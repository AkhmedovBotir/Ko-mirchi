const Maxsulot = require("../models/maxsulot.model");
const OmborchiKirim = require("../models/omborchiKirim.model");
const { OMBORCHI_OMBORS_POPULATE, validateOmborAssignment } = require("../utils/omborchiOmbor.util");

const createOmborchiKirim = async (req, res, next) => {
  try {
    const { product, truckNumber, grossWeight, tareWeight, omborId } = req.body;

    if (!product || !truckNumber || grossWeight === undefined || tareWeight === undefined || !omborId) {
      return res.status(400).json({
        success: false,
        message: "product, truckNumber, grossWeight, tareWeight, omborId are required"
      });
    }

    const omborCheck = validateOmborAssignment(req.omborchi, omborId);
    if (omborCheck.error) {
      return res.status(400).json(omborCheck.error);
    }

    const parsedGrossWeight = Number(grossWeight);
    const parsedTareWeight = Number(tareWeight);

    if (Number.isNaN(parsedGrossWeight) || Number.isNaN(parsedTareWeight)) {
      return res.status(400).json({
        success: false,
        message: "grossWeight and tareWeight must be valid numbers"
      });
    }

    if (parsedGrossWeight < 0 || parsedTareWeight < 0) {
      return res.status(400).json({
        success: false,
        message: "grossWeight and tareWeight must be greater than or equal to 0"
      });
    }

    if (parsedGrossWeight <= parsedTareWeight) {
      return res.status(400).json({
        success: false,
        message: "grossWeight must be greater than tareWeight"
      });
    }

    const maxsulot = await Maxsulot.findById(product);
    if (!maxsulot) {
      return res.status(404).json({
        success: false,
        message: "Maxsulot not found"
      });
    }

    const netWeight = parsedGrossWeight - parsedTareWeight;

    const kirim = await OmborchiKirim.create({
      omborchi: req.omborchi._id,
      ombor: omborCheck.omborId,
      product,
      truckNumber,
      grossWeight: parsedGrossWeight,
      tareWeight: parsedTareWeight,
      netWeight,
      weightUnit: "kg"
    });

    const populated = await OmborchiKirim.findById(kirim._id)
      .populate("product")
      .populate("ombor")
      .populate({ path: "omborchi", select: "-password", populate: OMBORCHI_OMBORS_POPULATE });

    return res.status(201).json({
      success: true,
      data: populated
    });
  } catch (error) {
    return next(error);
  }
};

const getMyKirims = async (req, res, next) => {
  try {
    const kirimlar = await OmborchiKirim.find({ omborchi: req.omborchi._id })
      .populate("product")
      .populate("ombor")
      .populate({ path: "omborchi", select: "-password", populate: OMBORCHI_OMBORS_POPULATE })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: kirimlar
    });
  } catch (error) {
    return next(error);
  }
};

const getProductsForKirim = async (_req, res, next) => {
  try {
    const products = await Maxsulot.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: products
    });
  } catch (error) {
    return next(error);
  }
};

const getMyOmborsForKirim = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      data: req.omborchi.ombors || []
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createOmborchiKirim,
  getMyKirims,
  getProductsForKirim,
  getMyOmborsForKirim
};
