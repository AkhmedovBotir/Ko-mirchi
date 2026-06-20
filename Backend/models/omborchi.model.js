const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const omborchiSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false
    },
    ombors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Ombor"
      }
    ]
  },
  {
    timestamps: true,
    versionKey: false
  }
);

omborchiSchema.pre("save", async function hashPassword() {
  if (!this.isModified("password")) {
    return;
  }

  this.password = await bcrypt.hash(this.password, 10);
});

omborchiSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const Omborchi = mongoose.model("Omborchi", omborchiSchema);

module.exports = Omborchi;
