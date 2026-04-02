export const formatPrice = (amount) => {
  const numberAmount = Number(amount);
  
  if (isNaN(numberAmount)) return '$0.00';

  return new Intl.NumberFormat('en-US', { // 'en-US' usa $ y punto decimal. 'es-ES' usa € y coma.
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numberAmount);
};