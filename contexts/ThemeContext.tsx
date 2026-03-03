import React, { createContext, ReactNode, useContext, useMemo, useState } from "react";

type Mode = "light" | "dark";

interface ThemeColors {
  background: string;
  card: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  border: string;
}

interface ThemeSpacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
}

interface ThemeRadius {
  sm: number;
  md: number;
  lg: number;
}

export interface AppTheme {
  mode: Mode;
  colors: ThemeColors;
  spacing: ThemeSpacing;
  borderRadius: ThemeRadius;
}

interface ThemeContextData {
  theme: AppTheme;
  toggleTheme: () => void;
}

const lightTheme: AppTheme = {
  mode: "light",
  colors: {
    background: "#F4F6F8",
    card: "#FFFFFF",
    textPrimary: "#111827",
    textSecondary: "#374151",
    textMuted: "#6B7280",
    primary: "#2563EB",
    border: "#E5E7EB",
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 14,
    lg: 18,
    xl: 24,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 18,
  },
};

const darkTheme: AppTheme = {
  mode: "dark",
  colors: {
    background: "#0F172A",
    card: "#1E293B",
    textPrimary: "#F9FAFB",
    textSecondary: "#CBD5E1",
    textMuted: "#94A3B8",
    primary: "#3B82F6",
    border: "#334155",
  },
  spacing: lightTheme.spacing,
  borderRadius: lightTheme.borderRadius,
};

const ThemeContext = createContext<ThemeContextData | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>("light");

  function toggleTheme() {
    setMode((prev) => (prev === "light" ? "dark" : "light"));
  }

  const theme = useMemo(() => {
    return mode === "light" ? lightTheme : darkTheme;
  }, [mode]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}