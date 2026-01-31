import { Checkbox } from "@/shared/ui/checkbox";
import { type DeepKeys } from "@tanstack/react-form";
import type { FormApi } from "./types";
import { FormFieldWrapper } from "./form-field-wrapper";

/* eslint-disable @typescript-eslint/no-explicit-any */
export type FormCheckboxProps<TFormData> = {
  form: FormApi<TFormData>;
  name: DeepKeys<TFormData>;
  label: string;
  description?: string;
  className?: string;
};

export function FormCheckbox<TFormData>({
  form,
  name,
  label,
  description,
  className,
}: FormCheckboxProps<TFormData>) {
  return (
    <FormFieldWrapper
      form={form}
      name={name}
      label={label}
      description={description ?? null}
      className={className ?? null}
      orientation="horizontal"
    >
      {(field, isInvalid) => (
        <Checkbox
          id={field.name}
          checked={(field.state.value as boolean) ?? false}
          onCheckedChange={(checked) => {
            field.handleChange(checked as any);
          }}
          onBlur={field.handleBlur}
          aria-invalid={isInvalid}
        />
      )}
    </FormFieldWrapper>
  );
}
