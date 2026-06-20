const mongoose = require("mongoose");

const omborSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

const Ombor = mongoose.model("Ombor", omborSchema);

module.exports = Ombor;
