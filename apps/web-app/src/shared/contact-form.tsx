import {
  AlertCircle,
  CheckCircle,
  Mail,
  MapPin,
} from "lucide-react";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAppForm } from "@/shared/forms/form-context";
import { useTRPC } from "@/infrastructure/trpc/react";
import { Link } from "@tanstack/react-router";
import { Schema } from "effect";
import { Email } from "@map-poster/common";

import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { FormInput } from "@/shared/forms/form-input";
import { FormTextarea } from "@/shared/forms/form-textarea";

interface ContactInfo {
  icon: React.ReactNode;
  title: string;
  description: string;
  value: string;
  href: string;
  badge?: string;
}

const ContactFormSchema = Schema.Struct({
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

const contactInfo: ContactInfo[] = [
  {
    icon: <Mail className="size-6" />,
    title: "Email",
    description: "Get a response within 24 hours",
    value: "support@map-poster.ai",
    href: "mailto:support@map-poster.ai",
    badge: "Recommended",
  },
  // {
  //   icon: <MessagesSquare className="size-6" />,
  //   title: "Live Chat",
  //   description: "Instant support available now",
  //   value: "Start chatting",
  //   href: "#",
  //   badge: "Online",
  // },
  // {
  //   icon: <Phone className="size-6" />,
  //   title: "Phone",
  //   description: "Mon-Fri, 9AM-6PM CET",
  //   value: "+420 605 836 840",
  //   href: "tel:+420605836840",
  // },
  {
    icon: <MapPin className="size-6" />,
    title: "Office",
    description: "Schedule an in-person meeting",
    value: "Nad Stráněmi 5656, 760 05 Zlín, Czech Republic",
    href: "https://maps.app.goo.gl/WWjaQ4am78tybGhS6",
  },
];

const ContactForm = () => {
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
      message: "",
      agreeToTerms: false,
      honeypot: "" as string | undefined,
    },
    validators: {
      onChange: Schema.standardSchemaV1(ContactFormSchema),
    },
    onSubmit: async ({ value }) => {
      setSubmitStatus("idle");
      await submitContactForm.mutateAsync(value);
    },
  });

  return (
    <section className="relative py-16 md:py-24">
      <div className="container max-w-6xl mx-auto px-4 md:px-6 relative z-10">
        <div className="mx-auto">
          {/* Header */}
          <div className="mb-16 text-center">
            <h1 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              Contact Us
            </h1>
            <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
              Ready to start your next project? Our team is
              here to help you succeed. Reach out and let's
              discuss how we can bring your ideas to life.
            </p>
          </div>

          <div className="grid gap-12 lg:grid-cols-2">
            {/* Contact Information */}
            <div className="space-y-6">
              <div className="space-y-4">
                {contactInfo.map((info, index) => (
                  <Card key={index}>
                    <CardContent>
                      <div className="flex items-start gap-4">
                        <div className="bg-muted flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg">
                          {info.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-center gap-2">
                            <h3 className="font-semibold">
                              {info.title}
                            </h3>
                          </div>
                          <p className="text-muted-foreground mb-2 text-sm">
                            {info.description}
                          </p>
                          <a
                            href={info.href}
                            className="text-sm font-medium transition-colors hover:underline"
                          >
                            {info.value}
                          </a>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Contact Form */}
            <Card>
              <CardHeader>
                <CardTitle>Send us a message</CardTitle>
                <p className="text-muted-foreground text-sm">
                  Fill out the form below and we'll get back
                  to you within 24 hours.
                </p>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    await form.handleSubmit();
                  }}
                  className="space-y-6"
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
                    placeholder="Tell us about your project, goals, or how we can help..."
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
                            field.handleChange(
                              e.target.value
                            );
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
                              field.handleChange(
                                e.target.checked
                              );
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
                        {field.state.meta.errors.length >
                          0 && (
                          <div className="text-sm text-destructive space-y-1">
                            {field.state.meta.errors.map(
                              (
                                error: unknown,
                                index: number
                              ) => (
                                <p key={index}>
                                  {error &&
                                  typeof error ===
                                    "object" &&
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
                          Message sent successfully!
                        </span>
                      </CardContent>
                    </Card>
                  )}

                  {submitStatus === "error" && (
                    <Card className="bg-red-50 ring-red-200 py-0 dark:bg-red-950 dark:ring-red-800">
                      <CardContent className="p-3 flex items-center gap-2">
                        <AlertCircle className="size-6 text-red-600 dark:text-red-400" />
                        <span className="text-sm font-medium text-red-800 dark:text-red-200">
                          Something went wrong. Please try
                          again.
                        </span>
                      </CardContent>
                    </Card>
                  )}

                  <Button
                    type="submit"
                    disabled={
                      form.state.isSubmitting ||
                      submitContactForm.isPending
                    }
                    className="w-full"
                  >
                    {form.state.isSubmitting ||
                    submitContactForm.isPending ? (
                      <div className="flex items-center gap-2">
                        <div className="size-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Sending...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        Submit
                      </div>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export { ContactForm };
