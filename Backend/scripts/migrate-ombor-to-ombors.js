require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Omborchi = require("../models/omborchi.model");

const migrate = async () => {
  await connectDB();

  const legacyOmborchilar = await Omborchi.collection
    .find({ ombor: { $exists: true, $ne: null } })
    .toArray();

  let migrated = 0;

  for (const omborchi of legacyOmborchilar) {
    const existingOmbors = Array.isArray(omborchi.ombors) ? omborchi.ombors.map(String) : [];
    const legacyOmborId = String(omborchi.ombor);

    if (!existingOmbors.includes(legacyOmborId)) {
      existingOmbors.push(legacyOmborId);
    }

    await Omborchi.collection.updateOne(
      { _id: omborchi._id },
      {
        $set: { ombors: existingOmbors.map((id) => new mongoose.Types.ObjectId(id)) },
        $unset: { ombor: "" }
      }
    );

    migrated += 1;
  }

  console.log(`Migrated ${migrated} omborchi record(s).`);
  await mongoose.disconnect();
};

migrate().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
