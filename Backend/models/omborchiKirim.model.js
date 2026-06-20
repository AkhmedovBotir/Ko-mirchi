const mongoose = require("mongoose");

const omborchiKirimSchema = new mongoose.Schema(
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
    sourceChiqim: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OmborchiChiqim",
      default: null
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

const OmborchiKirim = mongoose.model("OmborchiKirim", omborchiKirimSchema);

module.exports = OmborchiKirim;
