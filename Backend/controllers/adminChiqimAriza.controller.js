const OmborchiChiqim = require("../models/omborchiChiqim.model");
const OmborchiChiqimAriza = require("../models/omborchiChiqimAriza.model");
const {
  ArizaError,
  parseArizaListQuery,
  applyChiqimUpdate,
  deleteChiqimRecord,
  processArizaStatus,
  chiqimArizaPopulate,
  buildPaginationMeta
} = require("../utils/ariza.util");

const handleError = (error, res, next) => {
  if (error instanceof ArizaError) {
    return res.status(error.statusCode).json({ success: false, message: error.message });
  }
  return next(error);
};

const getAllChiqimArizalar = async (req, res, next) => {
  try {
    const { status, omborchiId, page, limit } = parseArizaListQuery(req.query);
    const filter = {};

    if (status) {
      filter.status = status;
    }
    if (omborchiId) {
      filter.omborchi = omborchiId;
    }

    const skip = (page - 1) * limit;

    const [list, total] = await Promise.all([
      OmborchiChiqimAriza.find(filter)
        .populate(chiqimArizaPopulate)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      OmborchiChiqimAriza.countDocuments(filter)
    ]);

    return res.status(200).json({
      success: true,
      count: list.length,
      pagination: buildPaginationMeta(page, limit, total),
      data: list
    });
  } catch (error) {
    return handleError(error, res, next);
  }
};

const getChiqimArizaById = async (req, res, next) => {
  try {
    const ariza = await OmborchiChiqimAriza.findById(req.params.id).populate(chiqimArizaPopulate);

    if (!ariza) {
      return res.status(404).json({
        success: false,
        message: "Ariza not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: ariza
    });
  } catch (error) {
    return handleError(error, res, next);
  }
};

const processChiqimAriza = async (req, res, next) => {
  try {
    const ariza = await OmborchiChiqimAriza.findById(req.params.id);

    if (!ariza) {
      return res.status(404).json({
        success: false,
        message: "Ariza not found"
      });
    }

    const chiqim = await OmborchiChiqim.findById(ariza.chiqim);

    await processArizaStatus({
      ariza,
      adminId: req.user._id,
      body: req.body,
      updateRecord: async (data) => {
        if (!chiqim) {
          throw new ArizaError("Chiqim not found", 404);
        }
        await applyChiqimUpdate(chiqim, data);
      },
      deleteRecord: async () => {
        if (!chiqim) {
          return;
        }
        await deleteChiqimRecord(chiqim);
      }
    });

    const populated = await OmborchiChiqimAriza.findById(ariza._id).populate(chiqimArizaPopulate);

    return res.status(200).json({
      success: true,
      message: "Ariza yangilandi",
      data: populated
    });
  } catch (error) {
    return handleError(error, res, next);
  }
};

module.exports = {
  getAllChiqimArizalar,
  getChiqimArizaById,
  processChiqimAriza
};
