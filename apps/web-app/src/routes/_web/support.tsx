import { createFileRoute } from "@tanstack/react-router";
import { WebLayout } from "@/web/layout/web-layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";

export const Route = createFileRoute("/_web/support")({
  component: SupportPage,
});

function SupportPage() {
  return (
    <WebLayout>
      <div className="flex justify-center py-12">
        <Card className="max-w-2xl w-full">
          <CardHeader>
            <CardTitle>Customer Support</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Our support team is here to help you get the
              most out of our API intermediation service.
              Whether you need technical assistance, have
              questions about integrations, or need help
              with account management, we're ready to assist
              you.
            </p>

            <Card size="sm" className="py-0">
              <CardContent className="p-4 text-center">
                <h3 className="font-medium text-lg mb-2">
                  📧 Contact Support
                </h3>
                <p className="font-medium text-blue-600">
                  gabriel.ecegi@blogic.cz
                </p>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    </WebLayout>
  );
}
