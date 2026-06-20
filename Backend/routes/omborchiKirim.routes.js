const express = require("express");
const {
  createOmborchiKirim,
  getMyKirims,
  getProductsForKirim,
  getMyOmborsForKirim
} = require("../controllers/omborchiKirim.controller");
const { omborchiAuth } = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/", omborchiAuth, createOmborchiKirim);
router.get("/my", omborchiAuth, getMyKirims);
router.get("/ombors", omborchiAuth, getMyOmborsForKirim);
router.get("/products", omborchiAuth, getProductsForKirim);

module.exports = router;
