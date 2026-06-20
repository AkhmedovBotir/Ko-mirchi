const mongoose = require("mongoose");
const Ombor = require("../models/ombor.model");

const OMBORCHI_OMBORS_POPULATE = { path: "ombors" };

const getOmborIds = (omborchi) => {
  if (!omborchi?.ombors?.length) {
    return [];
  }

  return omborchi.ombors.map((item) => String(item._id || item));
};

const formatOmborNames = (ombors) => {
  if (!ombors?.length) {
    return "";
  }

  return ombors
    .map((ombor) => ombor?.name)
    .filter(Boolean)
    .join(", ");
};

const normalizeOmborId = (value) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value === "object" && value._id) {
    return String(value._id);
  }

  return String(value);
};

const validateOmborAssignment = (omborchi, omborId) => {
  const normalizedId = normalizeOmborId(omborId);

  if (!normalizedId) {
    return {
      error: {
        success: false,
        message: "omborId is required"
      }
    };
  }

  if (!mongoose.Types.ObjectId.isValid(normalizedId)) {
    return {
      error: {
        success: false,
        message: "omborId must be a valid ObjectId"
      }
    };
  }

  const assignedIds = getOmborIds(omborchi);
  if (!assignedIds.length) {
    return {
      error: {
        success: false,
        message: "Omborchiga ombor biriktirilmagan"
      }
    };
  }

  if (!assignedIds.includes(normalizedId)) {
    return {
      error: {
        success: false,
        message: "This ombor is not assigned to you"
      }
    };
  }

  return { omborId: normalizedId };
};

const resolveOmborForAdminUpdate = async (omborchi, omborIdRaw, currentOmborId) => {
  if (omborIdRaw === undefined) {
    return { changed: false };
  }

  const omborId = normalizeOmborId(omborIdRaw);

  if (!omborId) {
    throw new Error("omborId must be a valid ObjectId");
  }

  if (!mongoose.Types.ObjectId.isValid(omborId)) {
    throw new Error("omborId must be a valid ObjectId");
  }

  if (currentOmborId && String(omborId) === String(currentOmborId)) {
    return { changed: false };
  }

  const ombor = await Ombor.findById(omborId);
  if (!ombor) {
    throw new Error("Ombor not found");
  }

  const assignedIds = getOmborIds(omborchi);
  if (assignedIds.length && !assignedIds.includes(String(omborId))) {
    throw new Error("Ombor is not assigned to this omborchi");
  }

  return { changed: true, omborId: ombor._id };
};

const getOmborObjectIds = (omborchi) =>
  getOmborIds(omborchi).map((id) => new mongoose.Types.ObjectId(id));

const validateRecipientOmbor = async (recipientOmborId, sourceOmborId) => {
  if (!recipientOmborId) {
    return {
      error: {
        success: false,
        message: "recipientOmborId is required"
      }
    };
  }

  if (!mongoose.Types.ObjectId.isValid(recipientOmborId)) {
    return {
      error: {
        success: false,
        message: "recipientOmborId must be a valid ObjectId"
      }
    };
  }

  if (sourceOmborId && String(recipientOmborId) === String(sourceOmborId)) {
    return {
      error: {
        success: false,
        message: "Cannot send to the same ombor"
      }
    };
  }

  const ombor = await Ombor.findById(recipientOmborId);
  if (!ombor) {
    return {
      error: {
        success: false,
        message: "Recipient ombor not found"
      }
    };
  }

  return { recipientOmborId: ombor._id };
};

module.exports = {
  OMBORCHI_OMBORS_POPULATE,
  getOmborIds,
  getOmborObjectIds,
  formatOmborNames,
  validateOmborAssignment,
  resolveOmborForAdminUpdate,
  normalizeOmborId,
  validateRecipientOmbor
};
