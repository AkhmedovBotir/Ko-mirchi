const OmborchiKirim = require("../models/omborchiKirim.model");
const OmborchiChiqim = require("../models/omborchiChiqim.model");
const {
  StatistikaQueryError,
  parseAdminStatistikaQuery,
  parsePagination,
  parseSort,
  buildKirimMatch,
  buildChiqimMatch,
  buildQabulMatch,
  buildModelSummary,
  mergeSummaries,
  paginateItems,
  buildPaginationMeta,
  formatAdminFiltersResponse
} = require("../utils/adminStatistika.util");
const {
  kirimPopulate,
  chiqimPopulate,
  mapKirim,
  mapChiqim,
  mapQabul,
  fetchAllItems,
  resolveQabulFilters
} = require("../utils/adminStatistikaData.util");

const respond = (res, payload) => res.status(200).json({ success: true, ...payload });

const fetchPaginatedFromModel = async ({
  Model,
  match,
  populate,
  mapFn,
  sort,
  page,
  limit
}) => {
  const skip = (page - 1) * limit;

  const [docs, total] = await Promise.all([
    Model.find(match).populate(populate).sort(sort).skip(skip).limit(limit).lean(),
    Model.countDocuments(match)
  ]);

  return {
    data: docs.map(mapFn),
    pagination: buildPaginationMeta(page, limit, total)
  };
};

const handleStatistikaError = (error, res, next) => {
  if (error instanceof StatistikaQueryError) {
    return res.status(400).json({ success: false, message: error.message });
  }
  return next(error);
};

const buildAllSummary = async (filters) => {
  const summaries = [];

  if (filters.types.includes("kirim")) {
    summaries.push(
      await buildModelSummary(OmborchiKirim, buildKirimMatch(filters), "kirim")
    );
  }

  if (filters.types.includes("chiqim")) {
    summaries.push(
      await buildModelSummary(OmborchiChiqim, buildChiqimMatch(filters), "chiqim")
    );
  }

  if (filters.types.includes("qabul")) {
    const qabulFilters = await resolveQabulFilters(filters);
    summaries.push(
      await buildModelSummary(OmborchiChiqim, buildQabulMatch(qabulFilters), "qabul")
    );
  }

  return mergeSummaries(summaries);
};

const getAllAdminStatistika = async (req, res, next) => {
  try {
    const filters = parseAdminStatistikaQuery(req.query);
    const { page, limit } = parsePagination(req.query);
    const sort = parseSort(req.query);

    const [merged, summary] = await Promise.all([
      fetchAllItems(filters, sort),
      filters.includeSummary ? buildAllSummary(filters) : Promise.resolve(undefined)
    ]);

    const paginated = paginateItems(merged, page, limit);

    return respond(res, {
      filters: formatAdminFiltersResponse(filters),
      summary,
      count: paginated.data.length,
      pagination: paginated.pagination,
      data: paginated.data
    });
  } catch (error) {
    return handleStatistikaError(error, res, next);
  }
};

const getKirimlarAdminStatistika = async (req, res, next) => {
  try {
    const filters = parseAdminStatistikaQuery(req.query);
    const { page, limit } = parsePagination(req.query);
    const sort = parseSort(req.query);
    const match = buildKirimMatch(filters);

    const [result, summary] = await Promise.all([
      fetchPaginatedFromModel({
        Model: OmborchiKirim,
        match,
        populate: kirimPopulate,
        mapFn: mapKirim,
        sort,
        page,
        limit
      }),
      filters.includeSummary
        ? buildModelSummary(OmborchiKirim, match, "kirim")
        : Promise.resolve(undefined)
    ]);

    return respond(res, {
      filters: formatAdminFiltersResponse(filters, ["kirim"]),
      summary,
      count: result.data.length,
      pagination: result.pagination,
      data: result.data
    });
  } catch (error) {
    return handleStatistikaError(error, res, next);
  }
};

const getChiqimlarAdminStatistika = async (req, res, next) => {
  try {
    const filters = parseAdminStatistikaQuery(req.query);
    const { page, limit } = parsePagination(req.query);
    const sort = parseSort(req.query);
    const match = buildChiqimMatch(filters);

    const [result, summary] = await Promise.all([
      fetchPaginatedFromModel({
        Model: OmborchiChiqim,
        match,
        populate: chiqimPopulate,
        mapFn: mapChiqim,
        sort,
        page,
        limit
      }),
      filters.includeSummary
        ? buildModelSummary(OmborchiChiqim, match, "chiqim")
        : Promise.resolve(undefined)
    ]);

    return respond(res, {
      filters: formatAdminFiltersResponse(filters, ["chiqim"]),
      summary,
      count: result.data.length,
      pagination: result.pagination,
      data: result.data
    });
  } catch (error) {
    return handleStatistikaError(error, res, next);
  }
};

const getQabulQilganlarAdminStatistika = async (req, res, next) => {
  try {
    const filters = parseAdminStatistikaQuery(req.query);
    const { page, limit } = parsePagination(req.query);
    const sort = parseSort(req.query);
    const qabulFilters = await resolveQabulFilters(filters);
    const match = buildQabulMatch(qabulFilters);

    const [result, summary] = await Promise.all([
      fetchPaginatedFromModel({
        Model: OmborchiChiqim,
        match,
        populate: chiqimPopulate,
        mapFn: mapQabul,
        sort,
        page,
        limit
      }),
      filters.includeSummary
        ? buildModelSummary(OmborchiChiqim, match, "qabul")
        : Promise.resolve(undefined)
    ]);

    return respond(res, {
      filters: formatAdminFiltersResponse(filters, ["qabul"]),
      summary,
      count: result.data.length,
      pagination: result.pagination,
      data: result.data
    });
  } catch (error) {
    return handleStatistikaError(error, res, next);
  }
};

module.exports = {
  getAllAdminStatistika,
  getKirimlarAdminStatistika,
  getChiqimlarAdminStatistika,
  getQabulQilganlarAdminStatistika
};
