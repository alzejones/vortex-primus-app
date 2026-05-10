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

interface Supplement {
  id: string;
  name: string;
  brand: string;
  sku: string | null;
  serving_size_g: number;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  fiber_g: number | null;
  notes: string | null;
}

export interface SelectedSupplement {
  supplement_id: string;
  name: string;
  quantity: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface SupplementSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (item: SelectedSupplement) => void;
}

// Converte valor por porção para qualquer quantidade em gramas
function scaleFromServing(
  valuePerServing: number | null,
  servingSize: number,
  targetGrams: number
): number {
  if (valuePerServing == null || servingSize <= 0) return 0;
  return parseFloat(((valuePerServing / servingSize) * targetGrams).toFixed(1));
}

export default function SupplementSearchModal({ visible, onClose, onSelect }: SupplementSearchModalProps) {
  const [query, setQuery]         = useState("");
  const [results, setResults]     = useState<Supplement[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected]   = useState<Supplement | null>(null);
  const [grams, setGrams]         = useState("100");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!visible) {
      setQuery("");
      setResults([]);
      setSelected(null);
      setGrams("100");
    }
  }, [visible]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(() => search(query.trim()), 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  async function search(term: string) {
    setSearching(true);
    try {
      const { data, error } = await supabase
        .from("supplements")
        .select("id, name, brand, sku, serving_size_g, calories, protein_g, carbs_g, fat_g, fiber_g, notes")
        .ilike("name", `%${term}%`)
        .order("name")
        .limit(30);
      if (!error && data) setResults(data as Supplement[]);
    } finally {
      setSearching(false);
    }
  }

  function handleSelectSupplement(item: Supplement) {
    setSelected(item);
    setGrams(String(item.serving_size_g));
  }

  function handleConfirm() {
    if (!selected) return;
    const g = parseFloat(grams.replace(",", "."));
    if (isNaN(g) || g <= 0) return;

    onSelect({
      supplement_id: selected.id,
      name:          selected.name,
      quantity:      `${g}g`,
      calories:      scaleFromServing(selected.calories, selected.serving_size_g, g),
      protein:       scaleFromServing(selected.protein_g, selected.serving_size_g, g),
      carbs:         scaleFromServing(selected.carbs_g, selected.serving_size_g, g),
      fat:           scaleFromServing(selected.fat_g, selected.serving_size_g, g),
    });
    onClose();
  }

  const g = parseFloat(grams.replace(",", ".")) || 0;
  const preview = selected
    ? {
        calories: scaleFromServing(selected.calories, selected.serving_size_g, g),
        protein:  scaleFromServing(selected.protein_g, selected.serving_size_g, g),
        carbs:    scaleFromServing(selected.carbs_g, selected.serving_size_g, g),
        fat:      scaleFromServing(selected.fat_g, selected.serving_size_g, g),
      }
    : null;

  function renderSearch() {
    return (
      <>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar suplemento (ex: Shake, Whey...)"
            placeholderTextColor={T.t3}
            value={query}
            onChangeText={setQuery}
            autoFocus
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {searching && <ActivityIndicator style={{ marginLeft: 8 }} color={T.orange} />}
        </View>

        {results.length === 0 && query.length >= 2 && !searching && (
          <Text style={styles.noResults}>Nenhum suplemento encontrado para "{query}".</Text>
        )}

        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.resultRow}
              onPress={() => handleSelectSupplement(item)}
              activeOpacity={0.7}
            >
              <View style={styles.resultHeader}>
                <Text style={styles.resultName}>{item.name}</Text>
                <View style={styles.brandBadge}>
                  <Text style={styles.brandBadgeText}>{item.brand}</Text>
                </View>
              </View>
              <Text style={styles.resultMeta}>
                {item.calories != null ? `${item.calories} kcal` : "—"} · porção {item.serving_size_g}g
                {item.notes ? `  ·  ${item.notes}` : ""}
              </Text>
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      </>
    );
  }

  function renderQuantity() {
    if (!selected) return null;
    return (
      <View style={{ flex: 1 }}>
        <TouchableOpacity style={styles.backBtn} onPress={() => setSelected(null)}>
          <Text style={styles.backBtnText}>← Voltar</Text>
        </TouchableOpacity>

        <Text style={styles.selectedName}>{selected.name}</Text>
        <View style={styles.servingInfo}>
          <Text style={styles.servingText}>
            Porção padrão: {selected.serving_size_g}g
          </Text>
        </View>
        {/* Card MACROS POR PORÇÃO */}
        <View style={styles.macroCard}>
          <Text style={styles.macroCardTitle}>MACROS POR PORÇÃO ({selected.serving_size_g}G)</Text>
          <View style={styles.macroRow}>
            <MacroChip label="kcal"  value={(selected.calories ?? 0).toFixed(1)}  color={T.green} />
            <MacroChip label="Prot." value={(selected.protein_g ?? 0).toFixed(1)} color={"#3B82F6"} />
            <MacroChip label="Carbs" value={(selected.carbs_g ?? 0).toFixed(1)}   color={T.orange} />
            <MacroChip label="Gord." value={(selected.fat_g ?? 0).toFixed(1)}     color={T.red} />
          </View>
        </View>

        {/* Card POR 100G */}
        <View style={styles.macroCard}>
          <Text style={styles.macroCardTitle}>POR 100G</Text>
          <View style={styles.macroRow}>
            <MacroChip label="kcal"  value={scaleFromServing(selected.calories, selected.serving_size_g, 100).toFixed(1)}  color={T.green} />
            <MacroChip label="Prot." value={scaleFromServing(selected.protein_g, selected.serving_size_g, 100).toFixed(1)} color={"#3B82F6"} />
            <MacroChip label="Carbs" value={scaleFromServing(selected.carbs_g, selected.serving_size_g, 100).toFixed(1)}   color={T.orange} />
            <MacroChip label="Gord." value={scaleFromServing(selected.fat_g, selected.serving_size_g, 100).toFixed(1)}     color={T.red} />
          </View>
        </View>

        <Text style={styles.qtyLabel}>Quantidade (g)</Text>
        <TextInput
          style={styles.qtyInput}
          value={grams}
          onChangeText={setGrams}
          keyboardType="decimal-pad"
          placeholder={String(selected.serving_size_g)}
          placeholderTextColor={T.t3}
          selectTextOnFocus
        />

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

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>
                {selected ? "Quantidade" : "Buscar Suplemento"}
              </Text>
              {!selected && (
                <Text style={styles.headerSub}>Herbalife Brasil</Text>
              )}
            </View>
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

function PreviewChip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={[styles.previewChip, { borderColor: color }]}>
      <Text style={[styles.previewChipValue, { color }]}>{value}</Text>
      <Text style={styles.previewChipLabel}>{label}</Text>
    </View>
  );
}

function MacroChip({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={[styles.macroChip, { borderColor: color }]}>
      <Text style={[styles.macroChipValue, { color }]}>{value}</Text>
      <Text style={styles.macroChipLabel}>{label}</Text>
    </View>
  );
}

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
  headerSub: { fontSize: 12, color: T.orange, fontWeight: "700", marginTop: 2 },
  closeBtn: { fontSize: 20, color: T.t3, fontWeight: "700" },

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
  resultHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 2 },
  resultName: { fontSize: 15, color: T.t1, fontWeight: "600", flex: 1, marginRight: 8 },
  brandBadge: { backgroundColor: "rgba(245,158,11,0.12)", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: "rgba(245,158,11,0.3)" },
  brandBadgeText: { color: T.orange, fontSize: 10, fontWeight: "800" },
  resultMeta: { fontSize: 12, color: T.t2 },
  separator: { height: 1, backgroundColor: T.border },

  backBtn: { marginBottom: 16 },
  backBtnText: { color: T.orange, fontWeight: "700", fontSize: 14 },
  selectedName: { fontSize: 20, fontWeight: "800", color: T.t1, marginBottom: 6 },
  servingInfo: { backgroundColor: "rgba(245,158,11,0.08)", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf: "flex-start", marginBottom: 6, borderWidth: 1, borderColor: "rgba(245,158,11,0.2)" },
  servingText: { color: T.orange, fontWeight: "700", fontSize: 12 },
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

  previewCard: {
    backgroundColor: T.surfaceAlt,
    borderRadius: 14,
    padding: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.3)",
  },
  previewTitle: { fontSize: 12, fontWeight: "800", color: T.orange, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 },
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

  macroCard: {
    backgroundColor: T.surfaceAlt,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.2)",
  },
  macroCardTitle: { fontSize: 11, fontWeight: "800", color: T.orange, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 },
  macroRow: { flexDirection: "row", justifyContent: "space-between" },
  macroChip: {
    flex: 1,
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    padding: 8,
    marginHorizontal: 2,
    backgroundColor: T.surface,
  },
  macroChipValue: { fontSize: 14, fontWeight: "800" },
  macroChipLabel: { fontSize: 9, color: T.t3 },

  confirmBtn: {
    backgroundColor: T.orange,
    padding: 18,
    borderRadius: 14,
    alignItems: "center",
  },
  confirmBtnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
});