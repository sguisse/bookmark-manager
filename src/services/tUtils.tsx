// small helpers used by UI components
export const readableTextColor = (bg: string) => {
  const hex = (bg || '').replace('#', '');
  const normalized = hex.length === 3 ? hex.split('').map(c => c + c).join('') : hex;
  const bigint = parseInt(normalized || '000000', 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  const l = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return l > 0.6 ? '#000' : '#fff';
};

export default { readableTextColor };
