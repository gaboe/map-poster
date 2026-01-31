import { useState } from "react";
import { Eye, EyeOff, Copy, Check } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { maskMiddle } from "@/shared/utils/masking";

interface MaskedSecretProps {
  value: string;
  className?: string;
}

export function MaskedSecret({
  value,
  className,
}: MaskedSecretProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleToggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setIsCopied(true);
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  if (!value || value.length < 10) {
    return (
      <div
        className={`flex items-center gap-2 ${className}`}
      >
        <span className="font-mono">
          {maskMiddle("sk-1234567890123456", 6, 4, "•")}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggleVisibility}
          className="h-6 w-6 p-0"
        >
          {isVisible ? (
            <EyeOff className="h-3 w-3" />
          ) : (
            <Eye className="h-3 w-3" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-6 w-6 p-0"
        >
          {isCopied ? (
            <Check className="h-3 w-3 text-green-500" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="font-mono">
        {isVisible ? value : maskMiddle(value, 6, 4, "•")}
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleToggleVisibility}
        className="h-6 w-6 p-0"
      >
        {isVisible ? (
          <EyeOff className="h-3 w-3" />
        ) : (
          <Eye className="h-3 w-3" />
        )}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopy}
        className="h-6 w-6 p-0"
      >
        {isCopied ? (
          <Check className="h-3 w-3 text-green-500" />
        ) : (
          <Copy className="h-3 w-3" />
        )}
      </Button>
    </div>
  );
}
