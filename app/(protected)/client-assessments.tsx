import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { router, useLocalSearchParams } from "expo-router";
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
import AssessmentDetailsModal from '../../components/AssessmentDetailsModal';
import AssessmentHistoryCard from '../../components/AssessmentHistoryCard';
import EvolutionPanel from '../../components/EvolutionPanel';
import MeasurementsEvolutionPanel from '../../components/MeasurementsEvolutionPanel';

export default function ClientAssessments() {
  
  const { id, openForm } = useLocalSearchParams();
  useEffect(() => {
    if (openForm === 'true') {
      setFormModalVisible(true);
    }
  }, [openForm]);
  
  const { session } = useAuth();
  const clientId = id as string;

  const [client, setClient] = useState<any>(null);
  const [trainerId, setTrainerId] = useState<string | null>(null);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formModalVisible, setFormModalVisible] = useState(false);

  const [editingAssessmentId, setEditingAssessmentId] = useState<string | null>(null);
  const [editingAnthropometryId, setEditingAnthropometryId] = useState<string | null>(null);

  // 🔴 NOVOS ESTADOS PARA EXCLUSÃO SEGURA (Substitui o Alert.alert bugado)
  const [assessmentToDelete, setAssessmentToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
    let v = text.replace(/\D/g, ""); 
    if (v.length > 12) v = v.substring(0, 12);
    
    v = v.replace(/^(\d{2})(\d)/, "$1/$2");
    v = v.replace(/^(\d{2})\/(\d{2})(\d)/, "$1/$2/$3");
    v = v.replace(/^(\d{2})\/(\d{2})\/(\d{4})(\d)/, "$1/$2/$3 $4");
    v = v.replace(/^(\d{2})\/(\d{2})\/(\d{4}) (\d{2})(\d)/, "$1/$2/$3 $4:$5");
    
    setForm({ ...form, assessment_date: v });
  }

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);

      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .select("*")
        .eq("id", clientId)
        .single();

      if (clientError) throw clientError;
      setClient(clientData);

      const { data: assessmentsData, error: assessError } = await supabase
        .from("physical_assessments")
        .select(`
          *,
          anthropometry:anthropometry!anthropometry_assessment_id_fkey (*)
        `)
        .eq("client_id", clientId)
        .order("date", { ascending: false });

      if (assessError) throw assessError;
      
      // 🔴 CORREÇÃO 1: Filtra as avaliações vazias criadas pelos testes de condicionamento
      const validAssessments = (assessmentsData || []).filter(
        (a: any) => a.anthropometry && a.anthropometry.length > 0
      );
      
      setAssessments(validAssessments);

    } catch (error: any) {
      console.error("Erro ao carregar histórico:", error.message);
      Alert.alert("Erro", "Não foi possível carregar as avaliações.");
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    if (clientId) {
      fetchHistory();
    }
  }, [clientId, fetchHistory]);

  const viewRef = useRef(null);

  async function handleShareLink() {
    const assessmentLink = `https://vortex-primus-app.vercel.app`;
    const cleanPhone = client?.phone ? client.phone.replace(/\D/g, '') : '';
    const whatsappNumber = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    const firstName = client?.name ? client.name.split(' ')[0] : 'Aluno';
    const message = `Olá, *${firstName}*!\n\nSua autoavaliação corporal já está disponível no *Vortex Primus*.\n\n_Clique e veja *agora*:_ 📊\n${assessmentLink}\n\nParabéns pela determinação e foco no processo! 🔥`;

    try {
      if (cleanPhone) {
        await Linking.openURL(`whatsapp://send?phone=${whatsappNumber}&text=${encodeURIComponent(message)}`);
      } else {
        await Linking.openURL(`whatsapp://send?text=${encodeURIComponent(message)}`);
      }
    } catch (error) {
      console.error("Erro ao abrir WhatsApp:", error);
      Alert.alert("Erro", "Não foi possível abrir o WhatsApp. Verifique se o aplicativo está instalado.");
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
  
  const chronologicalAssessments = [...(assessments || [])].reverse();
  const chartAssessments = chronologicalAssessments.filter(a => a.anthropometry && a.anthropometry.length > 0);

  const chartLabels = chartAssessments.length > 0 
    ? chartAssessments.map((_, index) => `Av ${index + 1}`) 
    : ["-"];

  const fatData = chartAssessments.length > 0 
    ? chartAssessments.map(a => Number(a.anthropometry[0].body_fat) || 0)
    : [0];

  const muscleData = chartAssessments.length > 0 
    ? chartAssessments.map(a => Number(a.anthropometry[0].muscle_mass_percentage) || 0)
    : [0];

  const screenWidth = Dimensions.get("window").width - 60; 

  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<any>(null);

  const [form, setForm] = useState({
    assessment_date: formatDateBR(new Date()), 
    weight: "", height: "", body_fat: "", waist: "", hip: "", chest: "", abdomen: "", arm_right: "", arm_left: "", thigh_right: "", thigh_left: "", calf_right: "", calf_left: "", muscle_mass_percentage: "", basal_metabolic_rate: "", body_fat_index: "", metabolic_age: "",
  });

  useEffect(() => {
    async function loadTrainer() {
      if (!session?.user?.id) return;
      const { data } = await supabase.from("trainers").select("id").eq("user_id", session.user.id).single();
      if (data) setTrainerId(data.id);
    }
    loadTrainer();
  }, [session]);

  useEffect(() => {
    if (clientId) fetchHistory();
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
      diffRecentMuscle: calc(latest.muscle_mass_percentage, previous.muscle_mass_percentage),
      diffTotalWeight: calc(latest.weight, first.weight),
      diffTotalFat: calc(latest.body_fat, first.body_fat),
      diffTotalMuscle: calc(latest.muscle_mass_percentage, first.muscle_mass_percentage),
    };
  }

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
      diffRecentWeight: calc(currentAnthro.weight, previousAnthro?.weight),
      diffRecentFat: calc(currentAnthro.body_fat, previousAnthro?.body_fat),
      diffRecentMuscle: calc(currentAnthro.muscle_mass_percentage, previousAnthro?.muscle_mass_percentage),
      diffRecentMetabolicAge: calc(currentAnthro.metabolic_age, previousAnthro?.metabolic_age),
      diffRecentVisceral: calc(currentAnthro.body_fat_index, previousAnthro?.body_fat_index),
      diffRecentBasal: calc(currentAnthro.basal_metabolic_rate, previousAnthro?.basal_metabolic_rate),
      diffTotalWeight: isNotFirst ? calc(currentAnthro.weight, firstAnthro?.weight) : null,
      diffTotalFat: isNotFirst ? calc(currentAnthro.body_fat, firstAnthro?.body_fat) : null,
      diffTotalMuscle: isNotFirst ? calc(currentAnthro.muscle_mass_percentage, firstAnthro?.muscle_mass_percentage) : null,
      diffTotalMetabolicAge: isNotFirst ? calc(currentAnthro.metabolic_age, firstAnthro?.metabolic_age) : null,
      diffTotalVisceral: isNotFirst ? calc(currentAnthro.body_fat_index, firstAnthro?.body_fat_index) : null,
      diffTotalBasal: isNotFirst ? calc(currentAnthro.basal_metabolic_rate, firstAnthro?.basal_metabolic_rate) : null,
      diffRecentChest: calc(currentAnthro.chest, previousAnthro?.chest),
      diffTotalChest: isNotFirst ? calc(currentAnthro.chest, firstAnthro?.chest) : null,
      diffRecentAbdomen: calc(currentAnthro.abdomen, previousAnthro?.abdomen),
      diffTotalAbdomen: isNotFirst ? calc(currentAnthro.abdomen, firstAnthro?.abdomen) : null,
      diffRecentWaist: calc(currentAnthro.waist, previousAnthro?.waist),
      diffTotalWaist: isNotFirst ? calc(currentAnthro.waist, firstAnthro?.waist) : null,
      diffRecentHip: calc(currentAnthro.hip, previousAnthro?.hip),
      diffTotalHip: isNotFirst ? calc(currentAnthro.hip, firstAnthro?.hip) : null,
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

  // 🔴 CORREÇÃO 2: Substitui o Alert nativo por uma abertura do nosso próprio Modal seguro
  function deleteAssessment(id: string) {
    setAssessmentToDelete(id);
  }

  async function executeDelete() {
    if (!assessmentToDelete) return;
    try {
      setIsDeleting(true);
      await supabase.from("anthropometry").delete().eq("assessment_id", assessmentToDelete);
      await supabase.from("physical_assessments").delete().eq("id", assessmentToDelete);

      setAssessments((prev) => prev.filter((a) => a.id !== assessmentToDelete));
      await fetchHistory();
      setAssessmentToDelete(null); // Fecha o modal
    } catch (error: any) {
      console.error("Erro na exclusão:", error);
    } finally {
      setIsDeleting(false);
    }
  }

  function handleEditAssessment(assessment: any) {
    const anthro = assessment.anthropometry?.[0];
    setFormModalVisible(true);
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
      setForm({ assessment_date: formatDateBR(new Date()), weight: "", height: "", body_fat: "", waist: "", hip: "", chest: "", abdomen: "", arm_right: "", arm_left: "", thigh_right: "", thigh_left: "", calf_right: "", calf_left: "", muscle_mass_percentage: "", basal_metabolic_rate: "", body_fat_index: "", metabolic_age: "" });
      await fetchHistory();
      setSaving(false);
      Alert.alert("Sucesso", "Avaliação atualizada");
      return;
    }

    const { data: assessment } = await supabase
      .from("physical_assessments")
      .insert([{ client_id: clientId, trainer_id: trainerId, date: isoDate, assessor_name: session?.user?.email || "Treinador" }])
      .select().single();

    await supabase.from("anthropometry").insert({ assessment_id: assessment.id, ...payload });

    setForm({ assessment_date: formatDateBR(new Date()), weight: "", height: "", body_fat: "", waist: "", hip: "", chest: "", abdomen: "", arm_right: "", arm_left: "", thigh_right: "", thigh_left: "", calf_right: "", calf_left: "", muscle_mass_percentage: "", basal_metabolic_rate: "", body_fat_index: "", metabolic_age: "" });
    setSaving(false);
    await fetchHistory();
  }

  function handleSendWhatsApp(assessment: any) {
    if (!client) return;
    const anthro = assessment.anthropometry?.[0];
    if (!anthro) return;

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

      evolutionSection = `\n━━━━━━━━━━━━━\n *EVOLUÇÃO REAL* 🏆\n \n${weightIcon} *Peso:* ${diffWeight}kg\n${fatIcon} *Gordura:* ${diffFat}%\n${muscleIcon} *Músculo:* ${diffMuscle}%\n━━━━━━━━━━━━━`;
    }

    const message = `Olá, *${client.name}*! 👋\n\nSua nova avaliação do *Vortex Primus* está pronta. Esqueça links externos, o seu resultado está aqui:\n\n📍 *STATUS ATUAL:*\n• Peso: *${anthro.weight ?? "-"} kg*\n• % Gordura: *${anthro.body_fat ?? "-"}%*\n• % Músculo: *${anthro.muscle_mass_percentage ?? "-"}%*\n• Idade Metab.: *${anthro.metabolic_age ?? "-"} anos*\n${evolutionSection}\n\nParabéns pela determinação e comprometimento! Esses números são o reflexo do seu suor no Cross. 👏👏👏\n\nBora buscar a próxima meta? 🔥\n_Att, Coach Alzejones_`;
    const url = `whatsapp://send?text=${encodeURIComponent(message)}`;

    Linking.canOpenURL(url).then((supported) => {
      if (!supported) Alert.alert("Erro", "WhatsApp não instalado.");
      else return Linking.openURL(url);
    });
  }

    function renderGridInput(label: string, key: keyof typeof form) {
    return (
      <View style={{ flex: 1, paddingHorizontal: 4, marginBottom: 12 }}>
        <Text style={{ fontSize: 12, marginBottom: 4, color: "#333", minHeight: 30 }} numberOfLines={2}>{label}</Text>
        <TextInput style={styles.gridInput as any} keyboardType="numeric" value={form[key]} onChangeText={(text) => setForm({ ...form, [key]: text })} />
      </View>
    );
  }

  function handlePhysicalTests(assessment: any) {
    router.push({ pathname: "/(protected)/assessments/conditioning" as any, params: { assessment_id: assessment.id } } as any);
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
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        
        {/* MODAL DE FORMULÁRIO */}
        <Modal visible={formModalVisible} animationType="slide" onRequestClose={() => setFormModalVisible(false)}>
          <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a', padding: 16, paddingTop: 50 }}>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>{editingAssessmentId ? "✏️ Editar Avaliação" : "➕ Nova Avaliação"}</Text>
              <TouchableOpacity onPress={() => setFormModalVisible(false)}><Text style={{ color: '#fca5a5', fontSize: 16, fontWeight: 'bold' }}>Cancelar</Text></TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
              <View style={styles.stickyHeader}>
                <View style={styles.headerRow}>
                  <Text style={styles.headerItem}><Text style={styles.bold}>Nome: </Text>{client?.name?.substring(0, 10)}{client?.name?.length > 10 ? '...' : ''}</Text>
                  <Text style={styles.headerItem}><Text style={styles.bold}>Idade: </Text>{calculateAge(client?.birth_date)}</Text>
                  <Text style={styles.headerItem}><Text style={styles.bold}>Alt: </Text>{client?.height_cm}cm</Text>
                </View>
              </View>
              <View style={{ padding: 16 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 10, marginBottom: 16 }}>
                  <View style={{ width: 140 }}>
                    <Text style={{ fontSize: 10, color: '#666', marginBottom: 2, fontWeight: 'bold' }}>Data / Hora</Text>
                    <TextInput style={[styles.gridInput, { fontSize: 12, padding: 6, minHeight: 35, textAlign: 'center' }]} value={form.assessment_date} onChangeText={handleDateChange} placeholder="DD/MM/AAAA HH:mm" keyboardType="numeric" maxLength={16} />
                  </View>
                </View>
                <View style={styles.card}><Text style={styles.cardTitle}>Bioimpedância</Text><View style={styles.row}>{renderGridInput("Peso", "weight")}{renderGridInput("% Gordura", "body_fat")}{renderGridInput("% M. Muscular", "muscle_mass_percentage")}</View><View style={styles.row}>{renderGridInput("Idade Metabólica", "metabolic_age")}{renderGridInput("Metabolismo Basal", "basal_metabolic_rate")}{renderGridInput("Gordura Visceral", "body_fat_index")}</View></View>
                <View style={styles.card}><Text style={styles.cardTitle}>Medidas do Tronco</Text><View style={styles.row}>{renderGridInput("Peitoral", "chest")}{renderGridInput("Abdômen", "abdomen")}</View><View style={styles.row}>{renderGridInput("Cintura", "waist")}{renderGridInput("Quadril", "hip")}</View></View>
                <View style={styles.card}><Text style={styles.cardTitle}>Medidas dos Membros</Text><View style={styles.row}>{renderGridInput("Braço Esquerdo", "arm_left")}{renderGridInput("Braço Direito", "arm_right")}</View><View style={styles.row}>{renderGridInput("Panturrilha Esquerda", "calf_left")}{renderGridInput("Panturrilha Direita", "calf_right")}</View><View style={styles.row}>{renderGridInput("Coxa Esquerda", "thigh_left")}{renderGridInput("Coxa Direita", "thigh_right")}</View></View>
                <TouchableOpacity style={[styles.button, saving && { opacity: 0.7 }]} onPress={() => { handleSaveAssessment(); if(!editingAssessmentId) setFormModalVisible(false); }} disabled={saving}><Text style={{ color: "#fff", textAlign: "center", fontWeight: 'bold' }}>{saving ? "Salvando..." : editingAssessmentId ? "Atualizar Avaliação" : "Salvar Avaliação"}</Text></TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </Modal>

        {/* 🔴 MODAL DE CONFIRMAÇÃO DE EXCLUSÃO SEGURO (Substitui o Alert) */}
        <Modal visible={!!assessmentToDelete} transparent={true} animationType="fade" onRequestClose={() => setAssessmentToDelete(null)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <View style={{ backgroundColor: '#fff', padding: 24, borderRadius: 16, width: '100%', maxWidth: 400, alignItems: 'center' }}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>⚠️</Text>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#0f172a', marginBottom: 8, textAlign: 'center' }}>Excluir Avaliação?</Text>
              <Text style={{ fontSize: 15, color: '#64748b', textAlign: 'center', marginBottom: 24 }}>Tem certeza que deseja apagar esta avaliação permanentemente? Esta ação não pode ser desfeita.</Text>
              <View style={{ flexDirection: 'row', width: '100%', gap: 12 }}>
                <TouchableOpacity style={{ flex: 1, padding: 14, backgroundColor: '#f1f5f9', borderRadius: 10, alignItems: 'center' }} onPress={() => setAssessmentToDelete(null)} disabled={isDeleting}><Text style={{ color: '#475569', fontWeight: 'bold', fontSize: 15 }}>Cancelar</Text></TouchableOpacity>
                <TouchableOpacity style={{ flex: 1, padding: 14, backgroundColor: '#ef4444', borderRadius: 10, alignItems: 'center' }} onPress={executeDelete} disabled={isDeleting}>{isDeleting ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>Sim, Excluir</Text>}</TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* TELA PRINCIPAL */}
        <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
          <View style={styles.stickyHeader}>
            <View style={styles.headerRow}>
              <Text style={styles.headerItem}><Text style={styles.bold}>Nome: </Text>{client?.name?.substring(0, 10)}{client?.name?.length > 10 ? '...' : ''}</Text>
              <Text style={styles.headerItem}><Text style={styles.bold}>Idade: </Text>{calculateAge(client?.birth_date)}</Text>
              <Text style={styles.headerItem}><Text style={styles.bold}>Alt: </Text>{client?.height_cm}cm</Text>
            </View>
          </View>

          <View style={{ padding: 16 }}>
            {evolution && <EvolutionPanel evolutionData={evolution} currentAssessment={assessments[0]} prevAssessment={assessments[1]} firstAssessment={assessments[assessments.length - 1]} formatValue={formatValue} />}
            {evolution && assessments?.length > 1 && <MeasurementsEvolutionPanel currentAssessment={assessments[0]} prevAssessment={assessments[1]} firstAssessment={assessments[assessments.length - 1]} />}
            
            <View style={{ marginBottom: 20, alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, padding: 10 }}>
              <View style={{ backgroundColor: "#1e293b", paddingVertical: 20, paddingHorizontal: 10, borderRadius: 16, marginVertical: 8, elevation: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5 }}>
                <LineChart data={fatData.map((val, index) => ({ value: Number(val) || 0, label: chartLabels[index] }))} data2={muscleData.map((val) => ({ value: Number(val) || 0 }))} height={220} width={screenWidth - 80} isAnimated animationDuration={1200} curved spacing={Math.max(35, (screenWidth - 140) / (fatData.length > 1 ? fatData.length - 1 : 1))} initialSpacing={20} endSpacing={20} color1="#ef4444" color2="#22c55e" dataPointsColor1="#ef4444" dataPointsColor2="#22c55e" thickness1={3} thickness2={3} dataPointsRadius={4} yAxisColor="rgba(255,255,255,0.3)" xAxisColor="rgba(255,255,255,0.3)" yAxisTextStyle={{ color: "#94a3b8", fontSize: 11 }} xAxisLabelTextStyle={{ color: "#94a3b8", fontSize: 11, marginBottom: -10 }} yAxisLabelSuffix="%" stepValue={5} maxValue={Math.ceil((Math.max(10, ...fatData.map(Number), ...muscleData.map(Number)) + 5) / 5) * 5} noOfSections={Math.ceil((Math.max(10, ...fatData.map(Number), ...muscleData.map(Number)) + 5) / 5)} rulesColor="rgba(255,255,255,0.25)" hideRules={false} showVerticalLines={true} verticalLinesColor="rgba(255,255,255,0.15)" />
                <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 24 }}><View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#ef4444', marginRight: 8 }} /><Text style={{ color: '#e2e8f0', fontSize: 12, fontWeight: '600' }}>% Gordura</Text></View>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}><View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#22c55e', marginRight: 8 }} /><Text style={{ color: '#e2e8f0', fontSize: 12, fontWeight: '600' }}>% Músculo</Text></View>
                </View>
                {fatData.length > 7 && <Text style={{ color: '#94a3b8', fontSize: 11, textAlign: 'center', marginTop: 16, fontStyle: 'italic' }}>↔️ Deslize o gráfico para o lado para ver o histórico completo</Text>}
              </View>
            </View>

            <TouchableOpacity style={{ backgroundColor: '#1e293b', padding: 16, borderRadius: 12, marginBottom: 24, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }} onPress={() => router.push({ pathname: "/(protected)/assessments/conditioning-evolution" as any, params: { client_id: clientId } } as any)}>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>📈 Ver Evolução de Performance</Text>
            </TouchableOpacity>

            <Text style={styles.pageTitle}>Histórico de Avaliações</Text>

            {assessments.map((assessment, index) => {
              const previousAnthro = assessments[index + 1]?.anthropometry?.[0];
              return (
                <AssessmentHistoryCard
                  key={assessment.id}
                  assessment={assessment}
                  previousAnthro={previousAnthro}
                  index={index}
                  totalAssessments={assessments.length}
                  onViewDetails={handleViewAssessment}
                  onEdit={handleEditAssessment}
                  onDelete={deleteAssessment}
                  onWhatsApp={handleSendWhatsApp}
                  onPhysicalTests={() => handlePhysicalTests(assessment)} 
                />
              );
            })}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <AssessmentDetailsModal visible={viewModalVisible} onClose={() => setViewModalVisible(false)} client={client} selectedAssessment={selectedAssessment} relativeEvolution={relativeEvolution} assessments={assessments} fatData={fatData} muscleData={muscleData} chartLabels={chartLabels} viewRef={viewRef} onShare={handleShareLink} calculateAge={calculateAge} getColor={getColor} formatValue={formatValue} styles={styles} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  stickyHeader: { backgroundColor: "#f8f9fa", paddingVertical: 10, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: "#eee", elevation: 3, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 2 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerItem: { fontSize: 14, color: "#333" },
  bold: { fontWeight: "bold" },
  pageTitle: { fontSize: 18, fontWeight: "bold", marginTop: 10, marginBottom: 16, color: "#000" },
  card: { padding: 12, borderWidth: 1, borderColor: "#e0e0e0", borderRadius: 10, backgroundColor: '#fff', marginBottom: 16 },
  cardTitle: { fontSize: 14, fontWeight: "bold", marginBottom: 8, color: "#444" },
  row: { flexDirection: "row", justifyContent: "space-between" },
  gridInput: { borderWidth: 1, borderColor: "#ccc", padding: 8, borderRadius: 6, backgroundColor: '#fafafa', textAlign: 'center', fontSize: 14, color: '#000' },
  button: { backgroundColor: "#000", padding: 16, borderRadius: 8, marginTop: 10 },
  historyCard: { marginBottom: 12, padding: 12, borderWidth: 1, borderColor: "#eee", borderRadius: 8, backgroundColor: "#fafafa" },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 15, padding: 20, width: '100%', maxHeight: '90%' }
});
