const Admin = require("../models/admin.model");

const getMe = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      data: req.user
    });
  } catch (error) {
    return next(error);
  }
};

const createAdmin = async (req, res, next) => {
  try {
    const { firstName, lastName, username, phone, password, role } = req.body;

    if (!firstName || !lastName || !username || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "firstName, lastName, username, phone, password are required"
      });
    }

    const existingAdmin = await Admin.findOne({ username: username.toLowerCase() });

    if (existingAdmin) {
      return res.status(409).json({
        success: false,
        message: "Username already exists"
      });
    }

    const admin = await Admin.create({
      firstName,
      lastName,
      username,
      phone,
      password,
      role: role || "admin"
    });

    return res.status(201).json({
      success: true,
      data: admin
    });
  } catch (error) {
    return next(error);
  }
};

const getAllAdmins = async (_req, res, next) => {
  try {
    const admins = await Admin.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: admins
    });
  } catch (error) {
    return next(error);
  }
};

const getAdminById = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.params.id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: admin
    });
  } catch (error) {
    return next(error);
  }
};

const updateAdmin = async (req, res, next) => {
  try {
    const { firstName, lastName, username, phone, role } = req.body;
    const admin = await Admin.findById(req.params.id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found"
      });
    }

    if (username && username.toLowerCase() !== admin.username) {
      const existingAdmin = await Admin.findOne({ username: username.toLowerCase() });
      if (existingAdmin) {
        return res.status(409).json({
          success: false,
          message: "Username already exists"
        });
      }
      admin.username = username;
    }

    if (firstName) admin.firstName = firstName;
    if (lastName) admin.lastName = lastName;
    if (phone) admin.phone = phone;
    if (role) admin.role = role;

    await admin.save();

    return res.status(200).json({
      success: true,
      data: admin
    });
  } catch (error) {
    return next(error);
  }
};

const deleteAdmin = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.params.id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found"
      });
    }

    await admin.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Admin deleted successfully"
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getMe,
  createAdmin,
  getAllAdmins,
  getAdminById,
  updateAdmin,
  deleteAdmin
};
