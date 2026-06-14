/**
 * Formatea un número con separadores de miles usando puntos y decimales con comas (formato colombiano)
 * @param value - El valor numérico a formatear
 * @param decimals - Número de decimales (por defecto 0)
 * @returns String formateado: 13.000,50 (miles con puntos, decimales con comas)
 */
export const formatNumberWithCommas = (
  value: number | string,
  decimals: number = 0,
): string => {
  let num: number;
  if (typeof value === 'number') {
    num = value;
  } else {
    const s = value ?? '';
    const looksLikeEs = s.includes(',') || /\.\d{3}(\D|$)/.test(s);
    num = looksLikeEs ? parseEsNumber(s) : Number(s.replace(/[^0-9.-]/g, ''));
  }

  if (isNaN(num)) return '0';

  const fixed = num.toFixed(decimals);
  const [intPart, decPart] = fixed.split('.');
  const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  return decimals > 0 && decPart ? `${intFormatted},${decPart}` : intFormatted;
};

/**
 * Parsea una cadena numérica manejando correctamente:
 * - es-CO: miles con punto y decimales con coma ("13.500,75")
 * - en-US/plain: sin separador de miles y punto decimal ("240000.00")
 * - miles con punto sin decimales ("240.000")
 */
export const parseEsNumber = (value: string): number => {
  if (!value) return NaN;
  const s = String(value).trim();

  if (s.includes(',')) {
    const normalized = s.replace(/\./g, '').replace(/,/g, '.');
    const num = parseFloat(normalized);
    return isNaN(num) ? NaN : num;
  }

  if (s.includes('.')) {
    const thousandGrouping = /^\d{1,3}(\.\d{3})+$/;
    if (thousandGrouping.test(s)) {
      const num = parseInt(s.replace(/\./g, ''), 10);
      return isNaN(num) ? NaN : num;
    }
    const num = parseFloat(s);
    return isNaN(num) ? NaN : num;
  }

  const num = parseFloat(s);
  return isNaN(num) ? NaN : num;
};
