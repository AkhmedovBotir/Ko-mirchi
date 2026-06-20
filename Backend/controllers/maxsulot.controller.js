const Maxsulot = require("../models/maxsulot.model");

const createMaxsulot = async (req, res, next) => {
  try {
    const { name, origin } = req.body;

    if (!name || !origin) {
      return res.status(400).json({
        success: false,
        message: "name and origin are required"
      });
    }

    const maxsulot = await Maxsulot.create({ name, origin });

    return res.status(201).json({
      success: true,
      data: maxsulot
    });
  } catch (error) {
    return next(error);
  }
};

const getAllMaxsulotlar = async (_req, res, next) => {
  try {
    const maxsulotlar = await Maxsulot.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: maxsulotlar
    });
  } catch (error) {
    return next(error);
  }
};

const getMaxsulotById = async (req, res, next) => {
  try {
    const maxsulot = await Maxsulot.findById(req.params.id);

    if (!maxsulot) {
      return res.status(404).json({
        success: false,
        message: "Maxsulot not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: maxsulot
    });
  } catch (error) {
    return next(error);
  }
};

const updateMaxsulot = async (req, res, next) => {
  try {
    const { name, origin } = req.body;
    const maxsulot = await Maxsulot.findById(req.params.id);

    if (!maxsulot) {
      return res.status(404).json({
        success: false,
        message: "Maxsulot not found"
      });
    }

    if (name !== undefined) maxsulot.name = name;
    if (origin !== undefined) maxsulot.origin = origin;

    await maxsulot.save();

    return res.status(200).json({
      success: true,
      data: maxsulot
    });
  } catch (error) {
    return next(error);
  }
};

const deleteMaxsulot = async (req, res, next) => {
  try {
    const maxsulot = await Maxsulot.findById(req.params.id);

    if (!maxsulot) {
      return res.status(404).json({
        success: false,
        message: "Maxsulot not found"
      });
    }

    await maxsulot.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Maxsulot deleted successfully"
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createMaxsulot,
  getAllMaxsulotlar,
  getMaxsulotById,
  updateMaxsulot,
  deleteMaxsulot
};
