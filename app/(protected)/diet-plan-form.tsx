import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
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
import { useTrainer } from "../../hooks/useTrainer";
import { supabase } from "../../lib/supabase";

// ------------------------------------------------------------
// Tipos locais
// ------------------------------------------------------------
interface FoodEntry {
  _key: string;       // chave local temporária
  id?: string;        // uuid do banco (apenas em edição)
  food_id?: string;   // FK foods (preenchido pela FoodSearchModal na Fase 9)
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

  const [loading, setLoading]   = useState(isEditing);
  const [saving, setSaving]     = useState(false);
  const [statusMsg, setStatusMsg] = useState({ text: "", type: "" });

  // Controle do FoodSearchModal
  const [foodModalMealKey, setFoodModalMealKey] = useState<string | null>(null);

  const [clientName, setClientName] = useState("");
  const [planTitle, setPlanTitle]   = useState("Plano Alimentar");
  const [planNotes, setPlanNotes]   = useState("");
  const [meals, setMeals]           = useState<MealEntry[]>([emptyMeal()]);

  // Carrega plano existente para edição
  useEffect(() => {
    if (!isEditing) return;
    loadPlan();
  }, [planId]);

  // Carrega nome do cliente
  useEffect(() => {
    if (!clientId) return;
    supabase
      .from("clients")
      .select("name")
      .eq("id", clientId)
      .single()
      .then(({ data }) => { if (data) setClientName(data.name); });
  }, [clientId]);

  async function loadPlan() {
    const { data, error } = await supabase
      .from("meal_plans")
      .select(`
        id, title, notes,
        meal_plan_meals (
          id, name, time_suggestion, order_index,
          meal_plan_foods (
            id, food_id, name, quantity, calories, protein, carbs, fat, order_index
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

  function toNum(val: string): number | null {
    const n = parseFloat(val.replace(",", "."));
    return isNaN(n) ? null : parseFloat(n.toFixed(1));
  }

  // ------------------------------------------------------------
  // Salvar
  // ------------------------------------------------------------
  async function handleSave() {
    if (!planTitle.trim()) {
      setStatusMsg({ text: "Informe um título para o plano.", type: "error" });
      return;
    }
    if (!trainerId) {
      setStatusMsg({ text: "Perfil de treinador não carregado.", type: "error" });
      return;
    }

    try {
      setSaving(true);
      setStatusMsg({ text: "", type: "" });

      // 1. Upsert meal_plan
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
        if (error || !data) throw error;
        currentPlanId = data.id;
      }

      // 2. Em edição: remove refeições antigas e recria (mais simples que diff)
      if (isEditing) {
        await supabase.from("meal_plan_meals").delete().eq("meal_plan_id", currentPlanId);
      }

      // 3. Insere refeições e alimentos
      for (let mi = 0; mi < meals.length; mi++) {
        const meal = meals[mi];
        if (!meal.name.trim()) continue;

        const { data: mealData, error: mealErr } = await supabase
          .from("meal_plan_meals")
          .insert({
            meal_plan_id:    currentPlanId,
            name:            meal.name.trim(),
            time_suggestion: meal.time_suggestion.trim() || null,
            order_index:     mi,
          })
          .select("id")
          .single();

        if (mealErr || !mealData) throw mealErr;

        const validFoods = meal.foods.filter((f) => f.name.trim());
        if (validFoods.length === 0) continue;

        const foodRows = validFoods.map((f, fi) => ({
          meal_id:     mealData.id,
          food_id:     f.food_id || null,
          name:        f.name.trim(),
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
      setTimeout(() => router.back(), 1200);
    } catch (err: any) {
      setStatusMsg({ text: err?.message || "Erro ao salvar o plano.", type: "error" });
    } finally {
      setSaving(false);
    }
  }

  // ------------------------------------------------------------
  // Render
  // ------------------------------------------------------------
  if (loading || loadingTrainer) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#f9fafb" }}
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
          />
          <Text style={styles.label}>Notas Gerais</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={planNotes}
            onChangeText={setPlanNotes}
            placeholder="Orientações gerais, horários, hidratação..."
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
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Horário</Text>
                <TextInput
                  style={styles.input}
                  value={meal.time_suggestion}
                  onChangeText={(v) => updateMeal(meal._key, "time_suggestion", v)}
                  placeholder="07:00"
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
                    />
                  </View>
                  <TouchableOpacity
                    style={styles.tacoBtn}
                    onPress={() => setFoodModalMealKey(meal._key)}
                  >
                    <Text style={styles.tacoBtnText}>🔍 TACO</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.foodRow}>
                  <View style={{ flex: 1, marginRight: 6 }}>
                    <Text style={styles.label}>Quantidade</Text>
                    <TextInput
                      style={styles.input}
                      value={food.quantity}
                      onChangeText={(v) => updateFood(meal._key, food._key, "quantity", v)}
                      placeholder="Ex: 100g"
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

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.saveBtnText}>SALVAR PLANO</Text>
          }
        </TouchableOpacity>
      </ScrollView>

      {/* Modal de busca TACO — abre por refeição */}
      <FoodSearchModal
        visible={foodModalMealKey !== null}
        onClose={() => setFoodModalMealKey(null)}
        onSelect={(food) => {
          if (foodModalMealKey) handleFoodSelected(foodModalMealKey, food);
        }}
      />
    </KeyboardAvoidingView>
  );
}

// ------------------------------------------------------------
// Estilos
// ------------------------------------------------------------
const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  pageTitle: { fontSize: 22, fontWeight: "800", color: "#111827", marginBottom: 16 },

  statusBox: { padding: 12, borderRadius: 10, marginBottom: 16, borderWidth: 1 },
  statusError: { backgroundColor: "#fef2f2", borderColor: "#fecaca" },
  statusSuccess: { backgroundColor: "#f0fdf4", borderColor: "#bbf7d0" },
  statusText: { fontWeight: "bold", fontSize: 14 },
  statusTextError: { color: "#dc2626" },
  statusTextSuccess: { color: "#16a34a" },

  card: { backgroundColor: "#fff", borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#e5e7eb" },

  label: { fontSize: 11, fontWeight: "800", color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  input: { backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#d1d5db", borderRadius: 10, padding: 12, fontSize: 15, color: "#111827", marginBottom: 12 },
  textArea: { height: 80, textAlignVertical: "top" },

  mealCard: { backgroundColor: "#fff", borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#d1d5db" },
  mealCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  mealIndex: { fontSize: 15, fontWeight: "800", color: "#059669" },
  mealRow: { flexDirection: "row" },
  removeText: { color: "#dc2626", fontWeight: "700", fontSize: 13 },

  foodBlock: { backgroundColor: "#f9fafb", borderRadius: 10, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: "#e5e7eb" },
  foodBlockHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  foodBlockTitle: { fontSize: 12, fontWeight: "800", color: "#374151", textTransform: "uppercase" },
  foodRow: { flexDirection: "row" },

  foodNameRow: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  tacoBtn: { backgroundColor: "#f0fdf4", borderWidth: 1, borderColor: "#059669", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 12, marginBottom: 12, justifyContent: "center" },
  tacoBtnText: { color: "#059669", fontWeight: "800", fontSize: 12 },
  addFoodBtn: { borderWidth: 1, borderColor: "#059669", borderRadius: 10, padding: 10, alignItems: "center", borderStyle: "dashed" },
  addFoodBtnText: { color: "#059669", fontWeight: "700", fontSize: 14 },

  addMealBtn: { backgroundColor: "#f0fdf4", borderWidth: 1, borderColor: "#059669", borderRadius: 14, padding: 16, alignItems: "center", marginBottom: 12 },
  addMealBtnText: { color: "#059669", fontWeight: "800", fontSize: 15 },

  saveBtn: { backgroundColor: "#059669", padding: 18, borderRadius: 14, alignItems: "center", elevation: 3, shadowColor: "#059669", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
  saveBtnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
});
