import { supabase } from "@/lib/supabase";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

interface AssessmentFormModalProps {
  visible: boolean;
  onClose: () => void;
  clientId: string;
  trainerId: string | null;
  assessorName: string;
  clientGender: string;
  clientBirthDate: string;
  editingAssessment: any | null;
  onSuccess: () => void;
}

export default function AssessmentFormModal({
  visible,
  onClose,
  clientId,
  trainerId,
  assessorName,
  clientGender,
  clientBirthDate,
  editingAssessment,
  onSuccess,
}: AssessmentFormModalProps) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    date: "", weight: "", height: "", body_fat: "", waist: "",
    hip: "", chest: "", abdomen: "", arm_right: "", arm_left: "",
    thigh_right: "", thigh_left: "", calf_right: "", calf_left: "",
    muscle_mass_percentage: "", basal_metabolic_rate: "", body_fat_index: "", metabolic_age: ""
  });

  // Função para formatar data (ISO para BR)
  const formatDateBR = (isoString: string) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  };

  // Carregar dados quando abre o modal (Novo ou Editar)
  useEffect(() => {
    if (visible) {
      if (editingAssessment) {
        const data = editingAssessment.anthropometry?.[0] || {};
        setForm({
          date: formatDateBR(editingAssessment.date),
          weight: data.weight?.toString() || "", height: data.height?.toString() || "",
          body_fat: data.body_fat?.toString() || "", waist: data.waist?.toString() || "",
          hip: data.hip?.toString() || "", chest: data.chest?.toString() || "",
          abdomen: data.abdomen?.toString() || "", arm_right: data.arm_right?.toString() || "",
          arm_left: data.arm_left?.toString() || "", thigh_right: data.thigh_right?.toString() || "",
          thigh_left: data.thigh_left?.toString() || "", calf_right: data.calf_right?.toString() || "",
          calf_left: data.calf_left?.toString() || "", muscle_mass_percentage: data.muscle_mass_percentage?.toString() || "",
          basal_metabolic_rate: data.basal_metabolic_rate?.toString() || "", body_fat_index: data.body_fat_index?.toString() || "",
          metabolic_age: data.metabolic_age?.toString() || ""
        });
      } else {
        const today = new Date();
        setForm({
          date: `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`,
          weight: "", height: "", body_fat: "", waist: "", hip: "", chest: "", abdomen: "",
          arm_right: "", arm_left: "", thigh_right: "", thigh_left: "", calf_right: "", calf_left: "",
          muscle_mass_percentage: "", basal_metabolic_rate: "", body_fat_index: "", metabolic_age: ""
        });
      }
    }
  }, [visible, editingAssessment]);

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
      return `${year}-${month}-${day}T12:00:00.000Z`;
    } catch {
      return new Date().toISOString();
    }
  };

  // 🪄 IA ANTROPOMÉTRICA - AVALIAÇÃO À DISTÂNCIA
  const calculateRemoteAssessment = () => {
    Keyboard.dismiss();
    setTimeout(() => {
      if (!form.weight || !form.height || !form.waist) {
        Alert.alert("Atenção", "Preencha primeiro o Peso, Altura e Cintura.");
        return;
      }

      const weight = parseFloat(form.weight.replace(',', '.'));
      const height = parseFloat(form.height.replace(',', '.'));
      const waist = parseFloat(form.waist.replace(',', '.'));
      
      if (isNaN(weight) || isNaN(height) || isNaN(waist)) {
        Alert.alert("Erro", "Valores numéricos inválidos.");
        return;
      }

      const gender = clientGender || 'M';
      const calcAge = (birthDateString: string) => {
        if (!birthDateString) return 30;
        const birthDate = new Date(birthDateString);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        if (today.getMonth() - birthDate.getMonth() < 0 || (today.getMonth() - birthDate.getMonth() === 0 && today.getDate() < birthDate.getDate())) age--;
        return age;
      };
      const age = calcAge(clientBirthDate);

      let bodyFat = (gender === 'M' || gender === 'Masculino') ? 64 - (20 * (height / waist)) : 76 - (20 * (height / waist));
      bodyFat = Math.max(5, Math.min(bodyFat, 60)); 

      let bmr = (gender === 'M' || gender === 'Masculino') ? (10 * weight) + (6.25 * height) - (5 * age) + 5 : (10 * weight) + (6.25 * height) - (5 * age) - 161;

      const leanMass = weight * (1 - (bodyFat / 100));
      const musclePercentage = ((leanMass * 0.55) / weight) * 100;

      let visceral = (gender === 'M' || gender === 'Masculino') ? (waist / 10) - 2 : (waist / 10) - 3;
      visceral = Math.max(1, Math.round(visceral));

      const idealFat = (gender === 'M' || gender === 'Masculino') ? 15 : 25;
      let metabolicAge = age + Math.round((bodyFat - idealFat) / 1.5);
      metabolicAge = Math.max(18, metabolicAge); 

      setForm(prev => ({
        ...prev,
        body_fat: bodyFat.toFixed(1).replace('.', ','),
        muscle_mass_percentage: musclePercentage.toFixed(1).replace('.', ','),
        basal_metabolic_rate: Math.round(bmr).toString(),
        body_fat_index: visceral.toString(),
        metabolic_age: metabolicAge.toString()
      }));
      
      Alert.alert("Cálculo Concluído! 🪄", "Gordura, Músculo e Metabolismo calculados via IA.");
    }, 100);
  };

  const handleSaveAssessment = async () => {
    if (!form.weight) { Alert.alert("Atenção", "O peso é obrigatório."); return; }
    setSaving(true);
    try {
      let currentAssessmentId = editingAssessment?.id;
      const isoDate = parseDateBRToISO(form.date);

      if (!currentAssessmentId) {
        const { data: newAssessment, error: assessmentError } = await supabase
          .from("physical_assessments")
          .insert([{ client_id: clientId, trainer_id: trainerId, assessor_name: assessorName, date: isoDate }])
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

      if (editingAssessment) {
        const { data: checkData } = await supabase.from("anthropometry").select("id").eq("assessment_id", currentAssessmentId).single();
        if (checkData) {
          await supabase.from("anthropometry").update(anthropometryData).eq("assessment_id", currentAssessmentId);
        } else {
          await supabase.from("anthropometry").insert([anthropometryData]);
        }
      } else {
        await supabase.from("anthropometry").insert([anthropometryData]);
      }
      
      onSuccess();
      onClose();
    } catch (error: any) {
      Alert.alert("Erro", "Erro ao salvar: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const renderGridInput = (label: string, key: keyof typeof form) => (
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

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: "#fff" }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.header}>
          <Text style={{ fontSize: 18, fontWeight: "bold" }}>{editingAssessment ? "Editar Avaliação" : "Nova Avaliação"}</Text>
          <TouchableOpacity onPress={onClose}><Text style={{ fontSize: 16, color: "#ef4444", fontWeight: "bold" }}>Cancelar</Text></TouchableOpacity>
        </View>
        
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }} keyboardShouldPersistTaps="handled">
          <View style={{ marginBottom: 16, paddingHorizontal: 4 }}>
            <Text style={{ fontSize: 12, fontWeight: "bold", color: "#666", marginBottom: 4, textTransform: 'uppercase' }}>Data da Avaliação</Text>
            <TextInput style={[styles.gridInput, { textAlign: 'left', fontSize: 16 }]} value={form.date} onChangeText={handleDateChange} placeholder="DD/MM/AAAA" keyboardType="numeric" maxLength={10} />
          </View>

          <View style={styles.row}>{renderGridInput("Peso (kg)", "weight")}{renderGridInput("Altura (cm)", "height")}</View>
          <View style={styles.row}>{renderGridInput("Cintura (cm)", "waist")}{renderGridInput("Quadril (cm)", "hip")}</View>

          <TouchableOpacity activeOpacity={0.7} style={styles.aiButton} onPress={calculateRemoteAssessment}>
            <Text style={{ fontSize: 24, marginRight: 12 }}>🪄</Text>
            <View>
              <Text style={{ color: '#0f172a', fontWeight: '900', fontSize: 13, textTransform: 'uppercase' }}>Auto-Preencher via IA</Text>
              <Text style={{ color: '#64748b', fontSize: 11, marginTop: 2 }}>Calcula composição com Peso, Altura e Cintura</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.row}>{renderGridInput("Peitoral (cm)", "chest")}{renderGridInput("Abdômen (cm)", "abdomen")}</View>
          <View style={styles.row}>{renderGridInput("Braço Dir.", "arm_right")}{renderGridInput("Braço Esq.", "arm_left")}</View>
          <View style={styles.row}>{renderGridInput("Coxa Dir.", "thigh_right")}{renderGridInput("Coxa Esq.", "thigh_left")}</View>
          <View style={styles.row}>{renderGridInput("Pant. Dir.", "calf_right")}{renderGridInput("Pant. Esq.", "calf_left")}</View>
          <View style={styles.row}>{renderGridInput("% Gordura", "body_fat")}{renderGridInput("% Músculo", "muscle_mass_percentage")}</View>
          <View style={styles.row}>{renderGridInput("Índice Visceral", "body_fat_index")}{renderGridInput("Idade Metabólica", "metabolic_age")}</View>
          <View style={styles.row}>{renderGridInput("Metabolismo Basal", "basal_metabolic_rate")}</View>

          <TouchableOpacity style={styles.button} onPress={handleSaveAssessment} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", textAlign: "center", fontWeight: "bold", fontSize: 16 }}>Salvar Avaliação</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee', marginTop: Platform.OS === "android" ? 20 : 0 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  gridInput: { borderWidth: 1, borderColor: "#ccc", padding: 8, borderRadius: 6, backgroundColor: '#fafafa', textAlign: 'center', fontSize: 14, color: '#000' },
  aiButton: { backgroundColor: '#f8fafc', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#cbd5e1', marginHorizontal: 4, marginTop: 4, marginBottom: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  button: { backgroundColor: "#000", padding: 16, borderRadius: 8, marginTop: 10, marginHorizontal: 4 },
});

