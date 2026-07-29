const fs = require("fs/promises");
const path = require("path");
const ExcelJS = require("exceljs");
const AdminStatistikaExport = require("../models/adminStatistikaExport.model");
const Omborchi = require("../models/omborchi.model");
const Ombor = require("../models/ombor.model");
const Maxsulot = require("../models/maxsulot.model");
const {
  parseAdminStatistikaQuery,
  parseSort
} = require("../utils/adminStatistika.util");
const {
  fetchStatistikaByScope,
  applyScopeToFilters
} = require("../utils/adminStatistikaData.util");
const { formatOmborNames } = require("../utils/omborchiOmbor.util");

const EXPORT_DIR = path.join(__dirname, "..", "uploads", "exports");
const EXPORT_TTL_MS = 24 * 60 * 60 * 1000;
const COLUMN_COUNT = 12;

const TYPE_LABELS = {
  kirim: "Kirim",
  chiqim: "Chiqim",
  qabul: "Qabul"
};

const SCOPE_LABELS = {
  all: "Barcha amallar",
  kirimlar: "Kirimlar",
  chiqimlar: "Chiqimlar",
  "qabul-qilganlar": "Qabul qilganlar"
};

const STATUS_LABELS = {
  pending: "Kutilmoqda",
  accepted: "Qabul qilingan",
  rejected: "Bekor qilingan"
};

const SORT_FIELD_LABELS = {
  createdAt: "Yaratilgan sana",
  updatedAt: "Yangilangan sana",
  netWeight: "Sof og'irlik",
  grossWeight: "Yuk og'irligi",
  tareWeight: "Bo'sh og'irlik"
};

const formatOmborchi = (omborchi) => {
  if (!omborchi) {
    return "";
  }

  return [omborchi.firstName, omborchi.lastName].filter(Boolean).join(" ").trim();
};

const formatDateTime = (value) => {
  if (!value) {
    return "";
  }

  return new Date(value).toLocaleString("uz-UZ", { hour12: false });
};

const formatDateOnly = (value) => {
  if (!value) {
    return "";
  }

  return new Date(value).toLocaleDateString("uz-UZ");
};

const formatOmborchiName = async (id) => {
  if (!id) {
    return null;
  }

  const omborchi = await Omborchi.findById(id).select("firstName lastName username");
  if (!omborchi) {
    return String(id);
  }

  const fullName = formatOmborchi(omborchi);
  return fullName ? `${fullName} (${omborchi.username})` : omborchi.username;
};

const formatOmborName = async (id) => {
  if (!id) {
    return null;
  }

  const ombor = await Ombor.findById(id).select("name");
  return ombor?.name || String(id);
};

const formatOmborNamesList = async (ids) => {
  if (!ids?.length) {
    return null;
  }

  const names = await Promise.all(ids.map((id) => formatOmborName(id)));
  const filtered = names.filter(Boolean);
  return filtered.length ? filtered.join(", ") : null;
};

const formatProductName = async (id) => {
  if (!id) {
    return null;
  }

  const product = await Maxsulot.findById(id).select("name origin");
  if (!product) {
    return String(id);
  }

  return product.origin ? `${product.name} (${product.origin})` : product.name;
};

const buildFilterRows = async (scope, filters, rawFilters) => {
  const rows = [
    ["Hisobot turi", SCOPE_LABELS[scope] || scope],
    ["Export sanasi", formatDateTime(new Date())]
  ];

  if (filters.from || filters.to) {
    const fromLabel = filters.from ? formatDateOnly(filters.from) : "—";
    const toLabel = filters.to ? formatDateOnly(filters.to) : "—";
    rows.push(["Sana oralig'i", `${fromLabel} dan ${toLabel} gacha`]);
  } else {
    rows.push(["Sana oralig'i", "Barcha sanalar"]);
  }

  if (scope === "all" && filters.types?.length) {
    rows.push([
      "Turlar",
      filters.types.map((type) => TYPE_LABELS[type] || type).join(", ")
    ]);
  }

  const [
    omborchiName,
    senderName,
    recipientName,
    omborName,
    productName
  ] = await Promise.all([
    formatOmborchiName(filters.omborchiId),
    formatOmborchiName(filters.senderOmborchiId),
    formatOmborName(filters.recipientOmborId),
    filters.omborIds?.length
      ? formatOmborNamesList(filters.omborIds)
      : formatOmborName(filters.omborId),
    formatProductName(filters.productId)
  ]);

  if (omborchiName) {
    rows.push(["Omborchi", omborchiName]);
  }

  if (senderName) {
    rows.push(["Yuboruvchi", senderName]);
  }

  if (recipientName) {
    rows.push(["Oluvchi", recipientName]);
  }

  if (omborName) {
    rows.push(["Ombor", omborName]);
  }

  if (productName) {
    rows.push(["Maxsulot", productName]);
  }

  if (filters.status) {
    rows.push(["Holat", STATUS_LABELS[filters.status] || filters.status]);
  }

  if (filters.truckNumber) {
    rows.push(["Mashina raqami", filters.truckNumber]);
  }

  if (filters.minNetWeight !== null || filters.maxNetWeight !== null) {
    rows.push([
      "Sof og'irlik (kg)",
      `${filters.minNetWeight ?? "—"} dan ${filters.maxNetWeight ?? "—"} gacha`
    ]);
  }

  if (filters.minGrossWeight !== null || filters.maxGrossWeight !== null) {
    rows.push([
      "Yuk og'irligi (kg)",
      `${filters.minGrossWeight ?? "—"} dan ${filters.maxGrossWeight ?? "—"} gacha`
    ]);
  }

  const sortBy = rawFilters.sortBy || "createdAt";
  const sortOrder = rawFilters.sortOrder === "asc" ? "o'sish" : "kamayish";
  rows.push([
    "Saralash",
    `${SORT_FIELD_LABELS[sortBy] || sortBy} (${sortOrder})`
  ]);

  return rows;
};

const styleHeaderSection = (sheet, titleRow, filterStartRow, filterEndRow, tableHeaderRow) => {
  sheet.mergeCells(titleRow, 1, titleRow, COLUMN_COUNT);
  const titleCell = sheet.getCell(titleRow, 1);
  titleCell.font = { bold: true, size: 16, color: { argb: "FFFFFFFF" } };
  titleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1F4E78" }
  };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  sheet.getRow(titleRow).height = 28;

  for (let row = filterStartRow; row <= filterEndRow; row += 1) {
    sheet.getCell(row, 1).font = { bold: true };
    sheet.getCell(row, 1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF2F2F2" }
    };
    sheet.mergeCells(row, 2, row, COLUMN_COUNT);
    sheet.getCell(row, 2).alignment = { vertical: "middle", wrapText: true };
  }

  const headerRow = sheet.getRow(tableHeaderRow);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF2F75B5" }
  };
  headerRow.alignment = { horizontal: "center", vertical: "middle" };
  headerRow.height = 22;
};

const buildWorkbook = async (items, scope, filters, rawFilters) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Ombor Admin";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Statistika");
  const filterRows = await buildFilterRows(scope, filters, rawFilters);

  const titleRow = 1;
  const filterStartRow = 3;
  const tableHeaderRow = filterStartRow + filterRows.length + 1;

  sheet.getCell(titleRow, 1).value = "OMBOR STATISTIKASI";

  filterRows.forEach(([label, value], index) => {
    const rowNumber = filterStartRow + index;
    sheet.getCell(rowNumber, 1).value = label;
    sheet.getCell(rowNumber, 2).value = value;
  });

  sheet.getRow(tableHeaderRow).values = [
    "Tur",
    "Sana",
    "Yuboruvchi",
    "Oluvchi",
    "Ombor",
    "Maxsulot",
    "Mashina raqami",
    "Yuk (kg)",
    "Bo'sh (kg)",
    "Sof (kg)",
    "Holat",
    "Izoh"
  ];

  styleHeaderSection(
    sheet,
    titleRow,
    filterStartRow,
    filterStartRow + filterRows.length - 1,
    tableHeaderRow
  );

  items.forEach((item) => {
    const sender = item.type === "qabul" ? item.sender : item.omborchi;

    sheet.addRow([
      TYPE_LABELS[item.type] || item.type,
      formatDateTime(item.createdAt),
      formatOmborchi(sender),
      item.recipientOmbor?.name || "",
      item.ombor?.name || "",
      item.product?.name || "",
      item.truckNumber || "",
      item.grossWeight ?? "",
      item.tareWeight ?? "",
      item.netWeight ?? "",
      item.status ? STATUS_LABELS[item.status] || item.status : "",
      item.notes || ""
    ]);
  });

  sheet.columns = [
    { width: 12 },
    { width: 22 },
    { width: 24 },
    { width: 24 },
    { width: 18 },
    { width: 28 },
    { width: 16 },
    { width: 12 },
    { width: 12 },
    { width: 12 },
    { width: 16 },
    { width: 24 }
  ];

  sheet.views = [{ state: "frozen", ySplit: tableHeaderRow }];
  sheet.autoFilter = {
    from: { row: tableHeaderRow, column: 1 },
    to: { row: tableHeaderRow, column: COLUMN_COUNT }
  };

  const summaryRow = tableHeaderRow + items.length + 2;
  sheet.getCell(summaryRow, 1).value = "Jami yozuvlar:";
  sheet.getCell(summaryRow, 1).font = { bold: true };
  sheet.getCell(summaryRow, 2).value = items.length;

  const totalNet = items.reduce((sum, item) => sum + (item.netWeight || 0), 0);
  sheet.getCell(summaryRow + 1, 1).value = "Jami sof og'irlik (kg):";
  sheet.getCell(summaryRow + 1, 1).font = { bold: true };
  sheet.getCell(summaryRow + 1, 2).value = Number(totalNet.toFixed(3));

  return workbook;
};

const ensureExportDir = async () => {
  await fs.mkdir(EXPORT_DIR, { recursive: true });
};

const processExportJob = async (jobId) => {
  const job = await AdminStatistikaExport.findById(jobId);
  if (!job || job.status !== "pending") {
    return;
  }

  job.status = "processing";
  await job.save();

  try {
    await ensureExportDir();

    const parsedFilters = parseAdminStatistikaQuery(job.filters || {});
    const scopedFilters = applyScopeToFilters(job.scope, parsedFilters);
    const sort = parseSort(job.filters || {});

    const items = await fetchStatistikaByScope(job.scope, scopedFilters, sort);
    const workbook = await buildWorkbook(items, job.scope, scopedFilters, job.filters || {});

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `statistika-${job.scope}-${timestamp}.xlsx`;
    const filePath = path.join(EXPORT_DIR, `${job._id}-${fileName}`);

    await workbook.xlsx.writeFile(filePath);

    job.status = "completed";
    job.fileName = fileName;
    job.filePath = filePath;
    job.rowCount = items.length;
    job.expiresAt = new Date(Date.now() + EXPORT_TTL_MS);
    job.errorMessage = null;
    await job.save();
  } catch (error) {
    job.status = "failed";
    job.errorMessage = error.message || "Export failed";
    await job.save();
  }
};

const queueExportJob = (jobId) => {
  setImmediate(() => {
    processExportJob(jobId).catch(() => {});
  });
};

module.exports = {
  EXPORT_DIR,
  ensureExportDir,
  queueExportJob,
  processExportJob
};
