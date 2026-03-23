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
import { supabase } from "../../../lib/supabase"; // Ajuste o caminho se necessário

// --- TIPAGENS ---
type StrengthTest = { id: string; exercise: string; load: string; reps: string; rm: string };
type EnduranceTest = { id: string; type: string; distance: string; time: string; vo2: string };
type MobilityTest = { id: string; name: string; score: string; notes: string };

export default function ConditioningAssessment() {
  // Pega o ID da avaliação que veio da tela de Antropometria
  const { assessment_id } = useLocalSearchParams();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // CONTROLO DAS SANFONAS (Abas)
  const [openSection, setOpenSection] = useState<"strength" | "endurance" | "mobility" | null>("strength");

  // LISTAS DE TESTES (O professor vai adicionando aqui antes de salvar)
  const [strengthTests, setStrengthTests] = useState<StrengthTest[]>([]);
  const [enduranceTests, setEnduranceTests] = useState<EnduranceTest[]>([]);
  const [mobilityTests, setMobilityTests] = useState<MobilityTest[]>([]);

  // OPÇÕES RÁPIDAS (Chips)
  const strengthOptions = ["Flexão", "Supino", "Agachamento", "Bíceps", "Abdominal"];
  const enduranceOptions = ["Corrida", "Remo", "Air Bike"];
  const mobilityOptions = ["Overhead Squat", "Sit and Reach", "Tornozelo"];

  // --- FUNÇÕES PARA ADICIONAR ITENS ÀS LISTAS ---
  const addStrength = (exercise: string) => {
    setStrengthTests([...strengthTests, { id: Date.now().toString(), exercise, load: "", reps: "", rm: "" }]);
  };
  const addEndurance = (type: string) => {
    setEnduranceTests([...enduranceTests, { id: Date.now().toString(), type, distance: "", time: "", vo2: "" }]);
  };
  const addMobility = (name: string) => {
    setMobilityTests([...mobilityTests, { id: Date.now().toString(), name, score: "", notes: "" }]);
  };

  // --- ATUALIZAR CAMPOS ---
  const updateStrength = (id: string, field: keyof StrengthTest, value: string) => {
    setStrengthTests(strengthTests.map(t => t.id === id ? { ...t, [field]: value } : t));
  };
  const updateEndurance = (id: string, field: keyof EnduranceTest, value: string) => {
    setEnduranceTests(enduranceTests.map(t => t.id === id ? { ...t, [field]: value } : t));
  };
  const updateMobility = (id: string, field: keyof MobilityTest, value: string) => {
    setMobilityTests(mobilityTests.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  // --- O "MOTOR" QUE SALVA TUDO DE UMA VEZ ---
  const handleSaveAll = async () => {
    if (!assessment_id) {
      setMessage("Erro: ID da Avaliação não encontrado.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      // 1. Cria a "pasta" de condicionamento para esta avaliação
      const { data: condTest, error: condError } = await supabase
        .from("conditioning_tests")
        .insert([{ assessment_id }])
        .select()
        .single();

      if (condError) throw condError;
      const conditioning_test_id = condTest.id;

      // 2. Prepara os dados de Força
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

      // 3. Prepara os dados de Resistência
      if (enduranceTests.length > 0) {
        const enduranceData = enduranceTests.map(t => ({
          conditioning_test_id,
          test_type: t.type,
          distance_m: t.distance ? parseFloat(t.distance) : null,
          time_seconds: t.time ? parseInt(t.time) : null,
          vo2_estimated: t.vo2 ? parseFloat(t.vo2) : null,
        }));
        const { error } = await supabase.from("endurance_tests").insert(enduranceData);
        if (error) throw error;
      }

      // 4. Prepara os dados de Mobilidade
      if (mobilityTests.length > 0) {
        const mobilityData = mobilityTests.map(t => ({
          conditioning_test_id,
          test_name: t.name,
          score: t.score ? parseInt(t.score) : null,
          notes: t.notes,
        }));
        const { error } = await supabase.from("mobility_tests").insert(mobilityData);
        if (error) throw error;
      }

      setMessage("✅ Avaliação de Condicionamento salva com sucesso!");
      
      // Volta para o Dashboard ou vai para a próxima etapa
      setTimeout(() => {
        router.replace("/(protected)" as any); 
      }, 1500);

    } catch (error: any) {
      setMessage("Erro ao salvar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: "#f8fafc" }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        
        <View style={styles.header}>
          <Text style={styles.title}>Capacidades Físicas</Text>
          <Text style={styles.subtitle}>Selecione os testes realizados neste ciclo de Cross.</Text>
        </View>

        {message ? <Text style={styles.message}>{message}</Text> : null}

        {/* --- SANFONA: FORÇA --- */}
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

        {/* --- SANFONA: RESISTÊNCIA --- */}
        <TouchableOpacity style={styles.accordionHeader} onPress={() => setOpenSection(openSection === "endurance" ? null : "endurance")}>
          <Text style={styles.accordionTitle}>🏃 Resistência / Cardio</Text>
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
                <View style={styles.row}>
                  <TextInput style={[styles.input, { flex: 1, marginRight: 8 }]} placeholder="Distância (m)" keyboardType="numeric" value={item.distance} onChangeText={(v) => updateEndurance(item.id, "distance", v)} />
                  <TextInput style={[styles.input, { flex: 1, marginRight: 8 }]} placeholder="Tempo (seg)" keyboardType="numeric" value={item.time} onChangeText={(v) => updateEndurance(item.id, "time", v)} />
                  <TextInput style={[styles.input, { flex: 1 }]} placeholder="VO2 Est." keyboardType="numeric" value={item.vo2} onChangeText={(v) => updateEndurance(item.id, "vo2", v)} />
                </View>
              </View>
            ))}
          </View>
        )}

        {/* --- SANFONA: MOBILIDADE --- */}
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
                <View style={styles.row}>
                  <TextInput style={[styles.input, { flex: 1, marginRight: 8 }]} placeholder="Score (0-10)" keyboardType="numeric" value={item.score} onChangeText={(v) => updateMobility(item.id, "score", v)} />
                  <TextInput style={[styles.input, { flex: 2 }]} placeholder="Notas / Dificuldade" value={item.notes} onChangeText={(v) => updateMobility(item.id, "notes", v)} />
                </View>
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
  
  saveButton: { backgroundColor: "#2563eb", height: 56, borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 24, elevation: 3 },
  saveButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});


