export const parseNumberValue = (value) => {
  if (value === null || value === undefined) return NaN;
  const cleaned = String(value).replace(/\s/g, '');
  const parsed = Number(cleaned);
  return Number.isNaN(parsed) ? NaN : parsed;
};

export const formatKgNumber = (value) => {
  const numeric = parseNumberValue(value);
  if (Number.isNaN(numeric)) return '0';
  return Math.trunc(numeric).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

export const formatTonNumber = (tonValue) => {
  const numeric = parseNumberValue(tonValue);
  if (Number.isNaN(numeric)) return '0';
  if (numeric === 0) return '0';
  if (Number.isInteger(numeric)) return String(numeric);
  return numeric.toFixed(2).replace(/\.?0+$/, '');
};

export const formatWeightAsTon = ({ kg, ton } = {}) => {
  const kgNum = parseNumberValue(kg);
  if (!Number.isNaN(kgNum)) {
    return formatTonNumber(kgNum / 1000);
  }
  const tonNum = parseNumberValue(ton);
  if (!Number.isNaN(tonNum)) {
    return formatTonNumber(tonNum);
  }
  return '0';
};
