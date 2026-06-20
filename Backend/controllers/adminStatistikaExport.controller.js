const fs = require("fs/promises");
const AdminStatistikaExport = require("../models/adminStatistikaExport.model");
const {
  StatistikaQueryError,
  parseAdminStatistikaQuery
} = require("../utils/adminStatistika.util");
const { EXPORT_SCOPES } = require("../utils/adminStatistikaData.util");
const { queueExportJob } = require("../services/adminStatistikaExport.service");

const parseScope = (value) => {
  const scope = value || "all";

  if (!EXPORT_SCOPES.includes(scope)) {
    throw new StatistikaQueryError(
      `scope must be one of: ${EXPORT_SCOPES.join(", ")}`
    );
  }

  return scope;
};

const buildFiltersPayload = (req) => {
  const merged = {
    ...req.query,
    ...(req.body?.filters || {})
  };

  delete merged.scope;
  parseAdminStatistikaQuery(merged);

  return merged;
};

const createExportJob = async (req, res, next) => {
  try {
    const scope = parseScope(req.body?.scope || req.query.scope);
    const filters = buildFiltersPayload(req);

    const job = await AdminStatistikaExport.create({
      admin: req.user._id,
      scope,
      filters,
      status: "pending"
    });

    queueExportJob(job._id);

    return res.status(202).json({
      success: true,
      message: "Export so'rovi qabul qilindi",
      data: {
        jobId: job._id,
        status: job.status,
        scope: job.scope,
        statusUrl: `/api/admin-statistika/export/${job._id}`,
        downloadUrl: `/api/admin-statistika/export/${job._id}/download`
      }
    });
  } catch (error) {
    if (error instanceof StatistikaQueryError) {
      return res.status(400).json({ success: false, message: error.message });
    }
    return next(error);
  }
};

const getExportJobStatus = async (req, res, next) => {
  try {
    const job = await AdminStatistikaExport.findOne({
      _id: req.params.jobId,
      admin: req.user._id
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Export job not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        jobId: job._id,
        status: job.status,
        scope: job.scope,
        rowCount: job.rowCount,
        fileName: job.fileName,
        errorMessage: job.errorMessage,
        expiresAt: job.expiresAt,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        ready: job.status === "completed",
        downloadUrl:
          job.status === "completed"
            ? `/api/admin-statistika/export/${job._id}/download`
            : null
      }
    });
  } catch (error) {
    return next(error);
  }
};

const downloadExportFile = async (req, res, next) => {
  try {
    const job = await AdminStatistikaExport.findOne({
      _id: req.params.jobId,
      admin: req.user._id
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Export job not found"
      });
    }

    if (job.status === "pending" || job.status === "processing") {
      return res.status(409).json({
        success: false,
        message: "Export hali tayyor emas",
        data: { status: job.status }
      });
    }

    if (job.status === "failed") {
      return res.status(422).json({
        success: false,
        message: job.errorMessage || "Export failed"
      });
    }

    if (!job.filePath) {
      return res.status(404).json({
        success: false,
        message: "Export file not found"
      });
    }

    try {
      await fs.access(job.filePath);
    } catch (_error) {
      return res.status(404).json({
        success: false,
        message: "Export file expired or removed"
      });
    }

    return res.download(job.filePath, job.fileName);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createExportJob,
  getExportJobStatus,
  downloadExportFile
};
