const { buildDashboardData } = require("../utils/omborchiDashboard.util");

const getDashboard = async (req, res, next) => {
  try {
    const data = await buildDashboardData(req.omborchi);

    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getDashboard
};
