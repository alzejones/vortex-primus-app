// ============================================================
// theme.ts — Design tokens do Vortex Primus Dark Theme
// ============================================================

export const T = {
  // Fundos
  bg:         "#080b14",
  bgAlt:      "#0d1120",
  surface:    "#111827",
  surfaceAlt: "#1a2236",
  card:       "#141c2e",
  cardHover:  "#1a2540",

  // Cores primárias
  blue:      "#3b82f6",
  blueSoft:  "#2563eb",
  blueGlow:  "rgba(59,130,246,0.2)",
  bluePale:  "rgba(59,130,246,0.08)",

  // Accent
  green:      "#10b981",
  greenGlow:  "rgba(16,185,129,0.15)",
  orange:     "#f59e0b",
  red:        "#ef4444",
  purple:     "#8b5cf6",
  cyan:       "#06b6d4",

  // Texto
  white: "#f8fafc",
  t1:    "#e2e8f0",
  t2:    "#94a3b8",
  t3:    "#64748b",
  t4:    "#475569",

  // Bordas
  border:       "rgba(255,255,255,0.06)",
  borderActive: "rgba(59,130,246,0.3)",
} as const;

export const Typography = {
  title:    { fontWeight: "800" as const, letterSpacing: -0.5 },
  subtitle: { fontWeight: "700" as const },
  body:     { fontWeight: "600" as const },
  muted:    { fontWeight: "500" as const },
} as const;
