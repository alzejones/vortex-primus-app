import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import MacroBar from "../../components/MacroBar";
import MealCard, { MealItem } from "../../components/MealCard";
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
export default function ClientDietView() {
  const { session, signOut } = useAuth();

  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [statusMsg, setStatusMsg] = useState({ text: "", type: "" });

  // Dados do cliente
  const [clientId, setClientId]             = useState<string | null>(null);
  const [clientName, setClientName]         = useState("");
  const [objective, setObjective]           = useState<Objective | "">("");
  const [activityLevel, setActivityLevel]   = useState<ActivityLevel | "">("");
  const [foodRestrictions, setFoodRestrictions] = useState("");

  // Dados calculados / plano
  const [dietResult, setDietResult] = useState<DietCalculationResult | null>(null);
  const [mealPlan, setMealPlan]     = useState<MealPlan | null>(null);

  // Guarda parâmetros físicos para recálculo após salvar preferências
  const [physicalParams, setPhysicalParams] = useState<{
    weight: number; heightCm: number; birthDate: string; gender: string; bodyFat: number;
  } | null>(null);

  useEffect(() => {
    if (session?.user?.id) load(session.user.id);
  }, [session]);

  async function load(userId: string) {
    setLoading(true);
    try {
      // 1. Perfil do aluno via user_id
      const { data: clientData, error: clientErr } = await supabase
        .from("clients")
        .select("id, name, height_cm, birth_date, gender, objective, activity_level, food_restrictions")
        .eq("user_id", userId)
        .single();

      if (clientErr || !clientData) throw clientErr ?? new Error("Perfil não encontrado.");

      const cId = clientData.id;
      setClientId(cId);
      setClientName(clientData.name || "");
      setObjective((clientData.objective as Objective) || "");
      setActivityLevel((clientData.activity_level as ActivityLevel) || "");
      setFoodRestrictions(clientData.food_restrictions || "");

      // 2. Última avaliação física
      let weight = 0;
      let bodyFat = 20;

      const { data: assessments } = await supabase
        .from("physical_assessments")
        .select("id")
        .eq("client_id", cId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (assessments && assessments.length > 0) {
        const { data: anthro } = await supabase
          .from("anthropometry")
          .select("weight, body_fat")
          .eq("assessment_id", assessments[0].id)
          .maybeSingle();

        if (anthro) {
          weight  = parseFloat(anthro.weight)   || 0;
          bodyFat = parseFloat(anthro.body_fat) || 20;
        }
      }

      // 3. Guarda parâmetros físicos para recálculo posterior
      if (weight > 0 && clientData.height_cm && clientData.birth_date && clientData.gender) {
        const params = {
          weight, heightCm: clientData.height_cm,
          birthDate: clientData.birth_date, gender: clientData.gender, bodyFat,
        };
        setPhysicalParams(params);

        if (clientData.objective && clientData.activity_level) {
          setDietResult(calculateDietPlan({
            weight_kg:        weight,
            height_cm:        clientData.height_cm,
            age:              calcAge(clientData.birth_date),
            gender:           clientData.gender as "M" | "F",
            body_fat_percent: bodyFat,
            activity:         clientData.activity_level as ActivityLevel,
            objective:        clientData.objective as Objective,
          }));
        }
      }

      // 4. Plano alimentar ativo
      const { data: plan } = await supabase
        .from("meal_plans")
        .select(`
          id, title, notes,
          meal_plan_meals (
            id, name, time_suggestion, order_index,
            meal_plan_foods (
              id, name, quantity, calories, protein, carbs, fat, order_index
            )
          )
        `)
        .eq("client_id", cId)
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
    } catch (err: any) {
      console.error("Erro ao carregar dieta do aluno:", err);
      setStatusMsg({ text: "Não foi possível carregar seus dados.", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function handleSavePreferences() {
    if (!clientId) return;
    setSaving(true);
    setStatusMsg({ text: "", type: "" });
    try {
      const { error } = await supabase
        .from("clients")
        .update({
          objective:         objective || null,
          activity_level:    activityLevel || null,
          food_restrictions: foodRestrictions.trim() || null,
          updated_at:        new Date().toISOString(),
        })
        .eq("id", clientId);

      if (error) throw error;

      // Recalcula macros localmente se tiver dados físicos suficientes
      if (physicalParams && objective && activityLevel) {
        setDietResult(calculateDietPlan({
          weight_kg:        physicalParams.weight,
          height_cm:        physicalParams.heightCm,
          age:              calcAge(physicalParams.birthDate),
          gender:           physicalParams.gender as "M" | "F",
          body_fat_percent: physicalParams.bodyFat,
          activity:         activityLevel as ActivityLevel,
          objective:        objective as Objective,
        }));
      }

      setStatusMsg({ text: "Preferências salvas com sucesso!", type: "success" });
    } catch (err: any) {
      setStatusMsg({ text: err.message || "Erro ao salvar preferências.", type: "error" });
    } finally {
      setSaving(false);
    }
  }

  // ------------------------------------------------------------
  // Render
  // ------------------------------------------------------------
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  const allFoods   = mealPlan ? mealPlan.meal_plan_meals.flatMap((m) => m.meal_plan_foods) : [];
  const planTotals = sumMacros(allFoods);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 80 }}>

      {/* Cabeçalho */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Olá,</Text>
          <Text style={styles.name}>{clientName || "Aluno"}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={signOut}>
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>
      </View>

      {/* Mensagem de status */}
      {statusMsg.text !== "" && (
        <View style={[styles.statusBox, statusMsg.type === "error" ? styles.statusError : styles.statusSuccess]}>
          <Text style={[styles.statusText, statusMsg.type === "error" ? styles.statusTextError : styles.statusTextSuccess]}>
            {statusMsg.type === "error" ? "⚠️ " : "✅ "}{statusMsg.text}
          </Text>
        </View>
      )}

      {/* Card de Macros */}
      {dietResult ? (
        <View style={styles.macroCard}>
          <Text style={styles.macroCardTitle}>Suas Metas Diárias</Text>
          <View style={styles.macroRow}>
            {[
              { label: "Calorias", value: dietResult.macros.calories, unit: "kcal", color: "#059669" },
              { label: "Proteína", value: dietResult.macros.protein,  unit: "g",    color: "#2563eb" },
              { label: "Carbs",    value: dietResult.macros.carbs,    unit: "g",    color: "#d97706" },
              { label: "Gordura",  value: dietResult.macros.fat,      unit: "g",    color: "#dc2626" },
            ].map((m) => (
              <View key={m.label} style={[styles.macroChip, { borderTopColor: m.color }]}>
                <Text style={[styles.macroChipValue, { color: m.color }]}>{m.value}</Text>
                <Text style={styles.macroChipUnit}>{m.unit}</Text>
                <Text style={styles.macroChipLabel}>{m.label}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.macroSub}>
            BMR {dietResult.bmr} kcal · TDEE {dietResult.tdee} kcal · Objetivo: {OBJECTIVE_LABELS[objective as Objective] ?? "—"}
          </Text>
        </View>
      ) : (
        <View style={[styles.macroCard, { backgroundColor: "#fef3c7" }]}>
          <Text style={{ color: "#92400e", fontSize: 13, fontWeight: "600", lineHeight: 20 }}>
            Configure seu objetivo e nível de atividade abaixo para ver suas metas calóricas.
          </Text>
        </View>
      )}

      {/* Plano Alimentar */}
      {mealPlan ? (
        <View style={{ marginBottom: 8 }}>
          <View style={styles.planHeader}>
            <Text style={styles.planTitle}>{mealPlan.title}</Text>
          </View>
          {mealPlan.notes ? (
            <Text style={styles.planNotes}>{mealPlan.notes}</Text>
          ) : null}

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
        </View>
      ) : (
        <View style={styles.emptyPlan}>
          <Text style={styles.emptyPlanText}>Nenhum plano disponível ainda.</Text>
          <Text style={styles.emptyPlanSub}>Seu treinador irá criar seu plano em breve.</Text>
        </View>
      )}

      {/* Seção de Preferências */}
      <View style={styles.prefCard}>
        <Text style={styles.prefTitle}>Minhas Preferências</Text>
        <Text style={styles.prefSub}>Atualize seu objetivo e estilo de vida para recalcular suas metas.</Text>

        <Text style={styles.label}>Objetivo</Text>
        {(Object.keys(OBJECTIVE_LABELS) as Objective[]).map((key) => (
          <TouchableOpacity
            key={key}
            style={[styles.optionBtn, objective === key && styles.optionBtnActive]}
            onPress={() => setObjective(key)}
          >
            <Text style={[styles.optionBtnText, objective === key && styles.optionBtnTextActive]}>
              {OBJECTIVE_LABELS[key]}
            </Text>
          </TouchableOpacity>
        ))}

        <Text style={[styles.label, { marginTop: 12 }]}>Nível de Atividade</Text>
        {(Object.keys(ACTIVITY_LABELS) as ActivityLevel[]).map((key) => (
          <TouchableOpacity
            key={key}
            style={[styles.optionBtn, activityLevel === key && styles.optionBtnActive]}
            onPress={() => setActivityLevel(key)}
          >
            <Text style={[styles.optionBtnText, activityLevel === key && styles.optionBtnTextActive]}>
              {ACTIVITY_LABELS[key]}
            </Text>
          </TouchableOpacity>
        ))}

        <Text style={[styles.label, { marginTop: 12 }]}>Restrições Alimentares</Text>
        <TextInput
          style={[styles.input, { height: 80, textAlignVertical: "top" }]}
          value={foodRestrictions}
          onChangeText={setFoodRestrictions}
          multiline
          numberOfLines={3}
          placeholder="Ex: intolerância à lactose, alergia a amendoim..."
        />

        <TouchableOpacity style={styles.saveBtn} onPress={handleSavePreferences} disabled={saving}>
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.saveBtnText}>SALVAR PREFERÊNCIAS</Text>
          }
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}

// ------------------------------------------------------------
// Estilos
// ------------------------------------------------------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb", padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  greeting: { fontSize: 14, color: "#6b7280", fontWeight: "600" },
  name: { fontSize: 26, fontWeight: "800", color: "#111827" },
  logoutBtn: { backgroundColor: "#f3f4f6", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: "#e5e7eb" },
  logoutText: { fontWeight: "700", color: "#374151", fontSize: 13 },

  statusBox: { padding: 12, borderRadius: 10, marginBottom: 14, borderWidth: 1 },
  statusError: { backgroundColor: "#fef2f2", borderColor: "#fecaca" },
  statusSuccess: { backgroundColor: "#f0fdf4", borderColor: "#bbf7d0" },
  statusText: { fontWeight: "bold", fontSize: 14 },
  statusTextError: { color: "#dc2626" },
  statusTextSuccess: { color: "#16a34a" },

  macroCard: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: "#e5e7eb" },
  macroCardTitle: { fontSize: 13, fontWeight: "800", color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 },
  macroRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  macroChip: { flex: 1, alignItems: "center", borderTopWidth: 3, paddingTop: 8, marginHorizontal: 3, borderRadius: 8, backgroundColor: "#f9fafb" },
  macroChipValue: { fontSize: 20, fontWeight: "800" },
  macroChipUnit: { fontSize: 11, color: "#6b7280" },
  macroChipLabel: { fontSize: 11, color: "#374151", fontWeight: "600", marginTop: 2 },
  macroSub: { fontSize: 11, color: "#9ca3af", textAlign: "center" },

  planHeader: { marginBottom: 4 },
  planTitle: { fontSize: 18, fontWeight: "800", color: "#111827", marginBottom: 4 },
  planNotes: { fontSize: 12, color: "#6b7280", marginBottom: 10 },

  macroBarsCard: { backgroundColor: "#fff", borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: "#e5e7eb" },
  macroBarsTitle: { fontSize: 11, fontWeight: "800", color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 },

  emptyPlan: { alignItems: "center", padding: 32, backgroundColor: "#fff", borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: "#e5e7eb" },
  emptyPlanText: { color: "#374151", fontSize: 15, fontWeight: "700", marginBottom: 6 },
  emptyPlanSub: { color: "#9ca3af", fontSize: 13, textAlign: "center" },

  prefCard: { backgroundColor: "#fff", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#e5e7eb" },
  prefTitle: { fontSize: 16, fontWeight: "800", color: "#111827", marginBottom: 4 },
  prefSub: { fontSize: 12, color: "#6b7280", marginBottom: 16 },

  label: { fontSize: 11, fontWeight: "800", color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 },
  optionBtn: { padding: 12, borderRadius: 10, borderWidth: 1, borderColor: "#d1d5db", backgroundColor: "#f9fafb", marginBottom: 6 },
  optionBtnActive: { backgroundColor: "#111827", borderColor: "#111827" },
  optionBtnText: { color: "#374151", fontWeight: "600", fontSize: 14 },
  optionBtnTextActive: { color: "#fff" },
  input: { backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#d1d5db", borderRadius: 10, padding: 12, fontSize: 15, color: "#111827", marginBottom: 12 },

  saveBtn: { backgroundColor: "#059669", padding: 16, borderRadius: 14, alignItems: "center", marginTop: 4 },
  saveBtnText: { color: "#fff", fontWeight: "800", fontSize: 15 },
});
