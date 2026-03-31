import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { LineChart } from "react-native-gifted-charts";
import AssessmentDetailsModal from '../../components/AssessmentDetailsModal';
import AssessmentFormModal from '../../components/AssessmentFormModal';
import AssessmentHistoryCard from '../../components/AssessmentHistoryCard';

export default function ClientAssessments() {
  const { id, openForm } = useLocalSearchParams();
  
  const { session } = useAuth();
  const clientId = id as string;

  const [client, setClient] = useState<any>(null);
  const [trainerId, setTrainerId] = useState<string | null>(null);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<any | null>(null);

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
          anthropometry (*)
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

  useEffect(() => {
    if (openForm === 'true') {
      openNewForm();
    }
  }, [openForm]);

  const openNewForm = () => {
    setEditingAssessment(null);
    setFormModalVisible(true);
  };

  const openEditForm = (assessment: any) => {
    setEditingAssessment(assessment);
    setFormModalVisible(true);
  };

  const deleteAssessment = (assessmentId: string) => {
    Alert.alert(
      "Confirmar Exclusão",
      "Tem certeza que deseja apagar esta avaliação?",
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
            } catch (error) {
              Alert.alert("Erro", "Não foi possível excluir a avaliação.");
            }
          }
        }
      ]
    );
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
      if (supported) await Linking.openURL(url);
      else Alert.alert("Erro", "WhatsApp não instalado.");
    } catch {
      Alert.alert("Erro", "Não foi possível abrir o WhatsApp.");
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

  if (loading) return <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}><ActivityIndicator size="large" color="#000" /></View>;

  const reversedAssessments = [...assessments].reverse();
  const fatData = reversedAssessments.map(a => a.anthropometry?.[0]?.body_fat).filter(Boolean);
  const muscleData = reversedAssessments.map(a => a.anthropometry?.[0]?.muscle_mass_percentage).filter(Boolean);
  const chartLabels = reversedAssessments.filter(a => a.anthropometry?.[0]?.body_fat).map(a => formatDateBR(a.date).substring(0, 5));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f4f4f5" }}>
      <View style={styles.stickyHeader}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 5 }}><Text style={{ fontSize: 24, color: "#333", fontWeight: 'bold' }}>←</Text></TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: "900", color: "#000", textTransform: 'uppercase' }}>{client?.name?.split(' ')[0]}</Text>
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
              height={180} width={Dimensions.get('window').width - 80} isAnimated curved
              color1="#ef4444" color2="#22c55e" dataPointsColor1="#ef4444" dataPointsColor2="#22c55e"
              thickness1={3} thickness2={3} yAxisColor="rgba(255,255,255,0.3)" xAxisColor="rgba(255,255,255,0.3)"
              yAxisTextStyle={{ color: "#94a3b8", fontSize: 11 }} xAxisLabelTextStyle={{ color: "#94a3b8", fontSize: 11 }}
              yAxisLabelSuffix="%" hideRules={false} rulesColor="rgba(255,255,255,0.15)"
            />
          </View>
        )}

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: "bold", color: "#333" }}>Histórico de Avaliações</Text>
          <TouchableOpacity style={{ backgroundColor: "#000", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 }} onPress={openNewForm}>
            <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 13 }}>+ AVALIAR</Text>
          </TouchableOpacity>
        </View>

        {assessments.length === 0 ? (
          <Text style={{ color: "#666", textAlign: "center", marginTop: 20 }}>Nenhuma avaliação registrada.</Text>
        ) : (
          assessments.map((assessment, index) => (
            <AssessmentHistoryCard
              key={assessment.id}
              assessment={assessment}
              previousAnthro={assessments[index + 1]?.anthropometry?.[0]}
              index={index}
              totalAssessments={assessments.length}
              onViewDetails={openDetailsModal}
              onEdit={openEditForm}
              onDelete={deleteAssessment}
              onWhatsApp={sendWhatsAppEvolution}
              onPhysicalTests={handlePhysicalTests}
            />
          ))
        )}
      </ScrollView>

      {/* NOVO COMPONENTE DE FORMULÁRIO */}
      <AssessmentFormModal
        visible={formModalVisible}
        onClose={() => setFormModalVisible(false)}
        clientId={clientId}
        trainerId={trainerId}
        assessorName={session?.user?.email || "Treinador"}
        clientGender={client?.gender || 'M'}
        clientBirthDate={client?.birth_date}
        editingAssessment={editingAssessment}
        onSuccess={fetchClientAndAssessments}
      />

      <AssessmentDetailsModal visible={detailsModalVisible} onClose={() => setDetailsModalVisible(false)} client={client} selectedAssessment={selectedAssessment} relativeEvolution={relativeEvolution} assessments={assessments} fatData={fatData} muscleData={muscleData} chartLabels={chartLabels} viewRef={viewRef} onShare={() => sendWhatsAppEvolution(selectedAssessment)} calculateAge={(d) => 30} getColor={() => '#000'} formatValue={(v) => String(v)} styles={styles} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  stickyHeader: { backgroundColor: "#f8f9fa", paddingVertical: 10, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: "#eee", elevation: 3 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  pageTitle: { fontSize: 18, fontWeight: "bold", marginTop: 10, marginBottom: 16, color: "#000" },
});

