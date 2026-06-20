const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/env");
const Admin = require("../models/admin.model");
const Omborchi = require("../models/omborchi.model");

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const admin = await Admin.findById(decoded.id);

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    req.user = admin;
    return next();
  } catch (_error) {
    return res.status(401).json({
      success: false,
      message: "Invalid token"
    });
  }
};

const requireGeneral = (req, res, next) => {
  if (req.user.role !== "general") {
    return res.status(403).json({
      success: false,
      message: "Only general admin can perform this action"
    });
  }

  return next();
};

const omborchiAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== "omborchi") {
      return res.status(401).json({
        success: false,
        message: "Invalid token"
      });
    }

    const omborchi = await Omborchi.findById(decoded.id).populate("ombors");
    if (!omborchi) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    req.omborchi = omborchi;
    return next();
  } catch (_error) {
    return res.status(401).json({
      success: false,
      message: "Invalid token"
    });
  }
};

module.exports = {
  auth,
  requireGeneral,
  omborchiAuth
};
