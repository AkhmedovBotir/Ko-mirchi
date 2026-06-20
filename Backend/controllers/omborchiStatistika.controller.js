const OmborchiKirim = require("../models/omborchiKirim.model");
const OmborchiChiqim = require("../models/omborchiChiqim.model");
const {
  StatistikaQueryError,
  parseOmborchiStatistikaQuery,
  parsePagination,
  parseSort,
  buildOmborchiKirimMatch,
  buildOmborchiChiqimMatch,
  buildOmborchiQabulMatch,
  formatFiltersResponse
} = require("../utils/omborchiStatistika.util");
const {
  buildModelSummary,
  buildPaginationMeta
} = require("../utils/adminStatistika.util");
const {
  kirimPopulate,
  chiqimPopulate,
  mapKirim,
  mapChiqim,
  mapQabul,
  fetchPaginatedAll
} = require("../utils/omborchiStatistikaData.util");

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

const getAllStatistika = async (req, res, next) => {
  try {
    const filters = parseOmborchiStatistikaQuery(req.query, req.omborchi);
    const { page, limit } = parsePagination(req.query);
    const sort = parseSort(req.query);

    const result = await fetchPaginatedAll(req.omborchi, filters, sort, page, limit);

    return respond(res, {
      filters: formatFiltersResponse(filters),
      summary: result.summary,
      count: result.data.length,
      pagination: result.pagination,
      data: result.data
    });
  } catch (error) {
    return handleStatistikaError(error, res, next);
  }
};

const getKirimlarStatistika = async (req, res, next) => {
  try {
    const filters = parseOmborchiStatistikaQuery(req.query, req.omborchi);
    const { page, limit } = parsePagination(req.query);
    const sort = parseSort(req.query);
    const match = buildOmborchiKirimMatch(req.omborchi._id, filters);

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
      filters: formatFiltersResponse(filters, ["kirim"]),
      summary,
      count: result.data.length,
      pagination: result.pagination,
      data: result.data
    });
  } catch (error) {
    return handleStatistikaError(error, res, next);
  }
};

const getChiqimlarStatistika = async (req, res, next) => {
  try {
    const filters = parseOmborchiStatistikaQuery(req.query, req.omborchi);
    const { page, limit } = parsePagination(req.query);
    const sort = parseSort(req.query);
    const match = buildOmborchiChiqimMatch(req.omborchi._id, filters);

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
      filters: formatFiltersResponse(filters, ["chiqim"]),
      summary,
      count: result.data.length,
      pagination: result.pagination,
      data: result.data
    });
  } catch (error) {
    return handleStatistikaError(error, res, next);
  }
};

const getQabulQilganlarStatistika = async (req, res, next) => {
  try {
    const filters = parseOmborchiStatistikaQuery(req.query, req.omborchi);
    const { page, limit } = parsePagination(req.query);
    const sort = parseSort(req.query);
    const match = buildOmborchiQabulMatch(req.omborchi, filters);

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
      filters: formatFiltersResponse(filters, ["qabul"]),
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
  getAllStatistika,
  getKirimlarStatistika,
  getChiqimlarStatistika,
  getQabulQilganlarStatistika
};
