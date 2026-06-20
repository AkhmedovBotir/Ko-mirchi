const mongoose = require("mongoose");

const omborchiChiqimArizaSchema = new mongoose.Schema(
  {
    omborchi: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Omborchi",
      required: true
    },
    chiqim: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OmborchiChiqim",
      required: true
    },
    note: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: ["pending", "reviewing", "accepted", "rejected"],
      default: "pending"
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: ""
    },
    actionTaken: {
      type: String,
      enum: ["updated", "deleted", ""],
      default: ""
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null
    },
    processedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

omborchiChiqimArizaSchema.index({ chiqim: 1, status: 1 });

const OmborchiChiqimAriza = mongoose.model("OmborchiChiqimAriza", omborchiChiqimArizaSchema);

module.exports = OmborchiChiqimAriza;
