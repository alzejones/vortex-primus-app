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
import { supabase } from "../../../lib/supabase";

type StrengthTest = { id: string; exercise: string; load: string; reps: string };
type EnduranceTest = { id: string; type: string; distance: string; time: string; reps: string };
type MobilityTest = { id: string; name: string; notes: string };

export default function ConditioningAssessment() {
  // 🔴 Agora recebe tanto o client_id quanto o assessment_id
  const { client_id, assessment_id } = useLocalSearchParams();
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [clientName, setClientName] = useState("");

  const [activeTab, setActiveTab] = useState<"strength" | "endurance" | "mobility">("strength");
  const [assessmentDate, setAssessmentDate] = useState("");

  const [strengthTests, setStrengthTests] = useState<StrengthTest[]>([]);
  const [enduranceTests, setEnduranceTests] = useState<EnduranceTest[]>([]);
  const [mobilityTests, setMobilityTests] = useState<MobilityTest[]>([]);

  // 🔴 CARREGA DADOS EXISTENTES (Se já houver testes salvos, ele mostra na tela)
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        if (client_id) {
          const { data } = await supabase.from("clients").select("name").eq("id", client_id).single();
          if (data) setClientName(data.name);
        }

        if (assessment_id) {
          const { data: assessData } = await supabase
            .from("physical_assessments")
            .select(`
              date,
              conditioning:conditioning_tests (
                id,
                strength:strength_tests (id, exercise_name, load_kg, repetitions),
                endurance:endurance_tests (id, test_type, distance_m, time_seconds, repetitions),
                mobility:mobility_tests (id, test_name, notes)
              )
            `)
            .eq("id", assessment_id)
            .single();

          if (assessData) {
            // Formata a data existente
            const d = new Date(assessData.date);
            const dia = d.getDate().toString().padStart(2, '0');
            const mes = (d.getMonth() + 1).toString().padStart(2, '0');
            const ano = d.getFullYear();
            const h = d.getHours().toString().padStart(2, '0');
            const min = d.getMinutes().toString().padStart(2, '0');
            setAssessmentDate(`${dia}/${mes}/${ano} ${h}:${min}`);

            // Preenche os testes se já existirem
            const cond = assessData.conditioning?.[0];
            if (cond) {
              if (cond.strength) {
                setStrengthTests(cond.strength.map((s: any) => ({ id: s.id, exercise: s.exercise_name, load: s.load_kg?.toString() || "", reps: s.repetitions || "" })));
              }
              if (cond.endurance) {
                setEnduranceTests(cond.endurance.map((e: any) => ({ id: e.id, type: e.test_type, distance: e.distance_m?.toString() || "", time: e.time_seconds?.toString() || "", reps: e.repetitions || "" })));
              }
              if (cond.mobility) {
                setMobilityTests(cond.mobility.map((m: any) => ({ id: m.id, name: m.test_name, notes: m.notes || "" })));
              }
            }
          }
        } else {
          // Nova avaliação - seta a data atual
          const d = new Date();
          const dia = d.getDate().toString().padStart(2, '0');
          const mes = (d.getMonth() + 1).toString().padStart(2, '0');
          const ano = d.getFullYear();
          const h = d.getHours().toString().padStart(2, '0');
          const min = d.getMinutes().toString().padStart(2, '0');
          setAssessmentDate(`${dia}/${mes}/${ano} ${h}:${min}`);
        }
      } catch (error) {
        console.error("Erro ao carregar dados", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [client_id, assessment_id]);

  const parseDateBRToISO = (str: string) => {
    try {
      const [datePart, timePart] = str.split(' ');
      const [d, m, y] = datePart.split('/');
      return `${y}-${m}-${d}T${timePart}:00-03:00`;
    } catch {
      return new Date().toISOString();
    }
  };

  const addStrengthTest = () => setStrengthTests([...strengthTests, { id: Date.now().toString(), exercise: "", load: "", reps: "" }]);
  const addEnduranceTest = () => setEnduranceTests([...enduranceTests, { id: Date.now().toString(), type: "", distance: "", time: "", reps: "" }]);
  const addMobilityTest = () => setMobilityTests([...mobilityTests, { id: Date.now().toString(), name: "", notes: "" }]);

  const updateStrength = (id: string, field: keyof StrengthTest, value: string) => setStrengthTests(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
  const updateEndurance = (id: string, field: keyof EnduranceTest, value: string) => setEnduranceTests(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
  const updateMobility = (id: string, field: keyof MobilityTest, value: string) => setMobilityTests(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));

  const removeStrength = (id: string) => setStrengthTests(prev => prev.filter(t => t.id !== id));
  const removeEndurance = (id: string) => setEnduranceTests(prev => prev.filter(t => t.id !== id));
  const removeMobility = (id: string) => setMobilityTests(prev => prev.filter(t => t.id !== id));

  const handleSaveAll = async () => {
    if (!client_id && !assessment_id) {
      setMessage("Erro: Referência da avaliação não encontrada.");
      return;
    }

    if (strengthTests.length === 0 && enduranceTests.length === 0 && mobilityTests.length === 0) {
      setMessage("Erro: Adicione pelo menos um teste antes de salvar.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      let trainerId = null;
      if (user) {
        const { data: trainer } = await supabase.from('trainers').select('id').eq('user_id', user.id).single();
        if (trainer) trainerId = trainer.id;
      }

      const isoDate = parseDateBRToISO(assessmentDate);
      let target_assessment_id = assessment_id as string;

      // 1. Se NÃO tiver assessment_id, cria um evento principal
      if (!target_assessment_id) {
        const { data: newAssessment, error: assessError } = await supabase
          .from("physical_assessments")
          .insert([{ client_id, date: isoDate, trainer_id: trainerId, assessor_name: user?.email || "Treinador" }])
          .select().single();
        if (assessError) throw assessError;
        target_assessment_id = newAssessment.id;
      } else {
        // Atualiza a data da avaliação principal se for edição
        await supabase.from("physical_assessments").update({ date: isoDate }).eq("id", target_assessment_id);
      }

      // 2. Procura a pasta de condicionamento para este assessment_id
      let conditioning_test_id = null;
      const { data: existingCond } = await supabase.from("conditioning_tests").select("id").eq("assessment_id", target_assessment_id).single();
      
      if (existingCond) {
        conditioning_test_id = existingCond.id;
        // Limpa os testes antigos para inserir os novos limpos (evita duplicação ao editar)
        await supabase.from("strength_tests").delete().eq("conditioning_test_id", conditioning_test_id);
        await supabase.from("endurance_tests").delete().eq("conditioning_test_id", conditioning_test_id);
        await supabase.from("mobility_tests").delete().eq("conditioning_test_id", conditioning_test_id);
      } else {
        const { data: condTest, error: condError } = await supabase.from("conditioning_tests").insert([{ assessment_id: target_assessment_id }]).select().single();
        if (condError) throw condError;
        conditioning_test_id = condTest.id;
      }

      // 3. Salva os testes (com replace de vírgula por ponto para não falhar na vírgula)
      if (strengthTests.length > 0) {
        const strengthData = strengthTests.map(t => ({ 
          conditioning_test_id, 
          exercise_name: t.exercise, 
          load_kg: t.load ? parseFloat(t.load.replace(',', '.')) : null, 
          repetitions: t.reps || null 
        }));
        const { error: errStr } = await supabase.from("strength_tests").insert(strengthData);
        if (errStr) throw errStr; 
      }

      if (enduranceTests.length > 0) {
        const enduranceData = enduranceTests.map(t => ({ 
          conditioning_test_id, 
          test_type: t.type, 
          distance_m: t.distance ? parseFloat(t.distance.replace(',', '.')) : null, 
          time_seconds: t.time ? parseInt(t.time) : null, 
          repetitions: t.reps || null 
        }));
        const { error: errEnd } = await supabase.from("endurance_tests").insert(enduranceData);
        if (errEnd) throw errEnd;
      }

      if (mobilityTests.length > 0) {
        const mobilityData = mobilityTests.map(t => ({ conditioning_test_id, test_name: t.name, notes: t.notes }));
        const { error: errMob } = await supabase.from("mobility_tests").insert(mobilityData);
        if (errMob) throw errMob;
      }

      setMessage("✅ Testes físicos salvos com sucesso!");
      setTimeout(() => { router.back(); }, 1500); 

    } catch (error: any) {
      setMessage("Erro ao salvar: " + (error.message || JSON.stringify(error)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 12 }}>
            <Text style={{ color: "#2563eb", fontWeight: "700" }}>← Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Avaliação de Condicionamento</Text>
          <Text style={styles.subtitle}>{clientName}</Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Data e Hora do Teste:</Text>
          <TextInput
            style={styles.input}
            value={assessmentDate}
            onChangeText={setAssessmentDate}
            placeholder="DD/MM/AAAA HH:MM"
          />
        </View>

        {/* TABS */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity style={[styles.tab, activeTab === "strength" && styles.activeTab]} onPress={() => setActiveTab("strength")}>
            <Text style={[styles.tabText, activeTab === "strength" && styles.activeTabText]}>Força</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === "endurance" && styles.activeTab]} onPress={() => setActiveTab("endurance")}>
            <Text style={[styles.tabText, activeTab === "endurance" && styles.activeTabText]}>Cárdio</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === "mobility" && styles.activeTab]} onPress={() => setActiveTab("mobility")}>
            <Text style={[styles.tabText, activeTab === "mobility" && styles.activeTabText]}>Mobilidade</Text>
          </TouchableOpacity>
        </View>

        {/* ABA FORÇA */}
        {activeTab === "strength" && (
          <View>
            {strengthTests.map((t, index) => (
              <View key={t.id} style={styles.testCard}>
                <View style={styles.row}>
                  <Text style={styles.testCardTitle}>Exercício de Força #{index + 1}</Text>
                  <TouchableOpacity onPress={() => removeStrength(t.id)}>
                    <Text style={{ color: '#ef4444', fontWeight: 'bold' }}>X Remover</Text>
                  </TouchableOpacity>
                </View>
                <TextInput style={[styles.input, { marginBottom: 8 }]} placeholder="Nome do Exercício (ex: Back Squat)" value={t.exercise} onChangeText={(val) => updateStrength(t.id, "exercise", val)} />
                <View style={styles.row}>
                  <TextInput style={[styles.input, { flex: 1, marginRight: 8 }]} placeholder="Carga (kg)" keyboardType="numeric" value={t.load} onChangeText={(val) => updateStrength(t.id, "load", val)} />
                  <TextInput style={[styles.input, { flex: 1 }]} placeholder="Repetições" value={t.reps} onChangeText={(val) => updateStrength(t.id, "reps", val)} />
                </View>
              </View>
            ))}
            <TouchableOpacity style={styles.addButton} onPress={addStrengthTest}>
              <Text style={styles.addButtonText}>+ Adicionar Teste de Força</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ABA CÁRDIO */}
        {activeTab === "endurance" && (
          <View>
            {enduranceTests.map((t, index) => (
              <View key={t.id} style={styles.testCard}>
                <View style={styles.row}>
                  <Text style={styles.testCardTitle}>Exercício de Resistência #{index + 1}</Text>
                  <TouchableOpacity onPress={() => removeEndurance(t.id)}>
                    <Text style={{ color: '#ef4444', fontWeight: 'bold' }}>X Remover</Text>
                  </TouchableOpacity>
                </View>
                <TextInput style={[styles.input, { marginBottom: 8 }]} placeholder="Tipo (ex: Corrida, Burpee)" value={t.type} onChangeText={(val) => updateEndurance(t.id, "type", val)} />
                <View style={styles.row}>
                  <TextInput style={[styles.input, { flex: 1, marginRight: 8 }]} placeholder="Distância (m)" keyboardType="numeric" value={t.distance} onChangeText={(val) => updateEndurance(t.id, "distance", val)} />
                  <TextInput style={[styles.input, { flex: 1 }]} placeholder="Tempo (segundos)" keyboardType="numeric" value={t.time} onChangeText={(val) => updateEndurance(t.id, "time", val)} />
                </View>
                <TextInput style={[styles.input, { marginTop: 8 }]} placeholder="Repetições (se houver)" value={t.reps} onChangeText={(val) => updateEndurance(t.id, "reps", val)} />
              </View>
            ))}
            <TouchableOpacity style={styles.addButton} onPress={addEnduranceTest}>
              <Text style={styles.addButtonText}>+ Adicionar Teste de Cárdio</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ABA MOBILIDADE */}
        {activeTab === "mobility" && (
          <View>
            {mobilityTests.map((t, index) => (
              <View key={t.id} style={styles.testCard}>
                <View style={styles.row}>
                  <Text style={styles.testCardTitle}>Exercício de Mobilidade #{index + 1}</Text>
                  <TouchableOpacity onPress={() => removeMobility(t.id)}>
                    <Text style={{ color: '#ef4444', fontWeight: 'bold' }}>X Remover</Text>
                  </TouchableOpacity>
                </View>
                <TextInput style={[styles.input, { marginBottom: 8 }]} placeholder="Nome (ex: Toque chão pernas esticadas)" value={t.name} onChangeText={(val) => updateMobility(t.id, "name", val)} />
                <TextInput style={styles.input} placeholder="Resultado / Nota" value={t.notes} onChangeText={(val) => updateMobility(t.id, "notes", val)} />
              </View>
            ))}
            <TouchableOpacity style={styles.addButton} onPress={addMobilityTest}>
              <Text style={styles.addButtonText}>+ Adicionar Mobilidade</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* MENSAGEM DE ERRO/SUCESSO */}
        {message !== "" && (
          <View style={[styles.messageBox, message.includes("Erro") ? styles.errorBox : styles.successBox]}>
            <Text style={[styles.messageText, message.includes("Erro") ? styles.errorText : styles.successText]}>
              {message}
            </Text>
          </View>
        )}

        {/* BOTÃO SALVAR */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSaveAll} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Salvar Avaliação Completa</Text>}
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc", padding: 16 },
  header: { marginBottom: 20 },
  title: { fontSize: 24, fontWeight: "800", color: "#0f172a" },
  subtitle: { fontSize: 16, color: "#64748b", marginTop: 4 },
  formGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "700", color: "#475569", marginBottom: 6 },
  input: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 8, paddingHorizontal: 12, height: 48, fontSize: 15 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  
  tabsContainer: { flexDirection: "row", marginBottom: 16, backgroundColor: "#e2e8f0", borderRadius: 8, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 6 },
  activeTab: { backgroundColor: "#fff", elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 1 },
  tabText: { fontSize: 13, fontWeight: "600", color: "#64748b" },
  activeTabText: { color: "#2563eb", fontWeight: "800" },

  testCard: { backgroundColor: "#fff", padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: "#e2e8f0", elevation: 1 },
  testCardTitle: { fontSize: 14, fontWeight: "800", color: "#1e293b", marginBottom: 12 },
  addButton: { backgroundColor: "#eff6ff", padding: 12, borderRadius: 8, alignItems: "center", borderWidth: 1, borderColor: "#bfdbfe", borderStyle: "dashed", marginBottom: 20 },
  addButtonText: { color: "#2563eb", fontWeight: "700" },

  saveBtn: { backgroundColor: "#16a34a", padding: 16, borderRadius: 8, alignItems: "center", marginTop: 10 },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },

  messageBox: { padding: 12, borderRadius: 8, marginBottom: 16, borderWidth: 1 },
  errorBox: { backgroundColor: "#fef2f2", borderColor: "#f87171" },
  successBox: { backgroundColor: "#f0fdf4", borderColor: "#4ade80" },
  messageText: { fontSize: 14, fontWeight: "600", textAlign: "center" },
  errorText: { color: "#b91c1c" },
  successText: { color: "#15803d" }
});
