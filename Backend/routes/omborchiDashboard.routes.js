const express = require("express");
const { getDashboard } = require("../controllers/omborchiDashboard.controller");
const { omborchiAuth } = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/", omborchiAuth, getDashboard);

module.exports = router;
