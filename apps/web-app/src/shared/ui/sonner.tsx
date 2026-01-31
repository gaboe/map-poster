import { useTheme } from "next-themes";
import {
  Toaster as Sonner,
  type ToasterProps,
} from "sonner";
import {
  CircleCheckIcon,
  InfoIcon,
  TriangleAlertIcon,
  OctagonXIcon,
  Loader2Icon,
} from "lucide-react";

const Toaster = ({
  theme: themeOverride,
  ...props
}: ToasterProps) => {
  const { theme: themeFromContext } = useTheme();
  // Validate theme value - use system as fallback for invalid values
  const rawTheme =
    themeOverride ?? themeFromContext ?? "system";
  const theme: "light" | "dark" | "system" =
    rawTheme === "light" ||
    rawTheme === "dark" ||
    rawTheme === "system"
      ? rawTheme
      : "system";

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
