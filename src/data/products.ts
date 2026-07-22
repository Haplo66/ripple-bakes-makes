import type { Product } from '../types/product';
import productRecords from './products.json';

type GeneratedData<T> = {
  data: T[];
};

type ProductRecord = Omit<Product, 'collectionId' | 'status' | 'title'> & {
  collection: string;
  name: string;
  title?: string;
  status: Product['status'] | 'Active' | 'Seasonal' | 'Out of Stock' | 'Preorder';
};

const statusMap: Record<ProductRecord['status'], Product['status']> = {
  Active: 'available',
  Seasonal: 'seasonal',
  'Out of Stock': 'out-of-stock',
  Preorder: 'preorder',
  available: 'available',
  seasonal: 'seasonal',
  'out-of-stock': 'out-of-stock',
  preorder: 'preorder',
};

const toProduct = (record: ProductRecord): Product => ({
  ...record,
  collectionId: record.collection,
  title: record.title || record.name,
  status: statusMap[record.status],
});

/** Product data loaded from JSON to support future spreadsheet-backed imports. */
const rawProductRecords = Array.isArray(productRecords)
  ? productRecords
  : (productRecords as GeneratedData<ProductRecord>).data;

export const products: readonly Product[] = (rawProductRecords as ProductRecord[]).map(toProduct);

const orderedActive = (items: readonly Product[]): Product[] =>
  items
    .filter((product) => product.active)
    .slice()
    .sort((a, b) => a.displayOrder - b.displayOrder);

/** Returns all active products sorted by display order. */
export const getAllProducts = (): Product[] => orderedActive(products);

/** Returns active products belonging to a specific collection ID. */
export const getProductsByCollection = (
  collectionId: string,
): Product[] =>
  orderedActive(
    products.filter((product) => product.collectionId === collectionId),
  );

/** Returns active products belonging to a specific business area. */
export const getProductsByBusinessArea = (
  area: Product['businessArea'],
): Product[] =>
  orderedActive(
    products.filter((product) => product.businessArea === area),
  );

/** Returns active featured products sorted by display order. */
export const getFeaturedProducts = (): Product[] =>
  orderedActive(products.filter((product) => product.featured));

/** Returns a product by unique ID, including inactive records. */
export const getProductById = (id: string): Product | undefined =>
  products.find((product) => product.id === id);

