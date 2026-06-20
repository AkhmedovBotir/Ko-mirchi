const express = require("express");
const {
  getAllChiqimArizalar,
  getChiqimArizaById,
  processChiqimAriza
} = require("../controllers/adminChiqimAriza.controller");
const { auth } = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/", auth, getAllChiqimArizalar);
router.get("/:id", auth, getChiqimArizaById);
router.patch("/:id", auth, processChiqimAriza);

module.exports = router;
