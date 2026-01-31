import { Button } from "./button";
import { IconPlus } from "@tabler/icons-react";
import { cn } from "@/infrastructure/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/ui/tooltip";

export function CreateButton({
  title,
  onClick,
  className,
  disabled,
  tooltip,
  size,
}: {
  title: string;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  tooltip?: string;
  size?: "default" | "sm" | "lg" | "icon";
}) {
  const button = (
    <span
      tabIndex={disabled ? 0 : -1}
      className={disabled ? "cursor-not-allowed" : ""}
    >
      <Button
        className={cn("flex items-center gap-2", className)}
        {...(onClick !== undefined && { onClick })}
        {...(disabled !== undefined && { disabled })}
        {...(tooltip !== undefined && { title: tooltip })}
        {...(size !== undefined && { size })}
      >
        <IconPlus className="size-4" />
        {title}
      </Button>
    </span>
  );

  return tooltip ? (
    <Tooltip>
      <TooltipTrigger render={button} />
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  ) : (
    button
  );
}
