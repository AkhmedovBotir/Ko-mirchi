const mongoose = require("mongoose");
const Maxsulot = require("../models/maxsulot.model");
const Omborchi = require("../models/omborchi.model");
const {
  OMBORCHI_OMBORS_POPULATE,
  resolveOmborForAdminUpdate,
  validateRecipientOmbor
} = require("./omborchiOmbor.util");
const { validateProductInOmbor } = require("./omborStock.util");
const { parsePagination, buildPaginationMeta } = require("./adminStatistika.util");

const ARIZA_STATUSES = ["pending", "reviewing", "accepted", "rejected"];
const ACTIVE_STATUSES = ["pending", "reviewing"];
const ARIZA_ACTIONS = ["update", "delete"];

class ArizaError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

const validateWeights = (grossWeight, tareWeight) => {
  const parsedGross = Number(grossWeight);
  const parsedTare = Number(tareWeight);

  if (Number.isNaN(parsedGross) || Number.isNaN(parsedTare)) {
    throw new ArizaError("grossWeight and tareWeight must be valid numbers");
  }

  if (parsedGross < 0 || parsedTare < 0) {
    throw new ArizaError("grossWeight and tareWeight must be greater than or equal to 0");
  }

  if (parsedGross <= parsedTare) {
    throw new ArizaError("grossWeight must be greater than tareWeight");
  }

  return {
    grossWeight: parsedGross,
    tareWeight: parsedTare,
    netWeight: parsedGross - parsedTare
  };
};

const parseObjectIdFilter = (value, fieldName) => {
  if (!value) {
    return null;
  }

  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new ArizaError(`${fieldName} must be a valid ObjectId`);
  }

  return new mongoose.Types.ObjectId(value);
};

const parseArizaListQuery = (query) => {
  const { status } = query;

  if (status && !ARIZA_STATUSES.includes(status)) {
    throw new ArizaError(`status must be one of: ${ARIZA_STATUSES.join(", ")}`);
  }

  const { page, limit } = parsePagination(query);

  return {
    status: status || null,
    omborchiId: parseObjectIdFilter(query.omborchiId, "omborchiId"),
    page,
    limit
  };
};

const assertArizaProcessable = (ariza) => {
  if (!ACTIVE_STATUSES.includes(ariza.status)) {
    throw new ArizaError(`Ariza is already ${ariza.status}`, 409);
  }
};

const loadOmborchiForRecord = async (omborchiId) => {
  const omborchi = await Omborchi.findById(omborchiId).populate("ombors");
  if (!omborchi) {
    throw new ArizaError("Omborchi not found", 404);
  }
  return omborchi;
};

const normalizeRefId = (value) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value === "object" && value._id) {
    return String(value._id);
  }

  return String(value);
};

const applyKirimUpdate = async (kirim, data) => {
  if (kirim.sourceChiqim) {
    throw new ArizaError("Transfer kirim cannot be updated through ariza");
  }

  const omborchi = await loadOmborchiForRecord(kirim.omborchi);
  const payload = data || {};

  if (payload.product !== undefined) {
    const productId = normalizeRefId(payload.product);
    const maxsulot = await Maxsulot.findById(productId);
    if (!maxsulot) {
      throw new ArizaError("Maxsulot not found", 404);
    }
    kirim.product = productId;
  }

  if (payload.truckNumber !== undefined) {
    kirim.truckNumber = payload.truckNumber;
  }

  if (payload.omborId !== undefined) {
    try {
      const omborUpdate = await resolveOmborForAdminUpdate(
        omborchi,
        payload.omborId,
        kirim.ombor
      );
      if (omborUpdate.changed) {
        kirim.ombor = omborUpdate.omborId;
      }
    } catch (error) {
      throw new ArizaError(error.message, error.message === "Ombor not found" ? 404 : 400);
    }
  }

  const effectiveGross = payload.grossWeight !== undefined ? payload.grossWeight : kirim.grossWeight;
  const effectiveTare = payload.tareWeight !== undefined ? payload.tareWeight : kirim.tareWeight;

  if (payload.grossWeight !== undefined || payload.tareWeight !== undefined) {
    const weights = validateWeights(effectiveGross, effectiveTare);
    kirim.grossWeight = weights.grossWeight;
    kirim.tareWeight = weights.tareWeight;
    kirim.netWeight = weights.netWeight;
  }

  await kirim.save();
  return kirim;
};

const deleteKirimRecord = async (kirim) => {
  if (kirim.sourceChiqim) {
    throw new ArizaError("Transfer kirim cannot be deleted through ariza");
  }

  await kirim.deleteOne();
};

const applyChiqimUpdate = async (chiqim, data) => {
  if (chiqim.status !== "pending") {
    throw new ArizaError("Only pending chiqim can be updated");
  }

  const omborchi = await loadOmborchiForRecord(chiqim.omborchi);
  const payload = data || {};

  if (payload.product !== undefined) {
    const productId = normalizeRefId(payload.product);
    const maxsulot = await Maxsulot.findById(productId);
    if (!maxsulot) {
      throw new ArizaError("Maxsulot not found", 404);
    }
    chiqim.product = productId;
  }

  if (payload.truckNumber !== undefined) {
    chiqim.truckNumber = payload.truckNumber;
  }

  if (payload.notes !== undefined) {
    chiqim.notes = payload.notes;
  }

  if (payload.omborId !== undefined) {
    try {
      const omborUpdate = await resolveOmborForAdminUpdate(
        omborchi,
        payload.omborId,
        chiqim.ombor
      );
      if (omborUpdate.changed) {
        chiqim.ombor = omborUpdate.omborId;
      }
    } catch (error) {
      throw new ArizaError(error.message, error.message === "Ombor not found" ? 404 : 400);
    }
  }

  if (payload.recipientOmborId !== undefined) {
    const recipientOmborId = normalizeRefId(payload.recipientOmborId);
    if (chiqim.recipientOmbor && String(recipientOmborId) === String(chiqim.recipientOmbor)) {
      // unchanged
    } else {
      const recipientCheck = await validateRecipientOmbor(recipientOmborId, chiqim.ombor);
      if (recipientCheck.error) {
        throw new ArizaError(
          recipientCheck.error.message,
          recipientCheck.error.message === "Recipient ombor not found" ? 404 : 400
        );
      }
      chiqim.recipientOmbor = recipientCheck.recipientOmborId;
    }
  }

  const effectiveGross =
    payload.grossWeight !== undefined ? payload.grossWeight : chiqim.grossWeight;
  const effectiveTare = payload.tareWeight !== undefined ? payload.tareWeight : chiqim.tareWeight;

  if (payload.grossWeight !== undefined || payload.tareWeight !== undefined) {
    const weights = validateWeights(effectiveGross, effectiveTare);
    chiqim.grossWeight = weights.grossWeight;
    chiqim.tareWeight = weights.tareWeight;
    chiqim.netWeight = weights.netWeight;
  }

  const productCheck = await validateProductInOmbor({
    omborchiId: omborchi._id,
    omborId: chiqim.ombor,
    productId: chiqim.product,
    netWeight: chiqim.netWeight,
    excludeChiqimId: chiqim._id
  });
  if (productCheck.error) {
    throw new ArizaError(productCheck.error.message);
  }

  await chiqim.save();
  return chiqim;
};

const deleteChiqimRecord = async (chiqim) => {
  if (chiqim.status !== "pending") {
    throw new ArizaError("Only pending chiqim can be deleted");
  }

  await chiqim.deleteOne();
};

const processArizaStatus = async ({ ariza, adminId, body, updateRecord, deleteRecord }) => {
  const { status, action, rejectionReason, data } = body;

  if (!status || !ARIZA_STATUSES.includes(status)) {
    throw new ArizaError(`status must be one of: ${ARIZA_STATUSES.join(", ")}`);
  }

  if (status === "reviewing") {
    assertArizaProcessable(ariza);
    ariza.status = "reviewing";
    await ariza.save();
    return ariza;
  }

  if (status === "rejected") {
    assertArizaProcessable(ariza);
    if (!rejectionReason || !String(rejectionReason).trim()) {
      throw new ArizaError("rejectionReason is required when rejecting");
    }
    ariza.status = "rejected";
    ariza.rejectionReason = String(rejectionReason).trim();
    ariza.actionTaken = "";
    ariza.processedBy = adminId;
    ariza.processedAt = new Date();
    await ariza.save();
    return ariza;
  }

  if (status === "accepted") {
    assertArizaProcessable(ariza);

    if (!action || !ARIZA_ACTIONS.includes(action)) {
      throw new ArizaError(`action must be one of: ${ARIZA_ACTIONS.join(", ")} when accepting`);
    }

    if (action === "update") {
      if (!data || !Object.keys(data).length) {
        throw new ArizaError("data is required when action is update");
      }
      await updateRecord(data);
      ariza.actionTaken = "updated";
    }

    if (action === "delete") {
      await deleteRecord();
      ariza.actionTaken = "deleted";
    }

    ariza.status = "accepted";
    ariza.rejectionReason = "";
    ariza.processedBy = adminId;
    ariza.processedAt = new Date();
    await ariza.save();
    return ariza;
  }

  throw new ArizaError("Invalid status transition");
};

const kirimArizaPopulate = [
  {
    path: "kirim",
    populate: [
      { path: "product" },
      { path: "ombor" },
      { path: "omborchi", select: "-password", populate: OMBORCHI_OMBORS_POPULATE }
    ]
  },
  { path: "omborchi", select: "-password", populate: OMBORCHI_OMBORS_POPULATE },
  { path: "processedBy", select: "-password" }
];

const chiqimArizaPopulate = [
  {
    path: "chiqim",
    populate: [
      { path: "product" },
      { path: "ombor" },
      { path: "recipientOmbor" },
      { path: "omborchi", select: "-password", populate: OMBORCHI_OMBORS_POPULATE },
      { path: "linkedKirim" }
    ]
  },
  { path: "omborchi", select: "-password", populate: OMBORCHI_OMBORS_POPULATE },
  { path: "processedBy", select: "-password" }
];

module.exports = {
  ARIZA_STATUSES,
  ACTIVE_STATUSES,
  ARIZA_ACTIONS,
  ArizaError,
  validateWeights,
  parseArizaListQuery,
  assertArizaProcessable,
  applyKirimUpdate,
  deleteKirimRecord,
  applyChiqimUpdate,
  deleteChiqimRecord,
  processArizaStatus,
  kirimArizaPopulate,
  chiqimArizaPopulate,
  buildPaginationMeta
};
