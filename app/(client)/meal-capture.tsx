import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import FoodSearchModal, { SelectedFood } from "../../components/FoodSearchModal";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import { GradientPrimary, GradientSuccess } from "../../utils/gradients";
import { T } from "../../utils/theme";

// ─── Tipos ───────────────────────────────────────────────────
type Step = "capture" | "analyzing" | "review";
type MealType = "Café" | "Almoço" | "Lanche" | "Jantar";

interface AnalysisFood {
  name: string;
  quantity_grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  order_index: number;
}

interface AnalysisResult {
  meal_log_id: string;
  foods: AnalysisFood[];
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  notes: string;
  meal_type: string | null;
}

const MEAL_TYPES: MealType[] = ["Café", "Almoço", "Lanche", "Jantar"];

// ─── Helper: recalcula macros de um alimento proporcionalmente ─
function scaleMacros(food: AnalysisFood, newGrams: number): AnalysisFood {
  if (food.quantity_grams <= 0) return food;
  const ratio = newGrams / food.quantity_grams;
  return {
    ...food,
    quantity_grams: newGrams,
    calories: parseFloat((food.calories * ratio).toFixed(1)),
    protein:  parseFloat((food.protein  * ratio).toFixed(1)),
    carbs:    parseFloat((food.carbs    * ratio).toFixed(1)),
    fat:      parseFloat((food.fat      * ratio).toFixed(1)),
  };
}

// ─── Tela principal ────────────────────────────────────────────
export default function MealCapture() {
  const { session } = useAuth();

  const [step, setStep] = useState<Step>("capture");
  const [mealType, setMealType] = useState<MealType | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);

  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [editableFoods, setEditableFoods] = useState<AnalysisFood[]>([]);
  const [editingName, setEditingName] = useState<{ idx: number; value: string } | null>(null);
  const [editingQty, setEditingQty] = useState<{ idx: number; value: string } | null>(null);

  const [showFoodSearch, setShowFoodSearch] = useState(false);
  const [showMealSelect, setShowMealSelect] = useState(false);
  const [mealPlanMeals, setMealPlanMeals] = useState<{ id: string; name: string }[]>([]);
  const [saving, setSaving] = useState(false);

  const [clientId, setClientId] = useState<string | null>(null);

  // Carrega clientId assim que a sessão está disponível
  useEffect(() => {
    if (!session?.user?.id || clientId) return;
    supabase
      .from("clients")
      .select("id")
      .eq("user_id", session.user.id)
      .single()
      .then(({ data }) => { if (data) setClientId(data.id); });
  }, [session?.user?.id]);

  // Totais calculados em tempo real
  const totals = useMemo(() => {
    return editableFoods.reduce(
      (acc, f) => ({
        calories: parseFloat((acc.calories + f.calories).toFixed(1)),
        protein:  parseFloat((acc.protein  + f.protein ).toFixed(1)),
        carbs:    parseFloat((acc.carbs    + f.carbs   ).toFixed(1)),
        fat:      parseFloat((acc.fat      + f.fat     ).toFixed(1)),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [editableFoods]);

  // ─── Captura ─────────────────────────────────────────────────
  async function handleCamera() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permissão negada", "Permita o acesso à câmera nas configurações.");
      return;
    }

    // Em PWA (Chrome Android), abrir a câmera pausa o contexto da página.
    // O Supabase pode interpretar como inatividade e disparar SIGNED_OUT.
    // Salvamos o token antes e restauramos a sessão ao retornar se necessário.
    const { data: { session: sessionBefore } } = await supabase.auth.getSession();
    const savedAccessToken  = sessionBefore?.access_token ?? null;
    const savedRefreshToken = sessionBefore?.refresh_token ?? null;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: "images",
      quality: 0.3,
      base64: true,
    });

    // Verifica sessão após retorno da câmera
    const { data: { session: sessionAfter } } = await supabase.auth.getSession();
    if (!sessionAfter && savedAccessToken && savedRefreshToken) {
      await supabase.auth.setSession({
        access_token:  savedAccessToken,
        refresh_token: savedRefreshToken,
      });
    }

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setPhotoUri(asset.uri);
      setPhotoBase64(asset.base64 ?? null);
      startAnalysis(asset.base64 ?? null);
    }
  }

  async function handleGallery() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permissão negada", "Permita o acesso às fotos nas configurações.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      quality: 0.3,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setPhotoUri(asset.uri);
      setPhotoBase64(asset.base64 ?? null);
      startAnalysis(asset.base64 ?? null);
    }
  }

  async function startAnalysis(base64: string | null) {
    if (!base64) {
      setStep("capture");
      return;
    }
    if (!clientId) {
      Alert.alert("Erro", "Perfil do aluno não encontrado. Tente novamente.");
      setStep("capture");
      return;
    }

    setStep("analyzing");

    try {
      // Timeout de 30s para não ficar travado indefinidamente
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Tempo esgotado. Tente com uma foto menor.")), 30000)
      );

      // A Edge Function agora retorna SEMPRE status 200 — erros vêm em data.error
      const invokePromise = supabase.functions.invoke("analyze-meal-photo", {
        body: { client_id: clientId, image_base64: base64, meal_type: mealType },
      });

      const { data, error } = await Promise.race([invokePromise, timeoutPromise]) as Awaited<typeof invokePromise>;

      // Erro de transporte (sem rede, DNS, etc.)
      if (error) {
        let msg = "Não foi possível conectar ao servidor. Verifique sua conexão.";
        try {
          const text = await (error as any)?.context?.text?.();
          if (text) { const p = JSON.parse(text); msg = p.error ?? msg; }
        } catch {}
        Alert.alert("Erro na análise", msg);
        setStep("capture");
        return;
      }

      // Todos os erros lógicos chegam aqui como data.error (status 200)
      if (data?.error) {
        Alert.alert("Foto inválida", data.error);
        setStep("capture");
        return;
      }

      if (!data?.meal_log_id) {
        Alert.alert("Erro na análise", "Resposta inesperada do servidor. Tente novamente.");
        setStep("capture");
        return;
      }

      setAnalysisResult(data as AnalysisResult);
      setEditableFoods((data as AnalysisResult).foods.map((f, i) => ({ ...f, order_index: i })));
      setStep("review");
    } catch (err: any) {
      Alert.alert("Erro na análise", err?.message ?? "Erro inesperado. Tente novamente.");
      setStep("capture");
    }
  }

  // ─── Edição de alimentos ─────────────────────────────────────
  function commitNameEdit() {
    if (!editingName) return;
    setEditableFoods((prev) =>
      prev.map((f, i) => (i === editingName.idx ? { ...f, name: editingName.value } : f))
    );
    setEditingName(null);
  }

  function commitQtyEdit() {
    if (!editingQty) return;
    const newGrams = parseFloat(editingQty.value.replace(",", "."));
    if (!isNaN(newGrams) && newGrams > 0) {
      setEditableFoods((prev) =>
        prev.map((f, i) => (i === editingQty.idx ? scaleMacros(f, newGrams) : f))
      );
    }
    setEditingQty(null);
  }

  function removeFood(idx: number) {
    setEditableFoods((prev) => prev.filter((_, i) => i !== idx));
  }

  function addFoodFromSearch(food: SelectedFood) {
    const newFood: AnalysisFood = {
      name:           food.name,
      quantity_grams: parseFloat(food.quantity.replace(/[^0-9.]/g, "")),
      calories:       food.calories,
      protein:        food.protein,
      carbs:          food.carbs,
      fat:            food.fat,
      order_index:    editableFoods.length,
    };
    setEditableFoods((prev) => [...prev, newFood]);
  }

  // ─── Salvar: Registrar hoje ───────────────────────────────────
  async function handleRegisterToday() {
    if (!analysisResult || !clientId) return;
    setSaving(true);
    try {
      // Atualiza os totais e alimentos no registro já salvo pela Edge Function
      const { error: updateErr } = await supabase
        .from("meal_log")
        .update({
          total_calories: parseFloat(totals.calories.toFixed(1)),
          total_protein:  parseFloat(totals.protein.toFixed(1)),
          total_carbs:    parseFloat(totals.carbs.toFixed(1)),
          total_fat:      parseFloat(totals.fat.toFixed(1)),
          meal_type:      mealType ?? analysisResult.meal_type,
        })
        .eq("id", analysisResult.meal_log_id);

      if (updateErr) throw updateErr;

      // Substitui os alimentos com a versão editada
      await supabase.from("meal_log_foods").delete().eq("meal_log_id", analysisResult.meal_log_id);
      if (editableFoods.length > 0) {
        const rows = editableFoods.map((f, i) => ({
          meal_log_id:   analysisResult.meal_log_id,
          name:          f.name,
          quantity_grams: parseFloat(f.quantity_grams.toFixed(1)),
          calories:       parseFloat(f.calories.toFixed(1)),
          protein:        parseFloat(f.protein.toFixed(1)),
          carbs:          parseFloat(f.carbs.toFixed(1)),
          fat:            parseFloat(f.fat.toFixed(1)),
          order_index:    i,
        }));
        const { error: foodsErr } = await supabase.from("meal_log_foods").insert(rows);
        if (foodsErr) throw foodsErr;
      }

      Alert.alert("Refeição registrada!", "Refeição salva com sucesso.", [
        { text: "OK", onPress: () => router.replace("/(client)/diet") },
      ]);
    } catch (err: any) {
      Alert.alert("Erro", err.message ?? "Não foi possível registrar a refeição.");
    } finally {
      setSaving(false);
    }
  }

  // ─── Salvar: Adicionar ao plano ────────────────────────────────
  async function handleAddToPlan() {
    if (!clientId) return;
    setSaving(true);
    try {
      const { data: plan } = await supabase
        .from("meal_plans")
        .select("id, meal_plan_meals(id, name, order_index)")
        .eq("client_id", clientId)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!plan || !plan.meal_plan_meals?.length) {
        Alert.alert("Sem plano", "Nenhum plano alimentar ativo encontrado.");
        setSaving(false);
        return;
      }

      const meals = [...plan.meal_plan_meals].sort((a: any, b: any) => a.order_index - b.order_index);
      setMealPlanMeals(meals);
      setShowMealSelect(true);
    } catch (err: any) {
      Alert.alert("Erro", err.message ?? "Não foi possível carregar o plano.");
    } finally {
      setSaving(false);
    }
  }

  async function handleMealSelected(mealId: string) {
    setShowMealSelect(false);
    setSaving(true);
    try {
      // Busca o maior order_index atual nessa refeição
      const { data: existing } = await supabase
        .from("meal_plan_foods")
        .select("order_index")
        .eq("meal_id", mealId)
        .order("order_index", { ascending: false })
        .limit(1);

      const startIndex = existing && existing.length > 0 ? existing[0].order_index + 1 : 0;

      const rows = editableFoods.map((f, i) => ({
        meal_id:    mealId,
        name:       f.name,
        quantity:   `${parseFloat(f.quantity_grams.toFixed(1))}g`,
        calories:   parseFloat(f.calories.toFixed(1)),
        protein:    parseFloat(f.protein.toFixed(1)),
        carbs:      parseFloat(f.carbs.toFixed(1)),
        fat:        parseFloat(f.fat.toFixed(1)),
        order_index: startIndex + i,
      }));

      const { error } = await supabase.from("meal_plan_foods").insert(rows);
      if (error) throw error;

      // Atualiza meal_log também com os dados editados
      if (analysisResult) {
        await supabase
          .from("meal_log")
          .update({
            total_calories: parseFloat(totals.calories.toFixed(1)),
            total_protein:  parseFloat(totals.protein.toFixed(1)),
            total_carbs:    parseFloat(totals.carbs.toFixed(1)),
            total_fat:      parseFloat(totals.fat.toFixed(1)),
            meal_type:      mealType ?? analysisResult.meal_type,
          })
          .eq("id", analysisResult.meal_log_id);
      }

      Alert.alert("Adicionado ao plano!", "Alimentos adicionados com sucesso.", [
        { text: "OK", onPress: () => router.replace("/(client)/diet") },
      ]);
    } catch (err: any) {
      Alert.alert("Erro", err.message ?? "Não foi possível adicionar ao plano.");
    } finally {
      setSaving(false);
    }
  }

  // ─── Renders ─────────────────────────────────────────────────
  function renderCapture() {
    return (
      <View style={styles.captureContainer}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>✕ Cancelar</Text>
        </TouchableOpacity>

        <Text style={styles.captureTitle}>Analisar Refeição</Text>
        <Text style={styles.captureSub}>Tire uma foto ou escolha da galeria para analisar os macros com IA.</Text>

        <Text style={styles.mealTypeLabel}>Tipo de refeição (opcional)</Text>
        <View style={styles.mealTypeRow}>
          {MEAL_TYPES.map((mt) => (
            <TouchableOpacity
              key={mt}
              style={[styles.mealTypeChip, mealType === mt && styles.mealTypeChipActive]}
              onPress={() => setMealType(mealType === mt ? null : mt)}
            >
              <Text style={[styles.mealTypeText, mealType === mt && styles.mealTypeTextActive]}>{mt}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.captureBtn} onPress={handleCamera}>
          <LinearGradient {...GradientSuccess} style={styles.captureBtnGradient}>
            <Text style={styles.captureBtnIcon}>📷</Text>
            <Text style={styles.captureBtnText}>Tirar Foto</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.captureBtn} onPress={handleGallery}>
          <LinearGradient {...GradientPrimary} style={styles.captureBtnGradient}>
            <Text style={styles.captureBtnIcon}>🖼️</Text>
            <Text style={styles.captureBtnText}>Escolher da Galeria</Text>
          </LinearGradient>
        </TouchableOpacity>

      </View>
    );
  }

  function renderAnalyzing() {
    return (
      <View style={styles.analyzingContainer}>
        {photoUri && (
          <Image source={{ uri: photoUri }} style={styles.analyzeThumb} resizeMode="cover" />
        )}
        <ActivityIndicator size="large" color={T.green} style={{ marginTop: 32 }} />
        <Text style={styles.analyzingText}>Analisando sua refeição...</Text>
        <Text style={styles.analyzingSub}>Isso pode levar alguns segundos</Text>
      </View>
    );
  }

  function renderReview() {
    if (!analysisResult) return null;
    return (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 160 }}>
        {/* Header: thumbnail + totais */}
        <View style={styles.reviewHeader}>
          {photoUri && (
            <Image source={{ uri: photoUri }} style={styles.reviewThumb} resizeMode="cover" />
          )}
          <LinearGradient {...GradientSuccess} style={styles.totalsCard}>
            <Text style={styles.totalsTitle}>ESTA REFEIÇÃO</Text>
            <View style={styles.totalsRow}>
              {[
                { label: "Calorias", value: totals.calories, unit: "kcal", color: T.white },
                { label: "Proteína", value: totals.protein,  unit: "g",    color: T.white },
                { label: "Carbs",    value: totals.carbs,    unit: "g",    color: T.white },
                { label: "Gordura",  value: totals.fat,      unit: "g",    color: T.white },
              ].map((m) => (
                <View key={m.label} style={styles.totalChip}>
                  <Text style={styles.totalChipValue}>{Number(m.value).toFixed(1)}</Text>
                  <Text style={styles.totalChipUnit}>{m.unit}</Text>
                  <Text style={styles.totalChipLabel}>{m.label}</Text>
                </View>
              ))}
            </View>
          </LinearGradient>
        </View>

        {/* Lista de alimentos editável */}
        <Text style={styles.sectionLabel}>Alimentos identificados</Text>
        {editableFoods.map((food, idx) => (
          <View key={idx} style={styles.foodCard}>
            <View style={styles.foodCardHeader}>
              {editingName?.idx === idx ? (
                <TextInput
                  style={styles.foodNameInput}
                  value={editingName.value}
                  onChangeText={(v) => setEditingName({ idx, value: v })}
                  onBlur={commitNameEdit}
                  onSubmitEditing={commitNameEdit}
                  autoFocus
                />
              ) : (
                <TouchableOpacity style={{ flex: 1 }} onPress={() => setEditingName({ idx, value: food.name })}>
                  <Text style={styles.foodName}>{food.name}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.removeBtn} onPress={() => removeFood(idx)}>
                <Text style={styles.removeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.foodQtyRow}>
              <Text style={styles.foodQtyLabel}>Quantidade: </Text>
              {editingQty?.idx === idx ? (
                <TextInput
                  style={styles.foodQtyInput}
                  value={editingQty.value}
                  onChangeText={(v) => setEditingQty({ idx, value: v })}
                  onBlur={commitQtyEdit}
                  onSubmitEditing={commitQtyEdit}
                  keyboardType="decimal-pad"
                  autoFocus
                />
              ) : (
                <TouchableOpacity onPress={() => setEditingQty({ idx, value: String(food.quantity_grams) })}>
                  <Text style={styles.foodQtyValue}>{food.quantity_grams}g</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.foodMacrosRow}>
              {[
                { label: "kcal", value: food.calories, color: T.green },
                { label: "P",    value: food.protein,  color: T.blue },
                { label: "C",    value: food.carbs,    color: T.orange },
                { label: "G",    value: food.fat,      color: T.red },
              ].map((m) => (
                <View key={m.label} style={styles.foodMacroChip}>
                  <Text style={[styles.foodMacroValue, { color: m.color }]}>{Number(m.value).toFixed(1)}</Text>
                  <Text style={styles.foodMacroLabel}>{m.label}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.addFoodBtn} onPress={() => setShowFoodSearch(true)}>
          <Text style={styles.addFoodBtnText}>+ Adicionar alimento manualmente</Text>
        </TouchableOpacity>

        {analysisResult.notes ? (
          <Text style={styles.notesText}>💡 {analysisResult.notes}</Text>
        ) : null}

        {/* Botões de ação no rodapé */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, saving && { opacity: 0.5 }]}
            onPress={handleRegisterToday}
            disabled={saving}
          >
            <LinearGradient {...GradientSuccess} style={styles.actionBtnGradient}>
              {saving
                ? <ActivityIndicator color={T.white} />
                : <Text style={styles.actionBtnText}>📅 Registrar hoje</Text>
              }
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, saving && { opacity: 0.5 }]}
            onPress={handleAddToPlan}
            disabled={saving}
          >
            <LinearGradient {...GradientPrimary} style={styles.actionBtnGradient}>
              {saving
                ? <ActivityIndicator color={T.white} />
                : <Text style={styles.actionBtnText}>➕ Adicionar ao plano</Text>
              }
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      {step === "capture"   && renderCapture()}
      {step === "analyzing" && renderAnalyzing()}
      {step === "review"    && renderReview()}

      <FoodSearchModal
        visible={showFoodSearch}
        onClose={() => setShowFoodSearch(false)}
        onSelect={addFoodFromSearch}
      />

      {/* Modal de seleção de refeição do plano */}
      <Modal visible={showMealSelect} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Adicionar em qual refeição?</Text>
            <FlatList
              data={mealPlanMeals}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.mealSelectRow}
                  onPress={() => handleMealSelected(item.id)}
                >
                  <Text style={styles.mealSelectText}>{item.name}</Text>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: T.border }} />}
            />
            <Pressable style={styles.modalCancelBtn} onPress={() => setShowMealSelect(false)}>
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },

  // Capture
  captureContainer: { flex: 1, padding: 24, justifyContent: "center" },
  backBtn: { position: "absolute", top: 52, right: 20 },
  backBtnText: { color: T.t3, fontWeight: "700", fontSize: 14 },
  captureTitle: { fontSize: 28, fontWeight: "800", color: T.t1, marginBottom: 8 },
  captureSub: { fontSize: 14, color: T.t3, marginBottom: 28, lineHeight: 20 },
  mealTypeLabel: { fontSize: 11, fontWeight: "800", color: T.t3, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 },
  mealTypeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 28 },
  mealTypeChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: T.border, backgroundColor: T.surface },
  mealTypeChipActive: { backgroundColor: T.green, borderColor: T.green },
  mealTypeText: { color: T.t2, fontWeight: "600", fontSize: 14 },
  mealTypeTextActive: { color: T.white },
  captureBtn: { borderRadius: 16, overflow: "hidden", marginBottom: 14 },
  captureBtnGradient: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 18, borderRadius: 16, gap: 10 },
  captureBtnIcon: { fontSize: 28 },
  captureBtnText: { color: T.white, fontWeight: "800", fontSize: 18 },

  // Analyzing
  analyzingContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  analyzeThumb: { width: 120, height: 120, borderRadius: 16, marginBottom: 8 },
  analyzingText: { marginTop: 20, fontSize: 18, fontWeight: "700", color: T.t1, textAlign: "center" },
  analyzingSub: { marginTop: 8, fontSize: 13, color: T.t3, textAlign: "center" },

  // Review
  reviewHeader: { padding: 16, gap: 12 },
  reviewThumb: { width: 80, height: 80, borderRadius: 12, alignSelf: "flex-start" },
  totalsCard: { borderRadius: 16, padding: 16 },
  totalsTitle: { fontSize: 11, fontWeight: "800", color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 },
  totalsRow: { flexDirection: "row", justifyContent: "space-between" },
  totalChip: { flex: 1, alignItems: "center" },
  totalChipValue: { fontSize: 20, fontWeight: "800", color: T.white },
  totalChipUnit: { fontSize: 11, color: "rgba(255,255,255,0.7)" },
  totalChipLabel: { fontSize: 11, color: "rgba(255,255,255,0.8)", fontWeight: "600", marginTop: 2 },

  sectionLabel: { fontSize: 11, fontWeight: "800", color: T.t3, textTransform: "uppercase", letterSpacing: 0.5, paddingHorizontal: 16, marginBottom: 8 },

  foodCard: { backgroundColor: T.card, borderRadius: 14, padding: 14, marginHorizontal: 16, marginBottom: 10, borderWidth: 1, borderColor: T.border },
  foodCardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  foodName: { fontSize: 15, fontWeight: "700", color: T.t1, flex: 1 },
  foodNameInput: { flex: 1, fontSize: 15, fontWeight: "700", color: T.t1, borderBottomWidth: 1, borderBottomColor: T.blue, paddingVertical: 2 },
  removeBtn: { paddingLeft: 12 },
  removeBtnText: { color: T.red, fontSize: 16, fontWeight: "700" },
  foodQtyRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  foodQtyLabel: { fontSize: 12, color: T.t3 },
  foodQtyValue: { fontSize: 13, fontWeight: "700", color: T.blue, textDecorationLine: "underline" },
  foodQtyInput: { fontSize: 14, fontWeight: "700", color: T.blue, borderBottomWidth: 1, borderBottomColor: T.blue, minWidth: 60, paddingVertical: 0 },
  foodMacrosRow: { flexDirection: "row", gap: 6 },
  foodMacroChip: { flex: 1, alignItems: "center", backgroundColor: T.surfaceAlt, borderRadius: 8, paddingVertical: 6 },
  foodMacroValue: { fontSize: 14, fontWeight: "800" },
  foodMacroLabel: { fontSize: 10, color: T.t3 },

  addFoodBtn: { marginHorizontal: 16, marginTop: 4, marginBottom: 12, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: T.blue, alignItems: "center" },
  addFoodBtnText: { color: T.blue, fontWeight: "700", fontSize: 14 },

  notesText: { fontSize: 12, color: T.t3, fontStyle: "italic", paddingHorizontal: 16, marginBottom: 16, lineHeight: 18 },

  actionRow: { flexDirection: "row", gap: 10, paddingHorizontal: 16, marginTop: 8 },
  actionBtn: { flex: 1, borderRadius: 14, overflow: "hidden" },
  actionBtnGradient: { paddingVertical: 16, alignItems: "center", borderRadius: 14 },
  actionBtnText: { color: T.white, fontWeight: "800", fontSize: 14 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  modalBox: { backgroundColor: T.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: "60%" },
  modalTitle: { fontSize: 18, fontWeight: "800", color: T.t1, marginBottom: 16 },
  mealSelectRow: { paddingVertical: 16 },
  mealSelectText: { fontSize: 16, fontWeight: "600", color: T.t1 },
  modalCancelBtn: { marginTop: 16, padding: 14, alignItems: "center", backgroundColor: T.surfaceAlt, borderRadius: 12 },
  modalCancelText: { fontWeight: "700", color: T.t2, fontSize: 15 },
});
