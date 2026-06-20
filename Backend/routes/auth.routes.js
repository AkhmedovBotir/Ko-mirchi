const express = require("express");
const {
  login,
  omborchiLogin,
  getOmborchiProfile,
  getMyOmbors,
  changeOmborchiPassword
} = require("../controllers/auth.controller");
const { omborchiAuth } = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/login", login);
router.post("/omborchi/login", omborchiLogin);
router.get("/omborchi/profile", omborchiAuth, getOmborchiProfile);
router.get("/omborchi/ombors", omborchiAuth, getMyOmbors);
router.patch("/omborchi/change-password", omborchiAuth, changeOmborchiPassword);

module.exports = router;
