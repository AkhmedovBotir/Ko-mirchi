const express = require("express");
const {
  createKirimAriza,
  getMyKirimArizalar,
  getKirimArizaById
} = require("../controllers/omborchiKirimAriza.controller");
const { omborchiAuth } = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/", omborchiAuth, createKirimAriza);
router.get("/", omborchiAuth, getMyKirimArizalar);
router.get("/:id", omborchiAuth, getKirimArizaById);

module.exports = router;
