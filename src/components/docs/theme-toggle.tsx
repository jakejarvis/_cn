import { IconDeviceDesktop, IconMoon, IconSun } from "@tabler/icons-react";

import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useTheme } from "./theme-provider";

const themeOptions = [
  {
    value: "system",
    label: "System",
    icon: IconDeviceDesktop,
  },
  {
    value: "light",
    label: "Light",
    icon: IconSun,
  },
  {
    value: "dark",
    label: "Dark",
    icon: IconMoon,
  },
] as const;

type ThemeToggleProps = {
  className?: string;
};

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const currentOption = themeOptions.find((option) => option.value === theme) ?? themeOptions[0];
  const CurrentIcon = currentOption.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className={className} />}>
        <CurrentIcon />
        <span className="sr-only">Toggle theme</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        <DropdownMenuGroup>
          <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
            {themeOptions.map((option) => {
              const Icon = option.icon;

              return (
                <DropdownMenuRadioItem
                  key={option.value}
                  value={option.value}
                  className="cursor-pointer gap-2 px-2 py-1.5 [&_svg:not([class*='text-'])]:text-muted-foreground"
                >
                  <Icon data-icon="inline-start" />
                  {option.label}
                </DropdownMenuRadioItem>
              );
            })}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
