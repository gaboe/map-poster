import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";

import { publicProcedure } from "@/infrastructure/trpc/procedures/auth";
import {
  badRequestError,
  internalServerError,
} from "@/infrastructure/errors";
import { env } from "@/env/server";
import { Schema } from "effect";
import { logger } from "@map-poster/logger";
import { Email } from "@map-poster/common";

export const router = {
  submitContactForm: publicProcedure
    .input(
      Schema.standardSchemaV1(
        Schema.Struct({
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
          company: Schema.optional(Schema.String),
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
          honeypot: Schema.optionalWith(Schema.String, {
            default: () => "",
          }),
        })
      )
    )
    .mutation(async ({ input }) => {
      // Honeypot spam protection - if filled, it's likely spam
      if (input.honeypot && input.honeypot.length > 0) {
        throw badRequestError("Spam detected");
      }

      try {
        // Prepare email content
        const htmlContent = `
          <h2>Nový kontaktní formulář z webu ${env.BASE_URL}</h2>
          <p><strong>Jméno:</strong> ${input.firstName} ${input.lastName}</p>
          <p><strong>Email:</strong> ${input.email}</p>
          ${input.company ? `<p><strong>Společnost:</strong> ${input.company}</p>` : ""}
          <p><strong>Zpráva:</strong></p>
          <p>${input.message.replace(/\n/g, "<br>")}</p>
          <hr>
          <p><em>Odesláno z kontaktního formuláře na ${env.BASE_URL}</em></p>
        `;

        // Send email via Brevo API
        const response = await fetch(
          "https://api.brevo.com/v3/smtp/email",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "api-key": env.BREVO_API_KEY,
            },
            body: JSON.stringify({
              sender: {
                name: "map-poster",
                email: "it@blogic.cz",
              },
              to: env.CONTACT_FORM_RECIPIENTS.split(
                ","
              ).map((email) => ({
                email: email.trim(),
              })),
              subject: `Nový kontaktní formulář z webu ${env.BASE_URL}`,
              htmlContent,
              replyTo: {
                name: `${input.firstName} ${input.lastName}`,
                email: input.email,
              },
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({}));
          logger.error({ errorData }, "Brevo API error");
          throw internalServerError("Failed to send email");
        }

        return { success: true };
      } catch (error) {
        logger.error(
          { error },
          "Contact form submission error"
        );

        // Re-throw if already a TRPCError (from internalServerError or badRequestError)
        if (error instanceof TRPCError) {
          throw error;
        }

        throw internalServerError(
          "Failed to send contact form"
        );
      }
    }),
} satisfies TRPCRouterRecord;
