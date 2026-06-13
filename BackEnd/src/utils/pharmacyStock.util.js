export const getStockStatus = (stock) => {
  if (stock <= 100) return 'Critical';
  if (stock <= 250) return 'Low';
  return 'OK';
};

export const buildStockAlertMessage = (name, stockPacks, status) => {
  const qty = Math.floor(Number(stockPacks) || 0);
  if (status === 'Critical') {
    return `Only ${qty} pack(s) left. Reorder immediately.`;
  }
  return `${qty} pack(s) remaining. Reorder soon.`;
};
