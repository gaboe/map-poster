import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import logo from "@/assets/logo.png";
import { GradientBackground } from "@/shared/ui/gradient-background";

type Props = {
  children: ReactNode;
  variant?: "auth" | "default";
  maxWidth?: "sm" | "md" | "lg";
};

export function AuthLayout({
  children,
  variant = "auth",
  maxWidth = "md",
}: Props) {
  const getMaxWidthClass = () => {
    switch (maxWidth) {
      case "sm":
        return "max-w-sm";
      case "lg":
        return "max-w-lg";
      case "md":
      default:
        return "max-w-md";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
      <GradientBackground variant={variant} />

      <div
        className={`w-full ${getMaxWidthClass()} relative z-10`}
      >
        <div className="text-center mb-8">
          <a href="/" className="cursor-pointer">
            <img
              src={logo}
              alt="map-poster Logo"
              className="w-16 h-16 mx-auto mb-4 cursor-pointer"
            />
            <span className="text-3xl font-bold cursor-pointer">
              map-poster
            </span>
          </a>
        </div>

        {children}

        <div className="text-center mt-8">
          <div className="flex justify-center gap-6 text-xs text-muted-foreground">
            <Link
              to="/privacy-policy"
              className="hover:text-gray-900 transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              to="/tos"
              className="hover:text-gray-900 transition-colors"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
