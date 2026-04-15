// ============================================================
// gradients.ts — Configurações de gradientes do Vortex Primus
// Uso: <LinearGradient {...GradientPrimary} style={...}>
// ============================================================

export const GradientPrimary = {
  colors: ["#1e3a8a", "#3b82f6", "#7c3aed"] as const,
  start: { x: 0, y: 0 },
  end:   { x: 1, y: 1 },
};

export const GradientSuccess = {
  colors: ["#10b981", "#06b6d4"] as const,
  start: { x: 0, y: 0 },
  end:   { x: 1, y: 1 },
};

export const GradientAI = {
  colors: ["#f59e0b", "#ef4444", "#ec4899"] as const,
  start: { x: 0, y: 0 },
  end:   { x: 1, y: 1 },
};
