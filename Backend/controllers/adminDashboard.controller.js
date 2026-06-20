const {
  buildAdminDashboardData,
  StatistikaQueryError
} = require("../utils/adminDashboard.util");

const getDashboard = async (req, res, next) => {
  try {
    const data = await buildAdminDashboardData(req.query);

    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    if (error instanceof StatistikaQueryError) {
      return res.status(400).json({ success: false, message: error.message });
    }
    return next(error);
  }
};

module.exports = {
  getDashboard
};
