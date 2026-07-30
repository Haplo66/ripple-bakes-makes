/*
 * Copyright (c) 2026 Eyal Tal. All rights reserved. Proprietary and confidential. Unauthorized copying of this file is strictly prohibited.
 *
 *
 */

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

/** Optional browser validation attributes for supported form fields. */
export interface FormFieldValidation {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
}

/** Data-driven field definition for future product customization forms. */
export interface FormField {
  id: string;
  label: string;
  type: FormFieldType;
  required: boolean;
  section?: string;
  placeholder?: string;
  helpText?: string;
  defaultValue?: string;
  options?: FormOption[];
  condition?: FormCondition;
  validation?: FormFieldValidation;
}

/** Reusable form definition referenced by product form IDs. */
export interface Form {
  id: string;
  /** Sheet-friendly form name. */
  name: string;
  description?: string;
  /** UI-facing title retained for existing renderers. */
  title: string;
  fields: FormField[];
}
