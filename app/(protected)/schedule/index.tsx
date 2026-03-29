import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../../lib/supabase";

interface Appointment {
  id: string;
  client_id: string;
  appointment_date: string; 
  appointment_time: string; 
  types: string[];          
  status: string;
  whatsapp_sent?: boolean; 
  clients: {
    name: string;
    phone: string;
  };
}

export default function ScheduleIndex() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para Novo Agendamento (Seleção Rápida de Aluno)
  const [clients, setClients] = useState<any[]>([]);
  const [clientModalVisible, setClientModalVisible] = useState(false);
  const [clientSearchQuery, setClientSearchQuery] = useState("");

  // Estados para Edição Segura (Reagendar)
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingAppt, setEditingAppt] = useState<Appointment | null>(null);
  const [editDate, setEditDate] = useState<Date | null>(null);
  const [editTime, setEditTime] = useState<string | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [upcomingDays, setUpcomingDays] = useState<Date[]>([]);

  // Estados para Exclusão Segura
  const [appointmentToDelete, setAppointmentToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const availableTimes = [
    "06:00", "06:30", "07:00", "07:30", "08:00", "08:30", "09:00", "09:30", 
    "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "16:00", "16:30", 
    "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30"
  ];

  useEffect(() => {
    loadSchedule();
    const days = [];
    for (let i = 0; i < 15; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    setUpcomingDays(days);
  }, []);

  async function loadSchedule() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: trainer } = await supabase.from("trainers").select("id").eq("user_id", user.id).single();
      if (!trainer) return;

      // Carrega Alunos para o botão + Novo
      const { data: clientsData } = await supabase.from('clients').select('id, name').eq('trainer_id', trainer.id).eq('is_active', true).order('name');
      if(clientsData) setClients(clientsData);

      // Carrega Agenda
      const { data, error } = await supabase
        .from("appointments")
        .select(`id, client_id, appointment_date, appointment_time, types, status, whatsapp_sent, clients(name, phone)`)
        .eq("trainer_id", trainer.id)
        .gte("appointment_date", new Date().toISOString().split('T')[0])
        .order("appointment_date", { ascending: true })
        .order("appointment_time", { ascending: true });

      if (error) throw error;
      if (data) setAppointments(data as any);
    } catch (error: any) {
      console.log("Erro ao carregar:", error.message);
    } finally {
      setLoading(false);
    }
  }

// ==== FUNÇÕES DE WHATSAPP ====
  async function handleWhatsApp(appt: Appointment) {
    const d = appt.appointment_date.split('-');
    const dateFormatted = `${d[2]}/${d[1]}`;
    const timeFormatted = appt.appointment_time.substring(0,5);
    
    let typeText = "";
    if (appt.types.includes('composition') && appt.types.includes('conditioning')) typeText = "Composição Corporal e Testes Físicos";
    else if (appt.types.includes('composition')) typeText = "Avaliação de Composição Corporal";
    else typeText = "Testes Físicos (Cross)";

    const firstName = appt.clients?.name?.split(' ')[0] || 'Aluno';
    const cleanPhone = appt.clients?.phone ? appt.clients.phone.replace(/\D/g, '') : '';
    const whatsappNumber = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;

    // 🔴 MENSAGEM ATUALIZADA COM O AVISO DE JEJUM
    const message = `Olá, *${firstName}*! Passando para confirmar nossa avaliação no Vortex Primus.\n\n🗓 *Data:* ${dateFormatted}\n⏰ *Hora:* ${timeFormatted}\n🎯 *Foco:* ${typeText}\n\n⚠️ *IMPORTANTE:* Você deve estar 1 hora em jejum de comida e bebida, inclusive água. E 1 hora sem a prática de atividade física.\n\nPor favor, confirme se está tudo certo para este horário! Nos vemos no box 💪`;

    try {
      if (cleanPhone) {
        await Linking.openURL(`whatsapp://send?phone=${whatsappNumber}&text=${encodeURIComponent(message)}`);
        
        await supabase.from("appointments").update({ whatsapp_sent: true }).eq("id", appt.id);
        setAppointments(prev => prev.map(a => a.id === appt.id ? { ...a, whatsapp_sent: true } : a) as any);
      } else {
        await Linking.openURL(`whatsapp://send?text=${encodeURIComponent(message)}`);
      }
    } catch (error) {
      Alert.alert("Erro", "Não foi possível abrir o WhatsApp.");
    }
  }



  // ==== FUNÇÕES DE REAGENDAMENTO ====
  const getDayName = (date: Date) => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return days[date.getDay()];
  };

  const isSameDay = (d1: Date, d2: Date) => d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth();

  function openEditModal(appt: Appointment) {
    setEditingAppt(appt);
    const [y, m, d] = appt.appointment_date.split('-');
    setEditDate(new Date(Number(y), Number(m)-1, Number(d)));
    setEditTime(appt.appointment_time.substring(0, 5));
    setEditModalVisible(true);
  }

  async function saveEdit() {
    if(!editingAppt || !editDate || !editTime) {
       Alert.alert("Aviso", "Selecione data e hora.");
       return;
    }
    setIsSavingEdit(true);
    try {
       const formattedDate = editDate.toISOString().split('T')[0];
       const { error } = await supabase.from('appointments')
          .update({ appointment_date: formattedDate, appointment_time: editTime })
          .eq('id', editingAppt.id);
       if(error) throw error;
       
       setEditModalVisible(false);
       loadSchedule();
    } catch (err: any) {
       Alert.alert("Erro", err.message);
    } finally {
       setIsSavingEdit(false);
    }
  }

  // ==== FUNÇÕES DE EXCLUSÃO ====
  async function executeDelete() {
    if (!appointmentToDelete) return;
    try {
      setIsDeleting(true);
      await supabase.from("appointments").delete().eq("id", appointmentToDelete);
      setAppointments((prev) => prev.filter((a) => a.id !== appointmentToDelete));
      setAppointmentToDelete(null); 
    } catch (error: any) {
      console.error("Erro na exclusão:", error);
    } finally {
      setIsDeleting(false);
    }
  }

  // Formatação para Agrupamento de Datas
  const groupAppointmentsByDate = () => {
    const groups: { [key: string]: Appointment[] } = {};
    appointments.forEach((appt) => {
      if (!groups[appt.appointment_date]) groups[appt.appointment_date] = [];
      groups[appt.appointment_date].push(appt);
    });
    return Object.keys(groups).sort().map((date) => ({ title: date, data: groups[date] }));
  };

  const formatHeaderDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-');
    const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (dateObj.toDateString() === today.toDateString()) return "Hoje";
    if (dateObj.toDateString() === tomorrow.toDateString()) return "Amanhã";

    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${days[dateObj.getDay()]}, ${d} de ${months[Number(m) - 1]}`;
  };

  const groupedData = groupAppointmentsByDate();
  const scheduleFilteredClients = clients.filter((c) => c.name.toLowerCase().includes(clientSearchQuery.toLowerCase()));

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f8fafc" }}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
          <Text style={styles.backBtnText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Minha Agenda</Text>
        <TouchableOpacity style={styles.headerBtn} onPress={() => setClientModalVisible(true)}>
          <Text style={styles.headerBtnText}>+ Novo</Text>
        </TouchableOpacity>
      </View>

      {/* MODAL DE SELEÇÃO DE ALUNO (Para o botão + Novo) */}
      <Modal visible={clientModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setClientModalVisible(false)}>
        <View style={styles.modalHeaderSec}>
          <View style={styles.modalHeaderTop}>
            <Text style={styles.modalTitle}>Novo Agendamento</Text>
            <TouchableOpacity onPress={() => setClientModalVisible(false)}><Text style={styles.modalCloseBtn}>Fechar</Text></TouchableOpacity>
          </View>
          <TextInput style={styles.modalInput} placeholder="Qual aluno será avaliado?" placeholderTextColor="#94a3b8" value={clientSearchQuery} onChangeText={setClientSearchQuery} autoFocus />
        </View>
        <FlatList
          data={scheduleFilteredClients}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.modalClientItem}
              onPress={() => {
                setClientModalVisible(false);
                router.push(`/schedule/new?client_id=${item.id}` as any);
              }}
            >
              <Text style={styles.modalClientEmoji}>👤</Text>
              <Text style={styles.modalClientName}>{item.name}</Text>
              <Text style={styles.modalArrow}>→</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={{ textAlign: "center", color: "#64748b", marginTop: 20 }}>Nenhum aluno encontrado.</Text>}
        />
      </Modal>

      {/* MODAL DE ALTERAÇÃO (REAGENDAR) */}
      <Modal visible={editModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setEditModalVisible(false)}>
        <View style={styles.modalHeaderSec}>
          <View style={styles.modalHeaderTop}>
            <Text style={styles.modalTitle}>Alterar Horário</Text>
            <TouchableOpacity onPress={() => setEditModalVisible(false)}><Text style={styles.modalCloseBtn}>Cancelar</Text></TouchableOpacity>
          </View>
          <Text style={{fontSize: 14, color: '#64748b', marginBottom: 10}}>Reagendando avaliação de <Text style={{fontWeight: 'bold', color: '#0f172a'}}>{editingAppt?.clients?.name}</Text></Text>
        </View>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
          <Text style={{ fontSize: 16, fontWeight: "800", color: "#1e293b", marginBottom: 12 }}>Nova Data</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 20, marginBottom: 24 }}>
            {upcomingDays.map((date, index) => {
              const isSelected = editDate && isSameDay(date, editDate);
              return (
                <TouchableOpacity key={index} style={[styles.dateBox, isSelected && styles.dateBoxActive]} onPress={() => setEditDate(date)}>
                  <Text style={[styles.dateDay, isSelected && styles.dateTextActive]}>{getDayName(date)}</Text>
                  <Text style={[styles.dateNumber, isSelected && styles.dateTextActive]}>{date.getDate()}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Text style={{ fontSize: 16, fontWeight: "800", color: "#1e293b", marginBottom: 12 }}>Novo Horário</Text>
          <View style={styles.timeGrid}>
            {availableTimes.map((time) => (
              <TouchableOpacity key={time} style={[styles.timeBox, editTime === time && styles.timeBoxActive]} onPress={() => setEditTime(time)}>
                <Text style={[styles.timeText, editTime === time && styles.timeTextActive]}>{time}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={[styles.saveBtn, isSavingEdit && { opacity: 0.7 }]} onPress={saveEdit} disabled={isSavingEdit}>
            <Text style={styles.saveBtnText}>{isSavingEdit ? "Salvando..." : "CONFIRMAR ALTERAÇÃO"}</Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>

      {/* MODAL DE EXCLUSÃO SEGURA */}
      <Modal visible={!!appointmentToDelete} transparent={true} animationType="fade" onRequestClose={() => setAppointmentToDelete(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ backgroundColor: '#fff', padding: 24, borderRadius: 16, width: '100%', maxWidth: 400, alignItems: 'center' }}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>⚠️</Text>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#0f172a', marginBottom: 8, textAlign: 'center' }}>Cancelar Agendamento?</Text>
            <Text style={{ fontSize: 15, color: '#64748b', textAlign: 'center', marginBottom: 24 }}>Tem certeza que deseja apagar este horário da sua agenda?</Text>
            <View style={{ flexDirection: 'row', width: '100%', gap: 12 }}>
              <TouchableOpacity style={{ flex: 1, padding: 14, backgroundColor: '#f1f5f9', borderRadius: 10, alignItems: 'center' }} onPress={() => setAppointmentToDelete(null)} disabled={isDeleting}><Text style={{ color: '#475569', fontWeight: 'bold', fontSize: 15 }}>Voltar</Text></TouchableOpacity>
              <TouchableOpacity style={{ flex: 1, padding: 14, backgroundColor: '#ef4444', borderRadius: 10, alignItems: 'center' }} onPress={executeDelete} disabled={isDeleting}>{isDeleting ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>Excluir</Text>}</TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {groupedData.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={{ fontSize: 50, marginBottom: 16 }}>☕</Text>
          <Text style={{ fontSize: 20, fontWeight: "bold", color: "#0f172a", marginBottom: 8 }}>Agenda Livre</Text>
          <Text style={{ color: "#64748b", textAlign: "center" }}>Você não possui avaliações agendadas para os próximos dias.</Text>
        </View>
      ) : (
        <FlatList
          data={groupedData}
          keyExtractor={(item) => item.title}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={{ marginBottom: 24 }}>
              <View style={styles.dateHeaderContainer}>
                <Text style={styles.dateHeader}>{formatHeaderDate(item.title)}</Text>
                <View style={{ height: 1, backgroundColor: "#e2e8f0", flex: 1, marginLeft: 16 }} />
              </View>

              {item.data.map((appt) => (
                <View key={appt.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.clientName}>{appt.clients?.name}</Text>
                    {appt.types.map(t => (
                      <View key={t} style={styles.badge}>
                        <Text style={styles.badgeText}>{t === 'composition' ? '⚖️ Corporal' : '🏃 Físico'}</Text>
                      </View>
                    ))}
                  </View>
                  
                  <View style={styles.dateTimeRow}>
                    <Text style={styles.dateTimeText}>⏰ {appt.appointment_time.substring(0, 5)}</Text>
                  </View>
                  
                  {/* BARRA DE AÇÕES ROBUSTA */}
                  <View style={styles.actionRow}>
                    <TouchableOpacity 
                      style={[styles.actionBtn, { flex: 1.5, backgroundColor: appt.whatsapp_sent ? "#f8fafc" : "#22c55e", borderColor: appt.whatsapp_sent ? "#e2e8f0" : "#22c55e" }]} 
                      onPress={() => handleWhatsApp(appt)}
                    >
                      <Text style={{ fontSize: 15, marginRight: 6 }}>{appt.whatsapp_sent ? "✓" : "💬"}</Text>
                      <Text style={[styles.actionBtnText, { color: appt.whatsapp_sent ? "#64748b" : "#fff" }]}>WhatsApp</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={[styles.actionBtn, { flex: 1, backgroundColor: "#f1f5f9", borderColor: "#e2e8f0" }]} onPress={() => openEditModal(appt)}>
                      <Text style={{ fontSize: 13, marginRight: 4 }}>✏️</Text>
                      <Text style={[styles.actionBtnText, { color: "#475569" }]}>Alterar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.actionBtn, { flex: 1, backgroundColor: "#fef2f2", borderColor: "#fecaca" }]} onPress={() => setAppointmentToDelete(appt.id)}>
                      <Text style={{ fontSize: 13, marginRight: 4 }}>🗑️</Text>
                      <Text style={[styles.actionBtnText, { color: "#ef4444" }]}>Excluir</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, paddingTop: Platform.OS === "ios" ? 60 : 40, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  backBtn: { padding: 5 },
  backBtnText: { color: "#4f46e5", fontWeight: "700", fontSize: 16 },
  title: { fontSize: 20, fontWeight: "900", color: "#0f172a" },
  headerBtn: { backgroundColor: "#e0e7ff", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  headerBtnText: { color: "#4f46e5", fontWeight: "800", fontSize: 14 },
  
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
  
  listContent: { padding: 20, paddingBottom: 100 },
  dateHeaderContainer: { flexDirection: "row", alignItems: "center", marginBottom: 16, marginTop: 8 },
  dateHeader: { fontSize: 16, fontWeight: "800", color: "#475569", textTransform: "uppercase", letterSpacing: 0.5 },
  
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: "#e5e7eb", elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  clientName: { fontSize: 18, fontWeight: "bold", color: "#111827", flex: 1 },
  badge: { backgroundColor: "#f8fafc", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: "#cbd5e1", flexShrink: 1, marginLeft: 8 },
  badgeText: { fontSize: 11, fontWeight: "800", color: "#334155", textAlign: "right" },
  
  dateTimeRow: { flexDirection: "row", marginBottom: 16 },
  dateTimeText: { fontSize: 14, color: "#6b7280", fontWeight: "700", marginRight: 16 },
  
  actionRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, borderWidth: 1 },
  actionBtnText: { fontWeight: '800', fontSize: 13 },

  modalHeaderSec: { padding: 20, backgroundColor: "#fff", borderBottomWidth: 1, borderColor: "#e2e8f0", paddingTop: Platform.OS === "android" ? 40 : 20 },
  modalHeaderTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: "900", color: "#0f172a" },
  modalCloseBtn: { color: "#ef4444", fontWeight: "800", fontSize: 16 },
  modalInput: { backgroundColor: "#f1f5f9", padding: 16, borderRadius: 12, fontSize: 16, color: "#1e293b", borderWidth: 1, borderColor: "#cbd5e1" },
  modalClientItem: { padding: 16, backgroundColor: "#fff", borderBottomWidth: 1, borderColor: "#f1f5f9", flexDirection: "row", alignItems: "center" },
  modalClientEmoji: { fontSize: 24, marginRight: 16 },
  modalClientName: { fontSize: 16, fontWeight: "700", color: "#334155", flex: 1 },
  modalArrow: { fontSize: 18, color: "#cbd5e1" },

  dateBox: { backgroundColor: "#fff", paddingVertical: 14, paddingHorizontal: 20, borderRadius: 16, borderWidth: 1, borderColor: "#e2e8f0", alignItems: "center", minWidth: 70 },
  dateBoxActive: { backgroundColor: "#1e293b", borderColor: "#1e293b" },
  dateDay: { fontSize: 12, fontWeight: "700", color: "#64748b", textTransform: "uppercase", marginBottom: 4 },
  dateNumber: { fontSize: 20, fontWeight: "800", color: "#0f172a" },
  dateTextActive: { color: "#fff" },

  timeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 30 },
  timeBox: { width: "22%", backgroundColor: "#fff", paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: "#e2e8f0", alignItems: "center" },
  timeBoxActive: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  timeText: { fontSize: 15, fontWeight: "700", color: "#334155" },
  timeTextActive: { color: "#fff" },

  saveBtn: { backgroundColor: "#0f172a", paddingVertical: 18, borderRadius: 16, alignItems: "center", shadowColor: "#0f172a", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  saveBtnText: { color: "#fff", fontWeight: "900", fontSize: 16, letterSpacing: 1 },
});
