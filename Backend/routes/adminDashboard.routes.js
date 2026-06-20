const express = require("express");
const { getDashboard } = require("../controllers/adminDashboard.controller");
const { auth } = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/", auth, getDashboard);

module.exports = router;
