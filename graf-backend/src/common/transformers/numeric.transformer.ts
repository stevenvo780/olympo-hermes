export const numericTransformer = {
  to: (value: number | null): number | null => (value === null ? null : value),
  from: (value: string | number | null): number | null => {
    if (value === null || value === undefined) return null;
    if (typeof value === 'number') return value;
    const parsed = parseFloat(value as string);
    return isNaN(parsed) ? null : parsed;
  },
};
