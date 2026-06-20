const express = require("express");
const {
  getAllKirimArizalar,
  getKirimArizaById,
  processKirimAriza
} = require("../controllers/adminKirimAriza.controller");
const { auth } = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/", auth, getAllKirimArizalar);
router.get("/:id", auth, getKirimArizaById);
router.patch("/:id", auth, processKirimAriza);

module.exports = router;
