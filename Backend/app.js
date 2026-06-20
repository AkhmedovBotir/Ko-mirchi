const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const healthRoutes = require("./routes/health.routes");
const authRoutes = require("./routes/auth.routes");
const adminRoutes = require("./routes/admin.routes");
const adminStatistikaRoutes = require("./routes/adminStatistika.routes");
const adminDashboardRoutes = require("./routes/adminDashboard.routes");
const adminKirimArizaRoutes = require("./routes/adminKirimAriza.routes");
const adminChiqimArizaRoutes = require("./routes/adminChiqimAriza.routes");
const omborRoutes = require("./routes/ombor.routes");
const omborchiRoutes = require("./routes/omborchi.routes");
const omborchiKirimRoutes = require("./routes/omborchiKirim.routes");
const omborchiKirimArizaRoutes = require("./routes/omborchiKirimAriza.routes");
const omborchiChiqimRoutes = require("./routes/omborchiChiqim.routes");
const omborchiChiqimArizaRoutes = require("./routes/omborchiChiqimAriza.routes");
const omborchiKelayotganKirimRoutes = require("./routes/omborchiKelayotganKirim.routes");
const omborchiBalansRoutes = require("./routes/omborchiBalans.routes");
const omborchiStatistikaRoutes = require("./routes/omborchiStatistika.routes");
const omborchiDashboardRoutes = require("./routes/omborchiDashboard.routes");
const maxsulotRoutes = require("./routes/maxsulot.routes");
const { notFoundHandler, errorHandler } = require("./middlewares/error.middleware");

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admins", adminRoutes);
app.use("/api/admin-statistika", adminStatistikaRoutes);
app.use("/api/admin-dashboard", adminDashboardRoutes);
app.use("/api/admin-kirim-arizalari", adminKirimArizaRoutes);
app.use("/api/admin-chiqim-arizalari", adminChiqimArizaRoutes);
app.use("/api/omborlar", omborRoutes);
app.use("/api/omborchilar", omborchiRoutes);
app.use("/api/omborchi-kirimlar", omborchiKirimRoutes);
app.use("/api/omborchi-kirim-arizalari", omborchiKirimArizaRoutes);
app.use("/api/omborchi-chiqimlar", omborchiChiqimRoutes);
app.use("/api/omborchi-chiqim-arizalari", omborchiChiqimArizaRoutes);
app.use("/api/omborchi-kelayotgan-kirimlar", omborchiKelayotganKirimRoutes);
app.use("/api/omborchi-balans", omborchiBalansRoutes);
app.use("/api/omborchi-statistika", omborchiStatistikaRoutes);
app.use("/api/omborchi-dashboard", omborchiDashboardRoutes);
app.use("/api/maxsulotlar", maxsulotRoutes);

app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "Ombor backend is up and running."
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
