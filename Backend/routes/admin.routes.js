const express = require("express");
const {
  getMe,
  createAdmin,
  getAllAdmins,
  getAdminById,
  updateAdmin,
  deleteAdmin
} = require("../controllers/admin.controller");
const { auth, requireGeneral } = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/me", auth, getMe);

router.post("/", auth, requireGeneral, createAdmin);
router.get("/", auth, requireGeneral, getAllAdmins);
router.get("/:id", auth, requireGeneral, getAdminById);
router.patch("/:id", auth, requireGeneral, updateAdmin);
router.delete("/:id", auth, requireGeneral, deleteAdmin);

module.exports = router;
