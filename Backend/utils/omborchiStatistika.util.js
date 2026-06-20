const {
  StatistikaQueryError,
  parseObjectId,
  parseDate,
  parseNumber,
  parseBoolean,
  parseTypes,
  parsePagination,
  parseSort,
  buildKirimMatch,
  buildChiqimMatch,
  buildQabulMatch
} = require("./adminStatistika.util");
const { getOmborIds, getOmborObjectIds } = require("./omborchiOmbor.util");

const CHIQIM_STATUSES = ["pending", "accepted", "rejected"];

const validateAssignedOmbor = (omborchi, omborId, fieldName = "omborId") => {
  if (!omborId) {
    return;
  }

  if (!getOmborIds(omborchi).includes(String(omborId))) {
    throw new StatistikaQueryError(`${fieldName} is not assigned to you`);
  }
};

const parseOmborchiStatistikaQuery = (query, omborchi) => {
  const status = query.status ? String(query.status) : null;
  if (status && !CHIQIM_STATUSES.includes(status)) {
    throw new StatistikaQueryError(`status must be one of: ${CHIQIM_STATUSES.join(", ")}`);
  }

  const omborId = parseObjectId(query.omborId, "omborId");
  validateAssignedOmbor(omborchi, omborId);

  return {
    omborId,
    recipientOmborId: parseObjectId(query.recipientOmborId, "recipientOmborId"),
    senderOmborchiId: parseObjectId(query.senderOmborchiId, "senderOmborchiId"),
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
    includeSummary: parseBoolean(query.includeSummary, true)
  };
};

const buildOmborchiKirimMatch = (omborchiId, filters) =>
  buildKirimMatch({
    ...filters,
    omborchiId
  });

const buildOmborchiChiqimMatch = (omborchiId, filters) =>
  buildChiqimMatch({
    ...filters,
    omborchiId
  });

const buildOmborchiQabulMatch = (omborchi, filters) => {
  const qabulFilters = {
    ...filters,
    recipientOmborIds: getOmborObjectIds(omborchi)
  };

  if (filters.omborId) {
    qabulFilters.recipientOmborId = filters.omborId;
    delete qabulFilters.omborId;
  }

  return buildQabulMatch(qabulFilters);
};

const formatFiltersResponse = (filters, scopeTypes) => ({
  types: scopeTypes || filters.types,
  omborId: filters.omborId,
  recipientOmborId: filters.recipientOmborId,
  senderOmborchiId: filters.senderOmborchiId,
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

module.exports = {
  StatistikaQueryError,
  parseOmborchiStatistikaQuery,
  parsePagination,
  parseSort,
  buildOmborchiKirimMatch,
  buildOmborchiChiqimMatch,
  buildOmborchiQabulMatch,
  formatFiltersResponse
};
