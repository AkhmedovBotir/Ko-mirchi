const express = require("express");
const {
  createMaxsulot,
  getAllMaxsulotlar,
  getMaxsulotById,
  updateMaxsulot,
  deleteMaxsulot
} = require("../controllers/maxsulot.controller");
const { auth, requireGeneral } = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/", auth, requireGeneral, createMaxsulot);
router.get("/", auth, getAllMaxsulotlar);
router.get("/:id", auth, getMaxsulotById);
router.patch("/:id", auth, requireGeneral, updateMaxsulot);
router.delete("/:id", auth, requireGeneral, deleteMaxsulot);

module.exports = router;
