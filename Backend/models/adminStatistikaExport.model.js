const mongoose = require("mongoose");

const adminStatistikaExportSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true
    },
    scope: {
      type: String,
      enum: ["all", "kirimlar", "chiqimlar", "qabul-qilganlar"],
      required: true
    },
    filters: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending"
    },
    fileName: {
      type: String,
      default: null
    },
    filePath: {
      type: String,
      default: null
    },
    rowCount: {
      type: Number,
      default: 0
    },
    errorMessage: {
      type: String,
      default: null
    },
    expiresAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

adminStatistikaExportSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const AdminStatistikaExport = mongoose.model(
  "AdminStatistikaExport",
  adminStatistikaExportSchema
);

module.exports = AdminStatistikaExport;
