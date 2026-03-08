import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function ClientDetails() {
  const { id } = useLocalSearchParams();
  const { session } = useAuth();
  const clientId = id as string;

  const [client, setClient] = useState<any>(null);
  const [trainerId, setTrainerId] = useState<string | null>(null);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editingAssessmentId, setEditingAssessmentId] = useState<string | null>(null);
  const [editingAnthropometryId, setEditingAnthropometryId] = useState<string | null>(null);

  // Estados para o Modal de "Consultar"
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<any>(null);

  const [form, setForm] = useState({
    weight: "",
    height: "",
    body_fat: "",
    waist: "",
    hip: "",
    chest: "",
    abdomen: "",
    arm_right: "",
    arm_left: "",
    thigh_right: "",
    thigh_left: "",
    calf_right: "",
    calf_left: "",
    muscle_mass_percentage: "",
    basal_metabolic_rate: "",
    body_fat_index: "",
    metabolic_age: "",
  });

  useEffect(() => {
    async function loadTrainer() {
      if (!session?.user?.id) return;

      const { data } = await supabase
        .from("trainers")
        .select("id")
        .eq("user_id", session.user.id)
        .single();

      if (data) setTrainerId(data.id);
    }

    loadTrainer();
  }, [session]);

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const loadClient = useCallback(async () => {
    const { data } = await supabase
      .from("clients")
      .select("*")
      .eq("id", clientId)
      .single();

    if (data) setClient(data);
  }, [clientId]);

  const loadAssessments = useCallback(async () => {
    const { data } = await supabase
      .from("physical_assessments")
      .select(`
        id,
        date,
        anthropometry (*)
      `)
      .eq("client_id", clientId)
      .order("date", { ascending: false });

    if (data) setAssessments(data);
  }, [clientId]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await loadClient();
    await loadAssessments();
    setLoading(false);
  }, [loadClient, loadAssessments]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  function getEvolution() {
    if (assessments.length < 2) return null;

    const latest = assessments[0]?.anthropometry?.[0];
    const previous = assessments[1]?.anthropometry?.[0];
    const first = assessments[assessments.length - 1]?.anthropometry?.[0];

    if (!latest || !previous || !first) return null;

    const calc = (a: any, b: any) => {
      if (a === null || a === undefined) return null;
      if (b === null || b === undefined) return null;
      return (Number(a) - Number(b)).toFixed(1);
    };

    return {
      diffRecentWeight: calc(latest.weight, previous.weight),
      diffRecentFat: calc(latest.body_fat, previous.body_fat),
      diffRecentMuscle: calc(
        latest.muscle_mass_percentage,
        previous.muscle_mass_percentage
      ),

      diffTotalWeight: calc(latest.weight, first.weight),
      diffTotalFat: calc(latest.body_fat, first.body_fat),
      diffTotalMuscle: calc(
        latest.muscle_mass_percentage,
        first.muscle_mass_percentage
      ),
    };
  }

 // NOVA LÓGICA: Calcula a evolução relativa à avaliação selecionada no Modal
  function getRelativeEvolution(selectedId: string) {
    if (!assessments || assessments.length === 0) return null;

    const currentIndex = assessments.findIndex((a) => a.id === selectedId);
    if (currentIndex === -1) return null;

    const current = assessments[currentIndex];
    const previous = assessments[currentIndex + 1]; // Anterior cronológica
    const first = assessments[assessments.length - 1]; // Primeira de todas

    const currentAnthro = current.anthropometry?.[0];
    const previousAnthro = previous?.anthropometry?.[0];
    const firstAnthro = first?.anthropometry?.[0];

    if (!currentAnthro) return null;

    const calc = (a: any, b: any) => {
      if (!a || !b) return null;
      return (Number(a) - Number(b)).toFixed(1);
    };

    const diffDays = (d1: string, d2: string) => {
      const delta = Math.abs(new Date(d1).getTime() - new Date(d2).getTime());
      return Math.ceil(delta / (1000 * 60 * 60 * 24));
    };

    const formatDate = (d: string) => new Date(d).toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit' });

    return {
      // Dados para o Card "Última vs Anterior"
      diffRecentWeight: calc(currentAnthro.weight, previousAnthro?.weight),
      diffRecentFat: calc(currentAnthro.body_fat, previousAnthro?.body_fat),
      diffRecentMuscle: calc(currentAnthro.muscle_mass_percentage, previousAnthro?.muscle_mass_percentage),
      labelRecent: previous ? `${formatDate(previous.date)} - ${formatDate(current.date)}` : "Primeira avaliação",
      daysRecent: previous ? `${diffDays(current.date, previous.date)} dias` : "-",

      // Dados para o Card "Evolução Total"
      diffTotalWeight: currentIndex !== assessments.length - 1 ? calc(currentAnthro.weight, firstAnthro?.weight) : null,
      diffTotalFat: currentIndex !== assessments.length - 1 ? calc(currentAnthro.body_fat, firstAnthro?.weight) : null,
      diffTotalMuscle: currentIndex !== assessments.length - 1 ? calc(currentAnthro.muscle_mass_percentage, firstAnthro?.muscle_mass_percentage) : null,
      labelTotal: currentIndex !== assessments.length - 1 ? `${formatDate(first.date)} - ${formatDate(current.date)}` : "Início da jornada",
      daysTotal: currentIndex !== assessments.length - 1 ? `${diffDays(current.date, first.date)} dias` : "-"
    };
  }

  function getColor(value: any, type: "fat" | "weight" | "muscle" = "weight") {
    if (value === null || value === "-" || value === undefined) return "#666";
    const num = Number(value);

    if (type === "fat" || type === "weight") {
      if (num < 0) return "#16a34a"; 
      if (num > 0) return "#dc2626"; 
    }

    if (type === "muscle") {
      if (num > 0) return "#16a34a"; 
      if (num < 0) return "#dc2626"; 
    }

    return "#666";
  }

  function formatValue(value: any) {
    if (value === null || value === "-" || value === undefined) return "-";
    const num = Number(value);
    if (num > 0) return `+${value}`;
    return value;
  }

  function handleViewAssessment(assessment: any) {
    setSelectedAssessment(assessment);
    setViewModalVisible(true);
  }

  async function deleteAssessment(id: string) {
    Alert.alert("Excluir avaliação", "Tem certeza?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          await supabase.from("physical_assessments").delete().eq("id", id);
          await loadAssessments();
        },
      },
    ]);
  }

  function handleEditAssessment(assessment: any) {
    const anthro = assessment.anthropometry?.[0];
    if (!anthro) return;

    setEditingAssessmentId(assessment.id);
    setEditingAnthropometryId(anthro.id);

    Object.keys(form).forEach((key) => {
      setForm((prev) => ({
        ...prev,
        [key]: anthro[key]?.toString() ?? "",
      }));
    });
  }

  async function handleSaveAssessment() {
    if (!trainerId) return;
    setSaving(true);

    const payload = {
      weight: form.weight ? Number(form.weight) : null,
      height: form.height ? Number(form.height) : null,
      body_fat: form.body_fat ? Number(form.body_fat) : null,
      waist: form.waist ? Number(form.waist) : null,
      hip: form.hip ? Number(form.hip) : null,
      chest: form.chest ? Number(form.chest) : null,
      abdomen: form.abdomen ? Number(form.abdomen) : null,
      arm_right: form.arm_right ? Number(form.arm_right) : null,
      arm_left: form.arm_left ? Number(form.arm_left) : null,
      thigh_right: form.thigh_right ? Number(form.thigh_right) : null,
      thigh_left: form.thigh_left ? Number(form.thigh_left) : null,
      calf_right: form.calf_right ? Number(form.calf_right) : null,
      calf_left: form.calf_left ? Number(form.calf_left) : null,
      muscle_mass_percentage: form.muscle_mass_percentage ? Number(form.muscle_mass_percentage) : null,
      basal_metabolic_rate: form.basal_metabolic_rate ? Number(form.basal_metabolic_rate) : null,
      body_fat_index: form.body_fat_index ? Number(form.body_fat_index) : null,
      metabolic_age: form.metabolic_age ? Number(form.metabolic_age) : null,
    };

    if (editingAnthropometryId) {
      await supabase.from("anthropometry").update(payload).eq("id", editingAnthropometryId);
      setEditingAnthropometryId(null);
      setEditingAssessmentId(null);
      await loadAssessments();
      setSaving(false);
      Alert.alert("Sucesso", "Avaliação atualizada");
      return;
    }

    const { data: assessment } = await supabase
      .from("physical_assessments")
      .insert([
        {
          client_id: clientId,
          trainer_id: trainerId,
          date: new Date().toISOString(),
          assessor_name: session?.user?.email || "Treinador",
        },
      ])
      .select()
      .single();

    await supabase.from("anthropometry").insert({
      assessment_id: assessment.id,
      ...payload,
    });

    setForm({
      weight: "", height: "", body_fat: "", waist: "", hip: "", chest: "", abdomen: "",
      arm_right: "", arm_left: "", thigh_right: "", thigh_left: "", calf_right: "", calf_left: "",
      muscle_mass_percentage: "", basal_metabolic_rate: "", body_fat_index: "", metabolic_age: "",
    });

    setSaving(false);
    await loadAssessments();
  }
 function handleSendWhatsApp(assessment: any) {
    if (!client) return;

    const anthro = assessment.anthropometry?.[0];
    if (!anthro) {
      Alert.alert("Aviso", "Não há dados nesta avaliação para enviar.");
      return;
    }

    const firstName = client.name.split(' ')[0];
    const currentIndex = assessments.findIndex((a) => a.id === assessment.id);
    const previousAnthro = assessments[currentIndex + 1]?.anthropometry?.[0];

    let evolutionSection = "";
    if (previousAnthro) {
      const diffWeight = (Number(anthro.weight || 0) - Number(previousAnthro.weight || 0)).toFixed(1);
      const diffFat = (Number(anthro.body_fat || 0) - Number(previousAnthro.body_fat || 0)).toFixed(1);
      const diffMuscle = (Number(anthro.muscle_mass_percentage || 0) - Number(previousAnthro.muscle_mass_percentage || 0)).toFixed(1);

      const weightIcon = Number(diffWeight) <= 0 ? "📉" : "📈";
      const fatIcon = Number(diffFat) <= 0 ? "✅" : "⚠️";
      const muscleIcon = Number(diffMuscle) >= 0 ? "🔥" : "💪";

      evolutionSection = `
━━━━━━━━━━━━━
      *EVOLUÇÃO REAL* 🏆
      
${weightIcon} *Peso:* ${diffWeight}kg
${fatIcon} *Gordura:* ${diffFat}%
${muscleIcon} *Músculo:* ${diffMuscle}%
━━━━━━━━━━━━━`;
    }

    const message = `
Olá, *${client.name}*! 👋

Sua nova avaliação do *Vortex Primus* está pronta. Esqueça links externos, o seu resultado está aqui:

📍 *STATUS ATUAL:*
• Peso: *${anthro.weight ?? "-"} kg*
• % Gordura: *${anthro.body_fat ?? "-"}%*
• % Músculo: *${anthro.muscle_mass_percentage ?? "-"}%*
• Idade Metab.: *${anthro.metabolic_age ?? "-"} anos*
${evolutionSection}

Parabéns pela determinação e comprometimento! Esses números são o reflexo do seu suor no Cross. 👏👏👏

Bora buscar a próxima meta? 🔥
_Att, Coach Alzejones_`;

    const encodedMessage = encodeURIComponent(message);
    const url = `whatsapp://send?text=${encodedMessage}`;

    Linking.canOpenURL(url).then((supported) => {
      if (!supported) {
        Alert.alert("Erro", "WhatsApp não instalado.");
      } else {
        return Linking.openURL(url);
      }
    });
  }

  function renderGridInput(label: string, key: keyof typeof form) {
    return (
      <View style={{ flex: 1, paddingHorizontal: 4, marginBottom: 12 }}>
        <Text style={{ fontSize: 12, marginBottom: 4, color: "#333", minHeight: 30 }} numberOfLines={2}>
          {label}
        </Text>
        <TextInput
          style={styles.gridInput}
          keyboardType="numeric"
          value={form[key]}
          onChangeText={(text) => setForm({ ...form, [key]: text })}
        />
      </View>
    );
  }

  function renderTrendIndicator(currentValue: any, previousValue: any, type: "weight" | "fat" | "muscle") {
    if (currentValue === null || previousValue === null || currentValue === undefined || previousValue === undefined || currentValue === "" || previousValue === "") {
      return null;
    }
    
    const diff = Number(currentValue) - Number(previousValue);
    if (diff === 0) return <Text style={{ color: '#9ca3af', fontSize: 12 }}> ➖</Text>; 

    if (type === "muscle") {
      return diff > 0 
        ? <Text style={{ color: '#16a34a', fontSize: 12, fontWeight: 'bold' }}> ⏫</Text> 
        : <Text style={{ color: '#dc2626', fontSize: 12, fontWeight: 'bold' }}> ⏬</Text>;
    } else {
      return diff < 0 
        ? <Text style={{ color: '#16a34a', fontSize: 12, fontWeight: 'bold' }}> ⏬</Text> 
        : <Text style={{ color: '#dc2626', fontSize: 12, fontWeight: 'bold' }}> ⏫</Text>;
    }
  }

  const evolution = getEvolution();
  const relativeEvolution = selectedAssessment ? getRelativeEvolution(selectedAssessment.id) : null;

  if (loading || !client) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Carregando...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView 
          stickyHeaderIndices={[0]} 
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          <View style={styles.stickyHeader}>
            <View style={styles.headerRow}>
              <Text style={styles.headerItem}>
                <Text style={styles.bold}>Nome: </Text>
                {client.name.substring(0, 10)}{client.name.length > 10 ? '...' : ''}
              </Text>
              <Text style={styles.headerItem}>
                <Text style={styles.bold}>Idade: </Text>
                {calculateAge(client.birth_date)}
              </Text>
              <Text style={styles.headerItem}>
                <Text style={styles.bold}>Alt: </Text>
                {client.height_cm}cm
              </Text>
            </View>
          </View>

          <View style={{ padding: 16 }}>
            <Text style={styles.pageTitle}>Nova Avaliação</Text>
            
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Bioimpedância</Text>
              <View style={styles.row}>
                {renderGridInput("Peso", "weight")}
                {renderGridInput("% Gordura", "body_fat")}
                {renderGridInput("% M. Muscular", "muscle_mass_percentage")}
              </View>
              <View style={styles.row}>
                {renderGridInput("Idade Metabólica", "metabolic_age")}
                {renderGridInput("Metabolismo Basal", "basal_metabolic_rate")}
                {renderGridInput("Gordura Visceral", "body_fat_index")}
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Medidas do Tronco</Text>
              <View style={styles.row}>
                {renderGridInput("Peitoral", "chest")}
                {renderGridInput("Abdômen", "abdomen")}
              </View>
              <View style={styles.row}>
                {renderGridInput("Cintura", "waist")}
                {renderGridInput("Quadril", "hip")}
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Medidas dos Membros</Text>
              <View style={styles.row}>
                {renderGridInput("Braço Esquerdo", "arm_left")}
                {renderGridInput("Braço Direito", "arm_right")}
              </View>
              <View style={styles.row}>
                {renderGridInput("Panturrilha Esquerda", "calf_left")}
                {renderGridInput("Panturrilha Direita", "calf_right")}
              </View>
              <View style={styles.row}>
                {renderGridInput("Coxa Esquerda", "thigh_left")}
                {renderGridInput("Coxa Direita", "thigh_right")}
              </View>
            </View>

            <TouchableOpacity style={styles.button} onPress={handleSaveAssessment}>
              <Text style={{ color: "#fff", textAlign: "center", fontWeight: 'bold' }}>
                {saving ? "Salvando..." : editingAssessmentId ? "Atualizar Avaliação" : "Salvar Avaliação"}
              </Text>
            </TouchableOpacity>

            {evolution && (
              <View style={{ flexDirection: "row", gap: 10, marginTop: 25, marginBottom: 10 }}>
                <View style={[styles.card, { flex: 1 }]}>
                  <Text style={styles.cardTitle}>Última vs Anterior</Text>
                  <Text style={{ color: getColor(evolution.diffRecentWeight, "weight"), fontSize: 12 }}>
                    Peso: {formatValue(evolution.diffRecentWeight)} kg
                  </Text>
                  <Text style={{ color: getColor(evolution.diffRecentFat, "fat"), fontSize: 12 }}>
                    % Gord: {formatValue(evolution.diffRecentFat)}
                  </Text>
                  <Text style={{ color: getColor(evolution.diffRecentMuscle, "muscle"), fontSize: 12 }}>
                    % Musc: {formatValue(evolution.diffRecentMuscle)}
                  </Text>
                </View>

                <View style={[styles.card, { flex: 1 }]}>
                  <Text style={styles.cardTitle}>Evolução Total</Text>
                  <Text style={{ color: getColor(evolution.diffTotalWeight, "weight"), fontSize: 12 }}>
                    Peso: {formatValue(evolution.diffTotalWeight)} kg
                  </Text>
                  <Text style={{ color: getColor(evolution.diffTotalFat, "fat"), fontSize: 12 }}>
                    % Gord: {formatValue(evolution.diffTotalFat)}
                  </Text>
                  <Text style={{ color: getColor(evolution.diffTotalMuscle, "muscle"), fontSize: 12 }}>
                    % Musc: {formatValue(evolution.diffTotalMuscle)}
                  </Text>
                </View>
              </View>
            )}

            <Text style={styles.pageTitle}>Histórico de Avaliações</Text>
            {assessments.map((assessment, index) => {
              const anthro = assessment.anthropometry?.[0];
              const previousAnthro = assessments[index + 1]?.anthropometry?.[0]; 
              
              const dateStr = assessment.date 
                ? new Date(assessment.date).toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit', year: '2-digit' }) 
                : "-";

              return (
                <View key={assessment.id} style={styles.historyCard}>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12, alignItems: 'center' }}>
                    <Text style={{ fontSize: 12, color: "#333", fontWeight: "bold" }}>{dateStr}. </Text>
                    <Text style={{ fontSize: 12, color: "#333" }}>
                      Peso: {anthro?.weight ?? "-"} Kg{renderTrendIndicator(anthro?.weight, previousAnthro?.weight, "weight")} | 
                      % Gord: {anthro?.body_fat ?? "-"}{renderTrendIndicator(anthro?.body_fat, previousAnthro?.body_fat, "fat")} | 
                      % Musc.: {anthro?.muscle_mass_percentage ?? "-"}{renderTrendIndicator(anthro?.muscle_mass_percentage, previousAnthro?.muscle_mass_percentage, "muscle")}
                    </Text>
                  </View>

                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <View style={{ flexDirection: "row" }}>
                      <TouchableOpacity onPress={() => handleViewAssessment(assessment)} style={{ marginRight: 15 }}>
                        <Text style={{ color: "#000", fontSize: 13, fontWeight: "bold" }}>Consultar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleEditAssessment(assessment)} style={{ marginRight: 15 }}>
                        <Text style={{ color: "#2563eb", fontSize: 13, fontWeight: "bold" }}>Editar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => deleteAssessment(assessment.id)}>
                        <Text style={{ color: "#dc2626", fontSize: 13, fontWeight: "bold" }}>Excluir</Text>
                      </TouchableOpacity>
                    </View>
                    
                    <TouchableOpacity onPress={() => handleSendWhatsApp(assessment)}>
                      <Text style={{ color: "#16a34a", fontSize: 13, fontWeight: "bold" }}>WhatsApp</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* MODAL DE CONSULTA COMPLETA */}
      <Modal
        visible={viewModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setViewModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
              <Text style={styles.pageTitle}>Detalhes da Avaliação</Text>
              <TouchableOpacity onPress={() => setViewModalVisible(false)}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#888' }}>X</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* CABEÇALHO DE EVOLUÇÃO RELATIVA DENTRO DO MODAL */}
        
                  
                   {relativeEvolution && (
                <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
                  {/* Card 1: Recente */}
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 10, fontWeight: "bold", color: "#666", marginBottom: 4, textAlign: 'center' }}>
                      {relativeEvolution.labelRecent} ({relativeEvolution.daysRecent})
                    </Text>
                    <View style={[styles.card, { marginBottom: 0, padding: 10 }]}>
                      <Text style={[styles.cardTitle, { fontSize: 11, marginBottom: 4 }]}>Última vs Anterior</Text>
                      <Text style={{ color: getColor(relativeEvolution.diffRecentWeight, "weight"), fontSize: 12 }}>
                        Peso: {formatValue(relativeEvolution.diffRecentWeight)} kg
                      </Text>
                      <Text style={{ color: getColor(relativeEvolution.diffRecentFat, "fat"), fontSize: 12 }}>
                        % Gord: {formatValue(relativeEvolution.diffRecentFat)}
                      </Text>
                      <Text style={{ color: getColor(relativeEvolution.diffRecentMuscle, "muscle"), fontSize: 12 }}>
                        % Musc: {formatValue(relativeEvolution.diffRecentMuscle)}
                      </Text>
                    </View>
                  </View>

                  {/* Card 2: Total */}
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 10, fontWeight: "bold", color: "#666", marginBottom: 4, textAlign: 'center' }}>
                      {relativeEvolution.labelTotal} ({relativeEvolution.daysTotal})
                    </Text>
                    <View style={[styles.card, { marginBottom: 0, padding: 10 }]}>
                      <Text style={[styles.cardTitle, { fontSize: 11, marginBottom: 4 }]}>Evolução Total</Text>
                      <Text style={{ color: getColor(relativeEvolution.diffTotalWeight, "weight"), fontSize: 12 }}>
                        Peso: {formatValue(relativeEvolution.diffTotalWeight)} kg
                      </Text>
                      <Text style={{ color: getColor(relativeEvolution.diffTotalFat, "fat"), fontSize: 12 }}>
                        % Gord: {formatValue(relativeEvolution.diffTotalFat)}
                      </Text>
                      <Text style={{ color: getColor(relativeEvolution.diffTotalMuscle, "muscle"), fontSize: 12 }}>
                        % Musc: {formatValue(relativeEvolution.diffTotalMuscle)}
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {selectedAssessment?.anthropometry?.[0] && (() => {
                const data = selectedAssessment.anthropometry[0];
                return (
                  <View style={{ gap: 10 }}>
                    <Text style={styles.cardTitle}>Bioimpedância</Text>
                    <Text>• Peso: {data.weight || "-"} kg</Text>
                    <Text>• % Gordura: {data.body_fat || "-"} %</Text>
                    <Text>• % M. Muscular: {data.muscle_mass_percentage || "-"} %</Text>
                    <Text>• Idade Metabólica: {data.metabolic_age || "-"} anos</Text>
                    <Text>• Metab. Basal: {data.basal_metabolic_rate || "-"} kcal</Text>
                    <Text>• Gord. Visceral: {data.body_fat_index || "-"}</Text>

                    <Text style={[styles.cardTitle, { marginTop: 15 }]}>Tronco</Text>
                    <Text>• Peitoral: {data.chest || "-"} cm</Text>
                    <Text>• Abdômen: {data.abdomen || "-"} cm</Text>
                    <Text>• Cintura: {data.waist || "-"} cm</Text>
                    <Text>• Quadril: {data.hip || "-"} cm</Text>

                    <Text style={[styles.cardTitle, { marginTop: 15 }]}>Membros</Text>
                    <Text>• Braço Esq/Dir: {data.arm_left || "-"} cm / {data.arm_right || "-"} cm</Text>
                    <Text>• Panturrilha Esq/Dir: {data.calf_left || "-"} cm / {data.calf_right || "-"} cm</Text>
                    <Text>• Coxa Esq/Dir: {data.thigh_left || "-"} cm / {data.thigh_right || "-"} cm</Text>
                  </View>
                );
              })()}
            </ScrollView>

            <TouchableOpacity style={styles.button} onPress={() => setViewModalVisible(false)}>
              <Text style={{ color: "#fff", textAlign: "center", fontWeight: 'bold' }}>Fechar Consulta</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  stickyHeader: {
    backgroundColor: "#f9f9f9",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 10 : 12,
    paddingBottom: 12,
    paddingHorizontal: 16,
    zIndex: 1000,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerItem: {
    fontSize: 14,
    color: "#333",
  },
  bold: {
    fontWeight: "bold",
  },
  pageTitle: { 
    fontSize: 18, 
    fontWeight: "bold", 
    marginTop: 10,
    marginBottom: 16,
    color: "#000"
  },
  card: { 
    padding: 12, 
    borderWidth: 1, 
    borderColor: "#e0e0e0", 
    borderRadius: 10, 
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#444",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  gridInput: { 
    borderWidth: 1, 
    borderColor: "#ccc", 
    padding: 8, 
    borderRadius: 6, 
    backgroundColor: '#fafafa',
    textAlign: 'center',
  },
  button: { 
    backgroundColor: "#000", 
    padding: 16, 
    borderRadius: 8, 
    marginTop: 10 
  },
  historyCard: { 
    marginBottom: 12, 
    padding: 12, 
    borderWidth: 1, 
    borderColor: "#ddd", 
    borderRadius: 8, 
    backgroundColor: '#fcfcfc' 
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  }
});
