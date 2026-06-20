const mongoose = require("mongoose");

const omborchiChiqimSchema = new mongoose.Schema(
  {
    omborchi: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Omborchi",
      required: true
    },
    ombor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ombor",
      default: null
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Maxsulot",
      required: true
    },
    truckNumber: {
      type: String,
      required: true,
      trim: true
    },
    recipientOmbor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ombor",
      required: true
    },
    grossWeight: {
      type: Number,
      required: true,
      min: 0
    },
    tareWeight: {
      type: Number,
      required: true,
      min: 0
    },
    netWeight: {
      type: Number,
      required: true,
      min: 0
    },
    weightUnit: {
      type: String,
      enum: ["kg"],
      default: "kg"
    },
    notes: {
      type: String,
      trim: true,
      default: ""
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending"
    },
    linkedKirim: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OmborchiKirim",
      default: null
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

const OmborchiChiqim = mongoose.model("OmborchiChiqim", omborchiChiqimSchema);

module.exports = OmborchiChiqim;
