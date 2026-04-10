import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MacroBar from "../../components/MacroBar";
import MealCard, { MealItem } from "../../components/MealCard";
import DietPlanPDF from "../../components/DietPlanPDF";
import { supabase } from "../../lib/supabase";
import {
  ACTIVITY_LABELS,
  ActivityLevel,
  DietCalculationResult,
  OBJECTIVE_LABELS,
  Objective,
  calculateDietPlan,
} from "../../utils/dietCalculations";

// ------------------------------------------------------------
// Tipos
// ------------------------------------------------------------
interface MealPlan {
  id: string;
  title: string;
  objective: string | null;
  meals_per_day: number | null;
  notes: string | null;
  meal_plan_meals: MealItem[];
}

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------
function calcAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function sumMacros(foods: { calories: number | null; protein: number | null; carbs: number | null; fat: number | null }[]) {
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

// ------------------------------------------------------------
// Screen
// ------------------------------------------------------------
export default function ClientDiet() {
  const { id } = useLocalSearchParams();
  const clientId = id as string;

  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<any>(null);
  const [dietResult, setDietResult] = useState<DietCalculationResult | null>(null);
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);

  useEffect(() => {
    if (clientId) load();
  }, [clientId]);

  async function load() {
    setLoading(true);
    try {
      // 1. Dados do cliente
      const { data: clientData, error: clientErr } = await supabase
        .from("clients")
        .select("id, name, height_cm, birth_date, gender, objective, activity_level")
        .eq("id", clientId)
        .single();

      if (clientErr || !clientData) throw clientErr;
      setClient(clientData);

      // 2. Última avaliação física com antropometria
      const { data: assessments } = await supabase
        .from("physical_assessments")
        .select("id")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })
        .limit(1);

      let weight = 0;
      let bodyFat = 20; // fallback conservador

      if (assessments && assessments.length > 0) {
        const { data: anthro } = await supabase
          .from("anthropometry")
          .select("weight, body_fat")
          .eq("assessment_id", assessments[0].id)
          .maybeSingle();

        if (anthro) {
          weight   = parseFloat(anthro.weight)   || 0;
          bodyFat  = parseFloat(anthro.body_fat)  || 20;
        }
      }

      // 3. Calcula macros se tiver dados suficientes
      if (
        weight > 0 &&
        clientData.height_cm &&
        clientData.birth_date &&
        clientData.gender &&
        clientData.objective &&
        clientData.activity_level
      ) {
        const result = calculateDietPlan({
          weight_kg:        weight,
          height_cm:        clientData.height_cm,
          age:              calcAge(clientData.birth_date),
          gender:           clientData.gender as "M" | "F",
          body_fat_percent: bodyFat,
          activity:         clientData.activity_level as ActivityLevel,
          objective:        clientData.objective as Objective,
        });
        setDietResult(result);
      }

      // 4. Plano ativo com refeições e alimentos
      const { data: plan } = await supabase
        .from("meal_plans")
        .select(`
          id, title, objective, meals_per_day, notes,
          meal_plan_meals (
            id, name, time_suggestion, order_index,
            meal_plan_foods (
              id, name, quantity, calories, protein, carbs, fat, order_index
            )
          )
        `)
        .eq("client_id", clientId)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (plan) {
        // Ordena refeições e alimentos
        const sorted: MealPlan = {
          ...plan,
          meal_plan_meals: (plan.meal_plan_meals as MealItem[])
            .sort((a, b) => a.order_index - b.order_index)
            .map((meal) => ({
              ...meal,
              meal_plan_foods: [...meal.meal_plan_foods].sort(
                (a, b) => a.order_index - b.order_index
              ),
            })),
        };
        setMealPlan(sorted);
      }
    } catch (err) {
      console.error("Erro ao carregar dieta:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  const allFoods = mealPlan
    ? mealPlan.meal_plan_meals.flatMap((m) => m.meal_plan_foods)
    : [];
  const planTotals = sumMacros(allFoods);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <Text style={styles.title}>{client?.name}</Text>
        {client?.objective && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {OBJECTIVE_LABELS[client.objective as Objective] ?? client.objective}
            </Text>
          </View>
        )}
        {client?.activity_level && (
          <Text style={styles.subLabel}>
            {ACTIVITY_LABELS[client.activity_level as ActivityLevel] ?? client.activity_level}
          </Text>
        )}
      </View>

      {/* Card de Macros Calculados */}
      {dietResult ? (
        <View style={styles.macroCard}>
          <Text style={styles.macroCardTitle}>Metas Calculadas</Text>
          <View style={styles.macroRow}>
            {[
              { label: "Calorias", value: `${dietResult.macros.calories}`, unit: "kcal", color: "#059669" },
              { label: "Proteína", value: `${dietResult.macros.protein}`,  unit: "g",    color: "#2563eb" },
              { label: "Carbs",    value: `${dietResult.macros.carbs}`,    unit: "g",    color: "#d97706" },
              { label: "Gordura",  value: `${dietResult.macros.fat}`,      unit: "g",    color: "#dc2626" },
            ].map((m) => (
              <View key={m.label} style={[styles.macroBox, { borderTopColor: m.color }]}>
                <Text style={[styles.macroValue, { color: m.color }]}>{m.value}</Text>
                <Text style={styles.macroUnit}>{m.unit}</Text>
                <Text style={styles.macroLabel}>{m.label}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.macroSub}>
            BMR {dietResult.bmr} kcal · TDEE {dietResult.tdee} kcal · Massa magra {dietResult.lean_mass} kg
          </Text>
        </View>
      ) : (
        <View style={[styles.macroCard, { backgroundColor: "#fef3c7" }]}>
          <Text style={{ color: "#92400e", fontSize: 13, fontWeight: "600" }}>
            Para calcular as metas, complete o perfil do aluno (objetivo, nível de atividade) e registre uma avaliação física.
          </Text>
        </View>
      )}

      {/* Plano alimentar */}
      {mealPlan ? (
        <>
          <View style={styles.planHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.planTitle}>{mealPlan.title}</Text>
              {mealPlan.notes ? (
                <Text style={styles.planNotes}>{mealPlan.notes}</Text>
              ) : null}
            </View>
            <View style={styles.planActions}>
              <DietPlanPDF
                data={{
                  clientName:  client?.name ?? "",
                  objective:   client?.objective ?? null,
                  mealPlan,
                  dietResult,
                }}
              />
              <TouchableOpacity
                style={[styles.editBtn, { marginLeft: 8 }]}
                onPress={() =>
                  router.push(
                    `/(protected)/diet-plan-form?client_id=${clientId}&plan_id=${mealPlan.id}` as any
                  )
                }
              >
                <Text style={styles.editBtnText}>✏️ Editar</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Barras de progresso macro: plano vs meta calculada */}
          {allFoods.length > 0 && dietResult && (
            <View style={styles.macroBarsCard}>
              <Text style={styles.macroBarsTitle}>Plano vs Meta</Text>
              <MacroBar label="Calorias" current={planTotals.calories} target={dietResult.macros.calories} unit="kcal" color="#059669" />
              <MacroBar label="Proteína" current={planTotals.protein}  target={dietResult.macros.protein}  unit="g"    color="#2563eb" />
              <MacroBar label="Carbs"    current={planTotals.carbs}    target={dietResult.macros.carbs}    unit="g"    color="#d97706" />
              <MacroBar label="Gordura"  current={planTotals.fat}      target={dietResult.macros.fat}      unit="g"    color="#dc2626" />
            </View>
          )}

          {/* Refeições */}
          {mealPlan.meal_plan_meals.map((meal) => (
            <MealCard key={meal.id} meal={meal} />
          ))}
        </>
      ) : (
        <View style={styles.emptyPlan}>
          <Text style={styles.emptyPlanText}>Nenhum plano alimentar cadastrado.</Text>
          <TouchableOpacity
            style={styles.createBtn}
            onPress={() =>
              router.push(`/(protected)/diet-plan-form?client_id=${clientId}` as any)
            }
          >
            <Text style={styles.createBtnText}>+ Criar Plano Alimentar</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

// ------------------------------------------------------------
// Estilos
// ------------------------------------------------------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb", padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: { marginBottom: 16 },
  title: { fontSize: 26, fontWeight: "800", color: "#111827", marginBottom: 6 },
  badge: { alignSelf: "flex-start", backgroundColor: "#d1fae5", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 4 },
  badgeText: { color: "#065f46", fontWeight: "700", fontSize: 12 },
  subLabel: { color: "#6b7280", fontSize: 12 },

  macroCard: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: "#e5e7eb" },
  macroCardTitle: { fontSize: 13, fontWeight: "800", color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 },
  macroRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  macroBox: { flex: 1, alignItems: "center", borderTopWidth: 3, paddingTop: 8, marginHorizontal: 3, borderRadius: 8, backgroundColor: "#f9fafb" },
  macroValue: { fontSize: 20, fontWeight: "800" },
  macroUnit: { fontSize: 11, color: "#6b7280" },
  macroLabel: { fontSize: 11, color: "#374151", fontWeight: "600", marginTop: 2 },
  macroSub: { fontSize: 11, color: "#9ca3af", textAlign: "center" },

  planHeader: { flexDirection: "row", alignItems: "flex-start", marginBottom: 8 },
  planActions: { flexDirection: "row", alignItems: "center" },
  planTitle: { fontSize: 18, fontWeight: "800", color: "#111827" },
  planNotes: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  editBtn: { backgroundColor: "#f3f4f6", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: "#e5e7eb" },
  editBtnText: { fontWeight: "700", color: "#374151", fontSize: 13 },

  macroBarsCard: { backgroundColor: "#fff", borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: "#e5e7eb" },
  macroBarsTitle: { fontSize: 11, fontWeight: "800", color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 },

  emptyPlan: { alignItems: "center", padding: 40 },
  emptyPlanText: { color: "#6b7280", fontSize: 15, marginBottom: 20 },
  createBtn: { backgroundColor: "#059669", paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14 },
  createBtnText: { color: "#fff", fontWeight: "800", fontSize: 15 },
});
