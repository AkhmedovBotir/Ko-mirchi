const { toBalanceData } = require("./omborStock.util");

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

const aggregateGrouped = async (Model, match, groupField) =>
  Model.aggregate([
    { $match: match },
    { $group: { _id: `$${groupField}`, total: { $sum: "$netWeight" } } }
  ]);

const aggregateByDate = async (Model, match, dateFormat, fromDate) =>
  Model.aggregate([
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

const aggregateCountByField = async (Model, match, field) => {
  const rows = await Model.aggregate([
    { $match: match },
    { $group: { _id: `$${field}`, count: { $sum: 1 } } }
  ]);

  return new Map(rows.map((row) => [String(row._id), row.count]));
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
    buckets.push(formatDayLabel(new Date(now.getTime() - i * DAY_MS)));
  }

  return buckets;
};

const buildWeekBuckets = (count) => {
  const now = new Date();
  const buckets = [];

  for (let i = count - 1; i >= 0; i -= 1) {
    buckets.push(getIsoWeekLabel(new Date(now.getTime() - i * 7 * DAY_MS)));
  }

  return [...new Set(buckets)];
};

const buildMonthBuckets = (count) => {
  const now = new Date();
  const buckets = [];

  for (let i = count - 1; i >= 0; i -= 1) {
    buckets.push(formatMonthLabel(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1))));
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

const buildChartSeries = (labels, seriesMaps) =>
  labels.map((label) => {
    const point = { label };

    seriesMaps.forEach(({ key, map }) => {
      const item = map.get(label) || { kg: 0, count: 0 };
      point[key] = sumToWeightWithCount(item.kg, item.count);
    });

    return point;
  });

const getChartRanges = () => {
  const now = new Date();

  return {
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
};

const mapRowsForChart = (rows) =>
  rowsToMap(rows.map((row) => ({ _id: row._id, total: row.total, count: row.count })));

module.exports = {
  DAY_MS,
  sumToWeight,
  sumToWeightWithCount,
  mergeBalanceMaps,
  aggregateTotal,
  aggregateGrouped,
  aggregateByDate,
  aggregateCountByField,
  rowsToMap,
  buildChartSeries,
  getChartRanges,
  mapRowsForChart
};
