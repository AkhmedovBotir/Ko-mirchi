const express = require("express");
const {
  createChiqimAriza,
  getMyChiqimArizalar,
  getChiqimArizaById
} = require("../controllers/omborchiChiqimAriza.controller");
const { omborchiAuth } = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/", omborchiAuth, createChiqimAriza);
router.get("/", omborchiAuth, getMyChiqimArizalar);
router.get("/:id", omborchiAuth, getChiqimArizaById);

module.exports = router;
