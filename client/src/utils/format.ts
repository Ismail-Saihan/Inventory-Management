import { toWords } from 'number-to-words';

export const formatCurrency = (value: number | string): string => {
  const numeric = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'BDT',
    minimumFractionDigits: 2
  }).format(numeric || 0);
};

export const formatDate = (value: string | Date): string => {
  const date = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: 'short',
    day: '2-digit'
  }).format(date);
};

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export const amountToWords = (amount: number): string => {
  const [takaPart, paisaPart] = amount.toFixed(2).split('.');
  const taka = parseInt(takaPart, 10);
  const paisa = parseInt(paisaPart, 10);

  const takaWords = taka === 0 ? 'Zero taka' : `${capitalize(toWords(taka))} taka`;
  const paisaSuffix = paisa > 0 ? ` and ${toWords(paisa)} paisa` : '';
  return `${takaWords}${paisaSuffix} only`;
};
