const mongoose = require("mongoose");

const omborchiKirimArizaSchema = new mongoose.Schema(
  {
    omborchi: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Omborchi",
      required: true
    },
    kirim: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OmborchiKirim",
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

omborchiKirimArizaSchema.index({ kirim: 1, status: 1 });

const OmborchiKirimAriza = mongoose.model("OmborchiKirimAriza", omborchiKirimArizaSchema);

module.exports = OmborchiKirimAriza;
