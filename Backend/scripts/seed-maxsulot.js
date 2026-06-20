const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Maxsulot = require("../models/maxsulot.model");

// Ko'mir turlari va markalari
const COAL_TYPES = [
  "Antratsit ko'mir",
  "Qo'ng'ir ko'mir",
  "Toshko'mir",
  "Briket ko'mir",
  "Koks ko'mir",
  "Boyitilgan ko'mir",
  "Navli ko'mir (Sortovoy)",
  "Mayda ko'mir (Sivka)",
  "Yirik ko'mir (Plita)",
  "Yong'oq ko'mir (Orex)"
];

// Kelib chiqish joylari va konlar
const ORIGINS = [
  "Angren koni",
  "Sharg'un koni",
  "Boysun koni",
  "Qozog'iston (Shubarkol)",
  "Qozog'iston (Qarag'anda)",
  "Qirg'iziston (Sulyukta)",
  "Rossiya (Kuzbass)",
  "Angren (Briket zavodi)"
];

// Ko'mir markalari (qo'shimcha turlanish uchun)
const MARKS = ["BR", "B3", "OMS", "DMS", "2BK", "3BK", "SS"];

const getSeedCount = () => {
  const raw = process.argv[2];
  if (!raw) return 50; // Standart 50 ta

  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 30) {
    throw new Error("Soni kamida 30 bo'lishi kerak. Masalan: npm run seed -- 40");
  }
  return parsed;
};

const buildFakeCoalProducts = (count) => {
  const products = [];

  for (let index = 1; index <= count; index += 1) {
    // Modul operatori orqali massivdan ketma-ket tanlab olish
    const type = COAL_TYPES[index % COAL_TYPES.length];
    const origin = ORIGINS[index % ORIGINS.length];
    const mark = MARKS[index % MARKS.length];

    products.push({
      // Nomi: "Antratsit ko'mir (BR) - 1" ko'rinishida
      name: `${type} (${mark}) - ${index}`, 
      origin: origin
    });
  }

  return products;
};

const run = async () => {
  try {
    const count = getSeedCount();
    console.log(`Bazaga ${count} ta ko'mir mahsuloti qo'shilmoqda...`);
    
    await connectDB();

    // Avvalgi ma'lumotlarni tozalash (Ixtiyoriy: agar xohlasangiz oching)
    // await Maxsulot.deleteMany({}); 

    const fakeCoal = buildFakeCoalProducts(count);
    const inserted = await Maxsulot.insertMany(fakeCoal, { ordered: false });

    console.log(`✅ ${inserted.length} ta ko'mir mahsuloti muvaffaqiyatli qo'shildi.`);
  } catch (error) {
    console.error("❌ Seed qilishda xatolik:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

run();