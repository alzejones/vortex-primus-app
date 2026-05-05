import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { GradientAI, GradientSuccess } from "../../utils/gradients";
import { T } from "../../utils/theme";

// ------------------------------------------------------------
// Tipos
// ------------------------------------------------------------
interface LastBio {
  weight: number;
  body_fat: number;
  muscle_mass_percentage: number | null;
  basal_metabolic_rate: number | null;
  metabolic_age: number | null;
}

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
  const [lastBio, setLastBio] = useState<LastBio | null>(null);
  const [dietResult, setDietResult] = useState<DietCalculationResult | null>(null);
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [mealLogs, setMealLogs] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (clientId) {
        load();
        loadMealLogs();
      }
    }, [clientId])
  );

  async function loadMealLogs() {
    const { data } = await supabase
      .from("meal_log")
      .select("id, consumed_at, meal_type, total_calories, total_protein, total_carbs, total_fat, notes")
      .eq("client_id", clientId)
      .order("consumed_at", { ascending: false })
      .limit(10);
    if (data) setMealLogs(data);
  }

  async function load() {
    setLoading(true);
    try {
      const { data: clientData, error: clientErr } = await supabase
        .from("clients")
        .select("id, name, height_cm, birth_date, gender, objective, activity_level")
        .eq("id", clientId)
        .single();

      if (clientErr || !clientData) throw clientErr;
      setClient(clientData);

      const { data: assessments, error: assessmentsErr } = await supabase
        .from("physical_assessments")
        .select("id")
        .eq("client_id", clientId)
        .order("date", { ascending: false })
        .limit(1);

      if (assessmentsErr) throw assessmentsErr;

      let weight = 0;
      let bodyFat = 20;

      if (assessments && assessments.length > 0) {
        const { data: anthro } = await supabase
          .from("anthropometry")
          .select("weight, body_fat, muscle_mass_percentage, basal_metabolic_rate, metabolic_age")
          .eq("assessment_id", assessments[0].id)
          .maybeSingle();

        if (anthro) {
          weight   = parseFloat(anthro.weight)   || 0;
          bodyFat  = parseFloat(anthro.body_fat)  || 20;
          setLastBio({
            weight,
            body_fat: parseFloat(anthro.body_fat) || 0,
            muscle_mass_percentage: anthro.muscle_mass_percentage != null
              ? parseFloat(anthro.muscle_mass_percentage)
              : null,
            basal_metabolic_rate: anthro.basal_metabolic_rate != null
              ? parseFloat(anthro.basal_metabolic_rate)
              : null,
            metabolic_age: anthro.metabolic_age != null
              ? parseFloat(anthro.metabolic_age)
              : null,
          });
        }
      }

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

  function handleGenerateAI() {
    Alert.alert(
      "Em breve!",
      "🚀 A geração automática de plano alimentar por Inteligência Artificial estará disponível na próxima atualização do Vortex Primus.",
      [{ text: "OK" }]
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={T.green} />
      </View>
    );
  }

  const allFoods = mealPlan
    ? mealPlan.meal_plan_meals.flatMap((m) => m.meal_plan_foods)
    : [];
  const { calories, protein, carbs, fat } = sumMacros(allFoods);
  const planTotals = {
    calories: parseFloat(calories.toFixed(1)),
    protein:  parseFloat(protein.toFixed(1)),
    carbs:    parseFloat(carbs.toFixed(1)),
    fat:      parseFloat(fat.toFixed(1)),
  };

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

      {/* ── Última Avaliação Corporal ── */}
      {lastBio && lastBio.weight > 0 && (
        <View style={styles.macroCard}>
          <Text style={styles.macroCardTitle}>Última Avaliação Corporal</Text>
          <View style={styles.macroRow}>
            {[
              { label: "Peso",         value: Number(lastBio.weight).toFixed(1),                                                                      unit: "kg",   color: "#94a3b8" },
              { label: "% Gordura",    value: Number(lastBio.body_fat).toFixed(1),                                                                     unit: "%",    color: T.red },
              { label: "% Músculo",    value: lastBio.muscle_mass_percentage != null ? Number(lastBio.muscle_mass_percentage).toFixed(1) : "—",         unit: lastBio.muscle_mass_percentage != null ? "%" : "",    color: T.blue },
              { label: "Metab. Basal", value: lastBio.basal_metabolic_rate    != null ? Number(lastBio.basal_metabolic_rate).toFixed(1)    : "—",         unit: lastBio.basal_metabolic_rate    != null ? "kcal" : "", color: T.green },
            ].map((item) => (
              <View key={item.label} style={[styles.macroBox, { borderTopColor: item.color }]}>
                <Text style={[styles.macroValue, { color: item.color }]}>{item.value}</Text>
                <Text style={styles.macroUnit}>{item.unit}</Text>
                <Text style={styles.macroLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* ── Metas Calculadas ── */}
      {dietResult ? (
        <View style={styles.macroCard}>
          <Text style={styles.macroCardTitle}>Metas Calculadas</Text>
          <View style={styles.macroRow}>
            {[
              { label: "Calorias", value: Number(dietResult.macros.calories).toFixed(1), unit: "kcal", color: T.green },
              { label: "Proteína", value: Number(dietResult.macros.protein).toFixed(1),  unit: "g",    color: T.blue },
              { label: "Carbs",    value: Number(dietResult.macros.carbs).toFixed(1),    unit: "g",    color: T.orange },
              { label: "Gordura",  value: Number(dietResult.macros.fat).toFixed(1),      unit: "g",    color: T.red },
            ].map((m) => (
              <View key={m.label} style={[styles.macroBox, { borderTopColor: m.color }]}>
                <Text style={[styles.macroValue, { color: m.color }]}>{m.value}</Text>
                <Text style={styles.macroUnit}>{m.unit}</Text>
                <Text style={styles.macroLabel}>{m.label}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.macroSub}>
            BMR {Number(dietResult.bmr).toFixed(1)} kcal · TDEE {Number(dietResult.tdee).toFixed(1)} kcal · Massa magra {Number(dietResult.lean_mass).toFixed(1)} kg
          </Text>
        </View>
      ) : (
        <View style={styles.warnCard}>
          <Text style={styles.warnText}>
            Para calcular as metas, complete o perfil do aluno (objetivo, nível de atividade) e registre uma Avaliação de Composição Corporal.
          </Text>
        </View>
      )}

      {/* Botão Gerar com IA */}
      <TouchableOpacity style={styles.aiBtn} onPress={handleGenerateAI} activeOpacity={0.85}>
        <LinearGradient {...GradientAI} style={styles.aiBtnGradient}>
          <Text style={styles.aiBtnText}>✨ Gerar Plano com IA</Text>
        </LinearGradient>
      </TouchableOpacity>

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

          {/* ── Plano vs Meta ── */}
          {dietResult && (
            <View style={styles.macroBarsCard}>
              <Text style={styles.macroBarsTitle}>Plano vs Meta</Text>
              <MacroBar label="Calorias" current={planTotals.calories} target={dietResult.macros.calories} unit="kcal" color={T.green} />
              <MacroBar label="Proteína" current={planTotals.protein}  target={dietResult.macros.protein}  unit="g"    color={T.blue} />
              <MacroBar label="Carbs"    current={planTotals.carbs}    target={dietResult.macros.carbs}    unit="g"    color={T.orange} />
              <MacroBar label="Gordura"  current={planTotals.fat}      target={dietResult.macros.fat}      unit="g"    color={T.red} />
            </View>
          )}

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
            activeOpacity={0.85}
          >
            <LinearGradient {...GradientSuccess} style={styles.createBtnGradient}>
              <Text style={styles.createBtnText}>+ Criar Plano Alimentar</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Refeições Registradas pelo Aluno ── */}
      <View style={styles.logSection}>
        <Text style={styles.logSectionTitle}>📖 Refeições Registradas pelo Aluno</Text>
        {mealLogs.length === 0 ? (
          <Text style={styles.logEmpty}>O aluno ainda não registrou nenhuma refeição.</Text>
        ) : (
          mealLogs.map((log) => {
            const dt = new Date(log.consumed_at);
            const dateStr = dt.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
            const timeStr = dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
            return (
              <View key={log.id} style={styles.logCard}>
                <View style={styles.logCardHeader}>
                  <Text style={styles.logDate}>{dateStr} {timeStr}</Text>
                  {log.meal_type ? <Text style={styles.logType}>{log.meal_type}</Text> : null}
                </View>
                <Text style={styles.logMacros}>
                  {Number(log.total_calories ?? 0).toFixed(0)} kcal · P {Number(log.total_protein ?? 0).toFixed(1)}g · C {Number(log.total_carbs ?? 0).toFixed(1)}g · G {Number(log.total_fat ?? 0).toFixed(1)}g
                </Text>
                {log.notes ? <Text style={styles.logNotes}>{log.notes}</Text> : null}
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

// ------------------------------------------------------------
// Estilos
// ------------------------------------------------------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg, padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: T.bg },

  header: { marginBottom: 16 },
  title: { fontSize: 26, fontWeight: "800", color: T.t1, marginBottom: 6 },
  badge: { alignSelf: "flex-start", backgroundColor: "rgba(16,185,129,0.12)", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 4, borderWidth: 1, borderColor: "rgba(16,185,129,0.25)" },
  badgeText: { color: T.green, fontWeight: "700", fontSize: 12 },
  subLabel: { color: T.t3, fontSize: 12 },

  macroCard: { backgroundColor: T.card, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: T.border },
  macroCardTitle: { fontSize: 11, fontWeight: "800", color: T.t2, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 },
  macroRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  macroBox: { flex: 1, alignItems: "center", borderTopWidth: 3, paddingTop: 8, marginHorizontal: 3, borderRadius: 8, backgroundColor: T.surfaceAlt },
  macroValue: { fontSize: 20, fontWeight: "800" },
  macroUnit: { fontSize: 11, color: T.t3 },
  macroLabel: { fontSize: 11, color: T.t2, fontWeight: "600", marginTop: 2 },
  macroSub: { fontSize: 11, color: T.t3, textAlign: "center" },

  warnCard: { backgroundColor: "rgba(245,158,11,0.08)", borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: "rgba(245,158,11,0.25)" },
  warnText: { color: T.orange, fontSize: 13, fontWeight: "600" },

  planHeader: { flexDirection: "row", alignItems: "flex-start", marginBottom: 8 },
  planActions: { flexDirection: "row", alignItems: "center" },
  planTitle: { fontSize: 18, fontWeight: "800", color: T.t1 },
  planNotes: { fontSize: 12, color: T.t3, marginTop: 2 },
  editBtn: { backgroundColor: T.surfaceAlt, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: T.border },
  editBtnText: { fontWeight: "700", color: T.t1, fontSize: 13 },

  macroBarsCard: { backgroundColor: T.card, borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: T.border },
  macroBarsTitle: { fontSize: 11, fontWeight: "800", color: T.t2, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 },

  aiBtn: { borderRadius: 14, overflow: "hidden", marginBottom: 16 },
  aiBtnGradient: { paddingVertical: 14, alignItems: "center", justifyContent: "center", borderRadius: 14 },
  aiBtnText: { color: T.white, fontWeight: "800", fontSize: 15 },

  emptyPlan: { alignItems: "center", padding: 40 },
  emptyPlanText: { color: T.t2, fontSize: 15, marginBottom: 20 },
  createBtn: { borderRadius: 14, overflow: "hidden" },
  createBtnGradient: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14, alignItems: "center" },
  createBtnText: { color: T.white, fontWeight: "800", fontSize: 15 },

  logSection: { backgroundColor: T.card, borderRadius: 16, padding: 16, marginTop: 16, borderWidth: 1, borderColor: T.border },
  logSectionTitle: { fontSize: 15, fontWeight: "800", color: T.t1, marginBottom: 12 },
  logEmpty: { color: T.t3, fontSize: 13, fontStyle: "italic" },
  logCard: { backgroundColor: T.surfaceAlt, borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: T.border },
  logCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  logDate: { fontSize: 12, color: T.t2, fontWeight: "600" },
  logType: { fontSize: 11, color: T.green, fontWeight: "700", backgroundColor: "rgba(16,185,129,0.1)", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  logMacros: { fontSize: 13, color: T.t1, fontWeight: "700" },
  logNotes: { fontSize: 11, color: T.t3, fontStyle: "italic", marginTop: 4 },
});
