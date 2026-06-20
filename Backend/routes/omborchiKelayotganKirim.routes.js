const express = require("express");
const {
  getIncomingKirimlar,
  getIncomingKirimById,
  acceptIncomingKirim,
  rejectIncomingKirim
} = require("../controllers/omborchiKelayotganKirim.controller");
const { omborchiAuth } = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/", omborchiAuth, getIncomingKirimlar);
router.get("/:id", omborchiAuth, getIncomingKirimById);
router.post("/:id/qabul", omborchiAuth, acceptIncomingKirim);
router.post("/:id/bekor", omborchiAuth, rejectIncomingKirim);

module.exports = router;
