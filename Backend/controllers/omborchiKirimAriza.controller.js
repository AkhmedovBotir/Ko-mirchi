const OmborchiKirim = require("../models/omborchiKirim.model");
const OmborchiKirimAriza = require("../models/omborchiKirimAriza.model");
const { kirimArizaPopulate } = require("../utils/ariza.util");

const ACTIVE_STATUSES = ["pending", "reviewing"];

const populateFields = kirimArizaPopulate;

const createKirimAriza = async (req, res, next) => {
  try {
    const { kirimId, note } = req.body;

    if (!kirimId || !note || !String(note).trim()) {
      return res.status(400).json({
        success: false,
        message: "kirimId and note are required"
      });
    }

    const kirim = await OmborchiKirim.findOne({
      _id: kirimId,
      omborchi: req.omborchi._id
    });

    if (!kirim) {
      return res.status(404).json({
        success: false,
        message: "Kirim not found"
      });
    }

    const existingAriza = await OmborchiKirimAriza.findOne({
      kirim: kirim._id,
      status: { $in: ACTIVE_STATUSES }
    });

    if (existingAriza) {
      return res.status(409).json({
        success: false,
        message: "This kirim already has an active application"
      });
    }

    const ariza = await OmborchiKirimAriza.create({
      omborchi: req.omborchi._id,
      kirim: kirim._id,
      note: String(note).trim(),
      status: "pending"
    });

    const populated = await OmborchiKirimAriza.findById(ariza._id).populate(populateFields);

    return res.status(201).json({
      success: true,
      message: "Ariza yuborildi",
      data: populated
    });
  } catch (error) {
    return next(error);
  }
};

const getMyKirimArizalar = async (req, res, next) => {
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

    const list = await OmborchiKirimAriza.find(filter)
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

const getKirimArizaById = async (req, res, next) => {
  try {
    const ariza = await OmborchiKirimAriza.findOne({
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
  createKirimAriza,
  getMyKirimArizalar,
  getKirimArizaById
};
