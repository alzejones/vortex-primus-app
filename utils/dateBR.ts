// ============================================================
// dateBR.ts — Data "hoje" no fuso de Brasília (America/Sao_Paulo)
// Evita o bug de virar o dia ~21h/22h horário local, quando o
// UTC (usado por padrão em new Date().toISOString()) já está
// no dia seguinte.
// ============================================================
export function brasiliaDate(base: Date = new Date()): Date {
  return new Date(base.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
}

function fmt(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayBR(): string {
  return fmt(brasiliaDate());
}

export function daysAgoBR(days: number): string {
  const d = brasiliaDate();
  d.setDate(d.getDate() - days);
  return fmt(d);
}
