import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { useColorScheme } from 'react-native';

type Mode = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

const THEME_STORAGE_KEY = "vortex_theme_mode";

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
  mode: Mode;
  setThemeMode: (mode: Mode) => void;
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
  const [mode, setMode] = useState<Mode>("dark");
  const [loading, setLoading] = useState(true);
  const systemColorScheme = useColorScheme();

  useEffect(() => {
    loadThemePreference();
  }, []);

  async function loadThemePreference() {
    try {
      const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedMode === "light" || savedMode === "dark" || savedMode === "system") {
        setMode(savedMode);
      }
    } catch (error) {
      console.warn('[ThemeContext] Erro ao carregar preferência de tema:', error);
    } finally {
      setLoading(false);
    }
  }

  async function setThemeMode(newMode: Mode) {
    try {
      setMode(newMode);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newMode);
    } catch (error) {
      console.warn('[ThemeContext] Erro ao salvar preferência de tema:', error);
    }
  }

  function toggleTheme() {
    const newMode = mode === "light" ? "dark" : "light";
    setThemeMode(newMode);
  }

  const resolvedTheme: ResolvedTheme = useMemo(() => {
    if (mode === "system") {
      return systemColorScheme === "light" ? "light" : "dark";
    }
    return mode;
  }, [mode, systemColorScheme]);

  const theme = useMemo(() => {
    return resolvedTheme === "light" ? lightTheme : darkTheme;
  }, [resolvedTheme]);

  if (loading) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, mode, setThemeMode, toggleTheme }}>
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