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

export const productStatusLabels: Record<string, string> = {
  available: 'Available',
  seasonal: 'Seasonal',
  'out-of-stock': 'Out of Stock',
  preorder: 'Preorder',
};

export const formatProductStatus = (status: string): string =>
  productStatusLabels[status] || status;
