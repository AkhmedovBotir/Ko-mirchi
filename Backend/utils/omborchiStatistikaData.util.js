const OmborchiKirim = require("../models/omborchiKirim.model");
const OmborchiChiqim = require("../models/omborchiChiqim.model");
const {
  buildSummary,
  paginateItems
} = require("./adminStatistika.util");
const {
  buildOmborchiKirimMatch,
  buildOmborchiChiqimMatch,
  buildOmborchiQabulMatch
} = require("./omborchiStatistika.util");
const {
  kirimPopulate,
  chiqimPopulate,
  mapKirim,
  mapChiqim,
  mapQabul
} = require("./adminStatistikaData.util");

const sortItems = (items, sort) => {
  const [[field, order]] = Object.entries(sort);

  return items.sort((a, b) => {
    const left = a[field];
    const right = b[field];

    if (left instanceof Date && right instanceof Date) {
      return order === 1 ? left - right : right - left;
    }

    if (typeof left === "number" && typeof right === "number") {
      return order === 1 ? left - right : right - left;
    }

    return order === 1
      ? String(left).localeCompare(String(right))
      : String(right).localeCompare(String(left));
  });
};

const fetchKirimItems = async (omborchiId, filters, sort) => {
  const docs = await OmborchiKirim.find(buildOmborchiKirimMatch(omborchiId, filters))
    .populate(kirimPopulate)
    .sort(sort)
    .lean();

  return docs.map(mapKirim);
};

const fetchChiqimItems = async (omborchiId, filters, sort) => {
  const docs = await OmborchiChiqim.find(buildOmborchiChiqimMatch(omborchiId, filters))
    .populate(chiqimPopulate)
    .sort(sort)
    .lean();

  return docs.map(mapChiqim);
};

const fetchQabulItems = async (omborchi, filters, sort) => {
  const docs = await OmborchiChiqim.find(buildOmborchiQabulMatch(omborchi, filters))
    .populate(chiqimPopulate)
    .sort(sort)
    .lean();

  return docs.map(mapQabul);
};

const fetchAllItems = async (omborchi, filters, sort) => {
  const loaders = [];
  const omborchiId = omborchi._id;

  if (filters.types.includes("kirim")) {
    loaders.push(fetchKirimItems(omborchiId, filters, sort));
  }

  if (filters.types.includes("chiqim")) {
    loaders.push(fetchChiqimItems(omborchiId, filters, sort));
  }

  if (filters.types.includes("qabul")) {
    loaders.push(fetchQabulItems(omborchi, filters, sort));
  }

  const chunks = await Promise.all(loaders);
  return sortItems(chunks.flat(), sort);
};

const fetchPaginatedAll = async (omborchi, filters, sort, page, limit) => {
  const items = await fetchAllItems(omborchi, filters, sort);
  const paginated = paginateItems(items, page, limit);

  return {
    data: paginated.data,
    pagination: paginated.pagination,
    summary: filters.includeSummary ? buildSummary(items) : undefined
  };
};

module.exports = {
  kirimPopulate,
  chiqimPopulate,
  mapKirim,
  mapChiqim,
  mapQabul,
  fetchKirimItems,
  fetchChiqimItems,
  fetchQabulItems,
  fetchAllItems,
  fetchPaginatedAll
};
