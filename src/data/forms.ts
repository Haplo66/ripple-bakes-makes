import type { Form } from '../types/form';
import formRecords from './forms.json';

type GeneratedData<T> = {
  data: T[];
};

type FormRecord = Omit<Form, 'title'> & {
  title?: string;
};

const toForm = (record: FormRecord): Form => ({
  ...record,
  title: record.title || record.name,
});

/** Form data loaded from JSON to support future spreadsheet-backed imports. */
const rawFormRecords = Array.isArray(formRecords)
  ? formRecords
  : (formRecords as GeneratedData<FormRecord>).data;

export const forms: readonly Form[] = (rawFormRecords as FormRecord[]).map(toForm);

export const getAllForms = (): Form[] => forms.slice();

/** Returns the active form definition for a product form ID. */
export const getFormById = (formId: string): Form | undefined =>
  forms.find((form) => form.id === formId);

export const getFormsByIds = (ids: readonly string[]): Form[] =>
  ids
    .map((id) => getFormById(id))
    .filter((form): form is Form => Boolean(form));
