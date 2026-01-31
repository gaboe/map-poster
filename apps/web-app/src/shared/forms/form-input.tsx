import { Input } from "@/shared/ui/input";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { useState } from "react";
import { type DeepKeys } from "@tanstack/react-form";
import type { FormApi } from "./types";
import { FormFieldWrapper } from "./form-field-wrapper";

/* eslint-disable @typescript-eslint/no-explicit-any */
export type FormInputProps<TFormData> = {
  form: FormApi<TFormData>;
  name: DeepKeys<TFormData>;
  label: string;
  placeholder?: string;
  type?:
    | "text"
    | "email"
    | "password"
    | "secret"
    | "url"
    | "number";
  required?: boolean;
  description?: string;
  className?: string;
  autoComplete?: string;
};

export function FormInput<TFormData>({
  form,
  name,
  label,
  placeholder,
  type = "text",
  required = false,
  description,
  className,
  autoComplete,
}: FormInputProps<TFormData>) {
  const [showPassword, setShowPassword] = useState(false);

  const isPasswordType =
    type === "password" || type === "secret";
  const inputType = isPasswordType
    ? showPassword
      ? "text"
      : "password"
    : type;

  const autocompleteValue =
    autoComplete ??
    (type === "email"
      ? "email"
      : type === "password"
        ? "current-password"
        : type === "secret"
          ? "new-password"
          : undefined);

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
        <div className="relative">
          <Input
            id={field.name}
            name={field.name}
            type={inputType}
            placeholder={placeholder}
            value={(field.state.value as string) ?? ""}
            onChange={(e) => {
              field.handleChange(e.target.value as any);
            }}
            onBlur={field.handleBlur}
            autoComplete={autocompleteValue}
            aria-invalid={isInvalid}
            className={isPasswordType ? "pr-10" : ""}
          />

          {isPasswordType && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => {
                setShowPassword(!showPassword);
              }}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      )}
    </FormFieldWrapper>
  );
}
