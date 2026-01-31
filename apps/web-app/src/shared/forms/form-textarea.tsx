import { Textarea } from "@/shared/ui/textarea";
import { type DeepKeys } from "@tanstack/react-form";
import type { FormApi } from "./types";
import { FormFieldWrapper } from "./form-field-wrapper";

/* eslint-disable @typescript-eslint/no-explicit-any */
export type FormTextareaProps<TFormData> = {
  form: FormApi<TFormData>;
  name: DeepKeys<TFormData>;
  label: string;
  placeholder?: string;
  rows?: number;
  required?: boolean;
  description?: string;
  className?: string;
};

export function FormTextarea<TFormData>({
  form,
  name,
  label,
  placeholder,
  rows = 3,
  required = false,
  description,
  className,
}: FormTextareaProps<TFormData>) {
  return (
    <FormFieldWrapper
      form={form}
      name={name}
      label={label}
      required={required}
      description={description ?? null}
      className={className ?? null}
    >
      {(field, isInvalid) => (
        <Textarea
          id={field.name}
          name={field.name}
          placeholder={placeholder}
          value={(field.state.value as string) ?? ""}
          onChange={(e) => {
            field.handleChange(e.target.value as any);
          }}
          onBlur={field.handleBlur}
          aria-invalid={isInvalid}
          rows={rows}
        />
      )}
    </FormFieldWrapper>
  );
}
