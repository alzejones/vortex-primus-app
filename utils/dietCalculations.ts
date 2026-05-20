// ============================================================
// DIET CALCULATIONS - Vortex Primus
// Protocolo High Protein baseado em evidências científicas
// ============================================================

export type Objective = "emagrecimento" | "hipertrofia" | "manutencao" | "saude" | "performance";

export type ActivityLevel = "sedentario" | "leve" | "moderado" | "intenso" | "muito_intenso";

export interface DietCalculationResult {
  bmr:       number;
  tdee:      number;
  lean_mass: number;
  macros: {
    calories: number;
    protein:  number;
    carbs:    number;
    fat:      number;
  };
}

export interface GeneratedPlan {
  days: Array<{
    day: string;
    meals: Array<{
      name: string;
      foods: string[];
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    }>;
  }>;
  observations: string;
}

// ============================================================
// CONSTANTES - Protocolo High Protein
// ============================================================

// Proteína por kg de massa magra (LBM) - evidência científica
const PROTEIN_PER_KG_LBM = {
  emagrecimento: 2.7,   // Helms ER et al. Int J Sport Nutr. 2014
  hipertrofia:   2.8,   // Morton RW et al. Br J Sports Med. 2018
  manutencao:    2.2,   // Phillips SM, Van Loon LJC. J Sports Sci. 2011
  saude:         2.0,   // Jäger R et al. ISSN Position Stand. 2017
  performance:   2.6,   // Burke LM et al. Eur J Sport Sci. 2019
};

// Ajuste calórico por objetivo
const CALORIE_ADJUSTMENT = {
  emagrecimento: -500,
  hipertrofia:   +300,
  manutencao:      0,
  saude:         -200,
  performance:   +200,
};

// Percentual de gordura das calorias totais (AMDR)
// Nota: FAT_PERCENT mantido para compatibilidade mas não usado no cálculo principal
const FAT_PERCENT = 0.25;

// Teto de carboidratos por objetivo (protocolo High Protein Low Carb)
// Ordem de cálculo: Proteína → Carbs (teto fixo) → Gordura (sobra)
const CARB_CEILING_G: Record<Objective, number> = {
  emagrecimento:  80,  // Low Carb restritivo
  saude:         120,  // Low Carb moderado
  manutencao:    180,  // Moderado
  hipertrofia:   280,  // Alto — reposição de glicogênio muscular
  performance:   300,  // Alto — demanda energética elevada
};

// Multiplicadores de atividade física
const ACTIVITY_MULTIPLIERS = {
  sedentario:    1.2,
  leve:          1.375,
  moderado:      1.55,
  intenso:       1.725,
  muito_intenso: 1.9,
};

// Labels para interface
export const OBJECTIVE_LABELS: Record<Objective, string> = {
  emagrecimento: "Emagrecimento",
  hipertrofia:   "Hipertrofia",
  manutencao:    "Manutenção",
  saude:         "Saúde Geral",
  performance:   "Performance",
};

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentario:    "Sedentário",
  leve:          "Leve (1-3x/semana)",
  moderado:      "Moderado (3-5x/semana)",
  intenso:       "Intenso (6-7x/semana)",
  muito_intenso: "Muito Intenso (2x/dia)",
};

// ============================================================
// FUNÇÃO PRINCIPAL
// ============================================================

export function calculateDietPlan(params: {
  weight_kg:        number;
  height_cm:        number;
  age:              number;
  gender:           "M" | "F";
  body_fat_percent: number;
  activity:         ActivityLevel;
  objective:        Objective;
  measured_bmr?:    number; // BMR medido pela bioimpedância (opcional, tem prioridade)
}): DietCalculationResult {
  const { weight_kg, height_cm, age, gender, body_fat_percent, activity, objective, measured_bmr } = params;

  // 1. BMR — usa o valor medido pela bioimpedância se disponível, senão Mifflin-St Jeor (1990)
  let bmr: number;
  if (measured_bmr && measured_bmr > 0) {
    bmr = measured_bmr;
  } else if (gender === "M") {
    bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age + 5;
  } else {
    bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age - 161;
  }

  // 2. TDEE (BMR × multiplicador de atividade) — TDEE nunca pode ser menor que o BMR
  const multiplier = ACTIVITY_MULTIPLIERS[activity] ?? 1.375;
  const tdee = Math.max(bmr * multiplier, bmr);

  // 3. Calorias alvo (TDEE + ajuste por objetivo)
  // REGRA DE SEGURANÇA: nunca abaixo do BMR
  const rawTargetCalories = tdee + CALORIE_ADJUSTMENT[objective];
  const targetCalories = Math.max(rawTargetCalories, bmr);

  // 4. Massa magra (LBM)
  const fatPct = Math.min(Math.max(body_fat_percent, 0), 99);
  const lbm = weight_kg * (1 - fatPct / 100);

  // 5. Proteína baseada na LBM (protocolo High Protein)
  // Piso de 1.6g/kg LBM para segurança
  let proteinG = Math.max(lbm * PROTEIN_PER_KG_LBM[objective], lbm * 1.6);

  // 6. Carboidratos — teto fixo por objetivo (Low Carb)
  // Piso de 30g para segurança metabólica mínima
  const carbsG = Math.max(CARB_CEILING_G[objective], 30);

  // 7. Gordura — preenche o restante das calorias (sobra)
  // Nova ordem: Proteína → Carbs (teto) → Gordura (resto)
  const fatFloorG = weight_kg * 0.8; // piso 0.8g/kg para saúde hormonal
  const fatFromRemainder = (targetCalories - proteinG * 4 - carbsG * 4) / 9;
  let fatG = Math.max(fatFromRemainder, fatFloorG);

  // 8. TRAVA DE SEGURANÇA: se gordura exceder calorias disponíveis,
  // reduz proteína progressivamente até o piso de 1.6g/kg LBM
  const totalCal = proteinG * 4 + carbsG * 4 + fatG * 9;
  if (totalCal > targetCalories * 1.05) {
    const calForProtein = targetCalories - carbsG * 4 - fatFloorG * 9;
    proteinG = Math.max(calForProtein / 4, lbm * 1.6);
    fatG = Math.max((targetCalories - proteinG * 4 - carbsG * 4) / 9, fatFloorG);
  }

  return {
    bmr:       Math.round(bmr),
    tdee:      Math.round(tdee),
    lean_mass: parseFloat(lbm.toFixed(1)),
    macros: {
      calories: Math.round(targetCalories),
      protein:  Math.round(proteinG),
      carbs:    Math.round(carbsG),
      fat:      Math.round(fatG),
    },
  };
}
