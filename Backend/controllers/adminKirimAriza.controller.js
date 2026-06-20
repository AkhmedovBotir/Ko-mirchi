const OmborchiKirim = require("../models/omborchiKirim.model");
const OmborchiKirimAriza = require("../models/omborchiKirimAriza.model");
const {
  ArizaError,
  parseArizaListQuery,
  applyKirimUpdate,
  deleteKirimRecord,
  processArizaStatus,
  kirimArizaPopulate,
  buildPaginationMeta
} = require("../utils/ariza.util");

const handleError = (error, res, next) => {
  if (error instanceof ArizaError) {
    return res.status(error.statusCode).json({ success: false, message: error.message });
  }
  return next(error);
};

const getAllKirimArizalar = async (req, res, next) => {
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
      OmborchiKirimAriza.find(filter)
        .populate(kirimArizaPopulate)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      OmborchiKirimAriza.countDocuments(filter)
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

const getKirimArizaById = async (req, res, next) => {
  try {
    const ariza = await OmborchiKirimAriza.findById(req.params.id).populate(kirimArizaPopulate);

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

const processKirimAriza = async (req, res, next) => {
  try {
    const ariza = await OmborchiKirimAriza.findById(req.params.id);

    if (!ariza) {
      return res.status(404).json({
        success: false,
        message: "Ariza not found"
      });
    }

    const kirim = await OmborchiKirim.findById(ariza.kirim);

    await processArizaStatus({
      ariza,
      adminId: req.user._id,
      body: req.body,
      updateRecord: async (data) => {
        if (!kirim) {
          throw new ArizaError("Kirim not found", 404);
        }
        await applyKirimUpdate(kirim, data);
      },
      deleteRecord: async () => {
        if (!kirim) {
          return;
        }
        await deleteKirimRecord(kirim);
      }
    });

    const populated = await OmborchiKirimAriza.findById(ariza._id).populate(kirimArizaPopulate);

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
  getAllKirimArizalar,
  getKirimArizaById,
  processKirimAriza
};
