const OmborchiKirim = require("../models/omborchiKirim.model");
const OmborchiChiqim = require("../models/omborchiChiqim.model");
const Omborchi = require("../models/omborchi.model");
const {
  buildKirimMatch,
  buildChiqimMatch,
  buildQabulMatch
} = require("./adminStatistika.util");

const EXPORT_SCOPES = ["all", "kirimlar", "chiqimlar", "qabul-qilganlar"];

const { OMBORCHI_OMBORS_POPULATE } = require("./omborchiOmbor.util");

const kirimPopulate = [
  { path: "product" },
  { path: "ombor" },
  { path: "omborchi", select: "-password", populate: OMBORCHI_OMBORS_POPULATE },
  {
    path: "sourceChiqim",
    populate: [
      { path: "product" },
      { path: "omborchi", select: "-password", populate: OMBORCHI_OMBORS_POPULATE },
      { path: "recipientOmbor" },
    ]
  }
];

const chiqimPopulate = [
  { path: "product" },
  { path: "ombor" },
  { path: "omborchi", select: "-password", populate: OMBORCHI_OMBORS_POPULATE },
  { path: "recipientOmbor" },
  { path: "linkedKirim" }
];

const mapKirim = (doc) => ({
  type: "kirim",
  id: doc._id,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
  omborchi: doc.omborchi,
  ombor: doc.ombor,
  product: doc.product,
  truckNumber: doc.truckNumber,
  grossWeight: doc.grossWeight,
  tareWeight: doc.tareWeight,
  netWeight: doc.netWeight,
  weightUnit: doc.weightUnit
});

const mapChiqim = (doc) => ({
  type: "chiqim",
  id: doc._id,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
  omborchi: doc.omborchi,
  ombor: doc.ombor,
  product: doc.product,
  truckNumber: doc.truckNumber,
  grossWeight: doc.grossWeight,
  tareWeight: doc.tareWeight,
  netWeight: doc.netWeight,
  weightUnit: doc.weightUnit,
  recipientOmbor: doc.recipientOmbor,
  status: doc.status,
  notes: doc.notes,
  linkedKirim: doc.linkedKirim
});

const mapQabul = (doc) => ({
  type: "qabul",
  id: doc._id,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
  ombor: doc.ombor,
  product: doc.product,
  truckNumber: doc.truckNumber,
  grossWeight: doc.grossWeight,
  tareWeight: doc.tareWeight,
  netWeight: doc.netWeight,
  weightUnit: doc.weightUnit,
  sender: doc.omborchi,
  recipientOmbor: doc.recipientOmbor,
  status: doc.status,
  notes: doc.notes,
  linkedKirim: doc.linkedKirim
});

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

const resolveQabulFilters = async (filters) => {
  if (filters.recipientOmborId || filters.recipientOmborIds) {
    return filters;
  }

  if (filters.omborchiId && !filters.senderOmborchiId) {
    const omborchi = await Omborchi.findById(filters.omborchiId).select("ombors").lean();
    return {
      ...filters,
      recipientOmborIds: omborchi?.ombors || []
    };
  }

  return filters;
};

const fetchAllItems = async (filters, sort) => {
  const qabulFilters = await resolveQabulFilters(filters);
  const loaders = [];

  if (filters.types.includes("kirim")) {
    loaders.push(
      OmborchiKirim.find(buildKirimMatch(filters))
        .populate(kirimPopulate)
        .sort(sort)
        .lean()
        .then((docs) => docs.map(mapKirim))
    );
  }

  if (filters.types.includes("chiqim")) {
    loaders.push(
      OmborchiChiqim.find(buildChiqimMatch(filters))
        .populate(chiqimPopulate)
        .sort(sort)
        .lean()
        .then((docs) => docs.map(mapChiqim))
    );
  }

  if (filters.types.includes("qabul")) {
    loaders.push(
      OmborchiChiqim.find(buildQabulMatch(qabulFilters))
        .populate(chiqimPopulate)
        .sort(sort)
        .lean()
        .then((docs) => docs.map(mapQabul))
    );
  }

  const chunks = await Promise.all(loaders);
  return sortItems(chunks.flat(), sort);
};

const fetchKirimItems = async (filters, sort) => {
  const docs = await OmborchiKirim.find(buildKirimMatch(filters))
    .populate(kirimPopulate)
    .sort(sort)
    .lean();

  return docs.map(mapKirim);
};

const fetchChiqimItems = async (filters, sort) => {
  const docs = await OmborchiChiqim.find(buildChiqimMatch(filters))
    .populate(chiqimPopulate)
    .sort(sort)
    .lean();

  return docs.map(mapChiqim);
};

const fetchQabulItems = async (filters, sort) => {
  const qabulFilters = await resolveQabulFilters(filters);
  const docs = await OmborchiChiqim.find(buildQabulMatch(qabulFilters))
    .populate(chiqimPopulate)
    .sort(sort)
    .lean();

  return docs.map(mapQabul);
};

const fetchStatistikaByScope = async (scope, filters, sort) => {
  switch (scope) {
    case "kirimlar":
      return fetchKirimItems(filters, sort);
    case "chiqimlar":
      return fetchChiqimItems(filters, sort);
    case "qabul-qilganlar":
      return fetchQabulItems(filters, sort);
    case "all":
    default:
      return fetchAllItems(filters, sort);
  }
};

const applyScopeToFilters = (scope, filters) => {
  switch (scope) {
    case "kirimlar":
      return { ...filters, types: ["kirim"] };
    case "chiqimlar":
      return { ...filters, types: ["chiqim"] };
    case "qabul-qilganlar":
      return { ...filters, types: ["qabul"] };
    default:
      return filters;
  }
};

module.exports = {
  EXPORT_SCOPES,
  kirimPopulate,
  chiqimPopulate,
  mapKirim,
  mapChiqim,
  mapQabul,
  fetchAllItems,
  fetchKirimItems,
  fetchChiqimItems,
  fetchQabulItems,
  fetchStatistikaByScope,
  resolveQabulFilters,
  applyScopeToFilters
};
