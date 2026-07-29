const mongoose = require("mongoose");

const SORT_FIELDS = ["createdAt", "updatedAt", "netWeight", "grossWeight", "tareWeight"];
const CHIQIM_STATUSES = ["pending", "accepted", "rejected"];
const STAT_TYPES = ["kirim", "chiqim", "qabul"];

class StatistikaQueryError extends Error {
  constructor(message) {
    super(message);
    this.statusCode = 400;
  }
}

const parseObjectId = (value, fieldName) => {
  if (!value) {
    return null;
  }

  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new StatistikaQueryError(`${fieldName} must be a valid ObjectId`);
  }

  return new mongoose.Types.ObjectId(value);
};

const parseObjectIds = (value, fieldName) => {
  if (value === undefined || value === null || value === "") {
    return [];
  }

  const raw = Array.isArray(value)
    ? value
    : String(value)
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

  if (!raw.length) {
    return [];
  }

  const unique = [...new Set(raw.map((item) => String(item).trim()).filter(Boolean))];
  return unique.map((id) => parseObjectId(id, fieldName));
};

const resolveOmborIds = (query) => {
  const fromOmborIds = parseObjectIds(query.omborIds, "omborIds");
  if (fromOmborIds.length) {
    return fromOmborIds;
  }

  return parseObjectIds(query.omborId, "omborId");
};

const applyOmborMatch = (match, field, filters) => {
  if (filters.omborIds?.length) {
    match[field] =
      filters.omborIds.length === 1 ? filters.omborIds[0] : { $in: filters.omborIds };
    return;
  }

  if (filters.omborId) {
    match[field] = filters.omborId;
  }
};

const parseDate = (value, fieldName) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new StatistikaQueryError(`${fieldName} must be a valid ISO date`);
  }

  return date;
};

const parseNumber = (value, fieldName) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new StatistikaQueryError(`${fieldName} must be a valid number`);
  }

  return parsed;
};

const parseBoolean = (value, defaultValue) => {
  if (value === undefined || value === null || value === "") {
    return defaultValue;
  }

  if (value === "true" || value === true) {
    return true;
  }

  if (value === "false" || value === false) {
    return false;
  }

  throw new StatistikaQueryError("includeSummary must be true or false");
};

const parseTypes = (value) => {
  if (!value) {
    return ["kirim", "chiqim", "qabul"];
  }

  const types = String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (!types.length) {
    throw new StatistikaQueryError("types must include at least one value");
  }

  const invalid = types.filter((type) => !STAT_TYPES.includes(type));
  if (invalid.length) {
    throw new StatistikaQueryError(`types must be one of: ${STAT_TYPES.join(", ")}`);
  }

  return [...new Set(types)];
};

const parsePagination = (query) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));

  return { page, limit, skip: (page - 1) * limit };
};

const parseSort = (query) => {
  const sortBy = SORT_FIELDS.includes(query.sortBy) ? query.sortBy : "createdAt";
  const sortOrder = query.sortOrder === "asc" ? 1 : -1;

  return { [sortBy]: sortOrder };
};

const parseAdminStatistikaQuery = (query) => {
  const status = query.status ? String(query.status) : null;
  if (status && !CHIQIM_STATUSES.includes(status)) {
    throw new StatistikaQueryError(`status must be one of: ${CHIQIM_STATUSES.join(", ")}`);
  }

  const omborIds = resolveOmborIds(query);

  return {
    omborchiId: parseObjectId(query.omborchiId, "omborchiId"),
    recipientOmborId: parseObjectId(query.recipientOmborId, "recipientOmborId"),
    senderOmborchiId: parseObjectId(query.senderOmborchiId, "senderOmborchiId"),
    omborId: omborIds.length === 1 ? omborIds[0] : null,
    omborIds,
    productId: parseObjectId(query.productId, "productId"),
    status,
    truckNumber: query.truckNumber ? String(query.truckNumber).trim() : null,
    from: parseDate(query.from, "from"),
    to: parseDate(query.to, "to"),
    minNetWeight: parseNumber(query.minNetWeight, "minNetWeight"),
    maxNetWeight: parseNumber(query.maxNetWeight, "maxNetWeight"),
    minGrossWeight: parseNumber(query.minGrossWeight, "minGrossWeight"),
    maxGrossWeight: parseNumber(query.maxGrossWeight, "maxGrossWeight"),
    types: parseTypes(query.types),
    includeSummary: parseBoolean(query.includeSummary, true),
  };
};

const applyDateRange = (target, from, to) => {
  if (!from && !to) {
    return;
  }

  target.createdAt = {};
  if (from) {
    target.createdAt.$gte = from;
  }
  if (to) {
    target.createdAt.$lte = to;
  }
};

const applyWeightRange = (target, field, min, max) => {
  if (min === null && max === null) {
    return;
  }

  // Frontend default 0/0 — filter yo'q deb hisoblanadi
  if (min === 0 && max === 0) {
    return;
  }

  target[field] = {};
  if (min !== null) {
    target[field].$gte = min;
  }
  if (max !== null) {
    target[field].$lte = max;
  }
};

const buildKirimMatch = (filters) => {
  const match = { sourceChiqim: null };

  if (filters.omborchiId) {
    match.omborchi = filters.omborchiId;
  }

  applyOmborMatch(match, "ombor", filters);

  if (filters.productId) {
    match.product = filters.productId;
  }

  if (filters.truckNumber) {
    match.truckNumber = { $regex: filters.truckNumber, $options: "i" };
  }

  applyDateRange(match, filters.from, filters.to);
  applyWeightRange(match, "netWeight", filters.minNetWeight, filters.maxNetWeight);
  applyWeightRange(match, "grossWeight", filters.minGrossWeight, filters.maxGrossWeight);

  return match;
};

const buildChiqimMatch = (filters, { acceptedOnly = false } = {}) => {
  const match = {};

  const senderId = filters.senderOmborchiId || filters.omborchiId;
  if (senderId) {
    match.omborchi = senderId;
  }

  if (filters.recipientOmborId) {
    match.recipientOmbor = filters.recipientOmborId;
  }

  applyOmborMatch(match, "ombor", filters);

  if (filters.productId) {
    match.product = filters.productId;
  }

  if (filters.status) {
    match.status = filters.status;
  } else if (acceptedOnly) {
    match.status = "accepted";
  }

  if (filters.truckNumber) {
    match.truckNumber = { $regex: filters.truckNumber, $options: "i" };
  }

  applyDateRange(match, filters.from, filters.to);
  applyWeightRange(match, "netWeight", filters.minNetWeight, filters.maxNetWeight);
  applyWeightRange(match, "grossWeight", filters.minGrossWeight, filters.maxGrossWeight);

  return match;
};

const buildQabulMatch = (filters) => {
  const normalized = { ...filters };

  if (!normalized.recipientOmborId) {
    if (normalized.omborIds?.length === 1) {
      normalized.recipientOmborId = normalized.omborIds[0];
    } else if (normalized.omborIds?.length > 1) {
      normalized.recipientOmborIds = normalized.omborIds;
    } else if (normalized.omborId) {
      normalized.recipientOmborId = normalized.omborId;
    }
  }
  delete normalized.omborId;
  delete normalized.omborIds;

  const match = buildChiqimMatch(
    {
      ...normalized,
      omborchiId:
        normalized.senderOmborchiId ||
        (normalized.recipientOmborIds !== undefined ? null : normalized.omborchiId)
    },
    { acceptedOnly: true }
  );

  if (normalized.recipientOmborId) {
    match.recipientOmbor = normalized.recipientOmborId;
  } else if (normalized.recipientOmborIds !== undefined) {
    match.recipientOmbor = { $in: normalized.recipientOmborIds };
    delete match.omborchi;
  }

  if (!match.recipientOmbor) {
    match.recipientOmbor = { $exists: true, $ne: null };
  }

  return match;
};

const formatAdminFiltersResponse = (filters, scopeTypes) => ({
  types: scopeTypes || filters.types,
  omborchiId: filters.omborchiId,
  recipientOmborId: filters.recipientOmborId,
  senderOmborchiId: filters.senderOmborchiId,
  omborId: filters.omborId,
  omborIds: filters.omborIds || [],
  productId: filters.productId,
  status: filters.status,
  truckNumber: filters.truckNumber,
  from: filters.from,
  to: filters.to,
  minNetWeight: filters.minNetWeight,
  maxNetWeight: filters.maxNetWeight,
  minGrossWeight: filters.minGrossWeight,
  maxGrossWeight: filters.maxGrossWeight
});

const buildSummary = (items) => {
  const summary = {
    totalCount: items.length,
    totalNetWeightKg: 0,
    totalGrossWeightKg: 0,
    totalNetWeightTon: 0,
    byType: {
      kirim: { count: 0, netWeightKg: 0 },
      chiqim: { count: 0, netWeightKg: 0 },
      qabul: { count: 0, netWeightKg: 0 }
    }
  };

  items.forEach((item) => {
    summary.totalNetWeightKg += item.netWeight || 0;
    summary.totalGrossWeightKg += item.grossWeight || 0;

    if (summary.byType[item.type]) {
      summary.byType[item.type].count += 1;
      summary.byType[item.type].netWeightKg += item.netWeight || 0;
    }
  });

  summary.totalNetWeightKg = Number(summary.totalNetWeightKg.toFixed(3));
  summary.totalGrossWeightKg = Number(summary.totalGrossWeightKg.toFixed(3));
  summary.totalNetWeightTon = Number((summary.totalNetWeightKg / 1000).toFixed(3));
  summary.byType.kirim.netWeightKg = Number(summary.byType.kirim.netWeightKg.toFixed(3));
  summary.byType.chiqim.netWeightKg = Number(summary.byType.chiqim.netWeightKg.toFixed(3));
  summary.byType.qabul.netWeightKg = Number(summary.byType.qabul.netWeightKg.toFixed(3));

  return summary;
};

const buildModelSummary = async (Model, match, type) => {
  const [result] = await Model.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalCount: { $sum: 1 },
        totalNetWeightKg: { $sum: "$netWeight" },
        totalGrossWeightKg: { $sum: "$grossWeight" }
      }
    }
  ]);

  const totalNetWeightKg = Number((result?.totalNetWeightKg || 0).toFixed(3));
  const totalGrossWeightKg = Number((result?.totalGrossWeightKg || 0).toFixed(3));
  const totalCount = result?.totalCount || 0;

  return {
    totalCount,
    totalNetWeightKg,
    totalGrossWeightKg,
    totalNetWeightTon: Number((totalNetWeightKg / 1000).toFixed(3)),
    byType: {
      kirim: {
        count: type === "kirim" ? totalCount : 0,
        netWeightKg: type === "kirim" ? totalNetWeightKg : 0
      },
      chiqim: {
        count: type === "chiqim" ? totalCount : 0,
        netWeightKg: type === "chiqim" ? totalNetWeightKg : 0
      },
      qabul: {
        count: type === "qabul" ? totalCount : 0,
        netWeightKg: type === "qabul" ? totalNetWeightKg : 0
      }
    }
  };
};

const mergeSummaries = (summaries) => {
  const merged = {
    totalCount: 0,
    totalNetWeightKg: 0,
    totalGrossWeightKg: 0,
    totalNetWeightTon: 0,
    byType: {
      kirim: { count: 0, netWeightKg: 0 },
      chiqim: { count: 0, netWeightKg: 0 },
      qabul: { count: 0, netWeightKg: 0 }
    }
  };

  summaries.forEach((summary) => {
    merged.totalCount += summary.totalCount;
    merged.totalNetWeightKg += summary.totalNetWeightKg;
    merged.totalGrossWeightKg += summary.totalGrossWeightKg;

    STAT_TYPES.forEach((type) => {
      merged.byType[type].count += summary.byType[type].count;
      merged.byType[type].netWeightKg += summary.byType[type].netWeightKg;
    });
  });

  merged.totalNetWeightKg = Number(merged.totalNetWeightKg.toFixed(3));
  merged.totalGrossWeightKg = Number(merged.totalGrossWeightKg.toFixed(3));
  merged.totalNetWeightTon = Number((merged.totalNetWeightKg / 1000).toFixed(3));
  merged.byType.kirim.netWeightKg = Number(merged.byType.kirim.netWeightKg.toFixed(3));
  merged.byType.chiqim.netWeightKg = Number(merged.byType.chiqim.netWeightKg.toFixed(3));
  merged.byType.qabul.netWeightKg = Number(merged.byType.qabul.netWeightKg.toFixed(3));

  return merged;
};

const paginateItems = (items, page, limit) => {
  const total = items.length;
  const start = (page - 1) * limit;

  return {
    data: items.slice(start, start + limit),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit))
    }
  };
};

const buildPaginationMeta = (page, limit, total) => ({
  page,
  limit,
  total,
  totalPages: Math.max(1, Math.ceil(total / limit))
});

module.exports = {
  StatistikaQueryError,
  parseObjectId,
  parseObjectIds,
  parseDate,
  parseNumber,
  parseBoolean,
  parseTypes,
  parseAdminStatistikaQuery,
  parsePagination,
  parseSort,
  buildKirimMatch,
  buildChiqimMatch,
  buildQabulMatch,
  buildSummary,
  buildModelSummary,
  mergeSummaries,
  paginateItems,
  buildPaginationMeta,
  formatAdminFiltersResponse
};
