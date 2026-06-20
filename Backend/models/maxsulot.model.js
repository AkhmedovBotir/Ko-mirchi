const mongoose = require("mongoose");

const maxsulotSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    origin: {
      type: String,
      required: true,
      trim: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

const Maxsulot = mongoose.model("Maxsulot", maxsulotSchema);

module.exports = Maxsulot;
