const express = require("express");
const {
  getAllAdminStatistika,
  getKirimlarAdminStatistika,
  getChiqimlarAdminStatistika,
  getQabulQilganlarAdminStatistika
} = require("../controllers/adminStatistika.controller");
const {
  createExportJob,
  getExportJobStatus,
  downloadExportFile
} = require("../controllers/adminStatistikaExport.controller");
const { auth } = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/export", auth, createExportJob);
router.get("/export/:jobId/download", auth, downloadExportFile);
router.get("/export/:jobId", auth, getExportJobStatus);

router.get("/all", auth, getAllAdminStatistika);
router.get("/kirimlar", auth, getKirimlarAdminStatistika);
router.get("/chiqimlar", auth, getChiqimlarAdminStatistika);
router.get("/qabul-qilganlar", auth, getQabulQilganlarAdminStatistika);

module.exports = router;
