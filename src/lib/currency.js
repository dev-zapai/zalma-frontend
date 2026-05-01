export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'MXN', symbol: 'MX$', name: 'Mexican Peso' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' },
];

const CURRENCY_MAP = Object.fromEntries(CURRENCIES.map(c => [c.code, c]));

// Default currency is now AUD per the salon's configured locale. Every
// price helper falls back to AUD when no code is provided so a missing
// `tenant.settings.currency` no longer silently shows USD.
export function getCurrencySymbol(code = 'AUD') {
  return CURRENCY_MAP[code]?.symbol || code;
}

export function formatPrice(amount, code = 'AUD') {
  const symbol = getCurrencySymbol(code);
  const num = parseFloat(amount) || 0;
  // JPY and similar zero-decimal currencies
  const decimals = ['JPY', 'KRW'].includes(code) ? 0 : 2;
  return `${symbol}${num.toFixed(decimals)}`;
}
