const express = require("express");
const {
  createOmborchi,
  getAllOmborchilar,
  getOmborchiById,
  updateOmborchi,
  deleteOmborchi,
  attachOmborToOmborchi,
  detachOmborFromOmborchi
} = require("../controllers/omborchi.controller");
const { auth, requireGeneral } = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/", auth, requireGeneral, createOmborchi);
router.get("/", auth, requireGeneral, getAllOmborchilar);
router.get("/:id", auth, requireGeneral, getOmborchiById);
router.patch("/:id", auth, requireGeneral, updateOmborchi);
router.delete("/:id", auth, requireGeneral, deleteOmborchi);

router.patch("/:id/attach-ombor", auth, requireGeneral, attachOmborToOmborchi);
router.patch("/:id/detach-ombor", auth, requireGeneral, detachOmborFromOmborchi);

module.exports = router;
