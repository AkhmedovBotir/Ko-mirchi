const express = require("express");
const {
  getAllStatistika,
  getKirimlarStatistika,
  getChiqimlarStatistika,
  getQabulQilganlarStatistika
} = require("../controllers/omborchiStatistika.controller");
const { omborchiAuth } = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/all", omborchiAuth, getAllStatistika);
router.get("/kirimlar", omborchiAuth, getKirimlarStatistika);
router.get("/chiqimlar", omborchiAuth, getChiqimlarStatistika);
router.get("/qabul-qilganlar", omborchiAuth, getQabulQilganlarStatistika);

module.exports = router;
