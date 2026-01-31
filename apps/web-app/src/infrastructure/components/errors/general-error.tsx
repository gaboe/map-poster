import * as React from "react";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { Link, useNavigate } from "@tanstack/react-router";
import { Home, ArrowLeft } from "lucide-react";

type Props = {
  title: "Error" | "400" | "401" | "404" | "403" | "500";
  message?: React.ReactNode;
  children?: React.ReactNode;
  withLayout?: boolean;
};

const ERROR_TITLES: Record<
  Props["title"],
  { heading: string; description: string }
> = {
  "400": {
    heading: "Bad Request",
    description:
      "The request could not be understood or was missing required parameters.",
  },
  "401": {
    heading: "Unauthorized",
    description:
      "You need to be authenticated to access this resource.",
  },
  "403": {
    heading: "Forbidden",
    description:
      "You don't have permission to access this resource.",
  },
  "404": {
    heading: "Page Not Found",
    description:
      "The page you are looking for might have been removed or is temporarily unavailable.",
  },
  "500": {
    heading: "Server Error",
    description:
      "An unexpected error occurred on the server. Please try again later.",
  },
  Error: {
    heading: "Something went wrong",
    description:
      "An unexpected error occurred. Please try again later.",
  },
};

export function GeneralError({
  title,
  message,
  children,
  withLayout = false,
}: Props) {
  const navigate = useNavigate();
  const errorInfo = ERROR_TITLES[title];
  const is404 = title === "404";

  const content = (
    <div className="container max-w-4xl mx-auto py-16 px-4 md:px-6">
      <div className="text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-9xl font-bold text-orange-500">
            {title}
          </h1>
          <h2 className="text-3xl font-semibold">
            {errorInfo.heading}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {message || children || errorInfo.description}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
          {is404 ? (
            <Link to="/">
              <Button
                size="lg"
                className="gap-2 min-w-[200px]"
              >
                <Home className="w-5 h-5" />
                Back to Homepage
              </Button>
            </Link>
          ) : (
            <>
              <Button
                size="lg"
                className="gap-2 min-w-[200px]"
                onClick={() => navigate({ to: ".." })}
              >
                <ArrowLeft className="w-5 h-5" />
                Go Back
              </Button>
              <Link to="/">
                <Button
                  variant="outline"
                  size="lg"
                  className="gap-2 min-w-[200px]"
                >
                  <Home className="w-5 h-5" />
                  Back to Homepage
                </Button>
              </Link>
            </>
          )}
        </div>

        <div className="pt-12 border-t mt-12">
          <h3 className="text-xl font-semibold mb-6">
            Popular Pages
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            <Link to="/app/dashboard" className="block">
              <Card className="py-0 transition-colors hover:bg-muted/20 hover:ring-orange-500/30">
                <CardContent className="p-4">
                  <p className="font-medium">Dashboard</p>
                  <p className="text-sm text-muted-foreground">
                    Go to your dashboard
                  </p>
                </CardContent>
              </Card>
            </Link>
            <Link to="/contact" className="block">
              <Card className="py-0 transition-colors hover:bg-muted/20 hover:ring-orange-500/30">
                <CardContent className="p-4">
                  <p className="font-medium">Contact</p>
                  <p className="text-sm text-muted-foreground">
                    Get in touch
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        <div className="pt-8 mt-8">
          <div className="text-sm text-muted-foreground">
            <p className="font-semibold mb-2">Need help?</p>
            <p>
              If you think this is a mistake, please{" "}
              <Link
                to="/contact"
                className="text-orange-500 hover:text-orange-600 underline"
              >
                contact support
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  if (withLayout) {
    return content;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      {content}
    </div>
  );
}
