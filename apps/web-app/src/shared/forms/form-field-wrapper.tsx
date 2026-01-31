import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
} from "@/shared/ui/field";
import { type DeepKeys } from "@tanstack/react-form";
import type { FormApi, SimpleFieldApi } from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Props<TFormData> = {
  form: FormApi<TFormData>;
  name: DeepKeys<TFormData>;
  label: string;
  required?: boolean;
  description: string | null | undefined;
  className: string | null | undefined;
  orientation?: "vertical" | "horizontal";
  children: (
    field: SimpleFieldApi,
    isInvalid: boolean
  ) => React.ReactNode;
};

export function FormFieldWrapper<TFormData>({
  form,
  name,
  label,
  required = false,
  description,
  className,
  orientation,
  children,
}: Props<TFormData>) {
  return (
    <form.Field name={name}>
      {(field) => {
        const isInvalid =
          field.state.meta.isTouched &&
          field.state.meta.errors.length > 0;

        if (orientation === "horizontal") {
          return (
            <Field
              data-invalid={isInvalid}
              className={className ?? undefined}
              orientation="horizontal"
            >
              {children(field, isInvalid)}
              <div className="flex-1 space-y-2">
                <FieldLabel
                  htmlFor={field.name}
                  className="font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {label}
                  {required && (
                    <span className="text-red-500 ml-1">
                      *
                    </span>
                  )}
                </FieldLabel>

                {description && (
                  <FieldDescription>
                    {description}
                  </FieldDescription>
                )}

                {isInvalid && (
                  <FieldError
                    errors={field.state.meta.errors}
                  />
                )}
              </div>
            </Field>
          );
        }

        return (
          <Field
            data-invalid={isInvalid}
            className={className ?? undefined}
          >
            <FieldLabel htmlFor={field.name}>
              {label}
              {required && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </FieldLabel>

            {children(field, isInvalid)}

            {description && (
              <FieldDescription>
                {description}
              </FieldDescription>
            )}

            {isInvalid && (
              <FieldError
                errors={field.state.meta.errors}
              />
            )}
          </Field>
        );
      }}
    </form.Field>
  );
}
