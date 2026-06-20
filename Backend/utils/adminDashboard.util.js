const mongoose = require("mongoose");
const OmborchiKirim = require("../models/omborchiKirim.model");
const OmborchiChiqim = require("../models/omborchiChiqim.model");
const OmborchiKirimAriza = require("../models/omborchiKirimAriza.model");
const OmborchiChiqimAriza = require("../models/omborchiChiqimAriza.model");
const Ombor = require("../models/ombor.model");
const Omborchi = require("../models/omborchi.model");
const Maxsulot = require("../models/maxsulot.model");
const { StatistikaQueryError, parseObjectId } = require("./adminStatistika.util");
const {
  sumToWeight,
  sumToWeightWithCount,
  mergeBalanceMaps,
  aggregateTotal,
  aggregateGrouped,
  aggregateByDate,
  buildChartSeries,
  getChartRanges,
  mapRowsForChart
} = require("./dashboardChart.util");

const parseAdminDashboardQuery = (query) => ({
  omborId: parseObjectId(query.omborId, "omborId"),
  omborchiId: parseObjectId(query.omborchiId, "omborchiId"),
  productId: parseObjectId(query.productId, "productId")
});

const buildRecordMatch = (filters, extra = {}) => {
  const match = { ...extra };

  if (filters.omborchiId) {
    match.omborchi = filters.omborchiId;
  }
  if (filters.omborId) {
    match.ombor = filters.omborId;
  }
  if (filters.productId) {
    match.product = filters.productId;
  }

  return match;
};

const buildQabulChartMatch = (filters) => {
  const match = {
    status: "accepted",
    recipientOmbor: { $exists: true, $ne: null }
  };

  if (filters.omborId) {
    match.recipientOmbor = filters.omborId;
  }
  if (filters.omborchiId) {
    match.omborchi = filters.omborchiId;
  }
  if (filters.productId) {
    match.product = filters.productId;
  }

  return match;
};

const populateBalanceList = async (balanceMap, Model, idField, sortField = "name") => {
  const ids = [...balanceMap.keys()]
    .filter((id) => id !== "null" && id !== "undefined")
    .map((id) => new mongoose.Types.ObjectId(id));

  if (!ids.length) {
    return [];
  }

  const docs = await Model.find({ _id: { $in: ids } }).sort({ [sortField]: 1 });
  const docById = new Map(docs.map((doc) => [String(doc._id), doc]));

  return ids
    .map((id) => {
      const key = String(id);
      const kg = balanceMap.get(key) || 0;

      if (kg <= 0) {
        return null;
      }

      const labelField = idField.replace(/Id$/, "");
      return {
        [labelField]: docById.get(key) || { _id: id },
        ...sumToWeight(kg)
      };
    })
    .filter(Boolean);
};

const getGlobalStock = async (filters) => {
  const baseMatch = buildRecordMatch(filters);
  const chiqimMatch = { ...baseMatch, status: { $ne: "rejected" } };

  const [
    kirimTotal,
    chiqimTotal,
    kirimByOmbor,
    chiqimByOmbor,
    kirimByProduct,
    chiqimByProduct,
    kirimByOmborchi,
    chiqimByOmborchi
  ] = await Promise.all([
    aggregateTotal(OmborchiKirim, baseMatch),
    aggregateTotal(OmborchiChiqim, chiqimMatch),
    aggregateGrouped(OmborchiKirim, baseMatch, "ombor"),
    aggregateGrouped(OmborchiChiqim, chiqimMatch, "ombor"),
    aggregateGrouped(OmborchiKirim, baseMatch, "product"),
    aggregateGrouped(OmborchiChiqim, chiqimMatch, "product"),
    aggregateGrouped(OmborchiKirim, baseMatch, "omborchi"),
    aggregateGrouped(OmborchiChiqim, chiqimMatch, "omborchi")
  ]);

  const omborBalance = mergeBalanceMaps(kirimByOmbor, chiqimByOmbor);
  const productBalance = mergeBalanceMaps(kirimByProduct, chiqimByProduct);
  const omborchiBalance = mergeBalanceMaps(kirimByOmborchi, chiqimByOmborchi);

  const overallKg = kirimTotal.kg - chiqimTotal.kg;

  const [byOmbor, byProduct, byOmborchi] = await Promise.all([
    populateBalanceList(omborBalance, Ombor, "ombor"),
    populateBalanceList(productBalance, Maxsulot, "product"),
    populateBalanceList(omborchiBalance, Omborchi, "omborchi", "firstName")
  ]);

  return {
    overall: sumToWeight(overallKg),
    byOmbor,
    byProduct,
    byOmborchi
  };
};

const getOperationTotals = async (filters) => {
  const baseMatch = buildRecordMatch(filters);
  const directKirimMatch = { ...baseMatch, sourceChiqim: null };

  const [kirim, directKirim, chiqim, transferPending, transferAccepted, transferRejected] =
    await Promise.all([
      aggregateTotal(OmborchiKirim, baseMatch),
      aggregateTotal(OmborchiKirim, directKirimMatch),
      aggregateTotal(OmborchiChiqim, { ...baseMatch, status: { $ne: "rejected" } }),
      aggregateTotal(OmborchiChiqim, { ...baseMatch, status: "pending" }),
      aggregateTotal(OmborchiChiqim, buildQabulChartMatch(filters)),
      aggregateTotal(OmborchiChiqim, { ...baseMatch, status: "rejected" })
    ]);

  return {
    kirim: sumToWeightWithCount(kirim.kg, kirim.count),
    directKirim: sumToWeightWithCount(directKirim.kg, directKirim.count),
    chiqim: sumToWeightWithCount(chiqim.kg, chiqim.count),
    transferlar: {
      pending: sumToWeightWithCount(transferPending.kg, transferPending.count),
      accepted: sumToWeightWithCount(transferAccepted.kg, transferAccepted.count),
      rejected: sumToWeightWithCount(transferRejected.kg, transferRejected.count)
    }
  };
};

const countArizalarByStatus = async (Model, filters) => {
  const match = filters.omborchiId ? { omborchi: filters.omborchiId } : {};
  const statuses = ["pending", "reviewing", "accepted", "rejected"];
  const counts = await Promise.all(
    statuses.map(async (status) => {
      const result = await Model.countDocuments({ ...match, status });
      return [status, result];
    })
  );

  return Object.fromEntries(counts);
};

const getArizaSummary = async (filters) => {
  const [kirim, chiqim] = await Promise.all([
    countArizalarByStatus(OmborchiKirimAriza, filters),
    countArizalarByStatus(OmborchiChiqimAriza, filters)
  ]);

  const attention =
    (kirim.pending || 0) +
    (kirim.reviewing || 0) +
    (chiqim.pending || 0) +
    (chiqim.reviewing || 0);

  return {
    kirim,
    chiqim,
    attention: {
      total: attention,
      pending: (kirim.pending || 0) + (chiqim.pending || 0),
      reviewing: (kirim.reviewing || 0) + (chiqim.reviewing || 0)
    }
  };
};

const getOverview = async () => {
  const [omborchilar, omborlar, maxsulotlar, omborchilarWithOmbor] = await Promise.all([
    Omborchi.countDocuments(),
    Ombor.countDocuments(),
    Maxsulot.countDocuments(),
    Omborchi.countDocuments({ ombors: { $exists: true, $not: { $size: 0 } } })
  ]);

  return {
    omborchilar,
    omborlar,
    maxsulotlar,
    omborchilarWithOmbor
  };
};

const getAdminChartData = async (filters) => {
  const kirimMatch = buildRecordMatch(filters);
  const chiqimMatch = buildRecordMatch(filters, { status: { $ne: "rejected" } });
  const qabulMatch = buildQabulChartMatch(filters);
  const ranges = getChartRanges();
  const chart = {};

  await Promise.all(
    Object.entries(ranges).map(async ([key, range]) => {
      const [kirimRows, chiqimRows, qabulRows] = await Promise.all([
        aggregateByDate(OmborchiKirim, kirimMatch, range.format, range.from),
        aggregateByDate(OmborchiChiqim, chiqimMatch, range.format, range.from),
        aggregateByDate(OmborchiChiqim, qabulMatch, range.format, range.from)
      ]);

      chart[key] = buildChartSeries(range.labels, [
        { key: "kirim", map: mapRowsForChart(kirimRows) },
        { key: "chiqim", map: mapRowsForChart(chiqimRows) },
        { key: "qabul", map: mapRowsForChart(qabulRows) }
      ]);
    })
  );

  return chart;
};

const buildAdminDashboardData = async (query) => {
  const filters = parseAdminDashboardQuery(query);

  const [overview, stock, totals, arizalar, chart] = await Promise.all([
    getOverview(),
    getGlobalStock(filters),
    getOperationTotals(filters),
    getArizaSummary(filters),
    getAdminChartData(filters)
  ]);

  return {
    filters: {
      omborId: filters.omborId,
      omborchiId: filters.omborchiId,
      productId: filters.productId
    },
    overview,
    stock,
    totals,
    arizalar,
    top: {
      omborlar: [...stock.byOmbor].sort((a, b) => b.kg - a.kg).slice(0, 10),
      omborchilar: [...stock.byOmborchi].sort((a, b) => b.kg - a.kg).slice(0, 10)
    },
    chart
  };
};

module.exports = {
  StatistikaQueryError,
  parseAdminDashboardQuery,
  buildAdminDashboardData
};
