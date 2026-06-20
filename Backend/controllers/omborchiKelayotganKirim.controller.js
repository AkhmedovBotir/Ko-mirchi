const OmborchiChiqim = require("../models/omborchiChiqim.model");
const OmborchiKirim = require("../models/omborchiKirim.model");
const {
  OMBORCHI_OMBORS_POPULATE,
  getOmborObjectIds,
  validateOmborAssignment
} = require("../utils/omborchiOmbor.util");

const populateFields = [
  { path: "product" },
  { path: "ombor" },
  { path: "recipientOmbor" },
  { path: "omborchi", select: "-password", populate: OMBORCHI_OMBORS_POPULATE },
  { path: "linkedKirim" }
];

const getIncomingFilter = (omborchi, status) => {
  const omborIds = getOmborObjectIds(omborchi);
  const filter = { recipientOmbor: { $in: omborIds } };

  if (status) {
    filter.status = status;
  }

  return filter;
};

const canAccessIncoming = (omborchi, chiqim) => {
  const omborIds = getOmborObjectIds(omborchi).map(String);
  return omborIds.includes(String(chiqim.recipientOmbor));
};

const getIncomingKirimlar = async (req, res, next) => {
  try {
    const { status } = req.query;
    const allowedStatuses = ["pending", "accepted", "rejected"];

    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "status must be one of: pending, accepted, rejected"
      });
    }

    const list = await OmborchiChiqim.find(getIncomingFilter(req.omborchi, status))
      .populate(populateFields)
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: list
    });
  } catch (error) {
    return next(error);
  }
};

const getIncomingKirimById = async (req, res, next) => {
  try {
    const chiqim = await OmborchiChiqim.findOne({
      _id: req.params.id,
      ...getIncomingFilter(req.omborchi)
    }).populate(populateFields);

    if (!chiqim) {
      return res.status(404).json({
        success: false,
        message: "Kelayotgan kirim not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: chiqim
    });
  } catch (error) {
    return next(error);
  }
};

const acceptIncomingKirim = async (req, res, next) => {
  try {
    const chiqim = await OmborchiChiqim.findOne({
      _id: req.params.id,
      status: "pending"
    });

    if (!chiqim || !canAccessIncoming(req.omborchi, chiqim)) {
      return res.status(404).json({
        success: false,
        message: "Kelayotgan kirim not found or already processed"
      });
    }

    const omborCheck = validateOmborAssignment(req.omborchi, chiqim.recipientOmbor);
    if (omborCheck.error) {
      return res.status(400).json(omborCheck.error);
    }

    const kirim = await OmborchiKirim.create({
      omborchi: req.omborchi._id,
      ombor: omborCheck.omborId,
      product: chiqim.product,
      truckNumber: chiqim.truckNumber,
      grossWeight: chiqim.grossWeight,
      tareWeight: chiqim.tareWeight,
      netWeight: chiqim.netWeight,
      weightUnit: "kg",
      sourceChiqim: chiqim._id
    });

    chiqim.status = "accepted";
    chiqim.linkedKirim = kirim._id;
    await chiqim.save();

    const populated = await OmborchiChiqim.findById(chiqim._id).populate(populateFields);

    return res.status(200).json({
      success: true,
      message: "Kirim qabul qilindi",
      data: populated
    });
  } catch (error) {
    return next(error);
  }
};

const rejectIncomingKirim = async (req, res, next) => {
  try {
    const chiqim = await OmborchiChiqim.findOne({
      _id: req.params.id,
      status: "pending"
    });

    if (!chiqim || !canAccessIncoming(req.omborchi, chiqim)) {
      return res.status(404).json({
        success: false,
        message: "Kelayotgan kirim not found or already processed"
      });
    }

    chiqim.status = "rejected";
    await chiqim.save();

    const populated = await OmborchiChiqim.findById(chiqim._id).populate(populateFields);

    return res.status(200).json({
      success: true,
      message: "Kirim bekor qilindi",
      data: populated
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getIncomingKirimlar,
  getIncomingKirimById,
  acceptIncomingKirim,
  rejectIncomingKirim
};
