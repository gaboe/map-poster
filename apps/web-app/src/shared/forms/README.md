# Form Components

Type-safe form components built on top of TanStack Form with automatic validation display and consistent styling.

## Components

### FormInput

Text input field with support for multiple input types including password visibility toggle.

**Props:**

- `form: FormApi<TFormData>` - Form instance from `useAppForm`
- `name: DeepKeys<TFormData>` - Type-safe field name (supports nested paths like `"user.email"`)
- `label: string` - Field label
- `type?: "text" | "email" | "password" | "secret" | "url" | "number"` - Input type (default: `"text"`)
  - `"password"` - Password field with eye icon (autocomplete: `current-password`)
  - `"secret"` - Secret/API key field with eye icon (autocomplete: `new-password`)
- `placeholder?: string` - Input placeholder
- `required?: boolean` - Shows red asterisk in label
- `description?: string` - Help text below input
- `className?: string` - Additional CSS classes
- `autoComplete?: string` - HTML autocomplete attribute (auto-detected from type if not provided)

**Example:**

```tsx
<FormInput
  form={form}
  name="email"
  label="Email Address"
  type="email"
  placeholder="john@example.com"
  required
  description="We'll never share your email"
/>
```

### FormTextarea

Multi-line text area field.

**Props:**

- `form: FormApi<TFormData>` - Form instance
- `name: DeepKeys<TFormData>` - Type-safe field name
- `label: string` - Field label
- `placeholder?: string` - Textarea placeholder
- `rows?: number` - Number of visible text rows (default: `3`)
- `required?: boolean` - Shows red asterisk in label
- `description?: string` - Help text below textarea
- `className?: string` - Additional CSS classes

**Example:**

```tsx
<FormTextarea
  form={form}
  name="message"
  label="Message"
  placeholder="Tell us more..."
  rows={5}
  required
/>
```

### FormSelect

Dropdown select field using shadcn/ui Select component.

**Props:**

- `form: FormApi<TFormData>` - Form instance
- `name: DeepKeys<TFormData>` - Type-safe field name
- `label: string` - Field label
- `options: FormSelectOption[]` - Array of `{ value: string, label: string, disabled?: boolean }`
- `placeholder?: string` - Placeholder text (default: `"Select an option"`)
- `required?: boolean` - Shows red asterisk in label
- `description?: string` - Help text below select
- `className?: string` - Additional CSS classes

**Example:**

```tsx
<FormSelect
  form={form}
  name="role"
  label="Role"
  options={[
    { value: "admin", label: "Administrator" },
    { value: "member", label: "Member" },
    { value: "guest", label: "Guest", disabled: true },
  ]}
  required
/>
```

### FormCheckbox

Checkbox field with horizontal layout (checkbox left, label right).

**Props:**

- `form: FormApi<TFormData>` - Form instance
- `name: DeepKeys<TFormData>` - Type-safe field name
- `label: string` - Field label (displayed next to checkbox)
- `description?: string` - Help text below label
- `className?: string` - Additional CSS classes

**Example:**

```tsx
<FormCheckbox
  form={form}
  name="agreeToTerms"
  label="I agree to the Terms of Service"
  description="You must accept to continue"
/>
```

## Usage

### 1. Create Form with Schema

```tsx
import { useAppForm } from "@/shared/forms/form-context";
import {
  FormInput,
  FormSelect,
  FormTextarea,
} from "@/shared/forms";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "member"]),
  bio: z.string().min(10),
});

function MyForm() {
  const form = useAppForm({
    defaultValues: {
      email: "",
      role: "member" as const,
      bio: "",
    },
    validators: { onChange: schema },
    onSubmit: async ({ value }) => {
      console.log(value); // Type-safe!
    },
  });

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        await form.handleSubmit();
      }}
    >
      <FormInput
        form={form}
        name="email"
        label="Email"
        type="email"
        required
      />
      <FormSelect
        form={form}
        name="role"
        label="Role"
        options={[
          { value: "admin", label: "Admin" },
          { value: "member", label: "Member" },
        ]}
      />
      <FormTextarea
        form={form}
        name="bio"
        label="Bio"
        rows={4}
      />
      <button type="submit">Submit</button>
    </form>
  );
}
```

### 2. Nested Field Paths

Form components support nested paths using `DeepKeys`:

```tsx
const schema = z.object({
  user: z.object({
    profile: z.object({
      firstName: z.string(),
      lastName: z.string(),
    }),
  }),
});

<FormInput
  form={form}
  name="user.profile.firstName" // ✅ Type-safe nested path
  label="First Name"
/>;
```

### 3. Validation Display

All components automatically display validation errors when:

- Field is touched (`onBlur` triggered)
- Field has validation errors from schema

No manual error handling needed!

## Architecture

### FormFieldWrapper (Internal)

Shared wrapper component that handles:

- Field registration with TanStack Form
- Validation state calculation
- Label rendering (with required asterisk)
- Description rendering
- Error message display
- Horizontal/vertical layout support

All form components use `FormFieldWrapper` internally to maintain consistency.

### Type Safety

**FormApi Type:**

```typescript
// Simplified type alias for ReactFormExtendedApi
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
```

**SimpleFieldApi Type:**

```typescript
// Simplified type alias for FieldApi (23 generic parameters!)
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
```

These type aliases avoid repeating complex generic types while maintaining type safety.

## Best Practices

### ✅ Do

```tsx
// Use FormInput/FormSelect/FormTextarea for standard fields
<FormInput form={form} name="email" label="Email" type="email" />

// Group related fields logically
<div className="grid grid-cols-2 gap-4">
  <FormInput form={form} name="firstName" label="First Name" />
  <FormInput form={form} name="lastName" label="Last Name" />
</div>

// Use description for help text
<FormInput
  form={form}
  name="apiKey"
  label="API Key"
  type="secret"
  description="Your API key will be encrypted"
/>
```

### ❌ Don't

```tsx
// Don't use form.Field directly - use form components instead
<form.Field name="email">
  {(field) => <Input {...field} />}
</form.Field>

// Don't manually render errors - components handle it
<FormInput form={form} name="email" label="Email" />
{field.state.meta.errors && <span>Error!</span>} // ❌ Redundant

// Don't forget to mark required fields
<FormInput form={form} name="email" label="Email" /> // ❌ Missing required
```
