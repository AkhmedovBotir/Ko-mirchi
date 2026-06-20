const express = require("express");
const { getOmborBalans } = require("../controllers/omborchiBalans.controller");
const { omborchiAuth } = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/", omborchiAuth, getOmborBalans);

module.exports = router;
