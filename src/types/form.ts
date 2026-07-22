/** Field input types supported by reusable product inquiry forms. */
export type FormFieldType =
  | 'text'
  | 'textarea'
  | 'select'
  | 'multiselect'
  | 'checkbox'
  | 'radio'
  | 'number'
  | 'date'
  | 'email'
  | 'phone';

/** Reusable display option for choice-based form fields. */
export interface FormOption {
  value: string;
  label: string;
}

/** Conditional rule for showing a field based on another field value. */
export interface FormCondition {
  fieldId: string;
  equals: string | number | boolean;
}

/** Data-driven field definition for future product customization forms. */
export interface FormField {
  id: string;
  label: string;
  type: FormFieldType;
  required: boolean;
  placeholder?: string;
  helpText?: string;
  options?: FormOption[];
  condition?: FormCondition;
}

/** Reusable form definition referenced by product form IDs. */
export interface Form {
  id: string;
  title: string;
  fields: FormField[];
}
