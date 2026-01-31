import {
  type FieldApi,
  type ReactFormExtendedApi,
} from "@tanstack/react-form";

/* eslint-disable @typescript-eslint/no-explicit-any */

// Helper type for simpler FieldApi usage - similar to React Hook Form approach
// TanStack Form's FieldApi has 23 complex generic parameters that are difficult to type properly
// This helper abstracts the complexity while maintaining the essential typing for form components
export type SimpleFieldApi<TFormData = any> = FieldApi<
  TFormData,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any
>;

// Helper type for form prop in form components
// ReactFormExtendedApi has 12 complex generic parameters
// This helper abstracts the complexity while maintaining type-safe field names through TFormData
export type FormApi<TFormData> = ReactFormExtendedApi<
  TFormData,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any
>;

/* eslint-enable @typescript-eslint/no-explicit-any */

// Common props that all form components share
export type BaseFormProps<TFormData = unknown> = {
  field: SimpleFieldApi<TFormData>;
  label: string;
  required?: boolean;
  description?: string;
  className?: string;
};
