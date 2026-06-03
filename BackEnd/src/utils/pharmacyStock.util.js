export const getStockStatus = (stock) => {
  if (stock <= 100) return 'Critical';
  if (stock <= 250) return 'Low';
  return 'OK';
};

export const buildStockAlertMessage = (name, stock, status) => {
  if (status === 'Critical') {
    return `Only ${stock} units left. Reorder immediately.`;
  }
  return `${stock} units remaining. Reorder soon.`;
};
