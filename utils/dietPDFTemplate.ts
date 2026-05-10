// ============================================================
// dietPDFTemplate.ts — Gerador de HTML para o PDF do plano alimentar
// Compartilhado entre DietPlanPDF.tsx (mobile) e DietPlanPDF.web.tsx (web)
// ============================================================

import { DietCalculationResult, OBJECTIVE_LABELS, Objective } from "./dietCalculations";
import { FoodItem, MealItem } from "../components/MealCard";

export interface DietPDFData {
  clientName: string;
  objective: string | null;
  mealPlan: {
    title: string;
    notes: string | null;
    meal_plan_meals: MealItem[];
  };
  dietResult: DietCalculationResult | null;
  generatedAt?: string; // ISO date string
}

function sumMacros(foods: FoodItem[]) {
  return foods.reduce(
    (acc, f) => ({
      calories: acc.calories + (f.calories || 0),
      protein:  acc.protein  + (f.protein  || 0),
      carbs:    acc.carbs    + (f.carbs    || 0),
      fat:      acc.fat      + (f.fat      || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

function fmt(n: number | null): string {
  return n != null ? Number(n).toFixed(1) : "—";
}

export function generateDietHTML(data: DietPDFData): string {
  const { clientName, objective, mealPlan, dietResult } = data;

  const dateStr = data.generatedAt
    ? new Date(data.generatedAt).toLocaleDateString("pt-BR", {
        day: "2-digit", month: "long", year: "numeric",
      })
    : new Date().toLocaleDateString("pt-BR", {
        day: "2-digit", month: "long", year: "numeric",
      });

  const objectiveLabel = objective
    ? (OBJECTIVE_LABELS[objective as Objective] ?? objective)
    : "Não definido";

  // Macros row
  const macrosHtml = dietResult
    ? `
      <div class="macros-grid">
        <div class="macro-box" style="border-top-color:#059669">
          <span class="macro-val" style="color:#059669">${Number(dietResult.macros.calories).toFixed(1)}</span>
          <span class="macro-unit">kcal</span>
          <span class="macro-lbl">Calorias</span>
        </div>
        <div class="macro-box" style="border-top-color:#2563eb">
          <span class="macro-val" style="color:#2563eb">${Number(dietResult.macros.protein).toFixed(1)}</span>
          <span class="macro-unit">g</span>
          <span class="macro-lbl">Proteína</span>
        </div>
        <div class="macro-box" style="border-top-color:#d97706">
          <span class="macro-val" style="color:#d97706">${Number(dietResult.macros.carbs).toFixed(1)}</span>
          <span class="macro-unit">g</span>
          <span class="macro-lbl">Carboidratos</span>
        </div>
        <div class="macro-box" style="border-top-color:#dc2626">
          <span class="macro-val" style="color:#dc2626">${Number(dietResult.macros.fat).toFixed(1)}</span>
          <span class="macro-unit">g</span>
          <span class="macro-lbl">Gordura</span>
        </div>
      </div>
      <p class="macros-sub">BMR ${Number(dietResult.bmr).toFixed(1)} kcal &nbsp;·&nbsp; TDEE ${Number(dietResult.tdee).toFixed(1)} kcal &nbsp;·&nbsp; Massa magra ${Number(dietResult.lean_mass).toFixed(1)} kg</p>
    `
    : `<p class="no-macros">Avaliação física incompleta — metas não calculadas.</p>`;

  // Meals
  const mealsHtml = mealPlan.meal_plan_meals
    .map((meal) => {
      const totals = sumMacros(meal.meal_plan_foods);
      const foodsRows = meal.meal_plan_foods.length === 0
        ? `<tr><td colspan="6" class="empty-cell">Nenhum alimento cadastrado</td></tr>`
        : meal.meal_plan_foods.map((f) => `
          <tr>
            <td class="food-name">${f.name}</td>
            <td class="center">${f.quantity ?? "—"}</td>
            <td class="center">${fmt(f.calories)}</td>
            <td class="center">${fmt(f.protein)}</td>
            <td class="center">${fmt(f.carbs)}</td>
            <td class="center">${fmt(f.fat)}</td>
          </tr>`).join("");

      return `
        <div class="meal-block">
          <div class="meal-header">
            <span class="meal-name">${meal.name}</span>
            ${meal.time_suggestion ? `<span class="meal-time">${meal.time_suggestion}</span>` : ""}
          </div>
          <table>
            <thead>
              <tr>
                <th>Alimento</th>
                <th class="center">Qtd.</th>
                <th class="center">kcal</th>
                <th class="center">Prot. (g)</th>
                <th class="center">Carbs (g)</th>
                <th class="center">Gord. (g)</th>
              </tr>
            </thead>
            <tbody>
              ${foodsRows}
            </tbody>
            ${meal.meal_plan_foods.length > 0 ? `
            <tfoot>
              <tr class="totals-row">
                <td><strong>Total da refeição</strong></td>
                <td></td>
                <td class="center"><strong>${Number(totals.calories).toFixed(1)}</strong></td>
                <td class="center"><strong>${Number(totals.protein).toFixed(1)}</strong></td>
                <td class="center"><strong>${Number(totals.carbs).toFixed(1)}</strong></td>
                <td class="center"><strong>${Number(totals.fat).toFixed(1)}</strong></td>
              </tr>
            </tfoot>` : ""}
          </table>
        </div>`;
    })
    .join("");

  // Grand total
  const allFoods = mealPlan.meal_plan_meals.flatMap((m) => m.meal_plan_foods);
  const grandTotal = sumMacros(allFoods);
  const grandTotalHtml = allFoods.length > 0
    ? `
      <div class="grand-total">
        <strong>Total do Plano:</strong>
        &nbsp; ${Number(grandTotal.calories).toFixed(1)} kcal
        &nbsp;·&nbsp; Prot. ${Number(grandTotal.protein).toFixed(1)}g
        &nbsp;·&nbsp; Carbs ${Number(grandTotal.carbs).toFixed(1)}g
        &nbsp;·&nbsp; Gord. ${Number(grandTotal.fat).toFixed(1)}g
      </div>`
    : "";

  const notesHtml = mealPlan.notes
    ? `<div class="notes"><strong>Observações:</strong> ${mealPlan.notes}</div>`
    : "";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Plano Alimentar — ${clientName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 13px;
      color: #111827;
      background: #fff;
      padding: 32px;
      max-width: 800px;
      margin: 0 auto;
    }
    /* ---- Header ---- */
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; border-bottom: 2px solid #059669; padding-bottom: 16px; }
    .brand { font-size: 11px; font-weight: 700; color: #059669; text-transform: uppercase; letter-spacing: 1px; }
    .client-name { font-size: 24px; font-weight: 800; color: #111827; }
    .client-meta { font-size: 12px; color: #6b7280; margin-top: 4px; }
    .doc-date { font-size: 11px; color: #9ca3af; text-align: right; }

    /* ---- Macros ---- */
    .section-title { font-size: 10px; font-weight: 800; color: #6b7280; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 12px; margin-top: 20px; }
    .macros-grid { display: flex; gap: 8px; margin-bottom: 8px; }
    .macro-box { flex: 1; border-top: 3px solid; border-radius: 8px; padding: 10px 8px; background: #f9fafb; text-align: center; }
    .macro-val { display: block; font-size: 22px; font-weight: 800; }
    .macro-unit { display: block; font-size: 10px; color: #6b7280; }
    .macro-lbl { display: block; font-size: 10px; font-weight: 700; color: #374151; margin-top: 2px; }
    .macros-sub { font-size: 11px; color: #9ca3af; text-align: center; margin-top: 6px; }
    .no-macros { font-size: 12px; color: #92400e; background: #fef3c7; padding: 10px; border-radius: 8px; }

    /* ---- Plan title ---- */
    .plan-title { font-size: 18px; font-weight: 800; margin-top: 24px; margin-bottom: 4px; }
    .notes { font-size: 12px; color: #6b7280; margin-bottom: 16px; padding: 8px 12px; background: #f9fafb; border-left: 3px solid #d1d5db; border-radius: 4px; }

    /* ---- Meals ---- */
    .meal-block { margin-bottom: 20px; break-inside: avoid; }
    .meal-header { display: flex; justify-content: space-between; align-items: center; background: #f0fdf4; border-left: 4px solid #059669; padding: 8px 12px; border-radius: 0 8px 8px 0; margin-bottom: 6px; }
    .meal-name { font-size: 14px; font-weight: 800; color: #065f46; }
    .meal-time { font-size: 12px; font-weight: 700; color: #059669; }
    table { width: 100%; border-collapse: collapse; }
    th { font-size: 10px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; padding: 6px 8px; border-bottom: 1px solid #e5e7eb; text-align: left; }
    td { padding: 7px 8px; border-bottom: 1px solid #f3f4f6; font-size: 12px; vertical-align: middle; }
    .center { text-align: center; }
    .food-name { font-weight: 600; }
    .empty-cell { color: #9ca3af; font-style: italic; text-align: center; padding: 12px; }
    .totals-row td { background: #f9fafb; font-size: 12px; border-top: 1px solid #e5e7eb; }

    /* ---- Grand total ---- */
    .grand-total { margin-top: 16px; padding: 12px 16px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; font-size: 13px; font-weight: 600; color: #065f46; }

    /* ---- Footer ---- */
    .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 10px; color: #9ca3af; text-align: center; }

    /* ---- Print ---- */
    @media print {
      body { padding: 16px; }
      @page { margin: 16mm; }
      .no-print { display: none !important; }
      .meal-block { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    <div>
      <div class="brand">Vortex Primus — Plano Alimentar</div>
      <div class="client-name">${clientName}</div>
      <div class="client-meta">Objetivo: ${objectiveLabel}</div>
    </div>
    <div class="doc-date">${dateStr}</div>
  </div>

  <!-- Macros -->
  <div class="section-title">Metas de Macronutrientes</div>
  ${macrosHtml}

  <!-- Plan -->
  <div class="plan-title">${mealPlan.title}</div>
  ${notesHtml}

  <div class="section-title">Refeições</div>
  ${mealsHtml}

  ${grandTotalHtml}

  <!-- Footer -->
  <div class="footer">
    Gerado por Vortex Primus &nbsp;·&nbsp; ${dateStr}
  </div>
</body>
</html>`;
}
