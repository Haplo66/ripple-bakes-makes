import type { ProductOption } from '../types/product-options';
import productOptionsRecords from '../content/product-options.json';

type GeneratedData<T> = {
  data: T[];
};

interface ProductOptionRecord {
  productId: string;
  optionName: string;
  optionType: ProductOption['type'];
  values: string[];
  required: boolean;
  displayOrder: number;
  placeholder: string | null;
  helpText: string | null;
}

const toProductOption = (record: ProductOptionRecord): ProductOption => ({
  id: `${record.productId}--${record.optionName.toLowerCase().replace(/\s+/g, '-')}`,
  label: record.optionName,
  type: record.optionType,
  required: record.required || undefined,
  values: record.values.length > 0 ? record.values : undefined,
  displayOrder: record.displayOrder || undefined,
  placeholder: record.placeholder ?? undefined,
  description: record.helpText ?? undefined,
});

const rawProductOptionsRecords = Array.isArray(productOptionsRecords)
  ? productOptionsRecords
  : (productOptionsRecords as GeneratedData<ProductOptionRecord>).data;

const sortByDisplayOrder = (a: ProductOption, b: ProductOption): number =>
  (a.displayOrder ?? 99) - (b.displayOrder ?? 99);

export const productOptions: readonly ProductOption[] = (
  rawProductOptionsRecords as ProductOptionRecord[]
).map(toProductOption);

export const getProductOptions = (productId: string): ProductOption[] =>
  productOptions
    .filter((option) => option.id.startsWith(`${productId}--`))
    .sort(sortByDisplayOrder);
