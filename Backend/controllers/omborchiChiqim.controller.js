const Maxsulot = require("../models/maxsulot.model");
const Ombor = require("../models/ombor.model");
const OmborchiChiqim = require("../models/omborchiChiqim.model");
const {
  OMBORCHI_OMBORS_POPULATE,
  validateOmborAssignment,
  validateRecipientOmbor
} = require("../utils/omborchiOmbor.util");
const { getOmborProductBalances, validateProductInOmbor } = require("../utils/omborStock.util");

const validateWeights = (grossWeight, tareWeight) => {
  const parsedGross = Number(grossWeight);
  const parsedTare = Number(tareWeight);

  if (Number.isNaN(parsedGross) || Number.isNaN(parsedTare)) {
    return {
      error: {
        success: false,
        message: "grossWeight and tareWeight must be valid numbers"
      }
    };
  }

  if (parsedGross < 0 || parsedTare < 0) {
    return {
      error: {
        success: false,
        message: "grossWeight and tareWeight must be greater than or equal to 0"
      }
    };
  }

  if (parsedGross <= parsedTare) {
    return {
      error: {
        success: false,
        message: "grossWeight must be greater than tareWeight"
      }
    };
  }

  return {
    grossWeight: parsedGross,
    tareWeight: parsedTare,
    netWeight: parsedGross - parsedTare
  };
};

const populateFields = [
  { path: "product" },
  { path: "ombor" },
  { path: "recipientOmbor" },
  { path: "omborchi", select: "-password", populate: OMBORCHI_OMBORS_POPULATE },
  { path: "linkedKirim" }
];

const createOmborchiChiqim = async (req, res, next) => {
  try {
    const { product, truckNumber, recipientOmborId, grossWeight, tareWeight, notes, omborId } =
      req.body;

    if (
      !product ||
      !truckNumber ||
      !recipientOmborId ||
      !omborId ||
      grossWeight === undefined ||
      tareWeight === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "product, truckNumber, recipientOmborId, omborId, grossWeight, tareWeight are required"
      });
    }

    const omborCheck = validateOmborAssignment(req.omborchi, omborId);
    if (omborCheck.error) {
      return res.status(400).json(omborCheck.error);
    }

    const recipientCheck = await validateRecipientOmbor(recipientOmborId, omborCheck.omborId);
    if (recipientCheck.error) {
      return res.status(
        recipientCheck.error.message === "Recipient ombor not found" ? 404 : 400
      ).json(recipientCheck.error);
    }

    const weights = validateWeights(grossWeight, tareWeight);
    if (weights.error) {
      return res.status(400).json(weights.error);
    }

    const maxsulot = await Maxsulot.findById(product);
    if (!maxsulot) {
      return res.status(404).json({
        success: false,
        message: "Maxsulot not found"
      });
    }

    const productCheck = await validateProductInOmbor({
      omborchiId: req.omborchi._id,
      omborId: omborCheck.omborId,
      productId: product,
      netWeight: weights.netWeight
    });
    if (productCheck.error) {
      return res.status(400).json(productCheck.error);
    }

    const chiqim = await OmborchiChiqim.create({
      omborchi: req.omborchi._id,
      ombor: omborCheck.omborId,
      product,
      truckNumber,
      recipientOmbor: recipientCheck.recipientOmborId,
      grossWeight: weights.grossWeight,
      tareWeight: weights.tareWeight,
      netWeight: weights.netWeight,
      weightUnit: "kg",
      notes: notes !== undefined ? notes : ""
    });

    const populated = await OmborchiChiqim.findById(chiqim._id).populate(populateFields);

    return res.status(201).json({
      success: true,
      data: populated
    });
  } catch (error) {
    return next(error);
  }
};

const getAllMyChiqimlar = async (req, res, next) => {
  try {
    const list = await OmborchiChiqim.find({ omborchi: req.omborchi._id })
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

const getOmborchiChiqimById = async (req, res, next) => {
  try {
    const chiqim = await OmborchiChiqim.findOne({
      _id: req.params.id,
      omborchi: req.omborchi._id
    }).populate(populateFields);

    if (!chiqim) {
      return res.status(404).json({
        success: false,
        message: "Chiqim not found"
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

const getProductsForOmborChiqim = async (req, res, next) => {
  try {
    const { omborId } = req.params;

    const omborCheck = validateOmborAssignment(req.omborchi, omborId);
    if (omborCheck.error) {
      return res.status(400).json(omborCheck.error);
    }

    const balances = await getOmborProductBalances(req.omborchi._id, omborCheck.omborId);
    if (!balances.length) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }

    const productIds = balances.map((item) => item.productId);
    const products = await Maxsulot.find({ _id: { $in: productIds } }).sort({ name: 1 });
    const balanceMap = new Map(balances.map((item) => [item.productId, item]));

    const data = products.map((product) => {
      const balance = balanceMap.get(String(product._id));
      return {
        product,
        balance: {
          kg: balance.kg,
          ton: balance.ton
        }
      };
    });

    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    return next(error);
  }
};

const getRecipientOmborsForChiqim = async (req, res, next) => {
  try {
    const { sourceOmborId } = req.query;
    const filter = {};

    if (sourceOmborId) {
      const sourceCheck = validateOmborAssignment(req.omborchi, sourceOmborId);
      if (sourceCheck.error) {
        return res.status(400).json(sourceCheck.error);
      }
      filter._id = { $ne: sourceCheck.omborId };
    }

    const ombors = await Ombor.find(filter).sort({ name: 1 });

    return res.status(200).json({
      success: true,
      data: ombors
    });
  } catch (error) {
    return next(error);
  }
};

const getMyOmborsForChiqim = async (req, res, next) => {
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
  createOmborchiChiqim,
  getAllMyChiqimlar,
  getOmborchiChiqimById,
  getProductsForOmborChiqim,
  getRecipientOmborsForChiqim,
  getMyOmborsForChiqim
};
