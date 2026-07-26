export function formatCurrency(amount: number, currencySymbolOrCode: string = '£'): string {
  const currencyMap: Record<string, string> = {
    '£': 'GBP',
    '$': 'USD',
    '₹': 'INR',
    'Rs': 'PKR',
    '৳': 'BDT',
    '€': 'EUR',
    'AED': 'AED'
  };

  const isoCode = currencyMap[currencySymbolOrCode] || (currencySymbolOrCode.length === 3 ? currencySymbolOrCode : 'USD');

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: isoCode,
      maximumFractionDigits: 2
    }).format(amount);
  } catch (e) {
    const safeAmount = isNaN(amount) ? 0 : amount;
    return `${currencySymbolOrCode}${safeAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}
