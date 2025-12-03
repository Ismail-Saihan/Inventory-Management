import { toWords } from 'number-to-words';

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export const amountToWords = (amount: number): string => {
  const [takaPart, paisaPart] = amount.toFixed(2).split('.');
  const taka = parseInt(takaPart, 10);
  const paisa = parseInt(paisaPart, 10);

  const takaText = taka === 0 ? 'Zero taka' : `${capitalize(toWords(taka))} taka`;
  const paisaText = paisa > 0 ? ` and ${toWords(paisa)} paisa` : '';

  return `${takaText}${paisaText} only`;
};
