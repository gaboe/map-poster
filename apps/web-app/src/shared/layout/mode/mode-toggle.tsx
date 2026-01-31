import { Moon, Sun } from "lucide-react";
import {
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/shared/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { useTheme } from "@/shared/layout/mode/theme-provider";

export function ModeToggle() {
  const { setTheme, theme } = useTheme();

  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <SidebarMenuButton
              className="cursor-pointer"
              tooltip="Toggle theme"
              aria-label="Toggle theme"
            />
          }
        >
          {/* Icon changes based on theme */}
          <Sun className="h-4 w-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute h-4 w-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
          <span className="font-bold text-sm">Theme</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => {
              setTheme("light");
            }}
            aria-checked={theme === "light"}
            role="menuitemradio"
          >
            Light
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setTheme("dark");
            }}
            aria-checked={theme === "dark"}
            role="menuitemradio"
          >
            Dark
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setTheme("system");
            }}
            aria-checked={theme === "system"}
            role="menuitemradio"
          >
            System
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
}
