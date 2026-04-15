import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
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
import AIDietPDF from "../../components/AIDietPDF";
import DietPlanPDF from "../../components/DietPlanPDF";
import { supabase } from "../../lib/supabase";
import {
  ACTIVITY_LABELS,
  ActivityLevel,
  DietCalculationResult,
  OBJECTIVE_LABELS,
  Objective,
  calculateDietPlan,
  GeneratedPlan,
} from "../../utils/dietCalculations";

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
  const [lastBio, setLastBio]       = useState<LastBio | null>(null);

  // Guarda parâmetros físicos para recálculo após salvar preferências
  const [physicalParams, setPhysicalParams] = useState<{
    weight: number; heightCm: number; birthDate: string; gender: string; bodyFat: number;
  } | null>(null);

  // IA
  const [generatingAI, setGeneratingAI] = useState(false);
  const [aiResult, setAiResult] = useState<{ plan: GeneratedPlan; trainer_name: string } | null>(null);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiError, setAiError] = useState("");

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
        .order("date", { ascending: false })
        .limit(1);

      if (assessments && assessments.length > 0) {
        const { data: anthro } = await supabase
          .from("anthropometry")
          .select("weight, body_fat, muscle_mass_percentage, basal_metabolic_rate, metabolic_age")
          .eq("assessment_id", assessments[0].id)
          .maybeSingle();

        if (anthro) {
          weight  = parseFloat(anthro.weight)   || 0;
          bodyFat = parseFloat(anthro.body_fat) || 20;
          setLastBio({
            weight,
            body_fat:               parseFloat(anthro.body_fat) || 0,
            muscle_mass_percentage: anthro.muscle_mass_percentage != null ? parseFloat(anthro.muscle_mass_percentage) : null,
            basal_metabolic_rate:   anthro.basal_metabolic_rate   != null ? parseFloat(anthro.basal_metabolic_rate)   : null,
            metabolic_age:          anthro.metabolic_age          != null ? parseFloat(anthro.metabolic_age)          : null,
          });
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

  async function handleGenerateAI() {
    if (!dietResult || !clientId) {
      setAiError("Configure seu objetivo e nível de atividade e aguarde uma avaliação física para gerar o plano com IA.");
      return;
    }
    setAiError("");
    setAiResult(null);
    setGeneratingAI(true);
    setShowAIModal(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const { data, error } = await supabase.functions.invoke("generate-diet", {
        body: { client_id: clientId },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (error) {
        let msg = "Erro ao gerar plano com IA.";
        try {
          const text = await (error as any).context?.text?.();
          if (text) { const parsed = JSON.parse(text); msg = parsed.error ?? msg; }
        } catch {}
        throw new Error(msg);
      }
      setAiResult(data);
    } catch (err: any) {
      setShowAIModal(false);
      setAiError(err.message || "Erro ao gerar plano com IA.");
    } finally {
      setGeneratingAI(false);
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

      {/* Card Última Avaliação Corporal */}
      {lastBio !== null ? (
        <View style={styles.macroCard}>
          <Text style={styles.macroCardTitle}>Última Avaliação Corporal</Text>
          <View style={styles.macroRow}>
            {[
              { label: "Peso",         value: Number(lastBio.weight).toFixed(1),
                unit: "kg",   color: "#374151" },
              { label: "% Gordura",    value: Number(lastBio.body_fat).toFixed(1),
                unit: "%",    color: "#dc2626" },
              { label: "% Músculo",    value: lastBio.muscle_mass_percentage != null
                                               ? Number(lastBio.muscle_mass_percentage).toFixed(1) : "—",
                unit: lastBio.muscle_mass_percentage != null ? "%" : "",
                color: "#2563eb" },
              { label: "Metab. Basal", value: lastBio.basal_metabolic_rate != null
                                               ? Number(lastBio.basal_metabolic_rate).toFixed(1) : "—",
                unit: lastBio.basal_metabolic_rate != null ? "kcal" : "",
                color: "#059669" },
            ].map((item) => (
              <View key={item.label} style={[styles.macroChip, { borderTopColor: item.color }]}>
                <Text style={[styles.macroChipValue, { color: item.color }]}>{item.value}</Text>
                <Text style={styles.macroChipUnit}>{item.unit}</Text>
                <Text style={styles.macroChipLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : (
        <View style={[styles.macroCard, { backgroundColor: "#eff6ff", borderColor: "#bfdbfe" }]}>
          <Text style={{ color: "#1d4ed8", fontSize: 13, fontWeight: "600",
                         lineHeight: 20, textAlign: "center" }}>
            Entre em contato com seu treinador para fazer sua avaliação de Composição Corporal.
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
                <Text style={[styles.macroChipValue, { color: m.color }]}>{Number(m.value).toFixed(1)}</Text>
                <Text style={styles.macroChipUnit}>{m.unit}</Text>
                <Text style={styles.macroChipLabel}>{m.label}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.macroSub}>
            BMR {Number(dietResult.bmr).toFixed(1)} kcal · TDEE {Number(dietResult.tdee).toFixed(1)} kcal · Objetivo: {OBJECTIVE_LABELS[objective as Objective] ?? "—"}
          </Text>
        </View>
      ) : (
        <View style={[styles.macroCard, { backgroundColor: "#fef3c7" }]}>
          <Text style={{ color: "#92400e", fontSize: 13, fontWeight: "600", lineHeight: 20 }}>
            Configure seu objetivo e nível de atividade abaixo para ver suas metas calóricas.
          </Text>
        </View>
      )}

      {/* Botão Gerar com IA — só aparece quando há avaliação corporal */}
      {lastBio !== null && (
        <>
          {aiError !== "" && (
            <View style={[styles.macroCard, { backgroundColor: "#fef2f2", borderColor: "#fecaca", marginBottom: 12 }]}>
              <Text style={{ color: "#dc2626", fontSize: 13, fontWeight: "600" }}>⚠️ {aiError}</Text>
            </View>
          )}
          <TouchableOpacity
            style={[styles.aiBtn, (!dietResult || generatingAI) && { opacity: 0.5 }]}
            onPress={handleGenerateAI}
            disabled={!dietResult || generatingAI}
          >
            <Text style={styles.aiBtnText}>✨ Gerar Plano com IA</Text>
          </TouchableOpacity>
        </>
      )}

      {/* Modal IA */}
      <Modal visible={showAIModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            {!aiResult ? (
              <View style={styles.modalLoadingBox}>
                <ActivityIndicator size="large" color="#D4AF37" />
                <Text style={styles.modalLoadingText}>A IA está criando seu plano personalizado...</Text>
                <Text style={styles.modalLoadingSub}>Isso pode levar alguns segundos</Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.modalTitle}>✨ Seu Plano Gerado pela IA</Text>
                {aiResult.plan.observations ? (
                  <View style={styles.modalObsBox}>
                    <Text style={styles.modalObsText}>{aiResult.plan.observations}</Text>
                  </View>
                ) : null}
                <Text style={styles.modalDaysTitle}>Resumo por dia</Text>
                {aiResult.plan.days.map((day) => (
                  <View key={day.day} style={styles.modalDayRow}>
                    <Text style={styles.modalDayLabel}>{day.label}</Text>
                    <Text style={styles.modalDayKcal}>{day.total_calories} kcal</Text>
                  </View>
                ))}
                <View style={{ marginTop: 16 }}>
                  <AIDietPDF
                    data={{
                      clientName:     clientName,
                      clientInitials: clientName.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?",
                      trainerName:    aiResult.trainer_name,
                      objective:      objective,
                      dietResult:     dietResult!,
                      lastBio:        lastBio,
                      plan:           aiResult.plan,
                      generatedAt:    new Date().toISOString(),
                    }}
                  />
                </View>
                <Pressable style={styles.modalCloseBtn} onPress={() => setShowAIModal(false)}>
                  <Text style={styles.modalCloseBtnText}>Fechar</Text>
                </Pressable>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Plano Alimentar — só aparece quando há avaliação corporal */}
      {lastBio !== null && mealPlan ? (
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

          {/* Botões de ação do plano */}
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => router.push(`/(client)/diet-plan-form?plan_id=${mealPlan.id}` as any)}
          >
            <Text style={styles.editBtnText}>✏️ Editar Plano Alimentar</Text>
          </TouchableOpacity>
          <DietPlanPDF
            data={{
              clientName,
              objective: objective || null,
              mealPlan,
              dietResult,
            }}
          />

          {/* Refeições */}
          {mealPlan.meal_plan_meals.map((meal) => (
            <MealCard key={meal.id} meal={meal} />
          ))}
        </View>
      ) : lastBio !== null ? (
        <View style={styles.emptyPlan}>
          <Text style={styles.emptyPlanText}>Nenhum plano disponível ainda.</Text>
          <TouchableOpacity
            style={styles.createBtn}
            onPress={() => router.push("/(client)/diet-plan-form" as any)}
          >
            <Text style={styles.createBtnText}>+ Criar Plano Alimentar</Text>
          </TouchableOpacity>
        </View>
      ) : null}

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

  createBtn: { backgroundColor: "#059669", paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14, marginTop: 12 },
  createBtnText: { color: "#fff", fontWeight: "800", fontSize: 15 },

  editBtn: { backgroundColor: "#065f46", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginBottom: 10, alignItems: "center" },
  editBtnText: { color: "#fff", fontWeight: "800", fontSize: 14 },

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

  aiBtn: { backgroundColor: "#0a0a0a", borderRadius: 14, paddingVertical: 14, alignItems: "center", marginBottom: 16, borderWidth: 1.5, borderColor: "#D4AF37" },
  aiBtnText: { color: "#D4AF37", fontWeight: "800", fontSize: 15 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  modalBox: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: "85%", minHeight: 200 },
  modalLoadingBox: { alignItems: "center", paddingVertical: 40 },
  modalLoadingText: { marginTop: 20, fontSize: 16, fontWeight: "700", color: "#111827", textAlign: "center" },
  modalLoadingSub: { marginTop: 8, fontSize: 13, color: "#6b7280", textAlign: "center" },
  modalTitle: { fontSize: 20, fontWeight: "800", color: "#111827", marginBottom: 12 },
  modalObsBox: { backgroundColor: "#fafaf5", borderLeftWidth: 3, borderLeftColor: "#D4AF37", padding: 12, borderRadius: 8, marginBottom: 16 },
  modalObsText: { fontSize: 13, color: "#374151", lineHeight: 20, fontStyle: "italic" },
  modalDaysTitle: { fontSize: 12, fontWeight: "800", color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
  modalDayRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  modalDayLabel: { fontSize: 14, fontWeight: "600", color: "#374151" },
  modalDayKcal: { fontSize: 14, fontWeight: "700", color: "#059669" },
  modalCloseBtn: { marginTop: 20, padding: 14, alignItems: "center", backgroundColor: "#f3f4f6", borderRadius: 12 },
  modalCloseBtnText: { fontWeight: "700", color: "#374151", fontSize: 15 },
});
