import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { type DeepKeys } from "@tanstack/react-form";
import type { FormApi } from "./types";
import { FormFieldWrapper } from "./form-field-wrapper";

export type FormSelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

/* eslint-disable @typescript-eslint/no-explicit-any */
export type FormSelectProps<TFormData> = {
  form: FormApi<TFormData>;
  name: DeepKeys<TFormData>;
  label: string;
  placeholder?: string;
  options: FormSelectOption[];
  required?: boolean;
  description?: string;
  className?: string;
};

export function FormSelect<TFormData>({
  form,
  name,
  label,
  placeholder = "Select an option",
  options,
  required = false,
  description,
  className,
}: FormSelectProps<TFormData>) {
  return (
    <FormFieldWrapper
      form={form}
      name={name}
      label={label}
      required={required}
      description={description ?? null}
      className={className ?? null}
    >
      {(field, isInvalid) => {
        const value = field.state.value as
          | string
          | undefined;
        const selectedOption = options.find(
          (o) => o.value === value
        );

        return (
          <Select
            value={value || undefined}
            onValueChange={(newValue) => {
              field.handleChange(newValue as any);
            }}
            onOpenChange={(open: boolean) => {
              if (!open) {
                field.handleBlur();
              }
            }}
          >
            <SelectTrigger aria-invalid={isInvalid}>
              <SelectValue placeholder={placeholder}>
                {selectedOption?.label}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled ?? false}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      }}
    </FormFieldWrapper>
  );
}
