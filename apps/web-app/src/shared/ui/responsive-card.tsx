import { cn } from "@/infrastructure/lib/utils";
import { Card, CardContent } from "@/shared/ui/card";

type Props = {
  children: React.ReactNode;
  padding?: "sm" | "md" | "lg";
  className?: string;
};

const paddingClasses = {
  sm: "p-3 xl:p-4",
  md: "p-4 xl:p-6",
  lg: "p-6 xl:p-8",
};

export function ResponsiveCard({
  children,
  padding = "md",
  className,
}: Props) {
  return (
    <Card
      size={padding === "sm" ? "sm" : "default"}
      className={cn("py-0", className)}
    >
      <CardContent className={paddingClasses[padding]}>
        {children}
      </CardContent>
    </Card>
  );
}
