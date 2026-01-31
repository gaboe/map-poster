import {
  createFormHookContexts,
  createFormHook,
} from "@tanstack/react-form";

// Create form contexts
export const {
  fieldContext,
  formContext,
  useFieldContext,
  useFormContext,
} = createFormHookContexts();

// Create custom form hook
export const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {},
  formComponents: {},
});
