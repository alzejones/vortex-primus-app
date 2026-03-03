// constants/theme.ts

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
}

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
}

export const typography = {
  size: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 22,
    xxl: 28,
    xxxl: 34,
  },
  weight: {
    regular: "400" as const,
    medium: "500" as const,
    semibold: "600" as const,
    bold: "700" as const,
  },
}

export const lightTheme = {
  mode: "light",
  colors: {
    background: "#F7F8FA",
    surface: "#FFFFFF",
    surfaceSoft: "#F1F3F7",
    border: "#E5E7EB",

    textPrimary: "#111827",
    textSecondary: "#4B5563",
    textMuted: "#9CA3AF",

    primary: "#16A34A",
    primaryHover: "#15803D",
    primarySoft: "rgba(22, 163, 74, 0.10)",

    danger: "#DC2626",
  },
}

export const darkTheme = {
  mode: "dark",
  colors: {
    background: "#0F1115",
    surface: "#171923",
    surfaceSoft: "#1E2230",
    border: "#262B3D",

    textPrimary: "#F3F4F6",
    textSecondary: "#A1A6B3",
    textMuted: "#6B7280",

    primary: "#22C55E",
    primaryHover: "#16A34A",
    primarySoft: "rgba(34, 197, 94, 0.12)",

    danger: "#EF4444",
  },
}

export type Theme = typeof lightTheme
