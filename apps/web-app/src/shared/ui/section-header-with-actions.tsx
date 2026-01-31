import { cn } from "@/infrastructure/lib/utils";

type Props = {
  title: string;
  subtitle?: string;
  titleTag?: React.ReactNode;
  actions?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const titleClasses = {
  sm: "text-sm xl:text-base font-medium text-gray-900 dark:text-gray-100",
  md: "text-lg xl:text-xl font-semibold text-gray-900 dark:text-gray-100",
  lg: "text-xl xl:text-2xl font-bold text-gray-900 dark:text-gray-100",
};

export function SectionHeaderWithActions({
  title,
  subtitle,
  titleTag,
  actions,
  size = "md",
  className,
}: Props) {
  return (
    <div
      className={cn(
        "flex items-center justify-between mb-4 xl:mb-6",
        className
      )}
    >
      <div>
        <div className="flex items-center gap-2">
          <h2 className={titleClasses[size]}>{title}</h2>
          {titleTag}
        </div>
        {subtitle && (
          <p className="text-xs xl:text-sm text-gray-500 dark:text-gray-400">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex gap-2">{actions}</div>
      )}
    </div>
  );
}
