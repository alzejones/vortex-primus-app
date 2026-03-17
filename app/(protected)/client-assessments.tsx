import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useLocalSearchParams } from "expo-router";
import * as Sharing from "expo-sharing";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert, Dimensions, KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { captureRef } from "react-native-view-shot";

export default function ClientAssessments() {
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


  const formatDateBR = (date: Date) => {
  const d = date.getDate().toString().padStart(2, '0');
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const y = date.getFullYear();
  const h = date.getHours().toString().padStart(2, '0');
  const min = date.getMinutes().toString().padStart(2, '0');
  return `${d}/${m}/${y} ${h}:${min}`;
};

const parseDateBRToISO = (str: string) => {
  try {
    const [datePart, timePart] = str.split(' ');
    const [d, m, y] = datePart.split('/');
    const [h, min] = timePart.split(':');
    return new Date(Number(y), Number(m) - 1, Number(d), Number(h), Number(min)).toISOString();
  } catch (e) {
    return new Date().toISOString();
  }
};

function handleDateChange(text: string) {
    let v = text.replace(/\D/g, ""); // Remove tudo que não for número
    if (v.length > 12) v = v.substring(0, 12);
    
    v = v.replace(/^(\d{2})(\d)/, "$1/$2");
    v = v.replace(/^(\d{2})\/(\d{2})(\d)/, "$1/$2/$3");
    v = v.replace(/^(\d{2})\/(\d{2})\/(\d{4})(\d)/, "$1/$2/$3 $4");
    v = v.replace(/^(\d{2})\/(\d{2})\/(\d{4}) (\d{2})(\d)/, "$1/$2/$3 $4:$5");
    
    setForm({ ...form, assessment_date: v });
  }

// 1. Função Unificada com o join explícito corrigido
const fetchHistory = useCallback(async () => {
  try {
    setLoading(true);

    // Busca os dados básicos do Cliente
    const { data: clientData, error: clientError } = await supabase
      .from("clients")
      .select("*")
      .eq("id", clientId)
      .single();

    if (clientError) throw clientError;
    setClient(clientData);

    // Busca as Avaliações usando a chave específica: anthropometry_assessment_id_fkey
    const { data: assessmentsData, error: assessError } = await supabase
      .from("physical_assessments")
      .select(`
        *,
        anthropometry:anthropometry!anthropometry_assessment_id_fkey (*)
      `)
      .eq("client_id", clientId)
      .order("date", { ascending: false });

    if (assessError) throw assessError;
    
    setAssessments(assessmentsData || []);

  } catch (error: any) {
    console.error("Erro ao carregar histórico:", error.message);
    Alert.alert("Erro", "Não foi possível carregar as avaliações.");
  } finally {
    setLoading(false);
  }
}, [clientId]);

// 2. useEffect único para disparar a busca de forma segura
useEffect(() => {
  if (clientId) {
    fetchHistory();
  }
}, [clientId, fetchHistory]);

  // 1. A "Lente" da câmera
  const viewRef = useRef(null);

  // 2. O "Gatilho" para tirar a foto e compartilhar
  async function handleShareImage() {
    try {
      // Tira a foto da área que vamos marcar no próximo passo
      const uri = await captureRef(viewRef, {
        format: "jpg",
        quality: 0.9,
      });
// Abre a janelinha de partilha (WhatsApp, etc)
      await Sharing.shareAsync(uri, {
        dialogTitle: 'Compartilhar Evolução - Vortex Primus',
        mimeType: 'image/jpeg',
      });
    } catch (error) {
      console.error("Erro ao gerar imagem:", error);
      Alert.alert("Erro", "Não foi possível gerar a imagem da evolução.");
    }
  }
 const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };
  
 // --- LÓGICA DO GRÁFICO (Gordura vs Músculo) ---
  // Invertemos o array para ordem cronológica (da mais antiga para a atual)
  const chronologicalAssessments = [...(assessments || [])].reverse();
  
  // Filtramos para garantir que só entram avaliações que tenham dados preenchidos
  const chartAssessments = chronologicalAssessments.filter(a => a.anthropometry && a.anthropometry.length > 0);

  // Eixo X (Quantidade de avaliações: Av 1, Av 2, Av 3...)
  const chartLabels = chartAssessments.length > 0 
    ? chartAssessments.map((_, index) => `Av ${index + 1}`) 
    : ["-"];

  // Eixo Y (Linha da Gordura e Linha do Músculo)
  const fatData = chartAssessments.length > 0 
    ? chartAssessments.map(a => Number(a.anthropometry[0].body_fat) || 0)
    : [0];

  const muscleData = chartAssessments.length > 0 
    ? chartAssessments.map(a => Number(a.anthropometry[0].muscle_mass_percentage) || 0)
    : [0];

  // Largura da tela menos as margens para o gráfico encaixar perfeito
  const screenWidth = Dimensions.get("window").width - 60; 


  // Estados para o Modal de "Consultar"
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<any>(null);

  const [form, setForm] = useState({
    assessment_date: formatDateBR(new Date()), 
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

// Dispara a busca sempre que o ID do cliente estiver disponível
useEffect(() => {
  if (clientId) {
    fetchHistory();
  }
}, [clientId]);

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
    const previous = assessments[currentIndex + 1];
    const first = assessments[assessments.length - 1];

    const currentAnthro = current.anthropometry?.[0];
    const previousAnthro = previous?.anthropometry?.[0];
    const firstAnthro = first?.anthropometry?.[0];

    if (!currentAnthro) return null;

    const calc = (a: any, b: any) => {if (!a || !b) return null;
      return (Number(a) - Number(b)).toFixed(1);
    };

    const diffDays = (d1: string, d2: string) => {
      const delta = Math.abs(new Date(d1).getTime() - new Date(d2).getTime());
      return Math.ceil(delta / (1000 * 60 * 60 * 24));
    };

    const formatDate = (d: string) => new Date(d).toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit' });
    const isNotFirst = currentIndex !== assessments.length - 1;

    return {
      // --- BIOIMPEDÂNCIA ---
      diffRecentWeight: calc(currentAnthro.weight, previousAnthro?.weight),
      diffRecentFat: calc(currentAnthro.body_fat, previousAnthro?.body_fat),
      diffRecentMuscle: calc(currentAnthro.muscle_mass_percentage, previousAnthro?.muscle_mass_percentage),
      
      diffTotalWeight: isNotFirst ? calc(currentAnthro.weight, firstAnthro?.weight) : null,
      diffTotalFat: isNotFirst ? calc(currentAnthro.body_fat, firstAnthro?.body_fat) : null,
      diffTotalMuscle: isNotFirst ? calc(currentAnthro.muscle_mass_percentage, firstAnthro?.muscle_mass_percentage) : null,

      // --- TRONCO ---
      diffRecentChest: calc(currentAnthro.chest, previousAnthro?.chest),
      diffTotalChest: isNotFirst ? calc(currentAnthro.chest, firstAnthro?.chest) : null,
      diffRecentAbdomen: calc(currentAnthro.abdomen, previousAnthro?.abdomen),
      diffTotalAbdomen: isNotFirst ? calc(currentAnthro.abdomen, firstAnthro?.abdomen) : null,
      diffRecentWaist: calc(currentAnthro.waist, previousAnthro?.waist),
      diffTotalWaist: isNotFirst ? calc(currentAnthro.waist, firstAnthro?.waist) : null,
      diffRecentHip: calc(currentAnthro.hip, previousAnthro?.hip),
      diffTotalHip: isNotFirst ? calc(currentAnthro.hip, firstAnthro?.hip) : null,

      // --- MEMBROS (Esquerdo / Direito) ---
      diffRecentArmL: calc(currentAnthro.arm_left, previousAnthro?.arm_left),
      diffRecentArmR: calc(currentAnthro.arm_right, previousAnthro?.arm_right),
      diffTotalArmL: isNotFirst ? calc(currentAnthro.arm_left, firstAnthro?.arm_left) : null,
      diffTotalArmR: isNotFirst ? calc(currentAnthro.arm_right, firstAnthro?.arm_right) : null,

      diffRecentCalfL: calc(currentAnthro.calf_left, previousAnthro?.calf_left),
      diffRecentCalfR: calc(currentAnthro.calf_right, previousAnthro?.calf_right),
      diffTotalCalfL: isNotFirst ? calc(currentAnthro.calf_left, firstAnthro?.calf_left) : null,
      diffTotalCalfR: isNotFirst ? calc(currentAnthro.calf_right, firstAnthro?.calf_right) : null,

      diffRecentThighL: calc(currentAnthro.thigh_left, previousAnthro?.thigh_left),
      diffRecentThighR: calc(currentAnthro.thigh_right, previousAnthro?.thigh_right),
      diffTotalThighL: isNotFirst ? calc(currentAnthro.thigh_left, firstAnthro?.thigh_left) : null,
      diffTotalThighR: isNotFirst ? calc(currentAnthro.thigh_right, firstAnthro?.thigh_right) : null,

      // --- LABELS E DATAS ---
      labelRecent: previous ? `${formatDate(previous.date)} - ${formatDate(current.date)}` : "Primeira avaliação",
      daysRecent: previous ? `${diffDays(current.date, previous.date)} dias` : "-",
      labelTotal: isNotFirst ? `${formatDate(first.date)} - ${formatDate(current.date)}` : "Início da jornada",
      daysTotal: isNotFirst ? `${diffDays(current.date, first.date)} dias` : "-"
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
    Alert.alert("Excluir avaliação", "Tem certeza que deseja apagar permanentemente?", [
      { text: "Cancelar", style: "cancel" },
{
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          try {
            setLoading(true);

            // 1. Remove os dados da antropometria
            await supabase
              .from("anthropometry")
              .delete()
              .eq("assessment_id", id);

            // 2. Remove a avaliação principal
            await supabase
              .from("physical_assessments")
              .delete()
              .eq("id", id);

            // 3. Atualiza a lista na memória (remove da tela na hora)
            setAssessments((prev) => prev.filter((a) => a.id !== id));
            
            // 4. Sincroniza com o banco de dados
            await fetchHistory();

          } catch (error: any) {
            console.error("Erro na exclusão:", error);
            Alert.alert("Erro", "Ocorreu um problema ao excluir a avaliação.");
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  }

  function handleEditAssessment(assessment: any) {
    const anthro = assessment.anthropometry?.[0];
    if (!anthro) return;

    setEditingAssessmentId(assessment.id);
    setEditingAnthropometryId(anthro.id);

    const dateToSet = assessment.date ? formatDateBR(new Date(assessment.date)) : formatDateBR(new Date());

    setForm((prev: any) => {
      const newForm = { ...prev, assessment_date: dateToSet };
      Object.keys(newForm).forEach((key) => {
        if (key !== 'assessment_date') {
          newForm[key] = anthro[key]?.toString() ?? "";
        }
      });
      return newForm;
    });
  }


async function handleSaveAssessment() {
    setSaving(true);
    const isoDate = parseDateBRToISO(form.assessment_date);

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
      if (editingAssessmentId) {
        await supabase.from("physical_assessments").update({ date: isoDate }).eq("id", editingAssessmentId);
      }
      
      await supabase.from("anthropometry").update(payload).eq("id", editingAnthropometryId);
      
      setEditingAnthropometryId(null);
      setEditingAssessmentId(null);
      
      // Reseta o formulário e volta a data para o momento atual
      setForm({
        assessment_date: formatDateBR(new Date()),
        weight: "", height: "", body_fat: "", waist: "", hip: "", chest: "", abdomen: "", arm_right: "", arm_left: "", thigh_right: "", thigh_left: "", calf_right: "", calf_left: "",
        muscle_mass_percentage: "", basal_metabolic_rate: "", body_fat_index: "", metabolic_age: "",
      });

      await fetchHistory();
      setSaving(false);
      Alert.alert("Sucesso", "Avaliação atualizada");
      return;
    }

    // Inserção de NOVA avaliação
    const { data: assessment } = await supabase
      .from("physical_assessments")
      .insert([
        {
          client_id: clientId,
          trainer_id: trainerId,
          date: isoDate, // Salva com a data que está no campo do cabeçalho
          assessor_name: session?.user?.email || "Treinador",
        },
      ])
      .select()
      .single();

    await supabase.from("anthropometry").insert({
      assessment_id: assessment.id,
      ...payload,
    });

    // Reseta o formulário e volta a data para o momento atual
    setForm({
      assessment_date: formatDateBR(new Date()),
      weight: "", height: "", body_fat: "", waist: "", hip: "", chest: "", abdomen: "", arm_right: "", arm_left: "", thigh_right: "", thigh_left: "", calf_right: "", calf_left: "",
      muscle_mass_percentage: "", basal_metabolic_rate: "", body_fat_index: "", metabolic_age: "",
    });

    setSaving(false);
    await fetchHistory();
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
          style={styles.gridInput as any}
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
      // Lógica restaurada para Peso e Gordura
      // diff > 0 (Subiu) -> Vermelho
      // diff < 0 (Desceu) -> Verde
      return diff > 0 
        ? <Text style={{ color: '#dc2626', fontSize: 12, fontWeight: 'bold' }}> ⏫</Text>
        : <Text style={{ color: '#16a34a', fontSize: 12, fontWeight: 'bold' }}> ⏬</Text>;
    }
  }
 
        const evolution = getEvolution();
  const relativeEvolution = selectedAssessment ? getRelativeEvolution(selectedAssessment.id) : null;

  if (loading || !client) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={{ marginTop: 10 }}>Carregando dados do aluno...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff", paddingTop: Platform.OS === "android" ? 48 : 0 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
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
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 16 }}>
              <Text style={[styles.pageTitle, { marginTop: 0, marginBottom: 0 }]}>Nova Avaliação</Text>
              
              <View style={{ width: 140 }}>
                <Text style={{ fontSize: 10, color: '#666', marginBottom: 2, fontWeight: 'bold' }}>Data / Hora</Text>
                <TextInput 
              style={[styles.gridInput, { fontSize: 12, padding: 6, minHeight: 35, textAlign: 'center' }]}
              value={form.assessment_date}
              onChangeText={handleDateChange}
              placeholder="DD/MM/AAAA HH:mm"
              keyboardType="numeric"
              maxLength={16}
            />
              </View>
            </View>
            
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

            <TouchableOpacity 
              style={[styles.button, saving && { opacity: 0.7 }]} 
              onPress={handleSaveAssessment}
              disabled={saving}
            >
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

            <View style={{ marginBottom: 20, alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, padding: 10 }}>
<View style={{ backgroundColor: "#1e293b", paddingVertical: 20, paddingHorizontal: 10, borderRadius: 16, marginVertical: 8, elevation: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5 }}>
    <LineChart
      data={fatData.map((val, index) => ({ value: Number(val) || 0, label: chartLabels[index] }))}
      data2={muscleData.map((val) => ({ value: Number(val) || 0 }))}
      height={220}
      width={screenWidth - 80}
      isAnimated
      animationDuration={1200}
      curved
      spacing={Math.max(35, (screenWidth - 140) / (fatData.length > 1 ? fatData.length - 1 : 1))}
      initialSpacing={20}
      endSpacing={20} 
      color1="#ef4444" 
      color2="#22c55e" 
      dataPointsColor1="#ef4444"
      dataPointsColor2="#22c55e"
      thickness1={3}
      thickness2={3}
      dataPointsRadius={4}
      yAxisColor="rgba(255,255,255,0.3)"
      xAxisColor="rgba(255,255,255,0.3)"
      yAxisTextStyle={{ color: "#94a3b8", fontSize: 11 }}
      xAxisLabelTextStyle={{ color: "#94a3b8", fontSize: 11, marginBottom: -10 }}
      yAxisLabelSuffix="%"
      stepValue={5}
      maxValue={Math.ceil((Math.max(10, ...fatData.map(Number), ...muscleData.map(Number)) + 5) / 5) * 5}
      noOfSections={Math.ceil((Math.max(10, ...fatData.map(Number), ...muscleData.map(Number)) + 5) / 5)}
      rulesColor="rgba(255,255,255,0.25)"
      hideRules={false}
      showVerticalLines={true}
      verticalLinesColor="rgba(255,255,255,0.15)"
    />
    
    {/* Legenda Customizada Premium */}
    <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 24 }}>
        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#ef4444', marginRight: 8 }} />
        <Text style={{ color: '#e2e8f0', fontSize: 12, fontWeight: '600' }}>% Gordura</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#22c55e', marginRight: 8 }} />
        <Text style={{ color: '#e2e8f0', fontSize: 12, fontWeight: '600' }}>% Músculo</Text>
      </View>
    </View>

    {/* Dica de Scroll Inteligente (Aparece apenas se houver mais de 7 avaliações) */}
    {fatData.length > 7 && (
      <Text style={{ color: '#94a3b8', fontSize: 11, textAlign: 'center', marginTop: 16, fontStyle: 'italic' }}>
        ↔️ Deslize o gráfico para o lado para ver o histórico completo
      </Text>
    )}
  </View>

            </View>

            <Text style={styles.pageTitle}>Histórico de Avaliações</Text>
{assessments.map((assessment, index) => {
  const anthro = assessment.anthropometry?.[0];
  const previousAnthro = assessments[index + 1]?.anthropometry?.[0]; 
  
  const dateStr = assessment.date 
    ? new Date(assessment.date).toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit', year: 'numeric' }) 
    : "-";

  return (
    <View key={assessment.id} style={{
      backgroundColor: '#fff',
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      borderWidth: 1,
      borderColor: '#f1f5f9'
    }}>
      {/* CABEÇALHO: Data e Botão Principal */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#3b82f6', marginRight: 8 }} />
          <Text style={{ fontSize: 13, color: '#64748b', fontWeight: '700', letterSpacing: 0.5 }}>{dateStr}</Text>
        </View>
        <TouchableOpacity onPress={() => handleViewAssessment(assessment)} style={{ backgroundColor: '#eff6ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}>
          <Text style={{ color: '#2563eb', fontSize: 12, fontWeight: '700' }}>VER DETALHES</Text>
        </TouchableOpacity>
      </View>

      {/* TRÍADE DE PERFORMANCE: Os 3 dados mais importantes em destaque */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
        
        {/* Coluna: Peso */}
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ fontSize: 11, color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase', marginBottom: 4 }}>Peso</Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
            <Text style={{ fontSize: 24, color: '#0f172a', fontWeight: '900' }}>{anthro?.weight ?? "-"}</Text>
            <Text style={{ fontSize: 12, color: '#64748b', fontWeight: '700', marginLeft: 2 }}>kg</Text>
          </View>
          <View style={{ marginTop: 4 }}>{renderTrendIndicator(anthro?.weight, previousAnthro?.weight, "weight")}</View>
        </View>

        {/* Divisor Vertical */}
        <View style={{ width: 1, backgroundColor: '#e2e8f0', height: '70%', alignSelf: 'center' }} />

        {/* Coluna: Gordura */}
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ fontSize: 11, color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase', marginBottom: 4 }}>Gordura</Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
            <Text style={{ fontSize: 24, color: '#ef4444', fontWeight: '900' }}>{anthro?.body_fat ?? "-"}</Text>
            <Text style={{ fontSize: 12, color: '#ef4444', fontWeight: '700', marginLeft: 2 }}>%</Text>
          </View>
          <View style={{ marginTop: 4 }}>{renderTrendIndicator(anthro?.body_fat, previousAnthro?.body_fat, "fat")}</View>
        </View>

        {/* Divisor Vertical */}
        <View style={{ width: 1, backgroundColor: '#e2e8f0', height: '70%', alignSelf: 'center' }} />

        {/* Coluna: Músculo */}
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ fontSize: 11, color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase', marginBottom: 4 }}>Músculo</Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
            <Text style={{ fontSize: 24, color: '#22c55e', fontWeight: '900' }}>{anthro?.muscle_mass_percentage ?? "-"}</Text>
            <Text style={{ fontSize: 12, color: '#22c55e', fontWeight: '700', marginLeft: 2 }}>%</Text>
          </View>
          <View style={{ marginTop: 4 }}>{renderTrendIndicator(anthro?.muscle_mass_percentage, previousAnthro?.muscle_mass_percentage, "muscle")}</View>
        </View>
        
      </View>

      {/* RODAPÉ DE AÇÕES: Controles secundários organizados */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: 12, borderRadius: 10 }}>
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity onPress={() => handleEditAssessment(assessment)} style={{ marginRight: 20 }}>
            <Text style={{ color: "#475569", fontSize: 13, fontWeight: "700" }}>✏️ Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => deleteAssessment(assessment.id)}>
            <Text style={{ color: "#ef4444", fontSize: 13, fontWeight: "700" }}>🗑️ Excluir</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity onPress={() => handleSendWhatsApp(assessment)}>
          <Text style={{ color: "#16a34a", fontSize: 13, fontWeight: "800" }}>📲 WhatsApp</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
})}

          </View>
        </ScrollView>
      </KeyboardAvoidingView>

<Modal
        visible={viewModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setViewModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            
            {/* CABEÇALHO DO MODAL */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
              <Text style={styles.pageTitle}>Detalhes da Avaliação</Text>
              <TouchableOpacity onPress={() => setViewModalVisible(false)} style={{ padding: 5 }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#64748b' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              
              {/* ÁREA DE PRINT (COMPARTILHAMENTO) */}
              <View ref={viewRef} collapsable={false} style={{ backgroundColor: '#fff', padding: 12, borderRadius: 12 }}>
                
                <Text style={{ fontSize: 18, fontWeight: '900', color: '#0f172a', textAlign: 'center', marginBottom: 15, textTransform: 'uppercase' }}>
                  Vortex Primus - Evolução de {client?.name.split(' ')[0]}
                </Text> 

                {/* GRÁFICO PREMIUM (Mantido intacto) */}
                <View style={{ alignItems: 'center', marginBottom: 24 }}>
                  <View style={{ backgroundColor: "#1e293b", paddingVertical: 20, paddingHorizontal: 10, borderRadius: 16, elevation: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5 }}>
                    <LineChart
                      data={fatData.map((val, index) => ({ value: Number(val) || 0, label: chartLabels[index] }))}
                      data2={muscleData.map((val) => ({ value: Number(val) || 0 }))}
                      height={220}
                      width={screenWidth - 80}
                      isAnimated
                      animationDuration={1200}
                      curved
                      spacing={Math.max(35, (screenWidth - 140) / (fatData.length > 1 ? fatData.length - 1 : 1))}
                      initialSpacing={20}
                      endSpacing={20} 
                      color1="#ef4444" 
                      color2="#22c55e" 
                      dataPointsColor1="#ef4444"
                      dataPointsColor2="#22c55e"
                      thickness1={3}
                      thickness2={3}
                      dataPointsRadius={4}
                      yAxisColor="rgba(255,255,255,0.3)"
                      xAxisColor="rgba(255,255,255,0.3)"
                      yAxisTextStyle={{ color: "#94a3b8", fontSize: 11 }}
                      xAxisLabelTextStyle={{ color: "#94a3b8", fontSize: 11, marginBottom: -10 }}
                      yAxisLabelSuffix="%"
                      stepValue={5}
                      maxValue={Math.ceil((Math.max(10, ...fatData.map(Number), ...muscleData.map(Number)) + 5) / 5) * 5}
                      noOfSections={Math.ceil((Math.max(10, ...fatData.map(Number), ...muscleData.map(Number)) + 5) / 5)}
                      rulesColor="rgba(255,255,255,0.25)"
                      hideRules={false}
                      showVerticalLines={true}
                      verticalLinesColor="rgba(255,255,255,0.15)"
                    />
                    <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 24 }}>
                        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#ef4444', marginRight: 8 }} />
                        <Text style={{ color: '#e2e8f0', fontSize: 12, fontWeight: '600' }}>% Gordura</Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#22c55e', marginRight: 8 }} />
                        <Text style={{ color: '#e2e8f0', fontSize: 12, fontWeight: '600' }}>% Músculo</Text>
                      </View>
                    </View>
                    {fatData.length > 7 && (
                      <Text style={{ color: '#94a3b8', fontSize: 11, textAlign: 'center', marginTop: 16, fontStyle: 'italic' }}>↔️ Deslize o gráfico para ver mais</Text>
                    )}
                  </View>
                </View>
             
                {/* PAINEL DE EVOLUÇÃO COMPARATIVA */}
                {relativeEvolution && (
                  <View style={{ marginBottom: 24 }}>
                    <Text style={{ fontSize: 15, fontWeight: '900', color: '#0f172a', marginBottom: 12, textTransform: 'uppercase' }}>📉 Análise de Evolução</Text>

                    {/* Cabeçalhos */}
                    <View style={{ flexDirection: 'row', marginBottom: 8, paddingHorizontal: 4 }}>
                      <View style={{ flex: 1 }}><Text style={{ fontSize: 11, fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Última vs Anterior</Text></View>
                      <View style={{ flex: 1, alignItems: 'flex-end' }}><Text style={{ fontSize: 11, fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Evolução Total</Text></View>
                    </View>
                    <View style={{ flexDirection: 'row', marginBottom: 12, paddingHorizontal: 4 }}>
                      <View style={{ flex: 1 }}><Text style={{ fontSize: 10, color: '#94a3b8' }}>{relativeEvolution.labelRecent} ({relativeEvolution.daysRecent})</Text></View>
                      <View style={{ flex: 1, alignItems: 'flex-end' }}><Text style={{ fontSize: 10, color: '#94a3b8' }}>{relativeEvolution.labelTotal} ({relativeEvolution.daysTotal})</Text></View>
                    </View>

                    {/* Linha 1: Bioimpedância */}
                    <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                      {/* Recente */}
                      <View style={{ flex: 1, backgroundColor: '#f8fafc', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' }}>
                        <Text style={{ fontSize: 12, fontWeight: '800', color: '#3b82f6', marginBottom: 8 }}>BIOIMPEDÂNCIA</Text>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}><Text style={{ fontSize: 12, color: '#475569' }}>Peso</Text><Text style={{ fontSize: 12, fontWeight: '800', color: getColor(relativeEvolution.diffRecentWeight, "weight") }}>{formatValue(relativeEvolution.diffRecentWeight)} kg</Text></View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}><Text style={{ fontSize: 12, color: '#475569' }}>% Gord</Text><Text style={{ fontSize: 12, fontWeight: '800', color: getColor(relativeEvolution.diffRecentFat, "fat") }}>{formatValue(relativeEvolution.diffRecentFat)}</Text></View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={{ fontSize: 12, color: '#475569' }}>% Musc</Text><Text style={{ fontSize: 12, fontWeight: '800', color: getColor(relativeEvolution.diffRecentMuscle, "muscle") }}>{formatValue(relativeEvolution.diffRecentMuscle)}</Text></View>
                      </View>
                      {/* Total */}
                      <View style={{ flex: 1, backgroundColor: '#f8fafc', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' }}>
                        <Text style={{ fontSize: 12, fontWeight: '800', color: '#3b82f6', marginBottom: 8 }}>BIOIMPEDÂNCIA</Text>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}><Text style={{ fontSize: 12, color: '#475569' }}>Peso</Text><Text style={{ fontSize: 12, fontWeight: '800', color: getColor(relativeEvolution.diffTotalWeight, "weight") }}>{formatValue(relativeEvolution.diffTotalWeight)} kg</Text></View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}><Text style={{ fontSize: 12, color: '#475569' }}>% Gord</Text><Text style={{ fontSize: 12, fontWeight: '800', color: getColor(relativeEvolution.diffTotalFat, "fat") }}>{formatValue(relativeEvolution.diffTotalFat)}</Text></View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={{ fontSize: 12, color: '#475569' }}>% Musc</Text><Text style={{ fontSize: 12, fontWeight: '800', color: getColor(relativeEvolution.diffTotalMuscle, "muscle") }}>{formatValue(relativeEvolution.diffTotalMuscle)}</Text></View>
                      </View>
                    </View>

                    {/* Linha 2: Tronco */}
                    <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                      <View style={{ flex: 1, backgroundColor: '#f8fafc', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' }}>
                        <Text style={{ fontSize: 12, fontWeight: '800', color: '#ea580c', marginBottom: 8 }}>TRONCO</Text>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}><Text style={{ fontSize: 12, color: '#475569' }}>Peitoral</Text><Text style={{ fontSize: 12, fontWeight: '800', color: getColor(relativeEvolution.diffRecentChest, "weight") }}>{formatValue(relativeEvolution.diffRecentChest)} cm</Text></View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}><Text style={{ fontSize: 12, color: '#475569' }}>Abdômen</Text><Text style={{ fontSize: 12, fontWeight: '800', color: getColor(relativeEvolution.diffRecentAbdomen, "weight") }}>{formatValue(relativeEvolution.diffRecentAbdomen)} cm</Text></View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}><Text style={{ fontSize: 12, color: '#475569' }}>Cintura</Text><Text style={{ fontSize: 12, fontWeight: '800', color: getColor(relativeEvolution.diffRecentWaist, "weight") }}>{formatValue(relativeEvolution.diffRecentWaist)} cm</Text></View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={{ fontSize: 12, color: '#475569' }}>Quadril</Text><Text style={{ fontSize: 12, fontWeight: '800', color: getColor(relativeEvolution.diffRecentHip, "weight") }}>{formatValue(relativeEvolution.diffRecentHip)} cm</Text></View>
                      </View>
                      <View style={{ flex: 1, backgroundColor: '#f8fafc', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' }}>
                        <Text style={{ fontSize: 12, fontWeight: '800', color: '#ea580c', marginBottom: 8 }}>TRONCO</Text>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}><Text style={{ fontSize: 12, color: '#475569' }}>Peitoral</Text><Text style={{ fontSize: 12, fontWeight: '800', color: getColor(relativeEvolution.diffTotalChest, "weight") }}>{formatValue(relativeEvolution.diffTotalChest)} cm</Text></View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}><Text style={{ fontSize: 12, color: '#475569' }}>Abdômen</Text><Text style={{ fontSize: 12, fontWeight: '800', color: getColor(relativeEvolution.diffTotalAbdomen, "weight") }}>{formatValue(relativeEvolution.diffTotalAbdomen)} cm</Text></View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}><Text style={{ fontSize: 12, color: '#475569' }}>Cintura</Text><Text style={{ fontSize: 12, fontWeight: '800', color: getColor(relativeEvolution.diffTotalWaist, "weight") }}>{formatValue(relativeEvolution.diffTotalWaist)} cm</Text></View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={{ fontSize: 12, color: '#475569' }}>Quadril</Text><Text style={{ fontSize: 12, fontWeight: '800', color: getColor(relativeEvolution.diffTotalHip, "weight") }}>{formatValue(relativeEvolution.diffTotalHip)} cm</Text></View>
                      </View>
                    </View>

                    {/* Linha 3: Membros */}
                    <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                      <View style={{ flex: 1, backgroundColor: '#f8fafc', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' }}>
                        <Text style={{ fontSize: 12, fontWeight: '800', color: '#16a34a', marginBottom: 8 }}>MEMBROS (E/D)</Text>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}><Text style={{ fontSize: 12, color: '#475569' }}>Braço</Text><Text style={{ fontSize: 12, fontWeight: '800', color: getColor(relativeEvolution.diffRecentArmL, "weight") }}>{formatValue(relativeEvolution.diffRecentArmL)} / {formatValue(relativeEvolution.diffRecentArmR)}</Text></View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}><Text style={{ fontSize: 12, color: '#475569' }}>Coxa</Text><Text style={{ fontSize: 12, fontWeight: '800', color: getColor(relativeEvolution.diffRecentThighL, "weight") }}>{formatValue(relativeEvolution.diffRecentThighL)} / {formatValue(relativeEvolution.diffRecentThighR)}</Text></View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={{ fontSize: 12, color: '#475569' }}>Pantur.</Text><Text style={{ fontSize: 12, fontWeight: '800', color: getColor(relativeEvolution.diffRecentCalfL, "weight") }}>{formatValue(relativeEvolution.diffRecentCalfL)} / {formatValue(relativeEvolution.diffRecentCalfR)}</Text></View>
                      </View>
                      <View style={{ flex: 1, backgroundColor: '#f8fafc', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' }}>
                        <Text style={{ fontSize: 12, fontWeight: '800', color: '#16a34a', marginBottom: 8 }}>MEMBROS (E/D)</Text>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}><Text style={{ fontSize: 12, color: '#475569' }}>Braço</Text><Text style={{ fontSize: 12, fontWeight: '800', color: getColor(relativeEvolution.diffTotalArmL, "weight") }}>{formatValue(relativeEvolution.diffTotalArmL)} / {formatValue(relativeEvolution.diffTotalArmR)}</Text></View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}><Text style={{ fontSize: 12, color: '#475569' }}>Coxa</Text><Text style={{ fontSize: 12, fontWeight: '800', color: getColor(relativeEvolution.diffTotalThighL, "weight") }}>{formatValue(relativeEvolution.diffTotalThighL)} / {formatValue(relativeEvolution.diffTotalThighR)}</Text></View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={{ fontSize: 12, color: '#475569' }}>Pantur.</Text><Text style={{ fontSize: 12, fontWeight: '800', color: getColor(relativeEvolution.diffTotalCalfL, "weight") }}>{formatValue(relativeEvolution.diffTotalCalfL)} / {formatValue(relativeEvolution.diffTotalCalfR)}</Text></View>
                      </View>
                    </View>
                  </View>
                )}

                {/* DIAGNÓSTICO ATUAL UNIFICADO (Substitui as duas listas antigas) */}
                <View style={{ marginTop: 10, borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 20 }}>
                  <Text style={{ fontSize: 15, fontWeight: '900', color: '#0f172a', marginBottom: 16, textTransform: 'uppercase' }}>📋 Diagnóstico Desta Avaliação</Text>
                  
                  {/* Bloco Composição */}
                  <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0' }}>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: '#3b82f6', marginBottom: 10 }}>📊 COMPOSIÇÃO CORPORAL</Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingVertical: 6 }}><Text style={{ color: '#475569', fontSize: 13 }}>Peso Corporal</Text><Text style={{ fontWeight: '800', color: '#0f172a' }}>{selectedAssessment?.anthropometry?.[0]?.weight ?? "-"} kg</Text></View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingVertical: 6 }}><Text style={{ color: '#475569', fontSize: 13 }}>% Gordura</Text><Text style={{ fontWeight: '800', color: '#0f172a' }}>{selectedAssessment?.anthropometry?.[0]?.body_fat ?? "-"} %</Text></View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingVertical: 6 }}><Text style={{ color: '#475569', fontSize: 13 }}>% Massa Muscular</Text><Text style={{ fontWeight: '800', color: '#0f172a' }}>{selectedAssessment?.anthropometry?.[0]?.muscle_mass_percentage ?? "-"} %</Text></View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingVertical: 6 }}><Text style={{ color: '#475569', fontSize: 13 }}>Idade Metabólica</Text><Text style={{ fontWeight: '800', color: '#0f172a' }}>{selectedAssessment?.anthropometry?.[0]?.metabolic_age ?? "-"} anos</Text></View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingVertical: 6 }}><Text style={{ color: '#475569', fontSize: 13 }}>Gordura Visceral</Text><Text style={{ fontWeight: '800', color: '#0f172a' }}>{selectedAssessment?.anthropometry?.[0]?.body_fat_index ?? "-"}</Text></View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}><Text style={{ color: '#475569', fontSize: 13 }}>Metabolismo Basal</Text><Text style={{ fontWeight: '800', color: '#0f172a' }}>{selectedAssessment?.anthropometry?.[0]?.basal_metabolic_rate ?? "-"} kcal</Text></View>
                  </View>

                  {/* Bloco Tronco & Membros Lado a Lado */}
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#e2e8f0' }}>
                      <Text style={{ fontSize: 12, fontWeight: '800', color: '#ea580c', marginBottom: 10 }}>📏 TRONCO</Text>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingVertical: 4 }}><Text style={{ color: '#475569', fontSize: 12 }}>Peitoral</Text><Text style={{ fontWeight: '800', fontSize: 12, color: '#0f172a' }}>{selectedAssessment?.anthropometry?.[0]?.chest ?? "-"} cm</Text></View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingVertical: 4 }}><Text style={{ color: '#475569', fontSize: 12 }}>Abdômen</Text><Text style={{ fontWeight: '800', fontSize: 12, color: '#0f172a' }}>{selectedAssessment?.anthropometry?.[0]?.abdomen ?? "-"} cm</Text></View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingVertical: 4 }}><Text style={{ color: '#475569', fontSize: 12 }}>Cintura</Text><Text style={{ fontWeight: '800', fontSize: 12, color: '#0f172a' }}>{selectedAssessment?.anthropometry?.[0]?.waist ?? "-"} cm</Text></View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}><Text style={{ color: '#475569', fontSize: 12 }}>Quadril</Text><Text style={{ fontWeight: '800', fontSize: 12, color: '#0f172a' }}>{selectedAssessment?.anthropometry?.[0]?.hip ?? "-"} cm</Text></View>
                    </View>
                    
                    <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#e2e8f0' }}>
                      <Text style={{ fontSize: 12, fontWeight: '800', color: '#16a34a', marginBottom: 10 }}>🦵 MEMBROS (E/D)</Text>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingVertical: 4 }}><Text style={{ color: '#475569', fontSize: 12 }}>Braço</Text><Text style={{ fontWeight: '800', fontSize: 12, color: '#0f172a' }}>{selectedAssessment?.anthropometry?.[0]?.arm_left ?? "-"}/{selectedAssessment?.anthropometry?.[0]?.arm_right ?? "-"}</Text></View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingVertical: 4 }}><Text style={{ color: '#475569', fontSize: 12 }}>Coxa</Text><Text style={{ fontWeight: '800', fontSize: 12, color: '#0f172a' }}>{selectedAssessment?.anthropometry?.[0]?.thigh_left ?? "-"}/{selectedAssessment?.anthropometry?.[0]?.thigh_right ?? "-"}</Text></View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}><Text style={{ color: '#475569', fontSize: 12 }}>Pantur.</Text><Text style={{ fontWeight: '800', fontSize: 12, color: '#0f172a' }}>{selectedAssessment?.anthropometry?.[0]?.calf_left ?? "-"}/{selectedAssessment?.anthropometry?.[0]?.calf_right ?? "-"}</Text></View>
                    </View>
                  </View>
                </View>

                {/* MENSAGEM MOTIVACIONAL PREMIUM */}
                <View style={{ marginTop: 24, paddingVertical: 14, backgroundColor: '#0f172a', borderRadius: 12 }}>
                  <Text style={{ color: '#fbbf24', textAlign: 'center', fontSize: 13, fontWeight: '900', letterSpacing: 1 }}>
                    FOCO NO PROCESSO. OS RESULTADOS VIRÃO! 🔥
                  </Text>
                </View>
              </View>

              {/* BOTÕES DE AÇÃO */}
              <View style={{ marginTop: 16, paddingBottom: 20 }}>
                <TouchableOpacity 
                  style={[styles.button, { backgroundColor: '#2563eb', paddingVertical: 14, borderRadius: 12, elevation: 2, shadowColor: '#2563eb', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3 }]} 
                  onPress={handleShareImage}
                >
                  <Text style={{ color: "#fff", textAlign: "center", fontWeight: '900', fontSize: 15, textTransform: 'uppercase' }}>📸 Compartilhar Evolução</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.button, { marginTop: 12, backgroundColor: '#f1f5f9', paddingVertical: 14, borderRadius: 12 }]} 
                  onPress={() => setViewModalVisible(false)}
                >
                  <Text style={{ color: "#475569", textAlign: "center", fontWeight: '800', fontSize: 15 }}>FECHAR PAINEL</Text>
                </TouchableOpacity>
              </View>

            </ScrollView>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  stickyHeader: {
    backgroundColor: "#f8f9fa",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
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
    fontSize: 14,
    color: '#000'
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
    borderColor: "#eee", 
    borderRadius: 8, 
    backgroundColor: "#fafafa" 
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    width: '100%',
    maxHeight: '90%'
  }
});
