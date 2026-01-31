import { createFileRoute } from "@tanstack/react-router";
import { WebLayout } from "@/web/layout/web-layout";

export const Route = createFileRoute("/_web/tos")({
  component: TosPage,
});

function TosPage() {
  return (
    <WebLayout>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">
          Terms of Service
        </h1>
        <div className="prose prose-gray max-w-none space-y-6">
          <p className="text-sm text-gray-600">
            <strong>Last updated:</strong>{" "}
            {new Date().toLocaleDateString()}
          </p>

          <section>
            <h2 className="text-lg font-semibold mb-3">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing and using our service, you accept
              and agree to be bound by the terms and
              provision of this agreement. Our service
              provides API intermediation and call routing
              between various platforms and services. If you
              do not agree to abide by the above, please do
              not use this service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">
              2. Description of Service
            </h2>
            <p>
              We provide a platform that facilitates API
              calls and data intermediation between various
              third-party services and applications. Our
              service acts as an intermediary to process,
              route, and manage API requests and responses
              between integrated platforms while maintaining
              security and reliability standards.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">
              3. User Accounts and Registration
            </h2>
            <div className="space-y-3">
              <div>
                <h3 className="font-medium">
                  3.1 Account Creation
                </h3>
                <p>
                  To use our service, you must create an
                  account by providing accurate and complete
                  information. You are responsible for
                  maintaining the confidentiality of your
                  account credentials.
                </p>
              </div>
              <div>
                <h3 className="font-medium">
                  3.2 Account Responsibility
                </h3>
                <p>
                  You are responsible for all activities
                  that occur under your account. You must
                  notify us immediately of any unauthorized
                  use of your account or any other breach of
                  security.
                </p>
              </div>
              <div>
                <h3 className="font-medium">
                  3.3 Eligibility
                </h3>
                <p>
                  You must be at least 18 years old to use
                  this service. By using the service, you
                  represent and warrant that you meet this
                  age requirement.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">
              4. Acceptable Use Policy
            </h2>
            <p>You agree not to use the service to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Violate any applicable laws, regulations, or
                third-party rights
              </li>
              <li>
                Transmit any harmful, illegal, or malicious
                content
              </li>
              <li>
                Attempt to gain unauthorized access to our
                systems or other users' accounts
              </li>
              <li>
                Interfere with or disrupt the integrity or
                performance of the service
              </li>
              <li>
                Use the service for any commercial purpose
                without our express written consent
              </li>
              <li>
                Reverse engineer, decompile, or attempt to
                extract source code
              </li>
              <li>
                Abuse rate limits or attempt to overload our
                systems
              </li>
              <li>
                Use the service to spam or send unsolicited
                communications
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">
              5. Third-Party Integrations
            </h2>
            <div className="space-y-3">
              <div>
                <h3 className="font-medium">
                  5.1 Third-Party Services
                </h3>
                <p>
                  Our service integrates with various
                  third-party platforms. You are responsible
                  for complying with the terms of service of
                  any third-party platforms you connect
                  through our service.
                </p>
              </div>
              <div>
                <h3 className="font-medium">
                  5.2 Data Processing
                </h3>
                <p>
                  When you authorize connections to
                  third-party services, you grant us
                  permission to access and process data from
                  those services solely to provide our
                  intermediation functionality.
                </p>
              </div>
              <div>
                <h3 className="font-medium">
                  5.3 Third-Party Availability
                </h3>
                <p>
                  We are not responsible for the
                  availability, functionality, or policies
                  of third-party services. Any issues with
                  third-party services should be addressed
                  directly with those providers.
                </p>
              </div>
              <div>
                <h3 className="font-medium">
                  5.4 map-poster Integrations
                </h3>
                <p>
                  Integrations designated as map-poster are
                  developed exclusively by the map-poster
                  team, utilizing the open and publicly
                  available integration interfaces of the
                  respective third-party applications.
                  map-poster makes no representation or
                  warranty regarding the continued
                  availability, accuracy, or functionality
                  of such third-party interfaces, and shall
                  not be held liable for any modification,
                  suspension, or discontinuation of those
                  interfaces by the respective third-party
                  providers. The use of these integrations
                  remains subject to the applicable terms of
                  service and policies of the third-party
                  applications.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">
              6. Service Availability and Limitations
            </h2>
            <div className="space-y-3">
              <div>
                <h3 className="font-medium">
                  6.1 Service Availability
                </h3>
                <p>
                  We strive to maintain high availability
                  but do not guarantee uninterrupted
                  service. We may perform maintenance,
                  updates, or experience downtime that
                  temporarily affects service availability.
                </p>
              </div>
              <div>
                <h3 className="font-medium">
                  6.2 Usage Limits
                </h3>
                <p>
                  We may impose reasonable limits on your
                  use of the service, including but not
                  limited to API call limits, data transfer
                  limits, and concurrent connection limits.
                </p>
              </div>
              <div>
                <h3 className="font-medium">
                  6.3 Service Modifications
                </h3>
                <p>
                  We reserve the right to modify, suspend,
                  or discontinue any part of the service at
                  any time with reasonable notice when
                  possible.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">
              7. Privacy and Data Protection
            </h2>
            <p>
              Your privacy is important to us. Our
              collection and use of personal information is
              governed by our Privacy Policy, which is
              incorporated into these Terms by reference. By
              using our service, you consent to the
              collection and use of your information as
              described in our Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">
              8. Intellectual Property Rights
            </h2>
            <div className="space-y-3">
              <div>
                <h3 className="font-medium">
                  8.1 Our Rights
                </h3>
                <p>
                  The service and its original content,
                  features, and functionality are owned by
                  us and are protected by international
                  copyright, trademark, patent, trade
                  secret, and other intellectual property
                  laws.
                </p>
              </div>
              <div>
                <h3 className="font-medium">
                  8.2 User Content
                </h3>
                <p>
                  You retain ownership of any content you
                  submit through the service. By submitting
                  content, you grant us a limited license to
                  use, process, and transmit such content
                  solely to provide our intermediation
                  services.
                </p>
              </div>
              <div>
                <h3 className="font-medium">
                  8.3 Feedback
                </h3>
                <p>
                  Any feedback, suggestions, or improvements
                  you provide regarding our service may be
                  used by us without any obligation to you.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">
              9. Disclaimers and Limitation of Liability
            </h2>
            <div className="space-y-3">
              <div>
                <h3 className="font-medium">
                  9.1 Service Disclaimer
                </h3>
                <p>
                  The service is provided "as is" and "as
                  available" without warranties of any kind,
                  either express or implied, including but
                  not limited to warranties of
                  merchantability, fitness for a particular
                  purpose, and non-infringement.
                </p>
              </div>
              <div>
                <h3 className="font-medium">
                  9.2 Limitation of Liability
                </h3>
                <p>
                  To the fullest extent permitted by law, we
                  shall not be liable for any indirect,
                  incidental, special, consequential, or
                  punitive damages, or any loss of profits
                  or revenues, whether incurred directly or
                  indirectly, or any loss of data, use,
                  goodwill, or other intangible losses.
                </p>
              </div>
              <div>
                <h3 className="font-medium">
                  9.3 Maximum Liability
                </h3>
                <p>
                  Our total liability to you for all claims
                  arising from or relating to the service
                  shall not exceed the amount you paid us,
                  if any, for the service during the twelve
                  months preceding the claim.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">
              10. Indemnification
            </h2>
            <p>
              You agree to indemnify, defend, and hold
              harmless us, our officers, directors,
              employees, and agents from and against any
              claims, liabilities, damages, losses, and
              expenses arising out of or in any way
              connected with your use of the service or
              violation of these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">
              11. Termination
            </h2>
            <div className="space-y-3">
              <div>
                <h3 className="font-medium">
                  11.1 Termination by You
                </h3>
                <p>
                  You may terminate your account at any time
                  by contacting us or using account deletion
                  features in the service.
                </p>
              </div>
              <div>
                <h3 className="font-medium">
                  11.2 Termination by Us
                </h3>
                <p>
                  We may terminate or suspend your account
                  immediately, without prior notice, if you
                  breach these Terms or engage in conduct
                  that we determine to be harmful to other
                  users or our service.
                </p>
              </div>
              <div>
                <h3 className="font-medium">
                  11.3 Effect of Termination
                </h3>
                <p>
                  Upon termination, your right to use the
                  service ceases immediately. We may delete
                  your account and data, subject to our data
                  retention policies and legal obligations.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">
              12. Governing Law and Dispute Resolution
            </h2>
            <p>
              These Terms shall be governed by and construed
              in accordance with applicable law. Any
              disputes arising from these Terms or your use
              of the service shall be resolved through
              appropriate legal channels in the jurisdiction
              where our service is operated.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">
              13. Changes to Terms
            </h2>
            <p>
              We reserve the right to modify these Terms at
              any time. We will provide notice of material
              changes by posting updated Terms on our
              website and updating the "Last updated" date.
              Your continued use of the service after
              changes become effective constitutes
              acceptance of the new Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">
              14. Severability
            </h2>
            <p>
              If any provision of these Terms is held to be
              invalid or unenforceable, the remaining
              provisions shall remain in full force and
              effect, and the invalid provision shall be
              replaced by a valid provision that most
              closely approximates the intent of the
              original provision.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">
              15. Contact Information
            </h2>
            <p>
              If you have any questions about these Terms of
              Service, please contact us through our support
              channels or customer service.
            </p>
          </section>
        </div>
      </div>
    </WebLayout>
  );
}
