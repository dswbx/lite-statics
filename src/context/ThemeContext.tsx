import {
   createContext,
   useCallback,
   useContext,
   useEffect,
   useMemo,
   useState,
   type ReactNode,
} from "react";

type Theme = "light" | "dark" | "system";
type Resolved = "light" | "dark";

const STORAGE_KEY = "statics-theme";

interface ThemeContextValue {
   theme: Theme;
   resolvedTheme: Resolved;
   setTheme: (theme: Theme) => void;
   toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function systemPrefersDark() {
   return (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
   );
}

function readStoredTheme(): Theme {
   if (typeof window === "undefined") return "system";
   const stored = window.localStorage.getItem(STORAGE_KEY);
   return stored === "light" || stored === "dark" ? stored : "system";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
   const [theme, setThemeState] = useState<Theme>(readStoredTheme);
   const [systemDark, setSystemDark] = useState(systemPrefersDark);

   // track OS preference so `system` stays live
   useEffect(() => {
      const mql = window.matchMedia("(prefers-color-scheme: dark)");
      const onChange = () => setSystemDark(mql.matches);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
   }, []);

   const resolvedTheme: Resolved =
      theme === "system" ? (systemDark ? "dark" : "light") : theme;

   // reflect resolved theme onto <html> for the CSS `.dark` overrides
   useEffect(() => {
      document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
   }, [resolvedTheme]);

   const setTheme = useCallback((next: Theme) => {
      setThemeState(next);
      if (next === "system") window.localStorage.removeItem(STORAGE_KEY);
      else window.localStorage.setItem(STORAGE_KEY, next);
   }, []);

   const toggle = useCallback(() => {
      setTheme(resolvedTheme === "dark" ? "light" : "dark");
   }, [resolvedTheme, setTheme]);

   const value = useMemo(
      () => ({ theme, resolvedTheme, setTheme, toggle }),
      [theme, resolvedTheme, setTheme, toggle],
   );

   return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
   const context = useContext(ThemeContext);
   if (!context) throw new Error("useTheme must be used within ThemeProvider");
   return context;
}
