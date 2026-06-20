const express = require("express");
const {
  createOmborchiChiqim,
  getAllMyChiqimlar,
  getOmborchiChiqimById,
  getProductsForOmborChiqim,
  getRecipientOmborsForChiqim,
  getMyOmborsForChiqim
} = require("../controllers/omborchiChiqim.controller");
const { omborchiAuth } = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/ombors", omborchiAuth, getMyOmborsForChiqim);
router.get("/ombors/:omborId/products", omborchiAuth, getProductsForOmborChiqim);
router.get("/recipient-ombors", omborchiAuth, getRecipientOmborsForChiqim);
router.post("/", omborchiAuth, createOmborchiChiqim);
router.get("/", omborchiAuth, getAllMyChiqimlar);
router.get("/:id", omborchiAuth, getOmborchiChiqimById);

module.exports = router;
