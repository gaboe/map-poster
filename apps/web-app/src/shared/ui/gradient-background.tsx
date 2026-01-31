import { cn } from "@/infrastructure/lib/utils";

type Props = {
  variant?: "auth" | "default" | "footer";
  className?: string;
};

export function GradientBackground({
  variant = "default",
  className,
}: Props) {
  const getGradientElements = () => {
    switch (variant) {
      case "auth":
        return (
          <>
            <div className="absolute w-[600px] h-[600px] -top-[200px] -left-[200px] rounded-full opacity-30 blur-[200px] bg-orange-600" />
            <div className="absolute w-[700px] h-[700px] -bottom-[250px] left-[20%] rounded-full opacity-30 blur-[200px] bg-yellow-400" />
            <div className="absolute w-[800px] h-[800px] top-[100px] -right-[300px] rounded-full opacity-30 blur-[200px] bg-purple-600" />
          </>
        );
      case "footer":
        return (
          <div className="absolute w-[800px] h-[400px] -bottom-[200px] left-1/2 transform -translate-x-1/2 rounded-full opacity-30 blur-[150px] bg-yellow-400/50 dark:bg-yellow-400/30" />
        );
      case "default":
      default:
        return (
          <>
            <div className="absolute w-[600px] h-[600px] -top-[100px] -left-[100px] rounded-full opacity-30 blur-[150px] bg-primary/60" />
            <div className="absolute w-[700px] h-[700px] -bottom-[200px] left-[15%] rounded-full opacity-25 blur-[150px] bg-accent/50" />
            <div className="absolute w-[800px] h-[800px] top-[200px] -right-[200px] rounded-full opacity-30 blur-[150px] bg-secondary/60" />
          </>
        );
    }
  };

  return (
    <div
      className={cn(
        "absolute inset-0 overflow-hidden z-0 pointer-events-none",
        className
      )}
    >
      {getGradientElements()}
    </div>
  );
}
