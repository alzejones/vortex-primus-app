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
const FAT_PERCENT = 0.25;  // 25% das calorias totais

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
  weight_kg: number;
  height_cm: number;
  age: number;
  gender: "M" | "F";
  body_fat_percent: number;
  activity: ActivityLevel;
  objective: Objective;
}): DietCalculationResult {
  const { weight_kg, height_cm, age, gender, body_fat_percent, activity, objective } = params;

  // 1. Calcular BMR usando Mifflin-St Jeor (1990)
  let bmr: number;
  if (gender === "M") {
    bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age + 5;
  } else {
    bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age - 161;
  }

  // 2. Calcular TDEE (BMR × multiplicador de atividade)
  const multiplier = ACTIVITY_MULTIPLIERS[activity] ?? 1.375;
  const tdee = bmr * multiplier;

  // 3. Calcular calorias alvo (TDEE + ajuste por objetivo)
  const targetCalories = tdee + CALORIE_ADJUSTMENT[objective];

  // 4. Calcular massa magra (LBM)
  const lbm = weight_kg * (1 - Math.min(Math.max(body_fat_percent, 0), 99) / 100);

  // 5. Calcular macronutrientes

  // Proteína: baseada na LBM
  const proteinG = lbm * PROTEIN_PER_KG_LBM[objective];
  const proteinCal = proteinG * 4;

  // Gordura: 25% das calorias totais
  const fatCal = targetCalories * FAT_PERCENT;
  const fatG = fatCal / 9;

  // Carboidratos: calorias restantes
  const carbsCal = targetCalories - proteinCal - fatCal;
  const carbsG = carbsCal / 4;

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    lean_mass: parseFloat(lbm.toFixed(1)),
    macros: {
      calories: Math.round(targetCalories),
      protein: Math.round(proteinG),
      carbs: Math.round(carbsG),
      fat: Math.round(fatG),
    },
  };
}
