export const formatLabel = (value: string): string =>
  value
    .replace(/([A-Z])/g, ' $1')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .trim();

export const formatValue = (value: unknown): string =>
  Array.isArray(value) ? value.join(', ') : String(value);

export const formatPrice = (price: number | undefined | null): string | null => {
  if (price == null || !Number.isFinite(price)) return null;
  return `$${price.toFixed(2)}`;
};
