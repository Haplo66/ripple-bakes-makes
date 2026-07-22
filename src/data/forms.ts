import type { Form } from '../types/form';

/** Product inquiry form definitions keyed by Product.formId. */
export const forms: readonly Form[] = [
  {
    id: 'birthday-cake-form',
    title: 'Birthday Cake',
    fields: [
      {
        id: 'flavor',
        label: 'Flavor',
        type: 'select',
        required: true,
        options: [
          { value: 'vanilla', label: 'Vanilla' },
          { value: 'chocolate', label: 'Chocolate' },
          { value: 'red-velvet', label: 'Red Velvet' },
          { value: 'lemon', label: 'Lemon' },
        ],
      },
      {
        id: 'size',
        label: 'Size',
        type: 'select',
        required: true,
        options: [
          { value: 'six-inch', label: '6 inch' },
          { value: 'eight-inch', label: '8 inch' },
          { value: 'ten-inch', label: '10 inch' },
        ],
      },
      {
        id: 'message',
        label: 'Message',
        type: 'text',
        required: false,
        placeholder: 'Happy birthday, Maya!',
        helpText: 'Optional short message for the cake.',
      },
    ],
  },
  {
    id: 'adult-t-shirt-form',
    title: 'Adult T-Shirt',
    fields: [
      {
        id: 'size',
        label: 'Size',
        type: 'select',
        required: true,
        options: [
          { value: 'small', label: 'Small' },
          { value: 'medium', label: 'Medium' },
          { value: 'large', label: 'Large' },
          { value: 'extra-large', label: 'Extra Large' },
        ],
      },
      {
        id: 'color',
        label: 'Color',
        type: 'select',
        required: true,
        options: [
          { value: 'cream', label: 'Cream' },
          { value: 'sage', label: 'Sage' },
          { value: 'rose', label: 'Rose' },
          { value: 'cocoa', label: 'Cocoa' },
        ],
      },
      {
        id: 'theme',
        label: 'Theme',
        type: 'select',
        required: false,
        options: [
          { value: 'floral', label: 'Floral' },
          { value: 'birthday', label: 'Birthday' },
          { value: 'seasonal', label: 'Seasonal' },
          { value: 'other', label: 'Other' },
        ],
      },
      {
        id: 'themeDescription',
        label: 'Theme Description',
        type: 'textarea',
        required: false,
        placeholder: 'Share the look, colors, or wording you have in mind.',
        helpText: 'Shown when Theme is Other.',
        condition: {
          fieldId: 'theme',
          equals: 'other',
        },
      },
    ],
  },
];

/** Returns the active form definition for a product form ID. */
export const getFormById = (formId: string): Form | undefined =>
  forms.find((form) => form.id === formId);
