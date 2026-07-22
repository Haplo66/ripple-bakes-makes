/** Input styles supported for future product customization. */
export type ProductOptionType =
  | 'select'
  | 'multiselect'
  | 'text'
  | 'textarea'
  | 'number'
  | 'checkbox';

/** Reusable option definition for bakery and sewing product choices. */
export interface ProductOption {
  /** Stable identifier for form fields or order notes. */
  id: string;

  /** Customer-facing option label. */
  label: string;

  type: ProductOptionType;

  required?: boolean;

  /** Available choices for select-style options. */
  values?: string[];

  /** Optional helper text for future forms or product detail pages. */
  description?: string;
}

/** Optional customization model attached to products that support choices. */
export interface ProductCustomization {
  /** Product options such as flavor, fabric, color, or size. */
  options: ProductOption[];

  /** Optional note for custom requests outside predefined options. */
  customRequestLabel?: string;
}
