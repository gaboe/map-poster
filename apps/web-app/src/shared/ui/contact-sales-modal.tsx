import { useState } from "react";
import { AlertCircle, CheckCircle } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useAppForm } from "@/shared/forms/form-context";
import { useTRPC } from "@/infrastructure/trpc/react";
import { Link } from "@tanstack/react-router";
import { Schema } from "effect";
import { Email } from "@map-poster/common";

import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { FormInput } from "@/shared/forms/form-input";
import { FormTextarea } from "@/shared/forms/form-textarea";

const ContactSalesFormSchema = Schema.Struct({
  firstName: Schema.String.pipe(
    Schema.minLength(1, {
      message: () => "First name is required",
    })
  ),
  lastName: Schema.String.pipe(
    Schema.minLength(1, {
      message: () => "Last name is required",
    })
  ),
  email: Email,
  company: Schema.UndefinedOr(Schema.String),
  message: Schema.String.pipe(
    Schema.minLength(1, {
      message: () => "Message is required",
    })
  ),
  agreeToTerms: Schema.Boolean.pipe(
    Schema.filter((val) => val === true, {
      message: () => "You must agree to the terms",
    })
  ),
  honeypot: Schema.UndefinedOr(Schema.String),
});

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export function ContactSalesModal({
  isOpen,
  onClose,
}: Props) {
  const trpc = useTRPC();
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  const submitContactForm = useMutation(
    trpc.contact.submitContactForm.mutationOptions({
      onSuccess: () => {
        setSubmitStatus("success");
        form.reset();
      },
      onError: (error) => {
        console.error(
          "Contact form submission error:",
          error
        );
        setSubmitStatus("error");
      },
    })
  );

  const form = useAppForm({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      company: "" as string | undefined,
      message:
        "I'm interested in the Enterprise plan and would like to discuss pricing and features.",
      agreeToTerms: false,
      honeypot: "" as string | undefined,
    },
    validators: {
      onChange: Schema.standardSchemaV1(
        ContactSalesFormSchema
      ),
    },
    onSubmit: async ({ value }) => {
      setSubmitStatus("idle");
      await submitContactForm.mutateAsync(value);
    },
  });

  const handleClose = () => {
    setSubmitStatus("idle");
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Contact Sales</DialogTitle>
          <DialogDescription>
            Get in touch with our sales team to discuss
            Enterprise plans, custom pricing, and how we can
            help scale your business.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await form.handleSubmit();
          }}
          className="space-y-6 mt-6"
        >
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              form={form}
              name="firstName"
              label="First Name"
              placeholder="John"
              required
            />
            <FormInput
              form={form}
              name="lastName"
              label="Last Name"
              placeholder="Doe"
              required
            />
          </div>

          <FormInput
            form={form}
            name="email"
            label="Email Address"
            placeholder="john@company.com"
            type="email"
            required
          />

          <FormInput
            form={form}
            name="company"
            label="Company"
            placeholder="Your Company"
          />

          <FormTextarea
            form={form}
            name="message"
            label="Message"
            placeholder="Tell us about your requirements, expected usage, team size, or specific features you need..."
            rows={4}
            required
          />

          {/* Honeypot field - hidden from users */}
          <form.Field name="honeypot">
            {(field) => (
              <div className="hidden">
                <input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onChange={(e) => {
                    field.handleChange(e.target.value);
                  }}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>
            )}
          </form.Field>

          <form.Field name="agreeToTerms">
            {(field) => (
              <div className="space-y-2">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id={field.name}
                    checked={field.state.value}
                    onChange={(e) => {
                      field.handleChange(e.target.checked);
                    }}
                    className="mt-1"
                  />
                  <label
                    htmlFor={field.name}
                    className="text-muted-foreground text-sm leading-relaxed"
                  >
                    I agree to the{" "}
                    <Link
                      to="/tos"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-foreground font-medium hover:underline"
                    >
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link
                      to="/privacy-policy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-foreground font-medium hover:underline"
                    >
                      Privacy Policy
                    </Link>
                  </label>
                </div>
                {field.state.meta.errors.length > 0 && (
                  <div className="text-sm text-red-500 space-y-1">
                    {field.state.meta.errors.map(
                      (error: unknown, index: number) => (
                        <p key={index}>
                          {error &&
                          typeof error === "object" &&
                          "message" in error
                            ? (
                                error as {
                                  message: string;
                                }
                              ).message
                            : String(error)}
                        </p>
                      )
                    )}
                  </div>
                )}
              </div>
            )}
          </form.Field>

          {submitStatus === "success" && (
            <Card className="bg-green-50 ring-green-200 py-0 dark:bg-green-950 dark:ring-green-800">
              <CardContent className="p-3 flex items-center gap-2">
                <CheckCircle className="size-6 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-800 dark:text-green-200">
                  Message sent successfully! Our sales team
                  will contact you within 24 hours.
                </span>
              </CardContent>
            </Card>
          )}

          {submitStatus === "error" && (
            <Card className="bg-red-50 ring-red-200 py-0 dark:bg-red-950 dark:ring-red-800">
              <CardContent className="p-3 flex items-center gap-2">
                <AlertCircle className="size-6 text-red-600 dark:text-red-400" />
                <span className="text-sm font-medium text-red-800 dark:text-red-200">
                  Something went wrong. Please try again.
                </span>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-3 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                form.state.isSubmitting ||
                submitContactForm.isPending
              }
              className="flex-1"
            >
              {form.state.isSubmitting ||
              submitContactForm.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Sending...
                </div>
              ) : (
                "Send Message"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
