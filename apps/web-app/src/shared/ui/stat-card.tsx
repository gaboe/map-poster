import { cn } from "@/infrastructure/lib/utils";
import { Card, CardContent } from "@/shared/ui/card";

type Props = {
  label: string;
  value: number | string;
  className?: string;
};

export function StatCard({
  label,
  value,
  className,
}: Props) {
  return (
    <Card size="sm" className={cn("py-0", className)}>
      <CardContent className="p-3 xl:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 xl:gap-3">
          <h3 className="text-xs xl:text-sm font-medium text-gray-500 text-center sm:text-left">
            {label}
          </h3>
          <p className="text-lg xl:text-2xl font-bold text-gray-900 dark:text-gray-100 text-center sm:text-left">
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
