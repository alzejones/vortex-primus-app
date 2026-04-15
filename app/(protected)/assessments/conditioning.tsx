import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { GradientSuccess } from "../../../utils/gradients";
import { T } from "../../../utils/theme";

type StrengthTest = { id: string; exercise: string; load: string; reps: string };
type EnduranceTest = { id: string; type: string; distance: string; time: string; reps: string };
type MobilityTest = { id: string; name: string; notes: string };

export default function ConditioningAssessment() {
  const { client_id, assessment_id } = useLocalSearchParams();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [clientName, setClientName] = useState("");

  const [activeTab, setActiveTab] = useState<"strength" | "endurance" | "mobility">("strength");
  const [assessmentDate, setAssessmentDate] = useState("");

  const [strengthTests, setStrengthTests] = useState<StrengthTest[]>([]);
  const [enduranceTests, setEnduranceTests] = useState<EnduranceTest[]>([]);
  const [mobilityTests, setMobilityTests] = useState<MobilityTest[]>([]);

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
            const raw: string = assessData.date || '';
            const [datePart, timePart] = raw.split('T');
            const [ano, mes, dia] = (datePart || '').split('-');
            const [h, min] = (timePart || '00:00').split(':');
            setAssessmentDate(`${dia}/${mes}/${ano} ${h}:${min}`);

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

      if (!target_assessment_id) {
        const { data: newAssessment, error: assessError } = await supabase
          .from("physical_assessments")
          .insert([{ client_id, date: isoDate, trainer_id: trainerId, assessor_name: user?.email || "Treinador" }])
          .select().single();
        if (assessError) throw assessError;
        target_assessment_id = newAssessment.id;
      } else {
        await supabase.from("physical_assessments").update({ date: isoDate }).eq("id", target_assessment_id);
      }

      let conditioning_test_id = null;
      const { data: existingCond } = await supabase.from("conditioning_tests").select("id").eq("assessment_id", target_assessment_id).single();

      if (existingCond) {
        conditioning_test_id = existingCond.id;
        await supabase.from("strength_tests").delete().eq("conditioning_test_id", conditioning_test_id);
        await supabase.from("endurance_tests").delete().eq("conditioning_test_id", conditioning_test_id);
        await supabase.from("mobility_tests").delete().eq("conditioning_test_id", conditioning_test_id);
      } else {
        const { data: condTest, error: condError } = await supabase.from("conditioning_tests").insert([{ assessment_id: target_assessment_id }]).select().single();
        if (condError) throw condError;
        conditioning_test_id = condTest.id;
      }

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

  const handleDelete = () => {
    if (!assessment_id) return;
    Alert.alert(
      "Excluir Avaliação",
      "Tem a certeza que deseja excluir esta avaliação de condicionamento? Esta ação não pode ser desfeita.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              const { error } = await supabase.from('physical_assessments').delete().eq('id', assessment_id);
              if (error) throw error;
              setMessage("✅ Avaliação excluída com sucesso!");
              setTimeout(() => { router.back(); }, 1500);
            } catch (error: any) {
              setMessage("Erro ao excluir: " + (error.message || JSON.stringify(error)));
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleDateChange = (text: string) => {
    const digits = text.replace(/\D/g, '').substring(0, 12);
    let formatted = digits.substring(0, 2);
    if (digits.length >= 3) formatted += '/' + digits.substring(2, 4);
    if (digits.length >= 5) formatted += '/' + digits.substring(4, 8);
    if (digits.length >= 9) formatted += ' ' + digits.substring(8, 10);
    if (digits.length >= 11) formatted += ':' + digits.substring(10, 12);
    setAssessmentDate(formatted);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>

        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 12 }}>
            <Text style={{ color: T.blue, fontWeight: "700" }}>← Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Avaliação de Condicionamento</Text>
          <Text style={styles.subtitle}>{clientName}</Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Data e Hora do Teste:</Text>
          <TextInput
            style={styles.input}
            value={assessmentDate}
            onChangeText={handleDateChange}
            placeholder="DD/MM/AAAA HH:MM"
            placeholderTextColor={T.t3}
            keyboardType="numeric"
            maxLength={16}
          />
        </View>

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

        {activeTab === "strength" && (
          <View>
            {strengthTests.map((t, index) => (
              <View key={t.id} style={styles.testCard}>
                <View style={styles.row}>
                  <Text style={styles.testCardTitle}>Exercício de Força #{index + 1}</Text>
                  <TouchableOpacity onPress={() => removeStrength(t.id)}>
                    <Text style={{ color: T.red, fontWeight: 'bold' }}>X Remover</Text>
                  </TouchableOpacity>
                </View>
                <TextInput style={[styles.input, { marginBottom: 8 }]} placeholder="Nome do Exercício (ex: Back Squat)" placeholderTextColor={T.t3} value={t.exercise} onChangeText={(val) => updateStrength(t.id, "exercise", val)} />
                <View style={styles.row}>
                  <TextInput style={[styles.input, { flex: 1, marginRight: 8 }]} placeholder="Carga (kg)" placeholderTextColor={T.t3} keyboardType="numeric" value={t.load} onChangeText={(val) => updateStrength(t.id, "load", val)} />
                  <TextInput style={[styles.input, { flex: 1 }]} placeholder="Repetições" placeholderTextColor={T.t3} value={t.reps} onChangeText={(val) => updateStrength(t.id, "reps", val)} />
                </View>
              </View>
            ))}
            <TouchableOpacity style={styles.addButton} onPress={addStrengthTest}>
              <Text style={styles.addButtonText}>+ Adicionar Teste de Força</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === "endurance" && (
          <View>
            {enduranceTests.map((t, index) => (
              <View key={t.id} style={styles.testCard}>
                <View style={styles.row}>
                  <Text style={styles.testCardTitle}>Exercício de Resistência #{index + 1}</Text>
                  <TouchableOpacity onPress={() => removeEndurance(t.id)}>
                    <Text style={{ color: T.red, fontWeight: 'bold' }}>X Remover</Text>
                  </TouchableOpacity>
                </View>
                <TextInput style={[styles.input, { marginBottom: 8 }]} placeholder="Tipo (ex: Corrida, Burpee)" placeholderTextColor={T.t3} value={t.type} onChangeText={(val) => updateEndurance(t.id, "type", val)} />
                <View style={styles.row}>
                  <TextInput style={[styles.input, { flex: 1, marginRight: 8 }]} placeholder="Distância (m)" placeholderTextColor={T.t3} keyboardType="numeric" value={t.distance} onChangeText={(val) => updateEndurance(t.id, "distance", val)} />
                  <TextInput style={[styles.input, { flex: 1 }]} placeholder="Tempo (segundos)" placeholderTextColor={T.t3} keyboardType="numeric" value={t.time} onChangeText={(val) => updateEndurance(t.id, "time", val)} />
                </View>
                <TextInput style={[styles.input, { marginTop: 8 }]} placeholder="Repetições (se houver)" placeholderTextColor={T.t3} value={t.reps} onChangeText={(val) => updateEndurance(t.id, "reps", val)} />
              </View>
            ))}
            <TouchableOpacity style={styles.addButton} onPress={addEnduranceTest}>
              <Text style={styles.addButtonText}>+ Adicionar Teste de Cárdio</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === "mobility" && (
          <View>
            {mobilityTests.map((t, index) => (
              <View key={t.id} style={styles.testCard}>
                <View style={styles.row}>
                  <Text style={styles.testCardTitle}>Exercício de Mobilidade #{index + 1}</Text>
                  <TouchableOpacity onPress={() => removeMobility(t.id)}>
                    <Text style={{ color: T.red, fontWeight: 'bold' }}>X Remover</Text>
                  </TouchableOpacity>
                </View>
                <TextInput style={[styles.input, { marginBottom: 8 }]} placeholder="Nome (ex: Toque chão pernas esticadas)" placeholderTextColor={T.t3} value={t.name} onChangeText={(val) => updateMobility(t.id, "name", val)} />
                <TextInput style={styles.input} placeholder="Resultado / Nota" placeholderTextColor={T.t3} value={t.notes} onChangeText={(val) => updateMobility(t.id, "notes", val)} />
              </View>
            ))}
            <TouchableOpacity style={styles.addButton} onPress={addMobilityTest}>
              <Text style={styles.addButtonText}>+ Adicionar Mobilidade</Text>
            </TouchableOpacity>
          </View>
        )}

        {message !== "" && (
          <View style={[styles.messageBox, message.includes("Erro") ? styles.errorBox : styles.successBox]}>
            <Text style={[styles.messageText, message.includes("Erro") ? styles.errorText : styles.successText]}>
              {message}
            </Text>
          </View>
        )}

        <TouchableOpacity style={styles.saveBtn} onPress={handleSaveAll} disabled={loading}>
          <LinearGradient {...GradientSuccess} style={styles.saveBtnGradient}>
            {loading ? <ActivityIndicator color={T.white} /> : <Text style={styles.saveBtnText}>Salvar Avaliação Completa</Text>}
          </LinearGradient>
        </TouchableOpacity>

        {assessment_id && (
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} disabled={loading}>
            {loading ? <ActivityIndicator color={T.white} /> : <Text style={styles.deleteBtnText}>🗑️ Excluir Avaliação</Text>}
          </TouchableOpacity>
        )}

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg, padding: 16 },
  header: { marginBottom: 20 },
  title: { fontSize: 24, fontWeight: "800", color: T.t1 },
  subtitle: { fontSize: 16, color: T.t3, marginTop: 4 },
  formGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "700", color: T.t2, marginBottom: 6 },
  input: {
    backgroundColor: T.surface,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
    fontSize: 15,
    color: T.t1,
  },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },

  tabsContainer: {
    flexDirection: "row",
    marginBottom: 16,
    backgroundColor: T.surfaceAlt,
    borderRadius: 8,
    padding: 4,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 6 },
  activeTab: { backgroundColor: T.surface },
  tabText: { fontSize: 13, fontWeight: "600", color: T.t3 },
  activeTabText: { color: T.blue, fontWeight: "800" },

  testCard: {
    backgroundColor: T.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: T.border,
  },
  testCardTitle: { fontSize: 14, fontWeight: "800", color: T.t1, marginBottom: 12 },
  addButton: {
    backgroundColor: T.surfaceAlt,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: T.blue,
    borderStyle: "dashed",
    marginBottom: 20,
  },
  addButtonText: { color: T.blue, fontWeight: "700" },

  saveBtn: { borderRadius: 8, overflow: "hidden", marginTop: 10 },
  saveBtnGradient: { padding: 16, alignItems: "center", borderRadius: 8 },
  saveBtnText: { color: T.white, fontSize: 16, fontWeight: "800" },

  deleteBtn: {
    backgroundColor: "rgba(239,68,68,0.1)",
    borderWidth: 1,
    borderColor: T.red,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 12,
  },
  deleteBtnText: { color: T.red, fontSize: 15, fontWeight: "800" },

  messageBox: { padding: 12, borderRadius: 8, marginBottom: 16, borderWidth: 1 },
  errorBox: { backgroundColor: "rgba(239,68,68,0.08)", borderColor: T.red },
  successBox: { backgroundColor: "rgba(16,185,129,0.08)", borderColor: T.green },
  messageText: { fontSize: 14, fontWeight: "600", textAlign: "center" },
  errorText: { color: T.red },
  successText: { color: T.green },
});
