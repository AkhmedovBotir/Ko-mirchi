const OmborchiChiqim = require("../models/omborchiChiqim.model");
const OmborchiChiqimAriza = require("../models/omborchiChiqimAriza.model");
const { chiqimArizaPopulate } = require("../utils/ariza.util");

const ACTIVE_STATUSES = ["pending", "reviewing"];

const populateFields = chiqimArizaPopulate;

const createChiqimAriza = async (req, res, next) => {
  try {
    const { chiqimId, note } = req.body;

    if (!chiqimId || !note || !String(note).trim()) {
      return res.status(400).json({
        success: false,
        message: "chiqimId and note are required"
      });
    }

    const chiqim = await OmborchiChiqim.findOne({
      _id: chiqimId,
      omborchi: req.omborchi._id
    });

    if (!chiqim) {
      return res.status(404).json({
        success: false,
        message: "Chiqim not found"
      });
    }

    const existingAriza = await OmborchiChiqimAriza.findOne({
      chiqim: chiqim._id,
      status: { $in: ACTIVE_STATUSES }
    });

    if (existingAriza) {
      return res.status(409).json({
        success: false,
        message: "This chiqim already has an active application"
      });
    }

    const ariza = await OmborchiChiqimAriza.create({
      omborchi: req.omborchi._id,
      chiqim: chiqim._id,
      note: String(note).trim(),
      status: "pending"
    });

    const populated = await OmborchiChiqimAriza.findById(ariza._id).populate(populateFields);

    return res.status(201).json({
      success: true,
      message: "Ariza yuborildi",
      data: populated
    });
  } catch (error) {
    return next(error);
  }
};

const getMyChiqimArizalar = async (req, res, next) => {
  try {
    const { status } = req.query;
    const allowedStatuses = ["pending", "reviewing", "accepted", "rejected"];

    const filter = { omborchi: req.omborchi._id };

    if (status) {
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "status must be one of: pending, reviewing, accepted, rejected"
        });
      }
      filter.status = status;
    }

    const list = await OmborchiChiqimAriza.find(filter)
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

const getChiqimArizaById = async (req, res, next) => {
  try {
    const ariza = await OmborchiChiqimAriza.findOne({
      _id: req.params.id,
      omborchi: req.omborchi._id
    }).populate(populateFields);

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
    return next(error);
  }
};

module.exports = {
  createChiqimAriza,
  getMyChiqimArizalar,
  getChiqimArizaById
};
