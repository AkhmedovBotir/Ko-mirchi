const readline = require("readline/promises");
const { stdin: input, stdout: output } = require("process");
const mongoose = require("mongoose");

const connectDB = require("../config/db");
const Admin = require("../models/admin.model");

const askRequired = async (rl, label) => {
  while (true) {
    const value = (await rl.question(`${label}: `)).trim();
    if (value) {
      return value;
    }
    console.log(`${label} bo'sh bo'lmasligi kerak.`);
  }
};

const askRole = async (rl) => {
  while (true) {
    const rawRole = (await rl.question("Role kiriting (general/admin): ")).trim().toLowerCase();
    if (rawRole === "general" || rawRole === "admin") {
      return rawRole;
    }
    console.log("Noto'g'ri role. Faqat: general yoki admin.");
  }
};

const run = async () => {
  const rl = readline.createInterface({ input, output });

  try {
    await connectDB();

    console.log("Yangi admin yaratish:");
    const firstName = await askRequired(rl, "Ism");
    const lastName = await askRequired(rl, "Familiya");
    const username = (await askRequired(rl, "Username")).toLowerCase();
    const phone = await askRequired(rl, "Telefon");
    const password = await askRequired(rl, "Parol");
    const role = await askRole(rl);

    const exists = await Admin.findOne({ username });
    if (exists) {
      console.log("Bu username allaqachon mavjud.");
      process.exitCode = 1;
      return;
    }

    const admin = await Admin.create({
      firstName,
      lastName,
      username,
      phone,
      password,
      role
    });

    console.log("Admin muvaffaqiyatli yaratildi:");
    console.log({
      id: admin._id.toString(),
      firstName: admin.firstName,
      lastName: admin.lastName,
      username: admin.username,
      phone: admin.phone,
      role: admin.role
    });
  } catch (error) {
    console.error("Admin yaratishda xatolik:", error.message);
    process.exitCode = 1;
  } finally {
    rl.close();
    await mongoose.connection.close();
  }
};

run();
