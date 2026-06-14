export const formatNumberWithCommas = (
  value: number | string,
  decimals: number = 0,
): string => {

  const num = Number(
    typeof value === 'string' ? value.replace(/[^0-9.-]/g, '') : value,
  );
  if (isNaN(num)) return '0';

  const fixed = num.toFixed(decimals);

  const [intPart, decPart] = fixed.split('.');

  const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  return decimals > 0 && decPart ? `${intFormatted}.${decPart}` : intFormatted;
};
