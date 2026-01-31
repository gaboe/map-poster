import { setThemeServerFn } from "@/infrastructure/theme";
import { useRouter } from "@tanstack/react-router";
import {
  createContext,
  type PropsWithChildren,
  use,
  useEffect,
} from "react";

export type Theme = "light" | "dark" | "system";

type ThemeContextVal = {
  theme: Theme;
  setTheme: (val: Theme) => void;
};

type Props = PropsWithChildren<{
  theme: Theme;
}>;

const ThemeContext = createContext<ThemeContextVal | null>(
  null
);

export function ThemeProvider({ children, theme }: Props) {
  const router = useRouter();

  useEffect(() => {
    const root = document.documentElement;
    const mq = window.matchMedia(
      "(prefers-color-scheme: dark)"
    );

    const isDark =
      theme === "dark" ||
      (theme === "system" && mq.matches);
    root.classList.toggle("dark", isDark);

    // Only persist system changes when the system theme actually changes.
    // This avoids an extra server roundtrip on every mount.
    if (theme === "system") {
      const handleChange = async () => {
        root.classList.toggle("dark", mq.matches);
        await setThemeServerFn({
          data: {
            preference: "system",
            lastSystemTheme: mq.matches ? "dark" : "light",
          },
        });
      };

      mq.addEventListener("change", handleChange);
      return () => {
        mq.removeEventListener("change", handleChange);
      };
    }
  }, [theme]);

  async function setTheme(val: Theme) {
    // Apply theme immediately to avoid flicker on switching
    const root = document.documentElement;
    const mq = window.matchMedia(
      "(prefers-color-scheme: dark)"
    );

    const isDark =
      val === "dark" || (val === "system" && mq.matches);
    root.classList.toggle("dark", isDark);

    // Update cookie and invalidate
    await setThemeServerFn({
      data:
        val === "system"
          ? {
              preference: "system",
              lastSystemTheme: mq.matches
                ? "dark"
                : "light",
            }
          : { preference: val },
    });
    void router.invalidate();
  }

  return (
    <ThemeContext value={{ theme, setTheme }}>
      {children}
    </ThemeContext>
  );
}

export function useTheme() {
  const val = use(ThemeContext);
  if (!val)
    throw new Error(
      "useTheme called outside of ThemeProvider!"
    );
  return val;
}
