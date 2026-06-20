const Omborchi = require("../models/omborchi.model");
const Ombor = require("../models/ombor.model");
const { OMBORCHI_OMBORS_POPULATE } = require("../utils/omborchiOmbor.util");

const populateOmborchi = (query) => query.populate(OMBORCHI_OMBORS_POPULATE);

const createOmborchi = async (req, res, next) => {
  try {
    const { firstName, lastName, phone, username, password } = req.body;

    if (!firstName || !lastName || !phone || !username || !password) {
      return res.status(400).json({
        success: false,
        message: "firstName, lastName, phone, username, password are required"
      });
    }

    const existingOmborchi = await Omborchi.findOne({ username: username.toLowerCase() });
    if (existingOmborchi) {
      return res.status(409).json({
        success: false,
        message: "Username already exists"
      });
    }

    const omborchi = await Omborchi.create({
      firstName,
      lastName,
      phone,
      username,
      password,
      ombors: []
    });

    return res.status(201).json({
      success: true,
      data: omborchi
    });
  } catch (error) {
    return next(error);
  }
};

const getAllOmborchilar = async (_req, res, next) => {
  try {
    const omborchilar = await populateOmborchi(Omborchi.find()).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: omborchilar
    });
  } catch (error) {
    return next(error);
  }
};

const getOmborchiById = async (req, res, next) => {
  try {
    const omborchi = await populateOmborchi(Omborchi.findById(req.params.id));

    if (!omborchi) {
      return res.status(404).json({
        success: false,
        message: "Omborchi not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: omborchi
    });
  } catch (error) {
    return next(error);
  }
};

const updateOmborchi = async (req, res, next) => {
  try {
    const { firstName, lastName, phone, username, password } = req.body;
    const omborchi = await Omborchi.findById(req.params.id).select("+password");

    if (!omborchi) {
      return res.status(404).json({
        success: false,
        message: "Omborchi not found"
      });
    }

    if (username && username.toLowerCase() !== omborchi.username) {
      const existingOmborchi = await Omborchi.findOne({ username: username.toLowerCase() });
      if (existingOmborchi) {
        return res.status(409).json({
          success: false,
          message: "Username already exists"
        });
      }
      omborchi.username = username;
    }

    if (firstName) omborchi.firstName = firstName;
    if (lastName) omborchi.lastName = lastName;
    if (phone) omborchi.phone = phone;
    if (password) omborchi.password = password;

    await omborchi.save();

    const sanitized = await populateOmborchi(Omborchi.findById(omborchi._id));

    return res.status(200).json({
      success: true,
      data: sanitized
    });
  } catch (error) {
    return next(error);
  }
};

const deleteOmborchi = async (req, res, next) => {
  try {
    const omborchi = await Omborchi.findById(req.params.id);

    if (!omborchi) {
      return res.status(404).json({
        success: false,
        message: "Omborchi not found"
      });
    }

    await omborchi.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Omborchi deleted successfully"
    });
  } catch (error) {
    return next(error);
  }
};

const attachOmborToOmborchi = async (req, res, next) => {
  try {
    const { omborId } = req.body;

    if (!omborId) {
      return res.status(400).json({
        success: false,
        message: "omborId is required"
      });
    }

    const omborchi = await Omborchi.findById(req.params.id);
    if (!omborchi) {
      return res.status(404).json({
        success: false,
        message: "Omborchi not found"
      });
    }

    const ombor = await Ombor.findById(omborId);
    if (!ombor) {
      return res.status(404).json({
        success: false,
        message: "Ombor not found"
      });
    }

    const alreadyAttached = omborchi.ombors.some((id) => String(id) === String(ombor._id));
    if (alreadyAttached) {
      return res.status(409).json({
        success: false,
        message: "Ombor already attached to this omborchi"
      });
    }

    omborchi.ombors.push(ombor._id);
    await omborchi.save();

    const updated = await populateOmborchi(Omborchi.findById(omborchi._id));

    return res.status(200).json({
      success: true,
      data: updated
    });
  } catch (error) {
    return next(error);
  }
};

const detachOmborFromOmborchi = async (req, res, next) => {
  try {
    const { omborId } = req.body;

    if (!omborId) {
      return res.status(400).json({
        success: false,
        message: "omborId is required"
      });
    }

    const omborchi = await Omborchi.findById(req.params.id);

    if (!omborchi) {
      return res.status(404).json({
        success: false,
        message: "Omborchi not found"
      });
    }

    const initialLength = omborchi.ombors.length;
    omborchi.ombors = omborchi.ombors.filter((id) => String(id) !== String(omborId));

    if (omborchi.ombors.length === initialLength) {
      return res.status(404).json({
        success: false,
        message: "Ombor is not attached to this omborchi"
      });
    }

    await omborchi.save();

    const updated = await populateOmborchi(Omborchi.findById(omborchi._id));

    return res.status(200).json({
      success: true,
      data: updated
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createOmborchi,
  getAllOmborchilar,
  getOmborchiById,
  updateOmborchi,
  deleteOmborchi,
  attachOmborToOmborchi,
  detachOmborFromOmborchi
};
