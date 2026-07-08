const mongoose = require("mongoose");
const OmborchiKirim = require("../models/omborchiKirim.model");
const OmborchiChiqim = require("../models/omborchiChiqim.model");

const KG_PER_TON = 1000;

const toBalanceData = (kg) => ({
  kg,
  ton: Number((kg / KG_PER_TON).toFixed(3))
});

const sumNetWeightByProduct = async (Model, match) => {
  const result = await Model.aggregate([
    { $match: match },
    { $group: { _id: "$product", total: { $sum: "$netWeight" } } }
  ]);

  return new Map(result.map((item) => [String(item._id), item.total]));
};

const getProductBalanceKg = async (omborchiId, omborId, productId, excludeChiqimId = null) => {
  const omborchiOid = new mongoose.Types.ObjectId(omborchiId);
  const omborOid = new mongoose.Types.ObjectId(omborId);
  const productOid = new mongoose.Types.ObjectId(productId);

  const chiqimMatch = {
    omborchi: omborchiOid,
    ombor: omborOid,
    product: productOid,
    status: { $ne: "rejected" }
  };

  if (excludeChiqimId) {
    chiqimMatch._id = { $ne: new mongoose.Types.ObjectId(excludeChiqimId) };
  }

  const [kirimMap, chiqimMap, incomingMap] = await Promise.all([
    sumNetWeightByProduct(OmborchiKirim, {
      omborchi: omborchiOid,
      ombor: omborOid,
      product: productOid
    }),
    sumNetWeightByProduct(OmborchiChiqim, chiqimMatch),
    sumNetWeightByProduct(OmborchiChiqim, {
      recipientOmbor: omborOid,
      product: productOid,
      status: "accepted"
    })
  ]);

  const kirimTotal = kirimMap.get(String(productOid)) || 0;
  const chiqimTotal = chiqimMap.get(String(productOid)) || 0;
  const incomingTotal = incomingMap.get(String(productOid)) || 0;

  return kirimTotal - chiqimTotal + incomingTotal;
};

const getOmborProductBalances = async (omborchiId, omborId) => {
  const omborchiOid = new mongoose.Types.ObjectId(omborchiId);
  const omborOid = new mongoose.Types.ObjectId(omborId);

  const [kirimMap, chiqimMap, incomingMap] = await Promise.all([
    sumNetWeightByProduct(OmborchiKirim, { omborchi: omborchiOid, ombor: omborOid }),
    sumNetWeightByProduct(OmborchiChiqim, {
      omborchi: omborchiOid,
      ombor: omborOid,
      status: { $ne: "rejected" }
    }),
    sumNetWeightByProduct(OmborchiChiqim, {
      recipientOmbor: omborOid,
      status: "accepted"
    })
  ]);

  const productIds = new Set([...kirimMap.keys(), ...chiqimMap.keys(), ...incomingMap.keys()]);
  const balances = [];

  for (const productId of productIds) {
    const kirimTotal = kirimMap.get(productId) || 0;
    const chiqimTotal = chiqimMap.get(productId) || 0;
    const incomingTotal = incomingMap.get(productId) || 0;
    const kg = kirimTotal - chiqimTotal + incomingTotal;

    if (kg > 0) {
      balances.push({
        productId,
        ...toBalanceData(kg)
      });
    }
  }

  return balances;
};

const validateProductInOmbor = async ({
  omborchiId,
  omborId,
  productId,
  netWeight,
  excludeChiqimId = null
}) => {
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return {
      error: {
        success: false,
        message: "product must be a valid ObjectId"
      }
    };
  }

  const balanceKg = await getProductBalanceKg(omborchiId, omborId, productId, excludeChiqimId);

  if (balanceKg <= 0) {
    return {
      error: {
        success: false,
        message: "This product is not available in the selected ombor"
      }
    };
  }

  if (netWeight !== undefined && netWeight > balanceKg) {
    return {
      error: {
        success: false,
        message: `Insufficient stock in ombor. Available: ${balanceKg} kg`
      }
    };
  }

  return { balanceKg };
};

module.exports = {
  toBalanceData,
  getProductBalanceKg,
  getOmborProductBalances,
  validateProductInOmbor
};
