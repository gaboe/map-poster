import type {
  ComponentProps,
  Dispatch,
  SetStateAction,
} from "react";
import { cn } from "@/infrastructure/lib/utils";
import { X } from "lucide-react";

type InputTagsProps = Omit<
  ComponentProps<"input">,
  "onChange" | "value"
> & {
  onChange: Dispatch<SetStateAction<string[]>>;
  value: string[];
};

const InputTags = ({
  className,
  onChange,
  value: tags,
  type,
  ...props
}: InputTagsProps) => {
  const isEmailType = type === "email";

  const parseValues = (rawValue: string) => {
    let values = rawValue
      .split(/[,;\s]+/u)
      .map((v) => v.trim())
      .filter(Boolean);

    if (isEmailType) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      values = values.filter((v) => emailRegex.test(v));
    }

    return values;
  };

  return (
    <div
      className={cn(
        "relative flex min-h-10 w-full flex-wrap items-center gap-[3px] rounded-md border border-input bg-transparent p-1 text-sm transition-[color,box-shadow] disabled:cursor-not-allowed disabled:opacity-50 has-[input:focus-visible]:border-ring has-[input:focus-visible]:ring-[3px] has-[input:focus-visible]:ring-ring/50 dark:bg-input/30",
        className
      )}
    >
      {tags.map((t) => (
        <p
          className="flex h-7 items-center gap-0.5 rounded-full bg-muted pr-1.5 pl-3 transition-all duration-300 hover:bg-input"
          key={t}
        >
          <span className="mb-px">{t}</span>
          <X
            className="size-4 cursor-pointer rounded-full stroke-1 p-0.5 text-muted-foreground transition-all duration-300 hover:scale-110 hover:bg-background hover:stroke-2 hover:text-destructive active:scale-75"
            onClick={() =>
              onChange(tags.filter((i) => i !== t))
            }
          />
        </p>
      ))}
      <input
        className={cn(
          "peer ml-1 w-0 flex-1 outline-none placeholder:text-muted-foreground placeholder:capitalize",
          tags.length ? "placeholder:opacity-0" : "pl-1"
        )}
        onKeyDown={(e) => {
          const { value } = e.currentTarget;
          const values = parseValues(value);

          if (value.trim()) {
            if ([",", ";", "Enter"].includes(e.key)) {
              e.preventDefault();
              if (values.length) {
                onChange([
                  ...new Set([...tags, ...values]),
                ]);
              }
              e.currentTarget.value = "";
            }
          } else if (e.key === "Backspace" && tags.length) {
            e.preventDefault();
            onChange(tags.slice(0, -1));
          }
        }}
        onBlur={(e) => {
          const { value } = e.currentTarget;
          if (value.trim()) {
            const values = parseValues(value);

            if (values.length) {
              onChange([...new Set([...tags, ...values])]);
              e.currentTarget.value = "";
            }
          }
        }}
        type={type ?? "text"}
        {...props}
      />
    </div>
  );
};

export { InputTags };
