import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import FoodSearchModal, { SelectedFood } from "../../components/FoodSearchModal";
import SupplementSearchModal, { SelectedSupplement } from "../../components/SupplementSearchModal";
import MacroBar from "../../components/MacroBar";
import { useTrainer } from "../../hooks/useTrainer";
import { supabase } from "../../lib/supabase";
import {
  ActivityLevel,
  DietCalculationResult,
  ACTIVITY_LABELS,
  OBJECTIVE_LABELS,
  Objective,
  calculateDietPlan,
} from "../../utils/dietCalculations";
import { GradientPrimary } from "../../utils/gradients";
import { T } from "../../utils/theme";

// ------------------------------------------------------------
// Tipos locais
// ------------------------------------------------------------
interface FoodEntry {
  _key: string;
  id?: string;
  food_id?: string;
  supplement_id?: string;
  name: string;
  quantity: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
}

interface MealEntry {
  _key: string;
  id?: string;
  name: string;
  time_suggestion: string;
  foods: FoodEntry[];
}

interface LastBio {
  weight: number;
  body_fat: number;
  muscle_mass_percentage: number | null;
  basal_metabolic_rate: number | null;
}

function calcAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

let _keyCounter = 0;
function nextKey() {
  return String(++_keyCounter);
}

function emptyFood(): FoodEntry {
  return { _key: nextKey(), name: "", quantity: "", calories: "", protein: "", carbs: "", fat: "" };
}

function emptyMeal(): MealEntry {
  return { _key: nextKey(), name: "", time_suggestion: "", foods: [emptyFood()] };
}

// ------------------------------------------------------------
// Screen
// ------------------------------------------------------------
export default function DietPlanForm() {
  const { client_id, plan_id } = useLocalSearchParams();
  const clientId  = client_id  as string;
  const planId    = plan_id    as string | undefined;
  const isEditing = !!planId;

  const { trainerId, loadingTrainer } = useTrainer();

  const [loading, setLoading]     = useState(isEditing);
  const [saving, setSaving]       = useState(false);
  const [statusMsg, setStatusMsg] = useState({ text: "", type: "" });

  const [foodModalMealKey, setFoodModalMealKey] = useState<string | null>(null);
  const [supplementModalMealKey, setSupplementModalMealKey] = useState<string | null>(null);

  const [clientName, setClientName] = useState("");
  const [lastBio, setLastBio]       = useState<LastBio | null>(null);
  const [dietResult, setDietResult] = useState<DietCalculationResult | null>(null);
  const [planTitle, setPlanTitle]   = useState("Plano Alimentar");
  const [planNotes, setPlanNotes]   = useState("");
  const [meals, setMeals]           = useState<MealEntry[]>([emptyMeal()]);

  // Refs para monitorar TextInputs quando onChange não funciona
  const mealNameRefs = useRef<{ [key: string]: TextInput | null }>({});
  const mealNameHtmlRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const preEditRef = useRef<Map<string, {
    qty: string; calories: string; protein: string; carbs: string; fat: string;
  }>>(new Map());

  useEffect(() => {
    if (!isEditing) return;
    loadPlan();
  }, [planId]);

  useEffect(() => {
    if (!clientId) return;
    supabase
      .from("clients")
      .select("name, birth_date, gender, height_cm, objective, activity_level")
      .eq("id", clientId)
      .single()
      .then(({ data }) => {
        if (data) {
          setClientName(data.name);
          loadAssessment(data);
        }
      });
  }, [clientId]);

  async function loadAssessment(clientData: any) {
    const { data: assessments } = await supabase
      .from("physical_assessments")
      .select("id")
      .eq("client_id", clientId)
      .order("date", { ascending: false })
      .limit(1);

    if (!assessments || assessments.length === 0) return;

    const { data: anthro } = await supabase
      .from("anthropometry")
      .select("weight, body_fat, muscle_mass_percentage, basal_metabolic_rate")
      .eq("assessment_id", assessments[0].id)
      .maybeSingle();

    if (!anthro) return;

    const bio: LastBio = {
      weight:                   parseFloat(anthro.weight)   || 0,
      body_fat:                 parseFloat(anthro.body_fat)  || 0,
      muscle_mass_percentage:   anthro.muscle_mass_percentage != null ? parseFloat(anthro.muscle_mass_percentage) : null,
      basal_metabolic_rate:     anthro.basal_metabolic_rate  != null ? parseFloat(anthro.basal_metabolic_rate)  : null,
    };
    setLastBio(bio);

    if (
      bio.weight > 0 &&
      clientData.height_cm &&
      clientData.birth_date &&
      clientData.gender &&
      clientData.objective &&
      clientData.activity_level
    ) {
      setDietResult(calculateDietPlan({
        weight_kg:        bio.weight,
        height_cm:        clientData.height_cm,
        age:              calcAge(clientData.birth_date),
        gender:           clientData.gender as "M" | "F",
        body_fat_percent: bio.body_fat,
        activity:         clientData.activity_level as ActivityLevel,
        objective:        clientData.objective as Objective,
      }));
    }
  }

  async function loadPlan() {
    const { data, error } = await supabase
      .from("meal_plans")
      .select(`
        id, title, notes,
        meal_plan_meals (
          id, name, time_suggestion, order_index,
          meal_plan_foods (
            id, food_id, supplement_id, name, quantity, calories, protein, carbs, fat, order_index
          )
        )
      `)
      .eq("id", planId)
      .single();

    if (error || !data) {
      setStatusMsg({ text: "Não foi possível carregar o plano.", type: "error" });
      setLoading(false);
      return;
    }

    setPlanTitle(data.title || "Plano Alimentar");
    setPlanNotes(data.notes || "");

    const loadedMeals: MealEntry[] = (data.meal_plan_meals as any[])
      .sort((a, b) => a.order_index - b.order_index)
      .map((meal) => ({
        _key: nextKey(),
        id: meal.id,
        name: meal.name,
        time_suggestion: meal.time_suggestion || "",
        foods: (meal.meal_plan_foods as any[])
          .sort((a, b) => a.order_index - b.order_index)
          .map((f) => ({
            _key: nextKey(),
            id: f.id,
            food_id: f.food_id || undefined,
            supplement_id: f.supplement_id || undefined,
            name: f.name,
            quantity: f.quantity || "",
            calories: f.calories != null ? String(f.calories) : "",
            protein:  f.protein  != null ? String(f.protein)  : "",
            carbs:    f.carbs    != null ? String(f.carbs)    : "",
            fat:      f.fat      != null ? String(f.fat)      : "",
          })),
      }));

    setMeals(loadedMeals.length > 0 ? loadedMeals : [emptyMeal()]);
    setLoading(false);
  }

  // ------------------------------------------------------------
  // Helpers de mutação de estado
  // ------------------------------------------------------------
  const updateMeal = useCallback((mealKey: string, field: keyof MealEntry, value: string) => {
    console.log("🔄 [updateMeal] key:", mealKey, "field:", field, "value:", value);
    setMeals((prev) => {
      const updated = prev.map((m) => (m._key === mealKey ? { ...m, [field]: value } : m));
      console.log("📝 [updateMeal] Estado atualizado:", updated.map(m => ({ key: m._key, name: m.name })));
      return updated;
    });
  }, []);

  // Callback estável para configurar refs
  const setMealNameRef = useCallback((mealKey: string) => {
    return (ref: TextInput | null) => {
      mealNameRefs.current[mealKey] = ref;
      console.log("📌 [REF] Ref configurada para meal:", mealKey, ref ? "OK" : "NULL");
    };
  }, []);

  function addMeal() {
    setMeals((prev) => [...prev, emptyMeal()]);
  }

  function removeMeal(mealKey: string) {
    setMeals((prev) => prev.filter((m) => m._key !== mealKey));
  }

  function addFood(mealKey: string) {
    setMeals((prev) =>
      prev.map((m) =>
        m._key === mealKey ? { ...m, foods: [...m.foods, emptyFood()] } : m
      )
    );
  }

  function removeFood(mealKey: string, foodKey: string) {
    setMeals((prev) =>
      prev.map((m) =>
        m._key === mealKey
          ? { ...m, foods: m.foods.filter((f) => f._key !== foodKey) }
          : m
      )
    );
  }

  function updateFood(mealKey: string, foodKey: string, field: keyof FoodEntry, value: string) {
    setMeals((prev) =>
      prev.map((m) =>
        m._key === mealKey
          ? {
              ...m,
              foods: m.foods.map((f) =>
                f._key === foodKey ? { ...f, [field]: value } : f
              ),
            }
          : m
      )
    );
  }

  function handleFoodSelected(mealKey: string, food: SelectedFood) {
    setMeals((prev) =>
      prev.map((m) =>
        m._key === mealKey
          ? {
              ...m,
              foods: [
                ...m.foods,
                {
                  _key:     nextKey(),
                  food_id:  food.food_id,
                  name:     food.name,
                  quantity: food.quantity,
                  calories: String(food.calories),
                  protein:  String(food.protein),
                  carbs:    String(food.carbs),
                  fat:      String(food.fat),
                },
              ],
            }
          : m
      )
    );
    setFoodModalMealKey(null);
  }

  function handleSupplementSelected(mealKey: string, supplement: SelectedSupplement) {
    setMeals((prev) =>
      prev.map((m) =>
        m._key === mealKey
          ? {
              ...m,
              foods: [
                ...m.foods,
                {
                  _key:         nextKey(),
                  supplement_id: supplement.supplement_id,
                  name:         supplement.name,
                  quantity:     supplement.quantity,
                  calories:     String(supplement.calories),
                  protein:      String(supplement.protein),
                  carbs:        String(supplement.carbs),
                  fat:          String(supplement.fat),
                },
              ],
            }
          : m
      )
    );
    setSupplementModalMealKey(null);
  }

  function toNum(val: string): number | null {
    const n = parseFloat(val.replace(",", "."));
    return isNaN(n) ? null : parseFloat(n.toFixed(1));
  }

  // ------------------------------------------------------------
  // Salvar
  // ------------------------------------------------------------
  async function handleSave() {
    console.log("🚀 [handleSave] INICIANDO - planTitle:", planTitle?.trim());
    console.log("🚀 [handleSave] trainerId:", trainerId);
    console.log("🚀 [handleSave] meals count:", meals.length);
    console.log("🚀 [handleSave] meals detalhado:");
    meals.forEach((m, i) => {
      console.log(`  Refeição ${i}:`, {
        key: m._key,
        name: `"${m.name}"`,
        name_length: m.name?.length || 0,
        foods_count: m.foods.length,
        first_food: m.foods[0]?.name || 'sem alimentos'
      });
    });
    
    if (!planTitle.trim()) {
      console.log("❌ [handleSave] ERRO: planTitle vazio");
      setStatusMsg({ text: "Informe um título para o plano.", type: "error" });
      return;
    }
    if (!trainerId) {
      console.log("❌ [handleSave] ERRO: trainerId null");
      setStatusMsg({ text: "Perfil de treinador não carregado.", type: "error" });
      return;
    }

    try {
      console.log("✅ [handleSave] Iniciando salvamento...");
      setSaving(true);
      setStatusMsg({ text: "", type: "" });

      let currentPlanId = planId;
      if (isEditing && currentPlanId) {
        console.log("📝 [handleSave] EDITANDO plano existente:", currentPlanId);
        const { error } = await supabase
          .from("meal_plans")
          .update({ title: planTitle.trim(), notes: planNotes.trim() || null })
          .eq("id", currentPlanId);
        if (error) throw error;
        console.log("✅ [handleSave] Plano atualizado com sucesso");
      } else {
        console.log("➕ [handleSave] CRIANDO novo plano - clientId:", clientId, "trainerId:", trainerId);
        const { data, error } = await supabase
          .from("meal_plans")
          .insert({
            client_id:  clientId,
            trainer_id: trainerId,
            title:      planTitle.trim(),
            notes:      planNotes.trim() || null,
            is_active:  true,
          })
          .select("id")
          .single();
        if (error || !data) {
          console.log("❌ [handleSave] ERRO ao criar plano:", error);
          throw error;
        }
        currentPlanId = data.id;
        console.log("✅ [handleSave] Plano criado com ID:", currentPlanId);
      }

      if (isEditing) {
        await supabase.from("meal_plan_meals").delete().eq("meal_plan_id", currentPlanId);
      }

      console.log("🍽️ [handleSave] Processando", meals.length, "refeições...");
      for (let mi = 0; mi < meals.length; mi++) {
        const meal = meals[mi];
        const mealNameValue = mealNameHtmlRefs.current[meal._key]?.value ?? meal.name;
        if (!mealNameValue.trim()) {
          console.log("⏭️ [handleSave] Pulando refeição", mi, "- nome vazio");
          continue;
        }

        console.log(`🍽️ [handleSave] Processando refeição ${mi + 1}:`, meal.name.trim());
        const { data: mealData, error: mealErr } = await supabase
          .from("meal_plan_meals")
          .insert({
            meal_plan_id:    currentPlanId,
            name:            mealNameValue.trim(),
            time_suggestion: meal.time_suggestion.trim() || null,
            order_index:     mi,
          })
          .select("id")
          .single();

        if (mealErr || !mealData) {
          console.log("❌ [handleSave] ERRO ao criar refeição:", mealErr);
          throw mealErr;
        }
        console.log("✅ [handleSave] Refeição criada com ID:", mealData.id);

        const validFoods = meal.foods.filter((f) => f.name.trim());
        if (validFoods.length === 0) {
          console.log("⏭️ [handleSave] Refeição sem alimentos válidos");
          continue;
        }

        console.log(`🥗 [handleSave] Adicionando ${validFoods.length} alimentos...`);
        const foodRows = validFoods.map((f, fi) => ({
          meal_id:       mealData.id,
          food_id:       f.food_id || null,
          supplement_id: f.supplement_id || null,
          name:          f.name.trim(),
          quantity:      f.quantity.trim() || null,
          calories:      toNum(f.calories),
          protein:       toNum(f.protein),
          carbs:         toNum(f.carbs),
          fat:           toNum(f.fat),
          order_index:   fi,
        }));

        const { error: foodErr } = await supabase
          .from("meal_plan_foods")
          .insert(foodRows);
        if (foodErr) {
          console.log("❌ [handleSave] ERRO ao inserir alimentos:", foodErr);
          throw foodErr;
        }
        console.log("✅ [handleSave] Alimentos inseridos com sucesso");
      }

      console.log("🎉 [handleSave] TUDO SALVO! Redirecionando em 1.2s...");
      setStatusMsg({ text: "Plano salvo com sucesso!", type: "success" });
      setTimeout(() => {
        console.log("🔄 [handleSave] REDIRECIONANDO para client-diet...");
        router.replace(`/(protected)/client-diet?id=${clientId}` as any);
      }, 1200);
    } catch (err: any) {
      console.log("💥 [handleSave] ERRO CAPTURADO:", err);
      setStatusMsg({ text: err?.message || "Erro ao salvar o plano.", type: "error" });
    } finally {
      console.log("🏁 [handleSave] FINALIZANDO - setSaving(false)");
      setSaving(false);
    }
  }

  // ------------------------------------------------------------
  // Render
  // ------------------------------------------------------------
  if (loading || loadingTrainer) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={T.green} />
      </View>
    );
  }

  const allFormFoods = meals.flatMap((m) => m.foods);
  const planTotals = {
    calories: allFormFoods.reduce((s, f) => s + (parseFloat(f.calories) || 0), 0),
    protein:  allFormFoods.reduce((s, f) => s + (parseFloat(f.protein)  || 0), 0),
    carbs:    allFormFoods.reduce((s, f) => s + (parseFloat(f.carbs)    || 0), 0),
    fat:      allFormFoods.reduce((s, f) => s + (parseFloat(f.fat)      || 0), 0),
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: T.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>
          {isEditing ? "Editar Plano" : "Novo Plano"}{clientName ? ` — ${clientName}` : ""}
        </Text>

        {/* ── Última Avaliação Corporal ── */}
        {lastBio && lastBio.weight > 0 && (
          <View style={styles.bioCard}>
            <Text style={styles.bioCardTitle}>Última Avaliação Corporal</Text>
            <View style={styles.bioRow}>
              {[
                { label: "Peso",         value: Number(lastBio.weight).toFixed(1),                                                                       unit: "kg",   color: "#94a3b8" },
                { label: "% Gordura",    value: Number(lastBio.body_fat).toFixed(1),                                                                      unit: "%",    color: T.red },
                { label: "% Músculo",    value: lastBio.muscle_mass_percentage != null ? Number(lastBio.muscle_mass_percentage).toFixed(1) : "—",          unit: lastBio.muscle_mass_percentage != null ? "%" : "",    color: T.blue },
                { label: "Metab. Basal", value: lastBio.basal_metabolic_rate    != null ? Number(lastBio.basal_metabolic_rate).toFixed(1)    : "—",          unit: lastBio.basal_metabolic_rate    != null ? "kcal" : "", color: T.green },
              ].map((item) => (
                <View key={item.label} style={[styles.bioBox, { borderTopColor: item.color }]}>
                  <Text style={[styles.bioValue, { color: item.color }]}>{item.value}</Text>
                  <Text style={styles.bioUnit}>{item.unit}</Text>
                  <Text style={styles.bioLabel}>{item.label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Metas Calculadas ── */}
        {dietResult && (
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
          </View>
        )}

        {/* ── Realizado vs Meta (tempo real) ── */}
        {dietResult && (
          <View style={styles.macroBarsCard}>
            <Text style={styles.macroBarsTitle}>Realizado vs Meta</Text>
            <MacroBar label="Calorias" current={Math.round(planTotals.calories)} target={dietResult.macros.calories} unit="kcal" color={T.green} />
            <MacroBar label="Proteína" current={Math.round(planTotals.protein)}  target={dietResult.macros.protein}  unit="g"    color={T.blue} />
            <MacroBar label="Carbs"    current={Math.round(planTotals.carbs)}    target={dietResult.macros.carbs}    unit="g"    color={T.orange} />
            <MacroBar label="Gordura"  current={Math.round(planTotals.fat)}      target={dietResult.macros.fat}      unit="g"    color={T.red} />
          </View>
        )}

        {statusMsg.text !== "" && (
          <View style={[styles.statusBox, statusMsg.type === "error" ? styles.statusError : styles.statusSuccess]}>
            <Text style={[styles.statusText, statusMsg.type === "error" ? styles.statusTextError : styles.statusTextSuccess]}>
              {statusMsg.type === "error" ? "⚠️ " : "✅ "}{statusMsg.text}
            </Text>
          </View>
        )}

        {/* Título e Notas do plano */}
        <View style={styles.card}>
          <Text style={styles.label}>Título do Plano</Text>
          <TextInput
            style={styles.input}
            value={planTitle}
            onChangeText={setPlanTitle}
            placeholder="Ex: Plano de Hipertrofia"
            placeholderTextColor={T.t3}
          />
          <Text style={styles.label}>Notas Gerais</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={planNotes}
            onChangeText={setPlanNotes}
            placeholder="Orientações gerais, horários, hidratação..."
            placeholderTextColor={T.t3}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Refeições */}
        {meals.map((meal, mi) => (
          <View key={meal._key} style={styles.mealCard}>
            <View style={styles.mealCardHeader}>
              <Text style={styles.mealIndex}>Refeição {mi + 1}</Text>
              <Text style={{fontSize: 10, color: '#999', flex: 1, textAlign: 'center'}}>
                Debug: "{meal.name || '[VAZIO]'}"
              </Text>
              {meals.length > 1 && (
                <TouchableOpacity onPress={() => removeMeal(meal._key)}>
                  <Text style={styles.removeText}>✕ Remover</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.mealRow}>
              <View style={{ flex: 2, marginRight: 8 }}>
                <Text style={styles.label}>Nome</Text>
                <input
                  ref={(el) => { mealNameHtmlRefs.current[meal._key] = el as HTMLInputElement | null; }}
                  key={`html-meal-input-${meal._key}`}
                  type="text"
                  style={{
                    backgroundColor: '#f9f9f9',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    fontSize: '16px',
                    color: '#333',
                    width: '100%',
                    border: '1px solid #ddd',
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit'
                  }}
                  defaultValue={meal.name || ""}
                  placeholder="Ex: Café da manhã"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Horário</Text>
                <TextInput
                  style={styles.input}
                  value={meal.time_suggestion}
                  onChangeText={(v) => updateMeal(meal._key, "time_suggestion", v)}
                  placeholder="07:00"
                  placeholderTextColor={T.t3}
                  keyboardType="numbers-and-punctuation"
                />
              </View>
            </View>

            {/* Alimentos */}
            {meal.foods.map((food) => (
              <View key={food._key} style={styles.foodBlock}>
                <View style={styles.foodBlockHeader}>
                  <Text style={styles.foodBlockTitle}>Alimento</Text>
                  {meal.foods.length > 1 && (
                    <TouchableOpacity onPress={() => removeFood(meal._key, food._key)}>
                      <Text style={styles.removeText}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.foodNameRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Nome do Alimento</Text>
                    <TextInput
                      style={styles.input}
                      value={food.name}
                      onChangeText={(v) => updateFood(meal._key, food._key, "name", v)}
                      placeholder="Ex: Arroz integral cozido"
                      placeholderTextColor={T.t3}
                    />
                  </View>
                  <View style={styles.searchBtnsRow}>
                    <TouchableOpacity
                      style={styles.tacoBtn}
                      onPress={() => setFoodModalMealKey(meal._key)}
                    >
                      <Text style={styles.tacoBtnText}>🔍 TACO</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.supplementBtn}
                      onPress={() => setSupplementModalMealKey(meal._key)}
                    >
                      <Text style={styles.supplementBtnText}>💊 Herbalife</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.foodRow}>
                  <View style={{ flex: 1, marginRight: 6 }}>
                    <Text style={styles.label}>Quantidade</Text>
                    <TextInput
                      style={styles.input}
                      value={food.quantity}
                      onChangeText={(v) => updateFood(meal._key, food._key, "quantity", v)}
                      onFocus={() => {
                        preEditRef.current.set(food._key, {
                          qty:      food.quantity,
                          calories: food.calories,
                          protein:  food.protein,
                          carbs:    food.carbs,
                          fat:      food.fat,
                        });
                      }}
                      onBlur={() => {
                        const pre = preEditRef.current.get(food._key);
                        if (!pre) return;
                        setMeals((prev) => {
                          const currentFood = prev
                            .find((m) => m._key === meal._key)?.foods
                            .find((f) => f._key === food._key);
                          if (!currentFood) return prev;
                          const oldQty = parseFloat(pre.qty.replace(/[^\d.]/g, ""));
                          const newQty = parseFloat(currentFood.quantity.replace(/[^\d.]/g, ""));
                          if (isNaN(oldQty) || oldQty <= 0 || isNaN(newQty) || newQty <= 0 || oldQty === newQty) return prev;
                          const ratio = newQty / oldQty;
                          const scale = (v: string) => {
                            const n = parseFloat(v.replace(",", "."));
                            return isNaN(n) ? v : parseFloat((n * ratio).toFixed(1)).toString();
                          };
                          return prev.map((m) =>
                            m._key !== meal._key ? m : {
                              ...m,
                              foods: m.foods.map((f) =>
                                f._key !== food._key ? f : {
                                  ...f,
                                  calories: scale(pre.calories),
                                  protein:  scale(pre.protein),
                                  carbs:    scale(pre.carbs),
                                  fat:      scale(pre.fat),
                                }
                              ),
                            }
                          );
                        });
                        preEditRef.current.delete(food._key);
                      }}
                      placeholder="Ex: 100g"
                      placeholderTextColor={T.t3}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Calorias (kcal)</Text>
                    <TextInput
                      style={styles.input}
                      value={food.calories}
                      onChangeText={(v) => updateFood(meal._key, food._key, "calories", v)}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      placeholderTextColor={T.t3}
                    />
                  </View>
                </View>

                <View style={styles.foodRow}>
                  <View style={{ flex: 1, marginRight: 4 }}>
                    <Text style={styles.label}>Prot. (g)</Text>
                    <TextInput
                      style={styles.input}
                      value={food.protein}
                      onChangeText={(v) => updateFood(meal._key, food._key, "protein", v)}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      placeholderTextColor={T.t3}
                    />
                  </View>
                  <View style={{ flex: 1, marginRight: 4 }}>
                    <Text style={styles.label}>Carbs (g)</Text>
                    <TextInput
                      style={styles.input}
                      value={food.carbs}
                      onChangeText={(v) => updateFood(meal._key, food._key, "carbs", v)}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      placeholderTextColor={T.t3}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Gord. (g)</Text>
                    <TextInput
                      style={styles.input}
                      value={food.fat}
                      onChangeText={(v) => updateFood(meal._key, food._key, "fat", v)}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      placeholderTextColor={T.t3}
                    />
                  </View>
                </View>
              </View>
            ))}

            <TouchableOpacity style={styles.addFoodBtn} onPress={() => addFood(meal._key)}>
              <Text style={styles.addFoodBtnText}>+ Adicionar Alimento</Text>
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity style={styles.addMealBtn} onPress={addMeal}>
          <Text style={styles.addMealBtnText}>+ Adicionar Refeição</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving} activeOpacity={0.85}>
          <LinearGradient {...GradientPrimary} style={styles.saveBtnGradient}>
            {saving
              ? <ActivityIndicator color={T.white} />
              : <Text style={styles.saveBtnText}>SALVAR PLANO</Text>
            }
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal de busca TACO */}
      <FoodSearchModal
        visible={foodModalMealKey !== null}
        onClose={() => setFoodModalMealKey(null)}
        onSelect={(food) => {
          if (foodModalMealKey) handleFoodSelected(foodModalMealKey, food);
        }}
      />

      {/* Modal de busca Suplementos */}
      <SupplementSearchModal
        visible={supplementModalMealKey !== null}
        onClose={() => setSupplementModalMealKey(null)}
        onSelect={(supplement) => {
          if (supplementModalMealKey) handleSupplementSelected(supplementModalMealKey, supplement);
        }}
      />
    </KeyboardAvoidingView>
  );
}

// ------------------------------------------------------------
// Estilos
// ------------------------------------------------------------
const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: T.bg },
  pageTitle: { fontSize: 22, fontWeight: "800", color: T.t1, marginBottom: 16 },

  statusBox: { padding: 12, borderRadius: 10, marginBottom: 16, borderWidth: 1 },
  statusError: { backgroundColor: "rgba(239,68,68,0.08)", borderColor: T.red },
  statusSuccess: { backgroundColor: "rgba(16,185,129,0.08)", borderColor: T.green },
  statusText: { fontWeight: "bold", fontSize: 14 },
  statusTextError: { color: T.red },
  statusTextSuccess: { color: T.green },

  card: { backgroundColor: T.card, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: T.border },

  label: { fontSize: 11, fontWeight: "800", color: T.t2, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  input: { backgroundColor: T.surface, borderWidth: 1, borderColor: T.border, borderRadius: 10, padding: 12, fontSize: 15, color: T.t1, marginBottom: 12 },
  textArea: { height: 80, textAlignVertical: "top" },

  mealCard: { backgroundColor: T.card, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: T.border },
  mealCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  mealIndex: { fontSize: 15, fontWeight: "800", color: T.green },
  mealRow: { flexDirection: "row" },
  removeText: { color: T.red, fontWeight: "700", fontSize: 13 },

  foodBlock: { backgroundColor: T.surfaceAlt, borderRadius: 10, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: T.border },
  foodBlockHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  foodBlockTitle: { fontSize: 11, fontWeight: "800", color: T.t2, textTransform: "uppercase" },
  foodRow: { flexDirection: "row" },

  foodNameRow: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  searchBtnsRow: { flexDirection: "column", gap: 4 },
  tacoBtn: { backgroundColor: "rgba(16,185,129,0.1)", borderWidth: 1, borderColor: T.green, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 12, marginBottom: 4, justifyContent: "center" },
  tacoBtnText: { color: T.green, fontWeight: "800", fontSize: 12 },
  supplementBtn: { backgroundColor: "rgba(245,158,11,0.1)", borderWidth: 1, borderColor: T.orange, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 12, marginBottom: 12, justifyContent: "center" },
  supplementBtnText: { color: T.orange, fontWeight: "800", fontSize: 12 },

  addFoodBtn: { borderWidth: 1, borderColor: T.green, borderRadius: 10, padding: 10, alignItems: "center", borderStyle: "dashed" },
  addFoodBtnText: { color: T.green, fontWeight: "700", fontSize: 14 },

  addMealBtn: { backgroundColor: "rgba(16,185,129,0.08)", borderWidth: 1, borderColor: T.green, borderRadius: 14, padding: 16, alignItems: "center", marginBottom: 12 },
  addMealBtnText: { color: T.green, fontWeight: "800", fontSize: 15 },

  saveBtn: { borderRadius: 14, overflow: "hidden" },
  saveBtnGradient: { height: 56, alignItems: "center", justifyContent: "center", borderRadius: 14 },
  saveBtnText: { color: T.white, fontWeight: "800", fontSize: 16 },

  bioCard: { backgroundColor: T.card, borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: T.border },
  bioCardTitle: { fontSize: 11, fontWeight: "800", color: T.t2, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 },
  bioRow: { flexDirection: "row", justifyContent: "space-between" },
  bioBox: { flex: 1, alignItems: "center", borderTopWidth: 3, paddingTop: 8, marginHorizontal: 3, borderRadius: 8, backgroundColor: T.surfaceAlt },
  bioValue: { fontSize: 16, fontWeight: "800" },
  bioUnit: { fontSize: 10, color: T.t3 },
  bioLabel: { fontSize: 10, color: T.t2, fontWeight: "600", marginTop: 2 },

  macroCard: { backgroundColor: T.card, borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: T.border },
  macroCardTitle: { fontSize: 11, fontWeight: "800", color: T.t2, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 },
  macroRow: { flexDirection: "row", justifyContent: "space-between" },
  macroBox: { flex: 1, alignItems: "center", borderTopWidth: 3, paddingTop: 8, marginHorizontal: 3, borderRadius: 8, backgroundColor: T.surfaceAlt },
  macroValue: { fontSize: 16, fontWeight: "800" },
  macroUnit: { fontSize: 10, color: T.t3 },
  macroLabel: { fontSize: 10, color: T.t2, fontWeight: "600", marginTop: 2 },

  macroBarsCard: { backgroundColor: T.card, borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: T.border },
  macroBarsTitle: { fontSize: 11, fontWeight: "800", color: T.t2, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 },
});
