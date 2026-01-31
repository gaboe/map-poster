import { createFileRoute } from "@tanstack/react-router";
import { WebLayout } from "@/web/layout/web-layout";

export const Route = createFileRoute(
  "/_web/privacy-policy"
)({
  component: PrivacyPolicyPage,
});

function PrivacyPolicyPage() {
  return (
    <WebLayout>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">
          Privacy Policy
        </h1>
        <div className="prose prose-gray max-w-none space-y-6">
          <p className="text-sm text-gray-600">
            <strong>Last updated:</strong>{" "}
            {new Date().toLocaleDateString()}
          </p>

          <section>
            <h2 className="text-lg font-semibold mb-3">
              1. Introduction
            </h2>
            <p>
              This Privacy Policy describes how we collect,
              use, and protect your information when you use
              our service that facilitates API calls and
              data intermediation between various platforms
              and services. We are committed to protecting
              your privacy and ensuring transparency about
              our data practices.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">
              2. Information We Collect
            </h2>
            <div className="space-y-3">
              <div>
                <h3 className="font-medium">
                  2.1 Account Information
                </h3>
                <p>
                  When you create an account, we collect
                  your email address, username, and
                  authentication credentials necessary for
                  service operation.
                </p>
              </div>
              <div>
                <h3 className="font-medium">
                  2.2 Service Usage Data
                </h3>
                <p>
                  We collect information about how you use
                  our service, including API calls made,
                  timestamps, request/response data
                  necessary for service functionality, and
                  system performance metrics.
                </p>
              </div>
              <div>
                <h3 className="font-medium">
                  2.3 Technical Information
                </h3>
                <p>
                  We automatically collect technical
                  information such as IP addresses, browser
                  type, device information, and access logs
                  for security and operational purposes.
                </p>
              </div>
              <div>
                <h3 className="font-medium">
                  2.4 Third-Party Integration Data
                </h3>
                <p>
                  When you connect third-party services
                  through our platform, we may temporarily
                  process data from those services solely to
                  facilitate the requested operations.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">
              3. How We Use Your Information
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                To provide and maintain our intermediation
                services
              </li>
              <li>
                To authenticate users and ensure secure
                access
              </li>
              <li>
                To process and route API calls between
                integrated services
              </li>
              <li>
                To monitor service performance and
                troubleshoot issues
              </li>
              <li>
                To improve our service functionality and
                user experience
              </li>
              <li>
                To comply with legal obligations and enforce
                our terms
              </li>
              <li>
                To send important service-related
                communications
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">
              4. Data Sharing and Disclosure
            </h2>
            <div className="space-y-3">
              <p>
                We do not sell your personal information. We
                may share information in the following
                circumstances:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Third-Party Services:</strong>{" "}
                  When you explicitly authorize connections
                  to third-party platforms, we share only
                  the necessary data to fulfill your
                  requests
                </li>
                <li>
                  <strong>Service Providers:</strong> With
                  trusted service providers who assist in
                  operating our platform under strict
                  confidentiality agreements
                </li>
                <li>
                  <strong>Legal Requirements:</strong> When
                  required by law, court order, or to
                  protect our rights and safety
                </li>
                <li>
                  <strong>Business Transfers:</strong> In
                  connection with mergers, acquisitions, or
                  asset sales with appropriate privacy
                  protections
                </li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">
              5. Data Security
            </h2>
            <p>
              We implement appropriate technical and
              organizational security measures to protect
              your information against unauthorized access,
              alteration, disclosure, or destruction. This
              includes encryption in transit and at rest,
              secure authentication protocols, and regular
              security assessments.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">
              6. Data Retention
            </h2>
            <p>
              We retain your information only as long as
              necessary to provide our services and comply
              with legal obligations. API call logs and
              temporary processing data are typically
              retained for limited periods necessary for
              service operation and troubleshooting.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">
              7. Your Rights and Choices
            </h2>
            <p>
              Depending on your location, you may have the
              following rights regarding your personal
              information:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access to your personal information</li>
              <li>Correction of inaccurate data</li>
              <li>Deletion of your personal information</li>
              <li>Data portability</li>
              <li>Objection to processing</li>
              <li>Withdrawal of consent</li>
            </ul>
            <p className="mt-3">
              To exercise these rights, please contact us
              using the information provided below.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">
              8. International Data Transfers
            </h2>
            <p>
              Your information may be processed and stored
              in countries other than your own. We ensure
              appropriate safeguards are in place for
              international data transfers in compliance
              with applicable privacy laws.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">
              9. Children's Privacy
            </h2>
            <p>
              Our service is not intended for children under
              13 years of age. We do not knowingly collect
              personal information from children under 13.
              If we become aware that we have collected such
              information, we will take steps to delete it
              promptly.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">
              10. Changes to This Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to
              time. We will notify you of any material
              changes by posting the updated policy on our
              website and updating the "Last updated" date.
              Your continued use of the service after such
              changes constitutes acceptance of the updated
              policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">
              11. Contact Information
            </h2>
            <p>
              If you have any questions about this Privacy
              Policy or our privacy practices, please
              contact us through our support channels or
              customer service.
            </p>
          </section>
        </div>
      </div>
    </WebLayout>
  );
}
