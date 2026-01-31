import * as React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Link, useNavigate } from "@tanstack/react-router";
import { Home, ArrowLeft } from "lucide-react";
import { Meteors } from "@/shared/magicui/meteors";

export function GeneralError({
  title = "Something went wrong",
  message,
  children,
}: {
  title?: React.ReactNode;
  message?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const navigate = useNavigate();

  return (
    <div className="relative flex min-h-[60vh] items-center justify-center overflow-hidden">
      {/* Meteors background */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <Meteors number={30} maxDuration={30} />
      </div>
      <Card className="max-w-md w-full text-center p-8 bg-white/80 dark:bg-black/70 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-4xl font-bold mb-2">
            {title}
          </CardTitle>
          <div className="text-muted-foreground mb-2">
            {message ||
              children ||
              "An unexpected error occurred. Please try again later."}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            <div className="mb-4">
              <span className="font-semibold">
                Need help?
              </span>
              <div className="mt-2 text-sm text-muted-foreground animate-pulse">
                Try refreshing the page, or contact support
                if the problem persists.
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate({ to: ".." })}
              className="w-full flex items-center justify-center gap-2"
            >
              <ArrowLeft className="size-4" />
              Go Back
            </Button>
            <Button
              render={<Link to="/" />}
              variant="default"
              className="w-full flex items-center justify-center gap-2"
            >
              <Home className="size-4" />
              Go Home
            </Button>
          </div>
        </CardContent>
        <CardFooter className="justify-center mt-4 text-xs text-muted-foreground">
          If you think this is a mistake, please contact
          support.
        </CardFooter>
      </Card>
    </div>
  );
}
