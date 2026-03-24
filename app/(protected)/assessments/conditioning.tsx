import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
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
import { supabase } from "../../../lib/supabase"; // Verifique se o caminho está correto para a sua estrutura

type StrengthTest = { id: string; exercise: string; load: string; reps: string; rm: string };
type EnduranceTest = { id: string; type: string; distance: string; time: string; reps: string; vo2: string };
type MobilityTest = { id: string; name: string; score: string; notes: string };

export default function ConditioningAssessment() {
  const { assessment_id } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [openSection, setOpenSection] = useState<"strength" | "endurance" | "mobility" | null>("endurance");

  const [strengthTests, setStrengthTests] = useState<StrengthTest[]>([]);
  const [enduranceTests, setEnduranceTests] = useState<EnduranceTest[]>([]);
  const [mobilityTests, setMobilityTests] = useState<MobilityTest[]>([]);

  // 🎯 AS SUAS NOVAS OPÇÕES DE CROSS
  const strengthOptions = ["Flexão", "Supino", "Agachamento", "Bíceps", "Abdominal"];
  
  // Ajuste do Endurance para opções por minuto
  const enduranceOptions = ["Corrida", "Burpee (1 min)", "Abdominal (1 min)", "Agachamento (1 min)"];
  
  // Ajuste da Mobilidade para opções categóricas
  const mobilityOptions = [
    "Toque chão (Pernas esticadas)", 
    "Agachamento (Profundidade)", 
    "Posição de Rack (Cotovelos altos)", 
    "Barra Overhead (Alinhamento)"
  ];

  const addStrength = (exercise: string) => {
    setStrengthTests([...strengthTests, { id: Date.now().toString(), exercise, load: "", reps: "", rm: "" }]);
  };
  const addEndurance = (type: string) => {
    setEnduranceTests([...enduranceTests, { id: Date.now().toString(), type, distance: "", time: "", reps: "", vo2: "" }]);
  };
  const addMobility = (name: string) => {
    setMobilityTests([...mobilityTests, { id: Date.now().toString(), name, score: "", notes: "" }]);
  };

  const updateStrength = (id: string, field: keyof StrengthTest, value: string) => {
    setStrengthTests(strengthTests.map(t => t.id === id ? { ...t, [field]: value } : t));
  };
  const updateEndurance = (id: string, field: keyof EnduranceTest, value: string) => {
    setEnduranceTests(enduranceTests.map(t => t.id === id ? { ...t, [field]: value } : t));
  };
  const updateMobility = (id: string, field: keyof MobilityTest, value: string) => {
    setMobilityTests(mobilityTests.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const handleSaveAll = async () => {
    if (!assessment_id) {
      setMessage("Erro: ID da Avaliação não encontrado na rota.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const { data: condTest, error: condError } = await supabase
        .from("conditioning_tests")
        .insert([{ assessment_id }])
        .select()
        .single();

      if (condError) throw condError;
      const conditioning_test_id = condTest.id;

      if (strengthTests.length > 0) {
        const strengthData = strengthTests.map(t => ({
          conditioning_test_id,
          exercise_name: t.exercise,
          load_kg: t.load ? parseFloat(t.load) : null,
          repetitions: t.reps ? parseInt(t.reps) : null,
          rm_estimated: t.rm ? parseFloat(t.rm) : null,
        }));
        const { error } = await supabase.from("strength_tests").insert(strengthData);
        if (error) throw error;
      }

      if (enduranceTests.length > 0) {
        const enduranceData = enduranceTests.map(t => ({
          conditioning_test_id,
          test_type: t.type,
          distance_m: t.distance ? parseFloat(t.distance) : null,
          time_seconds: t.time ? parseInt(t.time) : null,
          repetitions: t.reps ? parseInt(t.reps) : null, 
          vo2_estimated: t.vo2 ? parseFloat(t.vo2) : null,
        }));
        const { error } = await supabase.from("endurance_tests").insert(enduranceData);
        if (error) throw error;
      }

      if (mobilityTests.length > 0) {
        const mobilityData = mobilityTests.map(t => ({
          conditioning_test_id,
          test_name: t.name,
          score: t.score ? parseInt(t.score) : null,
          notes: t.notes, // As opções "Sim/Não" ou "Acima/Abaixo" serão salvas aqui
        }));
        const { error } = await supabase.from("mobility_tests").insert(mobilityData);
        if (error) throw error;
      }

      setMessage("✅ Testes salvos com sucesso!");
      setTimeout(() => { router.back(); }, 1500); // Retorna para o histórico automaticamente

    } catch (error: any) {
      setMessage("Erro ao salvar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Renderizador de Botões Rápidos para Mobilidade
  const renderMobilityOptions = (item: MobilityTest) => {
    const isRackOrOverhead = item.name.includes("Rack") || item.name.includes("Overhead");
    const isSquat = item.name.includes("Agachamento");

    if (isRackOrOverhead) {
      return (
        <View style={styles.quickSelectRow}>
          <TouchableOpacity 
            style={[styles.quickButton, item.notes === "Sim" && styles.quickButtonActive]} 
            onPress={() => updateMobility(item.id, "notes", "Sim")}
          >
            <Text style={[styles.quickButtonText, item.notes === "Sim" && styles.quickButtonTextActive]}>Sim</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.quickButton, item.notes === "Não" && styles.quickButtonActive]} 
            onPress={() => updateMobility(item.id, "notes", "Não")}
          >
            <Text style={[styles.quickButtonText, item.notes === "Não" && styles.quickButtonTextActive]}>Não</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (isSquat) {
      return (
        <View style={{ flexDirection: "column", gap: 8, marginTop: 8 }}>
          <TouchableOpacity 
            style={[styles.quickButton, item.notes === "Acima da linha" && styles.quickButtonActive]} 
            onPress={() => updateMobility(item.id, "notes", "Acima da linha")}
          >
            <Text style={[styles.quickButtonText, item.notes === "Acima da linha" && styles.quickButtonTextActive]}>Acima da linha</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.quickButton, item.notes === "Na linha" && styles.quickButtonActive]} 
            onPress={() => updateMobility(item.id, "notes", "Na linha")}
          >
            <Text style={[styles.quickButtonText, item.notes === "Na linha" && styles.quickButtonTextActive]}>Na linha</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.quickButton, item.notes === "Abaixo da linha" && styles.quickButtonActive]} 
            onPress={() => updateMobility(item.id, "notes", "Abaixo da linha")}
          >
            <Text style={[styles.quickButtonText, item.notes === "Abaixo da linha" && styles.quickButtonTextActive]}>Abaixo da linha</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Padrão: Toque no chão (Campo de texto para digitar a distância)
    return (
      <View style={styles.row}>
        <TextInput 
          style={[styles.input, { flex: 1 }]} 
          placeholder="Distância da mão até o chão (ex: 5cm, Tocou)" 
          value={item.notes} 
          onChangeText={(v) => updateMobility(item.id, "notes", v)} 
        />
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: "#f8fafc" }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        
        <View style={styles.header}>
          <Text style={styles.title}>Capacidades Físicas</Text>
          <Text style={styles.subtitle}>Registre os resultados de performance do aluno.</Text>
        </View>

        {message ? <Text style={styles.message}>{message}</Text> : null}

        {/* --- FORÇA --- */}
        <TouchableOpacity style={styles.accordionHeader} onPress={() => setOpenSection(openSection === "strength" ? null : "strength")}>
          <Text style={styles.accordionTitle}>💪 Testes de Força</Text>
          <Text>{openSection === "strength" ? "▼" : "▶"}</Text>
        </TouchableOpacity>
        
        {openSection === "strength" && (
          <View style={styles.accordionBody}>
            <View style={styles.chipContainer}>
              {strengthOptions.map(opt => (
                <TouchableOpacity key={opt} style={styles.chip} onPress={() => addStrength(opt)}>
                  <Text style={styles.chipText}>+ {opt}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {strengthTests.map((item) => (
              <View key={item.id} style={styles.testCard}>
                <Text style={styles.testCardTitle}>{item.exercise}</Text>
                <View style={styles.row}>
                  <TextInput style={[styles.input, { flex: 1, marginRight: 8 }]} placeholder="Carga (kg)" keyboardType="numeric" value={item.load} onChangeText={(v) => updateStrength(item.id, "load", v)} />
                  <TextInput style={[styles.input, { flex: 1, marginRight: 8 }]} placeholder="Reps" keyboardType="numeric" value={item.reps} onChangeText={(v) => updateStrength(item.id, "reps", v)} />
                  <TextInput style={[styles.input, { flex: 1 }]} placeholder="1RM Est." keyboardType="numeric" value={item.rm} onChangeText={(v) => updateStrength(item.id, "rm", v)} />
                </View>
              </View>
            ))}
          </View>
        )}

        {/* --- RESISTÊNCIA / CÁRDIO --- */}
        <TouchableOpacity style={styles.accordionHeader} onPress={() => setOpenSection(openSection === "endurance" ? null : "endurance")}>
          <Text style={styles.accordionTitle}>🏃 Resistência Cárdio</Text>
          <Text>{openSection === "endurance" ? "▼" : "▶"}</Text>
        </TouchableOpacity>
        
        {openSection === "endurance" && (
          <View style={styles.accordionBody}>
            <View style={styles.chipContainer}>
              {enduranceOptions.map(opt => (
                <TouchableOpacity key={opt} style={styles.chip} onPress={() => addEndurance(opt)}>
                  <Text style={styles.chipText}>+ {opt}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {enduranceTests.map((item) => (
              <View key={item.id} style={styles.testCard}>
                <Text style={styles.testCardTitle}>{item.type}</Text>
                {item.type === "Corrida" ? (
                  <View style={styles.row}>
                    <TextInput style={[styles.input, { flex: 1, marginRight: 8 }]} placeholder="Distância (m)" keyboardType="numeric" value={item.distance} onChangeText={(v) => updateEndurance(item.id, "distance", v)} />
                    <TextInput style={[styles.input, { flex: 1 }]} placeholder="Tempo (seg)" keyboardType="numeric" value={item.time} onChangeText={(v) => updateEndurance(item.id, "time", v)} />
                  </View>
                ) : (
                  <View style={styles.row}>
                    <TextInput style={[styles.input, { flex: 1 }]} placeholder="Quantidade (Reps em 1 minuto)" keyboardType="numeric" value={item.reps} onChangeText={(v) => updateEndurance(item.id, "reps", v)} />
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* --- MOBILIDADE --- */}
        <TouchableOpacity style={styles.accordionHeader} onPress={() => setOpenSection(openSection === "mobility" ? null : "mobility")}>
          <Text style={styles.accordionTitle}>🧘 Mobilidade</Text>
          <Text>{openSection === "mobility" ? "▼" : "▶"}</Text>
        </TouchableOpacity>
        
        {openSection === "mobility" && (
          <View style={styles.accordionBody}>
            <View style={styles.chipContainer}>
              {mobilityOptions.map(opt => (
                <TouchableOpacity key={opt} style={styles.chip} onPress={() => addMobility(opt)}>
                  <Text style={styles.chipText}>+ {opt}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {mobilityTests.map((item) => (
              <View key={item.id} style={styles.testCard}>
                <Text style={styles.testCardTitle}>{item.name}</Text>
                {renderMobilityOptions(item)}
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity style={styles.saveButton} onPress={handleSaveAll} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Salvar Avaliação Completa</Text>}
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 100 },
  header: { marginBottom: 24, marginTop: 40 },
  title: { fontSize: 28, fontWeight: "900", color: "#0f172a" },
  subtitle: { fontSize: 14, color: "#64748b", marginTop: 4 },
  message: { backgroundColor: "#dbeafe", color: "#1e40af", padding: 12, borderRadius: 8, marginBottom: 16, fontWeight: "600", textAlign: "center" },
  
  accordionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#fff", padding: 16, borderRadius: 12, marginBottom: 8, elevation: 1, borderWidth: 1, borderColor: "#e2e8f0" },
  accordionTitle: { fontSize: 16, fontWeight: "700", color: "#1e293b" },
  accordionBody: { paddingBottom: 16 },
  
  chipContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16, marginTop: 8 },
  chip: { backgroundColor: "#eff6ff", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: "#bfdbfe" },
  chipText: { color: "#2563eb", fontWeight: "600", fontSize: 13 },
  
  testCard: { backgroundColor: "#fff", padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: "#f1f5f9" },
  testCardTitle: { fontSize: 14, fontWeight: "700", color: "#334155", marginBottom: 12 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  input: { backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 8, paddingHorizontal: 12, height: 44, fontSize: 14 },
  
  quickSelectRow: { flexDirection: "row", gap: 10, marginTop: 8 },
  quickButton: { flex: 1, backgroundColor: "#f1f5f9", paddingVertical: 12, borderRadius: 8, alignItems: "center", borderWidth: 1, borderColor: "#e2e8f0" },
  quickButtonActive: { backgroundColor: "#2563eb", borderColor: "#1d4ed8" },
  quickButtonText: { color: "#475569", fontWeight: "600" },
  quickButtonTextActive: { color: "#fff" },

  saveButton: { backgroundColor: "#2563eb", height: 56, borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 24, elevation: 3 },
  saveButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});

