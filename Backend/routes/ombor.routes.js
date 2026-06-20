const express = require("express");
const {
  createOmbor,
  getAllOmbors,
  getOmborById,
  updateOmbor,
  deleteOmbor
} = require("../controllers/ombor.controller");
const { auth } = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/", auth, createOmbor);
router.get("/", auth, getAllOmbors);
router.get("/:id", auth, getOmborById);
router.patch("/:id", auth, updateOmbor);
router.delete("/:id", auth, deleteOmbor);

module.exports = router;
