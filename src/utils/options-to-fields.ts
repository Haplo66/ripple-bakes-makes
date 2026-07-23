import type { ProductOption } from '../types/product-options';
import type { FormField, FormOption } from '../types/form';

const slugify = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-');

const toFormOptions = (values: string[]): FormOption[] =>
  values.map((v) => ({ value: slugify(v), label: v }));

const typeMap: Record<string, FormField['type']> = {
  select: 'select',
  multiselect: 'multiselect',
  radio: 'radio',
  text: 'text',
  textarea: 'textarea',
  number: 'number',
  checkbox: 'checkbox',
};

export const productOptionsToFormFields = (
  options: ProductOption[],
): FormField[] =>
  options.map((option) => {
    const fieldType = typeMap[option.type] || 'text';

    const field: FormField = {
      id: option.id,
      label: option.label,
      type: fieldType,
      required: option.required ?? false,
      helpText: option.description,
      placeholder: option.placeholder,
    };

    if (option.values && option.values.length > 0) {
      field.options = toFormOptions(option.values);
    }

    return field;
  });
