// ============================================================
// goalCalculations.ts — Funções compartilhadas de cálculo de metas
// Extraídas de business-goals.tsx para uso no Painel do Presidente
// ============================================================

export function getWorkingDays(start: Date, end: Date): number {
  let count = 0;
  const d = new Date(start); d.setHours(0, 0, 0, 0);
  const e = new Date(end);   e.setHours(0, 0, 0, 0);
  while (d <= e) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) count++;
    d.setDate(d.getDate() + 1);
  }
  return count;
}

export function computeTrend(monthlyGoal: number, actualMonthToDate: number): {
  projection: number;
  expected: number;
  pct: number;
  status: 'on-track' | 'warning' | 'risk';
  color: string;
  label: string;
} | null {
  if (monthlyGoal <= 0) return null;
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const daysElapsed  = getWorkingDays(monthStart, now);
  const daysTotal    = getWorkingDays(monthStart, monthEnd);
  if (daysElapsed === 0) return null;
  const dailyAvg   = actualMonthToDate / daysElapsed;
  const projection = Math.round(dailyAvg * daysTotal);
  const expected   = Math.round(monthlyGoal * (daysTotal > 0 ? daysElapsed / daysTotal : 0));
  const pct        = Math.round((projection / monthlyGoal) * 100);
  let status: 'on-track' | 'warning' | 'risk';
  let color: string;
  let label: string;
  if (pct >= 90) {
    status = 'on-track'; color = '#22c55e';
    label = pct >= 100 ? '🎯 Meta atingida' : '✅ No ritmo';
  } else if (pct >= 60) {
    status = 'warning'; color = '#f59e0b';
    label = '⚠️ Abaixo do ritmo';
  } else {
    status = 'risk'; color = '#ef4444';
    label = '🔴 Meta em risco';
  }
  return { projection, expected, pct, status, color, label };
}
