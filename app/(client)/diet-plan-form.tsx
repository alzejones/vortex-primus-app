import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
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
import MacroBar from "../../components/MacroBar";
import ScienceReferencesModal from "../../components/ScienceReferencesModal";
import SupplementSearchModal, { SelectedSupplement } from "../../components/SupplementSearchModal";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { supabase } from "../../lib/supabase";
import { GradientSuccess } from "../../utils/gradients";
import { T } from "../../utils/theme";
import {
  ActivityLevel,
  DietCalculationResult,
  ACTIVITY_LABELS,
  OBJECTIVE_LABELS,
  Objective,
  calculateDietPlan,
} from "../../utils/dietCalculations";

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

export default function ClientDietPlanForm() {
  const { plan_id } = useLocalSearchParams();
  const planId    = plan_id as string | undefined;
  const isEditing = !!planId;

  const { session } = useAuth();
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [statusMsg, setStatusMsg] = useState({ text: "", type: "" });
  const [orphanClient, setOrphanClient] = useState(false);

  const [clientId, setClientId]     = useState<string | null>(null);
  const [trainerId, setTrainerId]   = useState<string | null>(null);
  const [clientName, setClientName] = useState("");

  const [lastBio, setLastBio]       = useState<LastBio | null>(null);
  const [dietResult, setDietResult] = useState<DietCalculationResult | null>(null);

  const [planTitle, setPlanTitle] = useState("Plano Alimentar");
  const [planNotes, setPlanNotes] = useState("");
  const [meals, setMeals]         = useState<MealEntry[]>([emptyMeal()]);

  const [foodModalMealKey, setFoodModalMealKey] = useState<string | null>(null);
  const [supplementModalMealKey, setSupplementModalMealKey] = useState<string | null>(null);

  const preEditRef = useRef<Map<string, {
    qty: string; calories: string; protein: string; carbs: string; fat: string;
  }>>(new Map());

  useEffect(() => {
    if (!session?.user?.id) return;

    supabase
      .from("clients")
      .select("id, name, trainer_id, birth_date, gender, height_cm, objective, activity_level")
      .eq("user_id", session.user.id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setLoading(false);
          return;
        }

        setClientId(data.id);
        setClientName(data.name ?? "");

        if (!data.trainer_id) {
          setOrphanClient(true);
          setLoading(false);
          return;
        }

        setTrainerId(data.trainer_id);
        loadAssessment(data);

        if (isEditing && planId) {
          loadPlan(planId);
        } else {
          setLoading(false);
        }
      });
  }, [session]);

  async function loadAssessment(clientData: any) {
    const { data: assessments } = await supabase
      .from("physical_assessments")
      .select("id")
      .eq("client_id", clientData.id)
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
      weight:                 parseFloat(anthro.weight)   || 0,
      body_fat:               parseFloat(anthro.body_fat)  || 0,
      muscle_mass_percentage: anthro.muscle_mass_percentage != null
        ? parseFloat(anthro.muscle_mass_percentage) : null,
      basal_metabolic_rate:   anthro.basal_metabolic_rate != null
        ? parseFloat(anthro.basal_metabolic_rate) : null,
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

  async function loadPlan(id: string) {
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
      .eq("id", id)
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

  function updateMeal(mealKey: string, field: keyof MealEntry, value: string) {
    setMeals((prev) =>
      prev.map((m) => (m._key === mealKey ? { ...m, [field]: value } : m))
    );
  }

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
          ? { ...m, foods: m.foods.map((f) => f._key === foodKey ? { ...f, [field]: value } : f) }
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
        m._key !== mealKey ? m : {
          ...m,
          foods: [
            ...m.foods,
            {
              _key:          nextKey(),
              supplement_id: supplement.supplement_id,
              name:          supplement.name,
              quantity:      supplement.quantity,
              calories:      String(supplement.calories),
              protein:       String(supplement.protein),
              carbs:         String(supplement.carbs),
              fat:           String(supplement.fat),
            },
          ],
        }
      )
    );
    setSupplementModalMealKey(null);
  }

  function toNum(val: string): number | null {
    const n = parseFloat(val.replace(",", "."));
    return isNaN(n) ? null : parseFloat(n.toFixed(1));
  }

  async function handleSave() {
    if (!planTitle.trim()) {
      setStatusMsg({ text: "Informe um título para o plano.", type: "error" });
      return;
    }
    if (!clientId || !trainerId) {
      setStatusMsg({ text: "Dados do perfil não carregados. Tente novamente.", type: "error" });
      return;
    }

    try {
      setSaving(true);
      setStatusMsg({ text: "", type: "" });

      let currentPlanId = planId;
      if (isEditing && currentPlanId) {
        const { error } = await supabase
          .from("meal_plans")
          .update({ title: planTitle.trim(), notes: planNotes.trim() || null })
          .eq("id", currentPlanId);
        if (error) throw error;
      } else {
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
        if (error || !data) throw error ?? new Error("Falha ao criar plano.");
        currentPlanId = data.id;
      }

      if (isEditing) {
        await supabase.from("meal_plan_meals").delete().eq("meal_plan_id", currentPlanId);
      }

      for (let mi = 0; mi < meals.length; mi++) {
        const meal = meals[mi];
        const mealName = meal.name.trim() || `Refeição ${mi + 1}`;

        const { data: mealData, error: mealErr } = await supabase
          .from("meal_plan_meals")
          .insert({
            meal_plan_id:    currentPlanId,
            name:            mealName,
            time_suggestion: meal.time_suggestion.trim() || null,
            order_index:     mi,
          })
          .select("id")
          .single();

        if (mealErr || !mealData) throw mealErr;

        const validFoods = meal.foods.filter((f) => f.name.trim());
        if (validFoods.length === 0) continue;

        const foodRows = validFoods.map((f, fi) => ({
          meal_id:       mealData.id,
          food_id:       f.food_id || null,
          supplement_id: f.supplement_id || null,
          name:          f.name.trim(),
          quantity:    f.quantity.trim() || null,
          calories:    toNum(f.calories),
          protein:     toNum(f.protein),
          carbs:       toNum(f.carbs),
          fat:         toNum(f.fat),
          order_index: fi,
        }));

        const { error: foodErr } = await supabase
          .from("meal_plan_foods")
          .insert(foodRows);
        if (foodErr) throw foodErr;
      }

      setStatusMsg({ text: "Plano salvo com sucesso!", type: "success" });
      setTimeout(() => router.replace("/(client)/diet" as any), 1200);
    } catch (err: any) {
      setStatusMsg({ text: err?.message || "Erro ao salvar o plano.", type: "error" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (orphanClient) {
    return (
      <View style={styles.center}>
        <Text style={styles.orphanText}>
          Você não está vinculado a nenhum treinador.{"\n"}
          Entre em contato com um treinador para criar seu plano alimentar.
        </Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>← Voltar</Text>
        </TouchableOpacity>
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
      style={[styles.keyboardAvoid, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>
          {isEditing ? "Editar Plano" : "Meu Plano Alimentar"}
        </Text>

        {/* Última Avaliação Corporal */}
        {lastBio && lastBio.weight > 0 && (
          <View style={styles.bioCard}>
            <Text style={styles.bioCardTitle}>Última Avaliação Corporal</Text>
            <View style={styles.bioRow}>
              {[
                { label: "Peso",         value: Number(lastBio.weight).toFixed(1),
                  unit: "kg",   color: theme.colors.textSecondary },
                { label: "% Gordura",    value: Number(lastBio.body_fat).toFixed(1),
                  unit: "%",    color: "#EF4444" },
                { label: "% Músculo",    value: lastBio.muscle_mass_percentage != null
                                                 ? Number(lastBio.muscle_mass_percentage).toFixed(1) : "—",
                  unit: lastBio.muscle_mass_percentage != null ? "%" : "",
                  color: "#3B82F6" },
                { label: "Metab. Basal", value: lastBio.basal_metabolic_rate != null
                                                 ? Number(lastBio.basal_metabolic_rate).toFixed(1) : "—",
                  unit: lastBio.basal_metabolic_rate != null ? "kcal" : "",
                  color: "#10B981" },
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

        {/* Metas Calculadas */}
        {dietResult && (
          <View style={styles.macroCard}>
            <Text style={styles.macroCardTitle}>Metas Calculadas</Text>
            <View style={styles.macroRow}>
              {[
                { label: "Calorias", value: Number(dietResult.macros.calories).toFixed(1), unit: "kcal", color: "#10B981" },
                { label: "Proteína", value: Number(dietResult.macros.protein).toFixed(1),  unit: "g",    color: "#3B82F6" },
                { label: "Carbs",    value: Number(dietResult.macros.carbs).toFixed(1),    unit: "g",    color: "#F59E0B" },
                { label: "Gordura",  value: Number(dietResult.macros.fat).toFixed(1),      unit: "g",    color: "#EF4444" },
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

        {/* Realizado vs Meta */}
        {dietResult && (
          <View style={styles.macroBarsCard}>
            <Text style={styles.macroBarsTitle}>Realizado vs Meta</Text>
            <MacroBar label="Calorias" current={Math.round(planTotals.calories)} target={dietResult.macros.calories} unit="kcal" color="#10B981" />
            <MacroBar label="Proteína" current={Math.round(planTotals.protein)}  target={dietResult.macros.protein}  unit="g"    color="#3B82F6" />
            <MacroBar label="Carbs"    current={Math.round(planTotals.carbs)}    target={dietResult.macros.carbs}    unit="g"    color="#F59E0B" />
            <MacroBar label="Gordura"  current={Math.round(planTotals.fat)}      target={dietResult.macros.fat}      unit="g"    color="#EF4444" />
          </View>
        )}

        {/* Status */}
        {statusMsg.text !== "" && (
          <View style={[styles.statusBox, statusMsg.type === "error" ? styles.statusError : styles.statusSuccess]}>
            <Text style={[styles.statusText, statusMsg.type === "error" ? styles.statusTextError : styles.statusTextSuccess]}>
              {statusMsg.type === "error" ? "⚠️ " : "✅ "}{statusMsg.text}
            </Text>
          </View>
        )}

        {/* Título e Notas */}
        <View style={styles.card}>
          <Text style={styles.label}>Título do Plano</Text>
          <TextInput
            style={styles.input}
            value={planTitle}
            onChangeText={setPlanTitle}
            placeholder="Ex: Plano de Hipertrofia"
            placeholderTextColor={theme.colors.textMuted}
          />
          <Text style={styles.label}>Notas Gerais</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={planNotes}
            onChangeText={setPlanNotes}
            placeholder="Orientações gerais, horários, hidratação..."
            placeholderTextColor={theme.colors.textMuted}
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
              {meals.length > 1 && (
                <TouchableOpacity onPress={() => removeMeal(meal._key)}>
                  <Text style={styles.removeText}>✕ Remover</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.mealRow}>
              <View style={{ flex: 2, marginRight: 8 }}>
                <Text style={styles.label}>Nome</Text>
                <TextInput
                  style={styles.input}
                  value={meal.name}
                  onChangeText={(v) => updateMeal(meal._key, "name", v)}
                  placeholder="Ex: Café da manhã"
                  placeholderTextColor={theme.colors.textMuted}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Horário</Text>
                <TextInput
                  style={styles.input}
                  value={meal.time_suggestion}
                  onChangeText={(v) => updateMeal(meal._key, "time_suggestion", v)}
                  placeholder="07:00"
                  placeholderTextColor={theme.colors.textMuted}
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
                      placeholderTextColor={theme.colors.textMuted}
                    />
                  </View>
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
                    <Text style={styles.supplementBtnText}>🏃‍♂️ Herbalife</Text>
                  </TouchableOpacity>
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
                      placeholderTextColor={theme.colors.textMuted}
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
                      placeholderTextColor={theme.colors.textMuted}
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
                      placeholderTextColor={theme.colors.textMuted}
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
                      placeholderTextColor={theme.colors.textMuted}
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
                      placeholderTextColor={theme.colors.textMuted}
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

        <ScienceReferencesModal />

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          <LinearGradient {...GradientSuccess} style={styles.saveBtnGradient}>
            {saving
              ? <ActivityIndicator color="#FFFFFF" />
              : <Text style={styles.saveBtnText}>SALVAR PLANO</Text>
            }
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      <FoodSearchModal
        visible={foodModalMealKey !== null}
        onClose={() => setFoodModalMealKey(null)}
        onSelect={(food) => {
          if (foodModalMealKey) handleFoodSelected(foodModalMealKey, food);
        }}
      />
      <SupplementSearchModal
        visible={supplementModalMealKey !== null}
        onClose={() => setSupplementModalMealKey(null)}
        onSelect={(supplement) => {
          if (supplementModalMealKey) {
            const key = supplementModalMealKey;
            setSupplementModalMealKey(null);
            handleSupplementSelected(key, supplement);
          }
        }}
      />
    </KeyboardAvoidingView>
  );
}

const createStyles = (theme: import("../../contexts/ThemeContext").AppTheme) =>
  StyleSheet.create({
  keyboardAvoid: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32, backgroundColor: theme.colors.background },
  pageTitle: { fontSize: 22, fontWeight: "800", color: theme.colors.textPrimary, marginBottom: 16 },

  orphanText: { fontSize: 15, color: theme.colors.textSecondary, textAlign: "center", lineHeight: 24, marginBottom: 24 },
  backBtn: { backgroundColor: theme.colors.card, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12, borderWidth: 1, borderColor: theme.colors.border },
  backBtnText: { fontWeight: "700", color: theme.colors.textSecondary, fontSize: 14 },

  statusBox: { padding: 12, borderRadius: 10, marginBottom: 16, borderWidth: 1 },
  statusError: { backgroundColor: "rgba(239,68,68,0.1)", borderColor: "#EF4444" },
  statusSuccess: { backgroundColor: "rgba(16,185,129,0.1)", borderColor: "#10B981" },
  statusText: { fontWeight: "bold", fontSize: 14 },
  statusTextError: { color: "#EF4444" },
  statusTextSuccess: { color: "#10B981" },

  card: { backgroundColor: theme.colors.card, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: theme.colors.border },

  label: { fontSize: 11, fontWeight: "800", color: theme.colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  input: { backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 10, padding: 12, fontSize: 15, color: theme.colors.textPrimary, marginBottom: 12 },
  textArea: { height: 80, textAlignVertical: "top" },

  bioCard: { backgroundColor: theme.colors.card, borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: theme.colors.border },
  bioCardTitle: { fontSize: 11, fontWeight: "800", color: theme.colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 },
  bioRow: { flexDirection: "row", justifyContent: "space-between" },
  bioBox: { flex: 1, alignItems: "center", borderTopWidth: 3, paddingTop: 8, marginHorizontal: 3, borderRadius: 8 },
  bioValue: { fontSize: 16, fontWeight: "800" },
  bioUnit: { fontSize: 10, color: theme.colors.textMuted },
  bioLabel: { fontSize: 10, color: theme.colors.textSecondary, fontWeight: "600", marginTop: 2 },

  macroCard: { backgroundColor: theme.colors.card, borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: theme.colors.border },
  macroCardTitle: { fontSize: 11, fontWeight: "800", color: theme.colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 },
  macroRow: { flexDirection: "row", justifyContent: "space-between" },
  macroBox: { flex: 1, alignItems: "center", borderTopWidth: 3, paddingTop: 8, marginHorizontal: 3, borderRadius: 8 },
  macroValue: { fontSize: 16, fontWeight: "800" },
  macroUnit: { fontSize: 10, color: theme.colors.textMuted },
  macroLabel: { fontSize: 10, color: theme.colors.textSecondary, fontWeight: "600", marginTop: 2 },

  macroBarsCard: { backgroundColor: theme.colors.card, borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: theme.colors.border },
  macroBarsTitle: { fontSize: 11, fontWeight: "800", color: theme.colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 },

  mealCard: { backgroundColor: theme.colors.card, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: theme.colors.border },
  mealCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  mealIndex: { fontSize: 15, fontWeight: "800", color: "#10B981" },
  mealRow: { flexDirection: "row" },
  removeText: { color: "#EF4444", fontWeight: "700", fontSize: 13 },

  foodBlock: { backgroundColor: theme.colors.card, borderRadius: 10, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: theme.colors.border },
  foodBlockHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  foodBlockTitle: { fontSize: 12, fontWeight: "800", color: theme.colors.textSecondary, textTransform: "uppercase" },
  foodRow: { flexDirection: "row" },
  foodNameRow: { flexDirection: "row", alignItems: "flex-end", gap: 8 },

  tacoBtn: { backgroundColor: theme.colors.card, borderWidth: 1, borderColor: "#10B981", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 12, marginBottom: 12, justifyContent: "center" },
  tacoBtnText: { color: "#10B981", fontWeight: "800", fontSize: 12 },
  supplementBtn: { backgroundColor: "rgba(245,158,11,0.1)", borderWidth: 1, borderColor: "#F59E0B", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 12, marginBottom: 12, justifyContent: "center" },
  supplementBtnText: { color: "#F59E0B", fontWeight: "800", fontSize: 12 },

  addFoodBtn: { borderWidth: 1, borderColor: "#10B981", borderRadius: 10, padding: 10, alignItems: "center", borderStyle: "dashed" },
  addFoodBtnText: { color: "#10B981", fontWeight: "700", fontSize: 14 },

  addMealBtn: { backgroundColor: theme.colors.card, borderWidth: 1, borderColor: "#10B981", borderRadius: 14, padding: 16, alignItems: "center", marginBottom: 12 },
  addMealBtnText: { color: "#10B981", fontWeight: "800", fontSize: 15 },

  saveBtn: { borderRadius: 14, overflow: "hidden" },
  saveBtnGradient: { padding: 18, alignItems: "center", borderRadius: 14 },
  saveBtnText: { color: "#FFFFFF", fontWeight: "800", fontSize: 16 },
});
