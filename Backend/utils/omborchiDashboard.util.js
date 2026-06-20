const mongoose = require("mongoose");
const OmborchiKirim = require("../models/omborchiKirim.model");
const OmborchiChiqim = require("../models/omborchiChiqim.model");
const Maxsulot = require("../models/maxsulot.model");
const { toBalanceData } = require("./omborStock.util");
const { getOmborObjectIds } = require("./omborchiOmbor.util");

const DAY_MS = 24 * 60 * 60 * 1000;

const sumToWeight = (kg) => toBalanceData(Number(kg.toFixed(3)));

const sumToWeightWithCount = (kg, count) => ({
  ...sumToWeight(kg),
  count
});

const mergeBalanceMaps = (kirimRows, chiqimRows) => {
  const map = new Map();

  kirimRows.forEach((row) => {
    const key = String(row._id);
    map.set(key, (map.get(key) || 0) + row.total);
  });

  chiqimRows.forEach((row) => {
    const key = String(row._id);
    map.set(key, (map.get(key) || 0) - row.total);
  });

  return map;
};

const aggregateTotal = async (Model, match) => {
  const [result] = await Model.aggregate([
    { $match: match },
    { $group: { _id: null, total: { $sum: "$netWeight" }, count: { $sum: 1 } } }
  ]);

  return {
    kg: result?.total || 0,
    count: result?.count || 0
  };
};

const aggregateGrouped = async (Model, match, groupField) => {
  return Model.aggregate([
    { $match: match },
    { $group: { _id: `$${groupField}`, total: { $sum: "$netWeight" } } }
  ]);
};

const aggregateByDate = async (Model, match, dateFormat, fromDate) => {
  return Model.aggregate([
    { $match: { ...match, createdAt: { $gte: fromDate } } },
    {
      $group: {
        _id: { $dateToString: { format: dateFormat, date: "$createdAt" } },
        total: { $sum: "$netWeight" },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);
};

const rowsToMap = (rows) =>
  new Map(rows.map((row) => [row._id, { kg: row.total, count: row.count }]));

const startOfUtcDay = (date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

const formatDayLabel = (date) => date.toISOString().slice(0, 10);

const formatMonthLabel = (date) =>
  `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;

const getIsoWeekLabel = (date) => {
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((target - yearStart) / DAY_MS + 1) / 7);
  return `${target.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
};

const buildDayBuckets = (count) => {
  const now = startOfUtcDay(new Date());
  const buckets = [];

  for (let i = count - 1; i >= 0; i -= 1) {
    const start = new Date(now.getTime() - i * DAY_MS);
    buckets.push(formatDayLabel(start));
  }

  return buckets;
};

const buildWeekBuckets = (count) => {
  const now = new Date();
  const buckets = [];

  for (let i = count - 1; i >= 0; i -= 1) {
    const date = new Date(now.getTime() - i * 7 * DAY_MS);
    buckets.push(getIsoWeekLabel(date));
  }

  return [...new Set(buckets)];
};

const buildMonthBuckets = (count) => {
  const now = new Date();
  const buckets = [];

  for (let i = count - 1; i >= 0; i -= 1) {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    buckets.push(formatMonthLabel(date));
  }

  return buckets;
};

const buildYearBuckets = (count) => {
  const year = new Date().getUTCFullYear();
  const buckets = [];

  for (let i = count - 1; i >= 0; i -= 1) {
    buckets.push(String(year - i));
  }

  return buckets;
};

const buildChartSeries = (labels, kirimMap, chiqimMap, qabulMap) =>
  labels.map((label) => {
    const kirim = kirimMap.get(label) || { kg: 0, count: 0 };
    const chiqim = chiqimMap.get(label) || { kg: 0, count: 0 };
    const qabul = qabulMap.get(label) || { kg: 0, count: 0 };

    return {
      label,
      kirim: sumToWeightWithCount(kirim.kg, kirim.count),
      chiqim: sumToWeightWithCount(chiqim.kg, chiqim.count),
      qabul: sumToWeightWithCount(qabul.kg, qabul.count)
    };
  });

const getStockByOmbor = async (omborchiId, ombors) => {
  const omborchiOid = new mongoose.Types.ObjectId(omborchiId);
  const omborIds = ombors.map((ombor) => new mongoose.Types.ObjectId(ombor._id || ombor));

  if (!omborIds.length) {
    return [];
  }

  const [kirimRows, chiqimRows] = await Promise.all([
    aggregateGrouped(OmborchiKirim, { omborchi: omborchiOid, ombor: { $in: omborIds } }, "ombor"),
    aggregateGrouped(
      OmborchiChiqim,
      { omborchi: omborchiOid, ombor: { $in: omborIds }, status: { $ne: "rejected" } },
      "ombor"
    )
  ]);

  const balanceMap = mergeBalanceMaps(kirimRows, chiqimRows);
  const omborById = new Map(ombors.map((ombor) => [String(ombor._id || ombor), ombor]));

  return ombors.map((ombor) => {
    const omborId = String(ombor._id || ombor);
    const kg = balanceMap.get(omborId) || 0;

    return {
      ombor: omborById.get(omborId) || { _id: omborId },
      ...sumToWeight(kg)
    };
  });
};

const getStockByProduct = async (omborchiId) => {
  const omborchiOid = new mongoose.Types.ObjectId(omborchiId);

  const [kirimRows, chiqimRows] = await Promise.all([
    aggregateGrouped(OmborchiKirim, { omborchi: omborchiOid }, "product"),
    aggregateGrouped(
      OmborchiChiqim,
      { omborchi: omborchiOid, status: { $ne: "rejected" } },
      "product"
    )
  ]);

  const balanceMap = mergeBalanceMaps(kirimRows, chiqimRows);
  const productIds = [...balanceMap.keys()]
    .filter((id) => id !== "null" && id !== "undefined")
    .map((id) => new mongoose.Types.ObjectId(id));

  if (!productIds.length) {
    return [];
  }

  const products = await Maxsulot.find({ _id: { $in: productIds } }).sort({ name: 1 });
  const productById = new Map(products.map((product) => [String(product._id), product]));

  return productIds
    .map((productId) => {
      const key = String(productId);
      const kg = balanceMap.get(key) || 0;

      if (kg <= 0) {
        return null;
      }

      return {
        product: productById.get(key) || { _id: productId },
        ...sumToWeight(kg)
      };
    })
    .filter(Boolean);
};

const getChartData = async (omborchi) => {
  const omborchiOid = new mongoose.Types.ObjectId(omborchi._id);
  const recipientOmborIds = getOmborObjectIds(omborchi);

  const kirimMatch = { omborchi: omborchiOid };
  const chiqimMatch = { omborchi: omborchiOid, status: { $ne: "rejected" } };
  const qabulMatch = {
    recipientOmbor: { $in: recipientOmborIds },
    status: "accepted"
  };

  const now = new Date();
  const ranges = {
    kun: {
      labels: buildDayBuckets(30),
      from: new Date(startOfUtcDay(now).getTime() - 29 * DAY_MS),
      format: "%Y-%m-%d"
    },
    hafta: {
      labels: buildWeekBuckets(12),
      from: new Date(now.getTime() - 12 * 7 * DAY_MS),
      format: "%G-W%V"
    },
    oy: {
      labels: buildMonthBuckets(12),
      from: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1)),
      format: "%Y-%m"
    },
    yil: {
      labels: buildYearBuckets(5),
      from: new Date(Date.UTC(now.getUTCFullYear() - 4, 0, 1)),
      format: "%Y"
    }
  };

  const chart = {};

  await Promise.all(
    Object.entries(ranges).map(async ([key, range]) => {
      const [kirimRows, chiqimRows, qabulRows] = await Promise.all([
        aggregateByDate(OmborchiKirim, kirimMatch, range.format, range.from),
        aggregateByDate(OmborchiChiqim, chiqimMatch, range.format, range.from),
        recipientOmborIds.length
          ? aggregateByDate(OmborchiChiqim, qabulMatch, range.format, range.from)
          : Promise.resolve([])
      ]);

      chart[key] = buildChartSeries(
        range.labels,
        rowsToMap(kirimRows.map((row) => ({ _id: row._id, total: row.total, count: row.count }))),
        rowsToMap(chiqimRows.map((row) => ({ _id: row._id, total: row.total, count: row.count }))),
        rowsToMap(qabulRows.map((row) => ({ _id: row._id, total: row.total, count: row.count })))
      );
    })
  );

  return chart;
};

const buildDashboardData = async (omborchi) => {
  const omborchiOid = new mongoose.Types.ObjectId(omborchi._id);
  const recipientOmborIds = getOmborObjectIds(omborchi);
  const ombors = omborchi.ombors || [];

  const [
    byOmbor,
    byProduct,
    kirimTotal,
    chiqimTotal,
    kelganPending,
    kelganAccepted,
    chart
  ] = await Promise.all([
    getStockByOmbor(omborchi._id, ombors),
    getStockByProduct(omborchi._id),
    aggregateTotal(OmborchiKirim, { omborchi: omborchiOid }),
    aggregateTotal(OmborchiChiqim, { omborchi: omborchiOid, status: { $ne: "rejected" } }),
    recipientOmborIds.length
      ? aggregateTotal(OmborchiChiqim, {
          recipientOmbor: { $in: recipientOmborIds },
          status: "pending"
        })
      : Promise.resolve({ kg: 0, count: 0 }),
    recipientOmborIds.length
      ? aggregateTotal(OmborchiChiqim, {
          recipientOmbor: { $in: recipientOmborIds },
          status: "accepted"
        })
      : Promise.resolve({ kg: 0, count: 0 }),
    getChartData(omborchi)
  ]);

  const overallKg = byOmbor.reduce((sum, item) => sum + item.kg, 0);

  return {
    stock: {
      overall: sumToWeight(overallKg),
      byOmbor,
      byProduct
    },
    totals: {
      kirim: sumToWeightWithCount(kirimTotal.kg, kirimTotal.count),
      chiqim: sumToWeightWithCount(chiqimTotal.kg, chiqimTotal.count),
      kelganlar: {
        pending: sumToWeightWithCount(kelganPending.kg, kelganPending.count),
        accepted: sumToWeightWithCount(kelganAccepted.kg, kelganAccepted.count)
      }
    },
    chart
  };
};

module.exports = {
  buildDashboardData,
  sumToWeight,
  sumToWeightWithCount
};
