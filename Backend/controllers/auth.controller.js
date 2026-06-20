const jwt = require("jsonwebtoken");
const Admin = require("../models/admin.model");
const Omborchi = require("../models/omborchi.model");
const { JWT_SECRET } = require("../config/env");

const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required"
      });
    }

    const admin = await Admin.findOne({ username: username.toLowerCase() }).select("+password");

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password"
      });
    }

    const isPasswordCorrect = await admin.comparePassword(password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password"
      });
    }

    const token = jwt.sign(
      {
        id: admin._id,
        role: admin.role
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      success: true,
      token
    });
  } catch (error) {
    return next(error);
  }
};

const omborchiLogin = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required"
      });
    }

    const omborchi = await Omborchi.findOne({ username: username.toLowerCase() })
      .select("+password")
      .populate("ombors");

    if (!omborchi) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password"
      });
    }

    const isPasswordCorrect = await omborchi.comparePassword(password);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password"
      });
    }

    const token = jwt.sign(
      {
        id: omborchi._id,
        role: "omborchi"
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      success: true,
      token
    });
  } catch (error) {
    return next(error);
  }
};

const getOmborchiProfile = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      data: req.omborchi
    });
  } catch (error) {
    return next(error);
  }
};

const getMyOmbors = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      data: req.omborchi.ombors || []
    });
  } catch (error) {
    return next(error);
  }
};

const changeOmborchiPassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "oldPassword and newPassword are required"
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "newPassword must be at least 6 characters"
      });
    }

    const omborchi = await Omborchi.findById(req.omborchi._id).select("+password");
    if (!omborchi) {
      return res.status(404).json({
        success: false,
        message: "Omborchi not found"
      });
    }

    const isOldPasswordCorrect = await omborchi.comparePassword(oldPassword);
    if (!isOldPasswordCorrect) {
      return res.status(400).json({
        success: false,
        message: "Old password is incorrect"
      });
    }

    omborchi.password = newPassword;
    await omborchi.save();

    return res.status(200).json({
      success: true,
      message: "Password updated successfully"
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  login,
  omborchiLogin,
  getOmborchiProfile,
  getMyOmbors,
  changeOmborchiPassword
};
