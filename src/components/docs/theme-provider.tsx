import * as React from "react";

const THEME_STORAGE_KEY = "theme";

type Theme = "light" | "dark" | "system";

type ThemeContextValue = {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
};

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

function isTheme(value: string | null): value is Theme {
  return value === "light" || value === "dark" || value === "system";
}

function getSystemTheme() {
  if (typeof window === "undefined") {
    return "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getStoredTheme(): Theme {
  if (typeof window === "undefined") {
    return "system";
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);

  return isTheme(storedTheme) ? storedTheme : "system";
}

function applyTheme(theme: Theme) {
  const resolvedTheme = theme === "system" ? getSystemTheme() : theme;
  const root = document.documentElement;

  root.classList.toggle("dark", resolvedTheme === "dark");
  root.dataset.theme = theme;

  return resolvedTheme;
}

export const themeScript = `(()=>{try{const e="${THEME_STORAGE_KEY}",t=window.localStorage.getItem(e),a="light"===t||"dark"===t||"system"===t?t:"system",m=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light",s="system"===a?m:a;document.documentElement.classList.toggle("dark","dark"===s),document.documentElement.dataset.theme=a}catch{}})();`;

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>(getStoredTheme);
  const [resolvedTheme, setResolvedTheme] = React.useState<"light" | "dark">(() =>
    theme === "system" ? getSystemTheme() : theme,
  );

  const setTheme = React.useCallback((nextTheme: Theme) => {
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    setThemeState(nextTheme);
  }, []);

  React.useEffect(() => {
    setResolvedTheme(applyTheme(theme));

    let cleanup: (() => void) | undefined;

    if (theme === "system") {
      const media = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = () => setResolvedTheme(applyTheme("system"));

      media.addEventListener("change", handleChange);
      cleanup = () => media.removeEventListener("change", handleChange);
    }

    return cleanup;
  }, [theme]);

  const value = React.useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme],
  );

  return <ThemeContext value={value}>{children}</ThemeContext>;
}

export function useTheme() {
  const context = React.useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return context;
}
