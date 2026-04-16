import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../lib/supabase";
import { T } from "../utils/theme";

// ------------------------------------------------------------
// Tipos
// ------------------------------------------------------------
interface TacoFood {
  id: string;
  name: string;
  energy_kcal: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
}

export interface SelectedFood {
  food_id: string;
  name: string;
  quantity: string;    // ex: "150g"
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface FoodSearchModalProps {
  visible: boolean;
  onClose: () => void;
  /** Chamado quando o treinador confirma a seleção com quantidade */
  onSelect: (food: SelectedFood) => void;
}

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------
function scale(base: number | null, grams: number): number {
  if (base == null) return 0;
  return parseFloat(((base * grams) / 100).toFixed(1));
}

// ------------------------------------------------------------
// Componente
// ------------------------------------------------------------
export default function FoodSearchModal({ visible, onClose, onSelect }: FoodSearchModalProps) {
  const [query, setQuery]           = useState("");
  const [results, setResults]       = useState<TacoFood[]>([]);
  const [searching, setSearching]   = useState(false);
  const [selected, setSelected]     = useState<TacoFood | null>(null);
  const [grams, setGrams]           = useState("100");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Limpa ao fechar
  useEffect(() => {
    if (!visible) {
      setQuery("");
      setResults([]);
      setSelected(null);
      setGrams("100");
    }
  }, [visible]);

  // Busca com debounce de 350 ms
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(() => search(query.trim()), 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  async function search(term: string) {
    setSearching(true);
    try {
      const { data, error } = await supabase
        .from("foods")
        .select("id, name, energy_kcal, protein, carbs, fat")
        .ilike("name", `%${term}%`)
        .order("name")
        .limit(30);

      if (!error && data) setResults(data as TacoFood[]);
    } finally {
      setSearching(false);
    }
  }

  function handleSelectFood(food: TacoFood) {
    setSelected(food);
    setGrams("100");
  }

  function handleConfirm() {
    if (!selected) return;
    const g = parseFloat(grams.replace(",", "."));
    if (isNaN(g) || g <= 0) return;

    onSelect({
      food_id:  selected.id,
      name:     selected.name,
      quantity: `${g}g`,
      calories: scale(selected.energy_kcal, g),
      protein:  scale(selected.protein, g),
      carbs:    scale(selected.carbs, g),
      fat:      scale(selected.fat, g),
    });
    onClose();
  }

  // Macros preview proporcional
  const g       = parseFloat(grams.replace(",", ".")) || 0;
  const preview = selected
    ? {
        calories: scale(selected.energy_kcal, g),
        protein:  scale(selected.protein, g),
        carbs:    scale(selected.carbs, g),
        fat:      scale(selected.fat, g),
      }
    : null;

  // ------------------------------------------------------------
  // Render — Tela de busca
  // ------------------------------------------------------------
  function renderSearch() {
    return (
      <>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar alimento (ex: arroz, frango...)"
            placeholderTextColor={T.t3}
            value={query}
            onChangeText={setQuery}
            autoFocus
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {searching && <ActivityIndicator style={{ marginLeft: 8 }} color={T.green} />}
        </View>

        {results.length === 0 && query.length >= 2 && !searching && (
          <Text style={styles.noResults}>Nenhum alimento encontrado para "{query}".</Text>
        )}

        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.resultRow}
              onPress={() => handleSelectFood(item)}
              activeOpacity={0.7}
            >
              <Text style={styles.resultName}>{item.name}</Text>
              <Text style={styles.resultMeta}>
                {item.energy_kcal != null ? `${item.energy_kcal} kcal` : "—"} · 100g
              </Text>
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      </>
    );
  }

  // ------------------------------------------------------------
  // Render — Tela de quantidade
  // ------------------------------------------------------------
  function renderQuantity() {
    if (!selected) return null;
    return (
      <View style={{ flex: 1 }}>
        <TouchableOpacity style={styles.backBtn} onPress={() => setSelected(null)}>
          <Text style={styles.backBtnText}>← Voltar</Text>
        </TouchableOpacity>

        <Text style={styles.selectedName}>{selected.name}</Text>
        <Text style={styles.selectedMeta}>
          Valores nutricionais por 100g: {selected.energy_kcal ?? "—"} kcal ·
          P {selected.protein ?? "—"}g · C {selected.carbs ?? "—"}g · G {selected.fat ?? "—"}g
        </Text>

        <Text style={styles.qtyLabel}>Quantidade (g)</Text>
        <TextInput
          style={styles.qtyInput}
          value={grams}
          onChangeText={setGrams}
          keyboardType="decimal-pad"
          placeholder="100"
          placeholderTextColor={T.t3}
          selectTextOnFocus
        />

        {/* Preview proporcional */}
        {preview && g > 0 && (
          <View style={styles.previewCard}>
            <Text style={styles.previewTitle}>Macros para {g}g</Text>
            <View style={styles.previewRow}>
              <PreviewChip label="kcal"  value={preview.calories} color={T.green} />
              <PreviewChip label="Prot." value={preview.protein}  color={T.blue} />
              <PreviewChip label="Carbs" value={preview.carbs}    color={T.orange} />
              <PreviewChip label="Gord." value={preview.fat}      color={T.red} />
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[styles.confirmBtn, (!g || g <= 0) && { opacity: 0.4 }]}
          onPress={handleConfirm}
          disabled={!g || g <= 0}
        >
          <Text style={styles.confirmBtnText}>ADICIONAR AO PLANO</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ------------------------------------------------------------
  // Modal
  // ------------------------------------------------------------
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {selected ? "Quantidade" : "Buscar Alimento (TACO)"}
            </Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          {selected ? renderQuantity() : renderSearch()}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ------------------------------------------------------------
// Sub-componente interno
// ------------------------------------------------------------
function PreviewChip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={[styles.previewChip, { borderColor: color }]}>
      <Text style={[styles.previewChipValue, { color }]}>{value}</Text>
      <Text style={styles.previewChipLabel}>{label}</Text>
    </View>
  );
}

// ------------------------------------------------------------
// Estilos
// ------------------------------------------------------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg, padding: 16 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  headerTitle: { fontSize: 18, fontWeight: "800", color: T.t1 },
  closeBtn: { fontSize: 20, color: T.t3, fontWeight: "700" },

  // Busca
  searchRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  searchInput: {
    flex: 1,
    backgroundColor: T.surface,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: T.t1,
  },
  noResults: { color: T.t3, textAlign: "center", marginTop: 24, fontSize: 14 },
  resultRow: { paddingVertical: 14, paddingHorizontal: 4 },
  resultName: { fontSize: 15, color: T.t1, fontWeight: "600", marginBottom: 2 },
  resultMeta: { fontSize: 12, color: T.t2 },
  separator: { height: 1, backgroundColor: T.border },

  // Quantidade
  backBtn: { marginBottom: 16 },
  backBtnText: { color: T.green, fontWeight: "700", fontSize: 14 },
  selectedName: { fontSize: 20, fontWeight: "800", color: T.t1, marginBottom: 6 },
  selectedMeta: { fontSize: 12, color: T.t2, marginBottom: 20, lineHeight: 18 },
  qtyLabel: { fontSize: 11, fontWeight: "800", color: T.t3, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 },
  qtyInput: {
    backgroundColor: T.surface,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 22,
    fontWeight: "800",
    color: T.t1,
    marginBottom: 16,
    textAlign: "center",
  },

  // Preview
  previewCard: {
    backgroundColor: T.surfaceAlt,
    borderRadius: 14,
    padding: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: T.greenGlow,
  },
  previewTitle: { fontSize: 12, fontWeight: "800", color: T.green, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 },
  previewRow: { flexDirection: "row", justifyContent: "space-between" },
  previewChip: {
    flex: 1,
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    padding: 8,
    marginHorizontal: 2,
    backgroundColor: T.surface,
  },
  previewChipValue: { fontSize: 16, fontWeight: "800" },
  previewChipLabel: { fontSize: 10, color: T.t3 },

  // Confirmar
  confirmBtn: {
    backgroundColor: T.green,
    padding: 18,
    borderRadius: 14,
    alignItems: "center",
    elevation: 3,
    shadowColor: T.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  confirmBtnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
});
