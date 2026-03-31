import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
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

  const [form, setForm] = useState({
    date: "",
    weight: "", height: "", body_fat: "", waist: "",
    hip: "", chest: "", abdomen: "",
    arm_right: "", arm_left: "", thigh_right: "", thigh_left: "", calf_right: "", calf_left: "",
    muscle_mass_percentage: "", basal_metabolic_rate: "", body_fat_index: "", metabolic_age: ""
  });

  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<any>(null);
  const [relativeEvolution, setRelativeEvolution] = useState<any>(null);

  const viewRef = useRef(null);

  const fetchClientAndAssessments = useCallback(async () => {
    try {
      if (!session?.user) return;
      const { data: trainerData } = await supabase.from("trainers").select("id").eq("user_id", session.user.id).single();
      if (trainerData) setTrainerId(trainerData.id);

      const { data: clientData } = await supabase.from("clients").select("*").eq("id", clientId).single();
      if (clientData) setClient(clientData);

      const { data: assessmentsData, error } = await supabase
        .from("physical_assessments")
        .select(`
          id, date, assessor_name,
          anthropometry (
            weight, height, body_fat, waist, hip, chest, abdomen,
            arm_right, arm_left, thigh_right, thigh_left, calf_right, calf_left,
            muscle_mass_percentage, basal_metabolic_rate, body_fat_index, metabolic_age
          )
        `)
        .eq("client_id", clientId)
        .order("date", { ascending: false });

      if (error) throw error;
      setAssessments(assessmentsData || []);
    } catch (error) {
      console.error("Erro ao buscar avaliações:", error);
    } finally {
      setLoading(false);
    }
  }, [clientId, session]);

  useEffect(() => {
    fetchClientAndAssessments();
  }, [fetchClientAndAssessments]);

  const handleDateChange = (text: string) => {
    let numericValue = text.replace(/\D/g, "");
    if (numericValue.length > 8) numericValue = numericValue.substring(0, 8);
    let formattedDate = numericValue;
    if (numericValue.length >= 3 && numericValue.length <= 4) formattedDate = `${numericValue.slice(0, 2)}/${numericValue.slice(2)}`;
    else if (numericValue.length >= 5) formattedDate = `${numericValue.slice(0, 2)}/${numericValue.slice(2, 4)}/${numericValue.slice(4)}`;
    setForm({ ...form, date: formattedDate });
  };

  const parseDateBRToISO = (dateStr: string) => {
    try {
      const [day, month, year] = dateStr.split("/");
      if (!day || !month || !year || year.length < 4) return new Date().toISOString();
      const isoString = `${year}-${month}-${day}T12:00:00.000Z`;
      return isoString;
    } catch {
      return new Date().toISOString();
    }
  };

  const formatDateBR = (isoString: string) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  };

  const openNewForm = () => {
    const today = new Date();
    const d = String(today.getDate()).padStart(2, '0');
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const y = today.getFullYear();
    const todayStr = `${d}/${m}/${y}`;
    
    setForm({
      date: todayStr,
      weight: "", height: "", body_fat: "", waist: "",
      hip: "", chest: "", abdomen: "",
      arm_right: "", arm_left: "", thigh_right: "", thigh_left: "", calf_right: "", calf_left: "",
      muscle_mass_percentage: "", basal_metabolic_rate: "", body_fat_index: "", metabolic_age: ""
    });
    setEditingAssessmentId(null);
    setFormModalVisible(true);
  };

  const openEditForm = (assessment: any) => {
    const data = assessment.anthropometry?.[0] || {};
    setForm({
      date: formatDateBR(assessment.date),
      weight: data.weight?.toString() || "",
      height: data.height?.toString() || "",
      body_fat: data.body_fat?.toString() || "",
      waist: data.waist?.toString() || "",
      hip: data.hip?.toString() || "",
      chest: data.chest?.toString() || "",
      abdomen: data.abdomen?.toString() || "",
      arm_right: data.arm_right?.toString() || "",
      arm_left: data.arm_left?.toString() || "",
      thigh_right: data.thigh_right?.toString() || "",
      thigh_left: data.thigh_left?.toString() || "",
      calf_right: data.calf_right?.toString() || "",
      calf_left: data.calf_left?.toString() || "",
      muscle_mass_percentage: data.muscle_mass_percentage?.toString() || "",
      basal_metabolic_rate: data.basal_metabolic_rate?.toString() || "",
      body_fat_index: data.body_fat_index?.toString() || "",
      metabolic_age: data.metabolic_age?.toString() || ""
    });
    setEditingAssessmentId(assessment.id);
    setFormModalVisible(true);
  };

  const deleteAssessment = (assessmentId: string) => {
    Alert.alert(
      "Confirmar Exclusão",
      "Tem certeza que deseja apagar esta avaliação? Esta ação não pode ser desfeita.",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Excluir", 
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase.from("physical_assessments").delete().eq("id", assessmentId);
              if (error) throw error;
              fetchClientAndAssessments();
            } catch (error: any) {
              Alert.alert("Erro", "Não foi possível excluir a avaliação.");
            }
          }
        }
      ]
    );
  };

  // 🪄 IA ANTROPOMÉTRICA - AVALIAÇÃO À DISTÂNCIA
  function calculateRemoteAssessment() {
    if (!form.weight || !form.height || !form.waist) {
      Alert.alert("Atenção", "Para a IA calcular, preencha primeiro o Peso, Altura e Cintura.");
      return;
    }

    const weight = parseFloat(form.weight.replace(',', '.'));
    const height = parseFloat(form.height.replace(',', '.'));
    const waist = parseFloat(form.waist.replace(',', '.'));
    
    if (isNaN(weight) || isNaN(height) || isNaN(waist)) {
      Alert.alert("Erro", "Certifique-se de que os valores de Peso, Altura e Cintura contêm apenas números.");
      return;
    }

    const gender = client?.gender || 'M';
    
    const calculateAge = (birthDateString: string) => {
      if (!birthDateString) return 30;
      const birthDate = new Date(birthDateString);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) { age--; }
      return age;
    };

    const age = calculateAge(client?.birth_date || new Date().toISOString());

    // 1. % Gordura (RFM)
    let bodyFat = (gender === 'M' || gender === 'Masculino') ? 64 - (20 * (height / waist)) : 76 - (20 * (height / waist));
    bodyFat = Math.max(5, Math.min(bodyFat, 60)); 

    // 2. Metabolismo Basal (Mifflin-St Jeor)
    let bmr = (gender === 'M' || gender === 'Masculino') ? (10 * weight) + (6.25 * height) - (5 * age) + 5 : (10 * weight) + (6.25 * height) - (5 * age) - 161;

    // 3. Massa Muscular %
    const leanMass = weight * (1 - (bodyFat / 100));
    const skeletalMuscleMass = leanMass * 0.55;
    const musclePercentage = (skeletalMuscleMass / weight) * 100;

    // 4. Gordura Visceral
    let visceral = (gender === 'M' || gender === 'Masculino') ? (waist / 10) - 2 : (waist / 10) - 3;
    visceral = Math.max(1, Math.round(visceral));

    // 5. Idade Metabólica
    const idealFat = (gender === 'M' || gender === 'Masculino') ? 15 : 25;
    let metabolicAge = age + Math.round((bodyFat - idealFat) / 1.5);
    metabolicAge = Math.max(18, metabolicAge); 

    setForm({
      ...form,
      body_fat: bodyFat.toFixed(1).replace('.', ','),
      muscle_mass_percentage: musclePercentage.toFixed(1).replace('.', ','),
      basal_metabolic_rate: Math.round(bmr).toString(),
      body_fat_index: visceral.toString(),
      metabolic_age: metabolicAge.toString()
    });
    
    Alert.alert("Cálculo Clínico Concluído! 🪄", "Gordura, Músculo e Metabolismo preenchidos via IA.");
  }

  const handleSaveAssessment = async () => {
    if (!form.weight) { Alert.alert("Atenção", "O peso é obrigatório."); return; }
    setSaving(true);
    try {
      let currentAssessmentId = editingAssessmentId;
      const isoDate = parseDateBRToISO(form.date);

      if (!currentAssessmentId) {
        const { data: newAssessment, error: assessmentError } = await supabase
          .from("physical_assessments")
          .insert([{ client_id: clientId, trainer_id: trainerId, assessor_name: session?.user?.email || "Treinador", date: isoDate }])
          .select().single();
        if (assessmentError) throw assessmentError;
        currentAssessmentId = newAssessment.id;
      } else {
        await supabase.from("physical_assessments").update({ date: isoDate }).eq("id", currentAssessmentId);
      }

      const anthropometryData = {
        assessment_id: currentAssessmentId,
        weight: form.weight ? Number(form.weight.replace(',', '.')) : null,
        height: form.height ? Number(form.height.replace(',', '.')) : null,
        body_fat: form.body_fat ? Number(form.body_fat.replace(',', '.')) : null,
        waist: form.waist ? Number(form.waist.replace(',', '.')) : null,
        hip: form.hip ? Number(form.hip.replace(',', '.')) : null,
        chest: form.chest ? Number(form.chest.replace(',', '.')) : null,
        abdomen: form.abdomen ? Number(form.abdomen.replace(',', '.')) : null,
        arm_right: form.arm_right ? Number(form.arm_right.replace(',', '.')) : null,
        arm_left: form.arm_left ? Number(form.arm_left.replace(',', '.')) : null,
        thigh_right: form.thigh_right ? Number(form.thigh_right.replace(',', '.')) : null,
        thigh_left: form.thigh_left ? Number(form.thigh_left.replace(',', '.')) : null,
        calf_right: form.calf_right ? Number(form.calf_right.replace(',', '.')) : null,
        calf_left: form.calf_left ? Number(form.calf_left.replace(',', '.')) : null,
        muscle_mass_percentage: form.muscle_mass_percentage ? Number(form.muscle_mass_percentage.replace(',', '.')) : null,
        basal_metabolic_rate: form.basal_metabolic_rate ? Number(form.basal_metabolic_rate.replace(',', '.')) : null,
        body_fat_index: form.body_fat_index ? Number(form.body_fat_index.replace(',', '.')) : null,
        metabolic_age: form.metabolic_age ? Number(form.metabolic_age.replace(',', '.')) : null,
      };

      if (editingAssessmentId) {
        const { data: checkData } = await supabase.from("anthropometry").select("id").eq("assessment_id", currentAssessmentId).single();
        if (checkData) {
          const { error: antError } = await supabase.from("anthropometry").update(anthropometryData).eq("assessment_id", currentAssessmentId);
          if (antError) throw antError;
        } else {
          const { error: antError } = await supabase.from("anthropometry").insert([anthropometryData]);
          if (antError) throw antError;
        }
      } else {
        const { error: antError } = await supabase.from("anthropometry").insert([anthropometryData]);
        if (antError) throw antError;
      }
      setFormModalVisible(false);
      fetchClientAndAssessments();
    } catch (error: any) {
      Alert.alert("Erro", "Erro ao salvar: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const calculateEvolution = (current: any, previous: any) => {
    if (!previous || !current) return null;
    const calcDiff = (curr: number, prev: number) => {
      if (curr == null || prev == null) return null;
      const diff = curr - prev;
      return { diff: parseFloat(diff.toFixed(2)), isPositive: diff > 0 };
    };
    return {
      weight: calcDiff(current.weight, previous.weight),
      body_fat: calcDiff(current.body_fat, previous.body_fat),
      muscle_mass_percentage: calcDiff(current.muscle_mass_percentage, previous.muscle_mass_percentage),
      waist: calcDiff(current.waist, previous.waist),
      abdomen: calcDiff(current.abdomen, previous.abdomen),
    };
  };

  const openDetailsModal = (assessment: any) => {
    setSelectedAssessment(assessment);
    const index = assessments.findIndex(a => a.id === assessment.id);
    const previous = assessments[index + 1]?.anthropometry?.[0];
    const current = assessment.anthropometry?.[0];
    
    setRelativeEvolution(calculateEvolution(current, previous));
    setDetailsModalVisible(true);
  };

  const handlePhysicalTests = (assessment: any) => {
    router.push(`/(protected)/assessments/conditioning?client_id=${clientId}&assessment_id=${assessment.id}` as any);
  };

  function renderGridInput(label: string, key: keyof typeof form) {
    return (
      <View style={{ flex: 1, paddingHorizontal: 4, marginBottom: 12 }}>
        <Text style={{ fontSize: 11, fontWeight: "bold", color: "#666", marginBottom: 4, textTransform: 'uppercase' }}>{label}</Text>
        <TextInput
          style={styles.gridInput}
          keyboardType="numeric"
          value={form[key]}
          onChangeText={(text) => setForm({ ...form, [key]: text })}
          placeholder="0.0"
          placeholderTextColor="#aaa"
        />
      </View>
    );
  }

  const calculateAge = (dateString: string) => {
    if (!dateString) return 30;
    const today = new Date();
    const birthDate = new Date(dateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  const getColor = (value: number, type: 'fat' | 'muscle') => {
    if (!value) return '#000';
    if (type === 'fat') return value > 25 ? '#ef4444' : value < 15 ? '#3b82f6' : '#22c55e';
    return value < 35 ? '#ef4444' : value > 45 ? '#3b82f6' : '#22c55e';
  };

  const formatValue = (value: number) => {
    if (value === null || value === undefined) return "-";
    return value.toString().replace('.', ',');
  };

  const sendWhatsAppEvolution = async (assessment: any) => {
    if (!client?.phone || !assessment) return;
    
    let phone = client.phone.replace(/\D/g, "");
    if (!phone.startsWith("55")) phone = "55" + phone;

    const data = assessment.anthropometry?.[0];
    if (!data) return;

    let message = `Fala ${client.name.split(' ')[0]}, tudo bem? 💪\n\n`;
    message += `Passando para enviar o resumo da sua última avaliação física no *Vortex Primus*! 🚀\n\n`;
    message += `📊 *RESULTADOS ATUAIS*\n`;
    message += `⚖️ Peso: ${data.weight || '-'} kg\n`;
    message += `🔥 Gordura: ${data.body_fat || '-'} %\n`;
    message += `💪 Músculo: ${data.muscle_mass_percentage || '-'} %\n`;
    message += `📏 Cintura: ${data.waist || '-'} cm\n\n`;

    message += `Qualquer dúvida, me avise. Vamos pra cima! 🔥🏋️‍♂️`;

    const url = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(message)}`;
    
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Erro", "WhatsApp não está instalado neste dispositivo.");
      }
    } catch (error) {
      Alert.alert("Erro", "Não foi possível abrir o WhatsApp.");
    }
  };

  if (loading) return <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}><ActivityIndicator size="large" color="#000" /></View>;

  const reversedAssessments = [...assessments].reverse();
  const fatData = reversedAssessments.map(a => a.anthropometry?.[0]?.body_fat).filter(Boolean);
  const muscleData = reversedAssessments.map(a => a.anthropometry?.[0]?.muscle_mass_percentage).filter(Boolean);
  const chartLabels = reversedAssessments.filter(a => a.anthropometry?.[0]?.body_fat).map(a => formatDateBR(a.date).substring(0, 5));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f4f4f5" }}>
      
      <View style={styles.stickyHeader}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 5 }}>
            <Text style={{ fontSize: 24, color: "#333", fontWeight: 'bold' }}>←</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: "900", color: "#000", textTransform: 'uppercase' }}>
            {client?.name?.split(' ')[0]}
          </Text>
          <View style={{ width: 30 }} />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.pageTitle}>Composição Corporal</Text>
        
        {fatData.length > 0 && (
          <View style={{ backgroundColor: "#1e293b", paddingVertical: 20, paddingHorizontal: 10, borderRadius: 16, elevation: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5, marginBottom: 24 }}>
            <LineChart
              data={fatData.map((val, index) => ({ value: Number(val) || 0, label: chartLabels[index] }))}
              data2={muscleData.map((val) => ({ value: Number(val) || 0 }))}
              height={180}
              width={Dimensions.get('window').width - 80}
              isAnimated
              curved
              color1="#ef4444" 
              color2="#22c55e" 
              dataPointsColor1="#ef4444"
              dataPointsColor2="#22c55e"
              thickness1={3}
              thickness2={3}
              yAxisColor="rgba(255,255,255,0.3)"
              xAxisColor="rgba(255,255,255,0.3)"
              yAxisTextStyle={{ color: "#94a3b8", fontSize: 11 }}
              xAxisLabelTextStyle={{ color: "#94a3b8", fontSize: 11 }}
              yAxisLabelSuffix="%"
              hideRules={false}
              rulesColor="rgba(255,255,255,0.15)"
            />
          </View>
        )}

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: "bold", color: "#333" }}>Histórico de Avaliações</Text>
          <TouchableOpacity 
            style={{ backgroundColor: "#000", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 }}
            onPress={openNewForm}
          >
            <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 13 }}>+ AVALIAR</Text>
          </TouchableOpacity>
        </View>


       {assessments.length === 0 ? (
          <Text style={{ color: "#666", textAlign: "center", marginTop: 20 }}>Nenhuma avaliação registrada.</Text>
        ) : (
          assessments.map((assessment, index) => {
            const previousAnthro = assessments[index + 1]?.anthropometry?.[0];

            return (
              <AssessmentHistoryCard
                key={assessment.id}
                assessment={assessment}
                previousAnthro={previousAnthro}
                index={index}
                totalAssessments={assessments.length}
                onViewDetails={openDetailsModal}
                onEdit={openEditForm}
                onDelete={deleteAssessment}
                onWhatsApp={sendWhatsAppEvolution}
                onPhysicalTests={handlePhysicalTests}
              />
            );
          })
        )}
      </ScrollView>

      {/* MODAL DE FORMULÁRIO COM O SEU LAYOUT ORIGINAL */}
      <Modal visible={formModalVisible} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: "#fff" }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee', marginTop: Platform.OS === "android" ? 20 : 0 }}>
            <Text style={{ fontSize: 18, fontWeight: "bold" }}>{editingAssessmentId ? "Editar Avaliação" : "Nova Avaliação"}</Text>
            <TouchableOpacity onPress={() => setFormModalVisible(false)}><Text style={{ fontSize: 16, color: "#ef4444", fontWeight: "bold" }}>Cancelar</Text></TouchableOpacity>
          </View>
          
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
            
            <View style={{ marginBottom: 16, paddingHorizontal: 4 }}>
              <Text style={{ fontSize: 12, fontWeight: "bold", color: "#666", marginBottom: 4, textTransform: 'uppercase' }}>Data da Avaliação</Text>
              <TextInput
                style={[styles.gridInput, { textAlign: 'left', fontSize: 16 }]}
                value={form.date}
                onChangeText={handleDateChange}
                placeholder="DD/MM/AAAA"
                keyboardType="numeric"
                maxLength={10}
              />
            </View>

            <View style={styles.row}>
              {renderGridInput("Peso (kg)", "weight")}
              {renderGridInput("Altura (cm)", "height")}
            </View>
            
            <View style={styles.row}>
              {renderGridInput("Cintura (cm)", "waist")}
              {renderGridInput("Quadril (cm)", "hip")}
            </View>

            {/* 🔴 AVALIAÇÃO À DISTÂNCIA VIA IA - DESIGN HARMONIZADO COM O SEU LAYOUT */}
            <TouchableOpacity 
              style={{ backgroundColor: '#f8fafc', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#cbd5e1', marginHorizontal: 4, marginTop: 4, marginBottom: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
              onPress={calculateRemoteAssessment}
            >
              <Text style={{ fontSize: 24, marginRight: 12 }}>🪄</Text>
              <View>
                <Text style={{ color: '#0f172a', fontWeight: '900', fontSize: 13, textTransform: 'uppercase' }}>Auto-Preencher via IA</Text>
                <Text style={{ color: '#64748b', fontSize: 11, marginTop: 2 }}>Calcula composição com Peso, Altura e Cintura</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.row}>
              {renderGridInput("Peitoral (cm)", "chest")}
              {renderGridInput("Abdômen (cm)", "abdomen")}
            </View>

            <View style={styles.row}>
              {renderGridInput("Braço Dir.", "arm_right")}
              {renderGridInput("Braço Esq.", "arm_left")}
            </View>

            <View style={styles.row}>
              {renderGridInput("Coxa Dir.", "thigh_right")}
              {renderGridInput("Coxa Esq.", "thigh_left")}
            </View>

            <View style={styles.row}>
              {renderGridInput("Pant. Dir.", "calf_right")}
              {renderGridInput("Pant. Esq.", "calf_left")}
            </View>

            <View style={styles.row}>
              {renderGridInput("% Gordura", "body_fat")}
              {renderGridInput("% Músculo", "muscle_mass_percentage")}
            </View>

            <View style={styles.row}>
              {renderGridInput("Índice Visceral", "body_fat_index")}
              {renderGridInput("Idade Metabólica", "metabolic_age")}
            </View>

            <View style={styles.row}>
              {renderGridInput("Metabolismo Basal", "basal_metabolic_rate")}
            </View>

            <TouchableOpacity style={styles.button} onPress={handleSaveAssessment} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", textAlign: "center", fontWeight: "bold", fontSize: 16 }}>Salvar Avaliação</Text>}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      <AssessmentDetailsModal visible={detailsModalVisible} onClose={() => setDetailsModalVisible(false)} client={client} selectedAssessment={selectedAssessment} relativeEvolution={relativeEvolution} assessments={assessments} fatData={fatData} muscleData={muscleData} chartLabels={chartLabels} viewRef={viewRef} onShare={() => sendWhatsAppEvolution(selectedAssessment)} calculateAge={calculateAge} getColor={getColor} formatValue={formatValue} styles={styles} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  stickyHeader: { backgroundColor: "#f8f9fa", paddingVertical: 10, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: "#eee", elevation: 3, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 2 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerItem: { fontSize: 14, color: "#333" },
  bold: { fontWeight: "bold" },
  pageTitle: { fontSize: 18, fontWeight: "bold", marginTop: 10, marginBottom: 16, color: "#000" },
  row: { flexDirection: "row", justifyContent: "space-between" },
  gridInput: { borderWidth: 1, borderColor: "#ccc", padding: 8, borderRadius: 6, backgroundColor: '#fafafa', textAlign: 'center', fontSize: 14, color: '#000' },
  button: { backgroundColor: "#000", padding: 16, borderRadius: 8, marginTop: 10, marginHorizontal: 4 },
});

