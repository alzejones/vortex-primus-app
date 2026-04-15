// ============================================================
// dietPDFTemplateAI.ts — Template premium (preto e dourado)
// para planos gerados por IA com 7 dias de refeições
// ============================================================

import { DietCalculationResult, GeneratedPlan, OBJECTIVE_LABELS, Objective } from "./dietCalculations";

export interface AIDietPDFData {
  clientName:    string;
  clientInitials: string;
  trainerName:   string;
  objective:     string | null;
  dietResult:    DietCalculationResult | null;
  lastBio: {
    weight:                   number;
    body_fat:                 number;
    muscle_mass_percentage:   number | null;
    basal_metabolic_rate:     number | null;
    metabolic_age:            number | null;
  } | null;
  plan:          GeneratedPlan;
  generatedAt:   string;
}

const DAY_LABELS = [
  "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira",
  "Sexta-feira", "Sábado", "Domingo",
];

function fmt(n: number | null | undefined, dec = 0): string {
  if (n == null) return "—";
  return n.toFixed(dec);
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit", month: "long", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function objectiveLabel(obj: string | null): string {
  if (!obj) return "—";
  return OBJECTIVE_LABELS[obj as Objective] ?? obj;
}

export function generateAIDietHTML(data: AIDietPDFData): string {
  const { clientName, clientInitials, trainerName, objective, dietResult, lastBio, plan, generatedAt } = data;

  const macros = dietResult?.macros;

  // ── Bioimpedância ──
  const bioRows = lastBio ? `
    <div class="bio-grid">
      <div class="bio-item"><span class="bio-val">${fmt(lastBio.weight, 1)}</span><span class="bio-unit">kg</span><span class="bio-lbl">Peso</span></div>
      <div class="bio-item"><span class="bio-val">${fmt(lastBio.body_fat, 1)}</span><span class="bio-unit">%</span><span class="bio-lbl">Gordura</span></div>
      <div class="bio-item"><span class="bio-val">${lastBio.muscle_mass_percentage != null ? fmt(lastBio.muscle_mass_percentage, 1) : "—"}</span><span class="bio-unit">${lastBio.muscle_mass_percentage != null ? "%" : ""}</span><span class="bio-lbl">Músculo</span></div>
      <div class="bio-item"><span class="bio-val">${lastBio.basal_metabolic_rate != null ? fmt(lastBio.basal_metabolic_rate, 0) : "—"}</span><span class="bio-unit">${lastBio.basal_metabolic_rate != null ? "kcal" : ""}</span><span class="bio-lbl">Met. Basal</span></div>
      <div class="bio-item"><span class="bio-val">${lastBio.metabolic_age != null ? fmt(lastBio.metabolic_age, 1) : "—"}</span><span class="bio-unit">${lastBio.metabolic_age != null ? "anos" : ""}</span><span class="bio-lbl">Idade Met.</span></div>
      ${dietResult ? `<div class="bio-item"><span class="bio-val">${fmt(dietResult.lean_mass, 1)}</span><span class="bio-unit">kg</span><span class="bio-lbl">Massa Magra</span></div>` : ""}
    </div>` : `<p class="no-data">Avaliação física não disponível.</p>`;

  // ── Metas de macros ──
  const macroCards = macros ? `
    <div class="macro-grid">
      <div class="macro-card cal"><span class="macro-num">${fmt(macros.calories, 1)}</span><span class="macro-unit">kcal</span><span class="macro-lbl">Calorias</span></div>
      <div class="macro-card prot"><span class="macro-num">${fmt(macros.protein, 1)}g</span><span class="macro-unit">proteína</span><span class="macro-lbl">por dia</span></div>
      <div class="macro-card carb"><span class="macro-num">${fmt(macros.carbs, 1)}g</span><span class="macro-unit">carboidratos</span><span class="macro-lbl">por dia</span></div>
      <div class="macro-card fat"><span class="macro-num">${fmt(macros.fat, 1)}g</span><span class="macro-unit">gorduras</span><span class="macro-lbl">por dia</span></div>
    </div>
    ${dietResult ? `<p class="macro-sub">BMR ${fmt(dietResult.bmr, 1)} kcal · TDEE ${fmt(dietResult.tdee, 1)} kcal</p>` : ""}
  ` : `<p class="no-data">Metas não disponíveis.</p>`;

  // ── 7 dias ──
  const daysHTML = plan.days.map((day) => {
    const mealsHTML = day.meals.map((meal) => {
      const foodRows = meal.foods.map((f) => `
        <tr>
          <td class="food-name">${f.name}</td>
          <td class="food-qty">${f.quantity}</td>
          <td>${fmt(f.calories, 0)}</td>
          <td>${fmt(f.protein, 1)}</td>
          <td>${fmt(f.carbs, 1)}</td>
          <td>${fmt(f.fat, 1)}</td>
        </tr>`).join("");

      const totCal  = meal.foods.reduce((s, f) => s + (f.calories || 0), 0);
      const totProt = meal.foods.reduce((s, f) => s + (f.protein  || 0), 0);
      const totCarb = meal.foods.reduce((s, f) => s + (f.carbs    || 0), 0);
      const totFat  = meal.foods.reduce((s, f) => s + (f.fat      || 0), 0);

      return `
        <div class="meal-block">
          <div class="meal-header">
            <span class="meal-name">${meal.name}</span>
            <span class="meal-time">${meal.time_suggestion}</span>
          </div>
          <table class="food-table">
            <thead>
              <tr>
                <th class="food-name">Alimento</th>
                <th class="food-qty">Quantidade</th>
                <th>kcal</th>
                <th>Prot.</th>
                <th>Carbs</th>
                <th>Gord.</th>
              </tr>
            </thead>
            <tbody>
              ${foodRows}
              <tr class="meal-total">
                <td colspan="2">Total da Refeição</td>
                <td>${fmt(totCal, 0)}</td>
                <td>${fmt(totProt, 1)}g</td>
                <td>${fmt(totCarb, 1)}g</td>
                <td>${fmt(totFat, 1)}g</td>
              </tr>
            </tbody>
          </table>
        </div>`;
    }).join("");

    return `
      <div class="day-section">
        <div class="day-header">
          <span class="day-num">Dia ${day.day}</span>
          <span class="day-label">${day.label ?? DAY_LABELS[(day.day - 1) % 7]}</span>
          <span class="day-kcal">${fmt(day.total_calories, 0)} kcal</span>
        </div>
        ${mealsHTML}
      </div>`;
  }).join("");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Plano Alimentar IA — ${clientName}</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: #0a0a0a;
    color: #e8e0d0;
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    font-size: 13px;
    line-height: 1.5;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* ── CAPA ── */
  .cover {
    background: linear-gradient(160deg, #111 0%, #0a0a0a 60%, #1a1200 100%);
    padding: 40px 32px 32px;
    border-bottom: 2px solid #D4AF37;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 12px;
  }

  .brand {
    font-size: 11px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: #D4AF37;
    opacity: 0.85;
  }

  .avatar {
    width: 80px; height: 80px;
    border-radius: 50%;
    background: linear-gradient(135deg, #D4AF37, #8B6914);
    display: flex; align-items: center; justify-content: center;
    font-size: 28px; font-weight: 800;
    color: #0a0a0a;
    border: 3px solid #D4AF37;
    flex-shrink: 0;
    margin: 4px 0;
  }

  .client-name {
    font-size: 26px;
    font-weight: 800;
    color: #fff;
    letter-spacing: -0.5px;
  }

  .objective-badge {
    display: inline-block;
    background: rgba(212,175,55,0.15);
    border: 1px solid #D4AF37;
    color: #D4AF37;
    border-radius: 20px;
    padding: 4px 16px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .trainer-line {
    font-size: 12px;
    color: #9ca3af;
  }
  .trainer-line strong { color: #D4AF37; }

  .generated-line {
    font-size: 11px;
    color: #4b5563;
    margin-top: 4px;
  }

  /* ── BODY ── */
  .content { padding: 24px 20px; max-width: 900px; margin: 0 auto; }

  /* ── SEÇÕES ── */
  .section { margin-bottom: 28px; }

  .section-title {
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 2px;
    color: #D4AF37;
    border-bottom: 1px solid #1f1a0a;
    padding-bottom: 6px;
    margin-bottom: 14px;
  }

  /* ── BIO GRID ── */
  .bio-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }
  @media (min-width: 500px) {
    .bio-grid { grid-template-columns: repeat(6, 1fr); }
  }

  .bio-item {
    background: #111;
    border: 1px solid #1f1a0a;
    border-top: 3px solid #D4AF37;
    border-radius: 8px;
    padding: 10px 8px;
    display: flex; flex-direction: column; align-items: center;
    text-align: center;
  }
  .bio-val  { font-size: 20px; font-weight: 800; color: #D4AF37; line-height: 1; }
  .bio-unit { font-size: 10px; color: #6b7280; }
  .bio-lbl  { font-size: 10px; color: #9ca3af; font-weight: 600; margin-top: 4px; }

  /* ── MACRO CARDS ── */
  .macro-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    margin-bottom: 8px;
  }
  @media (min-width: 500px) {
    .macro-grid { grid-template-columns: repeat(4, 1fr); }
  }

  .macro-card {
    border-radius: 10px;
    padding: 14px 12px;
    display: flex; flex-direction: column; align-items: center;
    text-align: center;
    gap: 2px;
  }
  .macro-card.cal  { background: rgba(5,150,105,0.15);  border: 1px solid #059669; }
  .macro-card.prot { background: rgba(37,99,235,0.15);  border: 1px solid #2563eb; }
  .macro-card.carb { background: rgba(217,119,6,0.15);  border: 1px solid #d97706; }
  .macro-card.fat  { background: rgba(220,38,38,0.15);  border: 1px solid #dc2626; }

  .macro-num  { font-size: 22px; font-weight: 800; color: #fff; }
  .macro-unit { font-size: 11px; color: #9ca3af; }
  .macro-lbl  { font-size: 10px; color: #6b7280; }
  .macro-sub  { font-size: 11px; color: #4b5563; text-align: center; }

  /* ── OBSERVAÇÕES ── */
  .observations {
    background: #111;
    border-left: 3px solid #D4AF37;
    border-radius: 0 8px 8px 0;
    padding: 14px 16px;
    font-style: italic;
    color: #d1c9b8;
    font-size: 13px;
    line-height: 1.7;
  }

  /* ── DIAS ── */
  .day-section {
    margin-bottom: 32px;
    page-break-inside: avoid;
    break-inside: avoid;
  }

  .day-header {
    background: linear-gradient(90deg, #D4AF37 0%, #8B6914 100%);
    color: #0a0a0a;
    border-radius: 10px 10px 0 0;
    padding: 10px 16px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .day-num   { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }
  .day-label { font-size: 16px; font-weight: 800; flex: 1; }
  .day-kcal  { font-size: 13px; font-weight: 700; opacity: 0.75; }

  /* ── REFEIÇÕES ── */
  .meal-block {
    background: #111;
    border: 1px solid #1e1e1e;
    border-top: none;
    padding: 12px 14px;
  }
  .meal-block:last-child { border-radius: 0 0 10px 10px; }

  .meal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }
  .meal-name { font-weight: 700; color: #D4AF37; font-size: 13px; }
  .meal-time { font-size: 11px; color: #6b7280; background: #1a1a1a; padding: 2px 8px; border-radius: 10px; }

  /* ── TABELA DE ALIMENTOS ── */
  .food-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
  }
  .food-table thead tr {
    background: #1a1a1a;
  }
  .food-table th {
    padding: 6px 8px;
    text-align: right;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #6b7280;
  }
  .food-table th.food-name { text-align: left; }
  .food-table th.food-qty  { text-align: left; }

  .food-table td {
    padding: 5px 8px;
    text-align: right;
    border-bottom: 1px solid #1e1e1e;
    color: #d1c9b8;
  }
  .food-table td.food-name { text-align: left; color: #e8e0d0; }
  .food-table td.food-qty  { text-align: left; color: #9ca3af; font-size: 11px; }

  .food-table tbody tr:nth-child(even) td { background: rgba(255,255,255,0.02); }

  .meal-total td {
    background: rgba(212,175,55,0.08) !important;
    border-top: 1px solid #D4AF37 !important;
    border-bottom: none !important;
    font-weight: 700;
    color: #D4AF37 !important;
    font-size: 11px;
  }

  /* ── RODAPÉ ── */
  .footer {
    text-align: center;
    padding: 20px;
    border-top: 1px solid #1a1a1a;
    color: #374151;
    font-size: 10px;
    letter-spacing: 1px;
  }
  .footer strong { color: #D4AF37; }

  .no-data { color: #4b5563; font-style: italic; }

  /* ── PRINT ── */
  @media print {
    body { background: #0a0a0a !important; color: #e8e0d0 !important; }
    .day-section { page-break-inside: avoid; break-inside: avoid; }
    .cover { page-break-after: avoid; }
  }
</style>
</head>
<body>

<div class="cover">
  <div class="brand">✦ powered by Vortex Primus ✦</div>
  <div class="avatar">${clientInitials}</div>
  <div class="client-name">${clientName}</div>
  <div class="objective-badge">${objectiveLabel(objective)}</div>
  <div class="trainer-line">Preparado por: <strong>${trainerName}</strong></div>
  <div class="generated-line">Gerado em ${fmtDate(generatedAt)}</div>
</div>

<div class="content">

  ${lastBio ? `
  <div class="section">
    <div class="section-title">Dados de Bioimpedância</div>
    ${bioRows}
  </div>` : ""}

  ${macros ? `
  <div class="section">
    <div class="section-title">Metas Nutricionais Diárias</div>
    ${macroCards}
  </div>` : ""}

  <div class="section">
    <div class="section-title">Observações Personalizadas da IA</div>
    <div class="observations">${plan.observations}</div>
  </div>

  <div class="section">
    <div class="section-title">Plano Alimentar — 7 Dias</div>
    ${daysHTML}
  </div>

</div>

<div class="footer">
  <strong>VORTEX PRIMUS</strong> &nbsp;·&nbsp; Plano gerado por Inteligência Artificial &nbsp;·&nbsp; Consulte sempre um nutricionista
</div>

</body>
</html>`;
}
