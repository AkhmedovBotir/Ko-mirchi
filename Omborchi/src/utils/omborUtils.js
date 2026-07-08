export const getOmborId = (ref) => {
  if (!ref) return '';
  if (typeof ref === 'object') return String(ref._id || ref.id || '');
  return String(ref);
};

export const getRecordOmborId = (record) => {
  if (!record) return '';
  if (record.ombor && typeof record.ombor === 'object') {
    return getOmborId(record.ombor);
  }
  if (record.omborId) return String(record.omborId);
  if (record.ombor) return String(record.ombor);
  return '';
};

export const getRecordRecipientOmborId = (record) => {
  if (!record) return '';
  if (record.recipientOmbor && typeof record.recipientOmbor === 'object') {
    return getOmborId(record.recipientOmbor);
  }
  if (record.recipientOmborId) return String(record.recipientOmborId);
  if (record.recipientOmbor) return String(record.recipientOmbor);
  return '';
};

export const matchesSelectedOmbor = (recordOmborId, selectedOmborId) => {
  if (!selectedOmborId) return true;
  return String(recordOmborId) === String(selectedOmborId);
};

export const filterBySourceOmbor = (items, selectedOmborId) => {
  if (!selectedOmborId) return items;
  return items.filter((item) => matchesSelectedOmbor(getRecordOmborId(item), selectedOmborId));
};

export const filterByRecipientOmbor = (items, selectedOmborId) => {
  if (!selectedOmborId) return items;
  return items.filter((item) =>
    matchesSelectedOmbor(getRecordRecipientOmborId(item), selectedOmborId)
  );
};
