import * as React from "react";

import { cn } from "@/infrastructure/lib/utils";
import { Card, CardContent } from "@/shared/ui/card";
import { maskMiddle } from "@/shared/utils/masking";

type MaskedValueProps =
  React.HTMLAttributes<HTMLDivElement> & {
    value?: string | null;
    fallback?: string;
    visibleStart?: number;
    visibleEnd?: number;
    maskChar?: string;
    minMaskLength?: number;
  };

function MaskedValue({
  value,
  fallback = "Not configured",
  visibleStart = 3,
  visibleEnd = 3,
  maskChar = "•",
  minMaskLength = 16,
  className,
  ...props
}: MaskedValueProps) {
  const maskedValue = React.useMemo(() => {
    if (!value) return fallback;

    const stringValue = value as string;
    if (stringValue.length <= visibleStart + visibleEnd) {
      return maskChar.repeat(minMaskLength);
    }

    return maskMiddle(
      stringValue,
      visibleStart,
      visibleEnd,
      maskChar
    );
  }, [
    value,
    fallback,
    visibleStart,
    visibleEnd,
    maskChar,
    minMaskLength,
  ]);

  return (
    <Card
      size="sm"
      className={cn("py-0", className)}
      {...props}
    >
      <CardContent className="p-3">
        {maskedValue}
      </CardContent>
    </Card>
  );
}

export { MaskedValue };
