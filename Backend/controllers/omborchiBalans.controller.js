const mongoose = require("mongoose");
const OmborchiKirim = require("../models/omborchiKirim.model");
const OmborchiChiqim = require("../models/omborchiChiqim.model");

const KG_PER_TON = 1000;

const toBalanceData = (kg) => ({
  kg,
  ton: Number((kg / KG_PER_TON).toFixed(3))
});

const sumNetWeight = async (Model, match) => {
  const result = await Model.aggregate([
    { $match: match },
    { $group: { _id: null, total: { $sum: "$netWeight" } } }
  ]);

  return result[0]?.total || 0;
};

const getOmborBalans = async (req, res, next) => {
  try {
    const omborchiId = new mongoose.Types.ObjectId(req.omborchi._id);

    const [kirimTotal, chiqimTotal] = await Promise.all([
      sumNetWeight(OmborchiKirim, { omborchi: omborchiId }),
      sumNetWeight(OmborchiChiqim, {
        omborchi: omborchiId,
        status: { $ne: "rejected" }
      })
    ]);

    const kg = kirimTotal - chiqimTotal;

    return res.status(200).json({
      success: true,
      data: toBalanceData(kg)
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getOmborBalans
};
