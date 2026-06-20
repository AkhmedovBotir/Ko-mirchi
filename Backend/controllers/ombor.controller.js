const Ombor = require("../models/ombor.model");

const createOmbor = async (req, res, next) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "name is required"
      });
    }

    const existingOmbor = await Ombor.findOne({ name: name.trim() });
    if (existingOmbor) {
      return res.status(409).json({
        success: false,
        message: "Ombor name already exists"
      });
    }

    const ombor = await Ombor.create({ name });

    return res.status(201).json({
      success: true,
      data: ombor
    });
  } catch (error) {
    return next(error);
  }
};

const getAllOmbors = async (_req, res, next) => {
  try {
    const ombors = await Ombor.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: ombors
    });
  } catch (error) {
    return next(error);
  }
};

const getOmborById = async (req, res, next) => {
  try {
    const ombor = await Ombor.findById(req.params.id);

    if (!ombor) {
      return res.status(404).json({
        success: false,
        message: "Ombor not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: ombor
    });
  } catch (error) {
    return next(error);
  }
};

const updateOmbor = async (req, res, next) => {
  try {
    const { name } = req.body;
    const ombor = await Ombor.findById(req.params.id);

    if (!ombor) {
      return res.status(404).json({
        success: false,
        message: "Ombor not found"
      });
    }

    if (name && name.trim() !== ombor.name) {
      const existingOmbor = await Ombor.findOne({ name: name.trim() });
      if (existingOmbor) {
        return res.status(409).json({
          success: false,
          message: "Ombor name already exists"
        });
      }
      ombor.name = name;
    }

    await ombor.save();

    return res.status(200).json({
      success: true,
      data: ombor
    });
  } catch (error) {
    return next(error);
  }
};

const deleteOmbor = async (req, res, next) => {
  try {
    const ombor = await Ombor.findById(req.params.id);

    if (!ombor) {
      return res.status(404).json({
        success: false,
        message: "Ombor not found"
      });
    }

    await ombor.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Ombor deleted successfully"
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createOmbor,
  getAllOmbors,
  getOmborById,
  updateOmbor,
  deleteOmbor
};
