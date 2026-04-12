// ============================================================
// dietCalculations.ts — Lógica de cálculo do Módulo de Dieta
// Fórmula BMR: Mifflin-St Jeor (padrão clínico atual)
// ============================================================

// ------------------------------------------------------------
// Tipos
// ------------------------------------------------------------
export type Objective =
  | "emagrecimento"
  | "hipertrofia"
  | "manutencao"
  | "saude"
  | "performance";

export type ActivityLevel =
  | "sedentario"
  | "levemente_ativo"
  | "moderadamente_ativo"
  | "muito_ativo"
  | "extremamente_ativo";

export interface MacroResult {
  calories: number;    // kcal alvo
  protein:  number;    // g
  carbs:    number;    // g
  fat:      number;    // g
}

export interface DietCalculationResult {
  bmr:        number;      // Taxa Metabólica Basal (kcal)
  tdee:       number;      // Gasto Energético Total (kcal)
  lean_mass:  number;      // Massa magra (kg)
  macros:     MacroResult;
}

// ------------------------------------------------------------
// Constantes
// ------------------------------------------------------------
export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentario:             1.2,
  levemente_ativo:        1.375,
  moderadamente_ativo:    1.55,
  muito_ativo:            1.725,
  extremamente_ativo:     1.9,
};

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentario:             "Sedentário (pouco ou nenhum exercício)",
  levemente_ativo:        "Levemente ativo (1–3 dias/semana)",
  moderadamente_ativo:    "Moderadamente ativo (3–5 dias/semana)",
  muito_ativo:            "Muito ativo (6–7 dias/semana)",
  extremamente_ativo:     "Extremamente ativo (atleta / trabalho físico intenso)",
};

export const OBJECTIVE_LABELS: Record<Objective, string> = {
  emagrecimento: "Emagrecimento",
  hipertrofia:   "Hipertrofia",
  manutencao:    "Manutenção",
  saude:         "Saúde e Qualidade de Vida",
  performance:   "Performance",
};

// Ajuste calórico sobre o TDEE por objetivo (kcal)
const CALORIE_ADJUSTMENT: Record<Objective, number> = {
  emagrecimento: -500,
  hipertrofia:   +300,
  manutencao:      0,
  saude:         -100,
  performance:   +200,
};

// Proteína por kg de massa magra (g/kg) por objetivo
const PROTEIN_PER_KG_LEAN: Record<Objective, number> = {
  emagrecimento: 2.2,
  hipertrofia:   2.4,
  manutencao:    1.8,
  saude:         2.0,
  performance:   2.2,
};

// Gordura como % das calorias alvo
const FAT_PERCENT_OF_CALORIES = 0.25;

// kcal por grama
const KCAL_PER_G_PROTEIN = 4;
const KCAL_PER_G_CARB    = 4;
const KCAL_PER_G_FAT     = 9;

// ------------------------------------------------------------
// BMR — Mifflin-St Jeor
// ------------------------------------------------------------
export function calculateBMR(
  weight_kg: number,
  height_cm: number,
  age: number,
  gender: "M" | "F"
): number {
  const base = 10 * weight_kg + 6.25 * height_cm - 5 * age;
  return gender.toUpperCase() === "M" ? base + 5 : base - 161;
}

// ------------------------------------------------------------
// TDEE
// ------------------------------------------------------------
export function calculateTDEE(bmr: number, activity: ActivityLevel): number {
  return bmr * ACTIVITY_MULTIPLIERS[activity];
}

// ------------------------------------------------------------
// Massa magra
// ------------------------------------------------------------
export function calculateLeanMass(
  weight_kg: number,
  body_fat_percent: number
): number {
  return weight_kg * (1 - body_fat_percent / 100);
}

// ------------------------------------------------------------
// Macros
// ------------------------------------------------------------
export function calculateMacros(
  target_calories: number,
  lean_mass_kg: number,
  objective: Objective
): MacroResult {
  const protein = lean_mass_kg * PROTEIN_PER_KG_LEAN[objective];
  const fat     = (target_calories * FAT_PERCENT_OF_CALORIES) / KCAL_PER_G_FAT;
  const calories_from_protein_fat =
    protein * KCAL_PER_G_PROTEIN + fat * KCAL_PER_G_FAT;
  const remaining = target_calories - calories_from_protein_fat;
  const carbs = Math.max(remaining / KCAL_PER_G_CARB, 0);

  return {
    calories: Math.round(target_calories),
    protein:  Math.round(protein),
    carbs:    Math.round(carbs),
    fat:      Math.round(fat),
  };
}

// ------------------------------------------------------------
// Tipos para plano gerado por IA
// ------------------------------------------------------------
export interface GeneratedFood {
  name:     string;
  quantity: string;
  calories: number;
  protein:  number;
  carbs:    number;
  fat:      number;
}

export interface GeneratedMeal {
  name:            string;
  time_suggestion: string;
  foods:           GeneratedFood[];
}

export interface GeneratedDay {
  day:            number;
  label:          string;
  total_calories: number;
  meals:          GeneratedMeal[];
}

export interface GeneratedPlan {
  observations: string;
  days:         GeneratedDay[];
}

// ------------------------------------------------------------
// Função principal — retorna tudo de uma vez
// ------------------------------------------------------------
export function calculateDietPlan(params: {
  weight_kg:        number;
  height_cm:        number;
  age:              number;
  gender:           "M" | "F";
  body_fat_percent: number;
  activity:         ActivityLevel;
  objective:        Objective;
}): DietCalculationResult {
  const { weight_kg, height_cm, age, gender, body_fat_percent, activity, objective } =
    params;

  const bmr       = calculateBMR(weight_kg, height_cm, age, gender);
  const tdee      = calculateTDEE(bmr, activity);
  const lean_mass = calculateLeanMass(weight_kg, body_fat_percent);
  const target    = tdee + CALORIE_ADJUSTMENT[objective];
  const macros    = calculateMacros(target, lean_mass, objective);

  return {
    bmr:       Math.round(bmr),
    tdee:      Math.round(tdee),
    lean_mass: parseFloat(lean_mass.toFixed(1)),
    macros,
  };
}
