import { useLocalSearchParams } from "expo-router";

import React, { useEffect, useState } from "react";

import { ActivityIndicator, Dimensions, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { LineChart } from "react-native-gifted-charts";

import { SafeAreaView } from "react-native-safe-area-context";

import EvolutionPanel from "../../components/EvolutionPanel";

import MeasurementsEvolutionPanel from "../../components/MeasurementsEvolutionPanel";

import { supabase } from "../../lib/supabase";




const screenWidth = Dimensions.get("window").width;



// --- FUNÇÕES AUXILIARES ---

const formatValue = (val: any) => {

  if (val === null || val === undefined) return "-";

  const num = Number(val);

  return isNaN(num) ? "-" : num.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

};



const formatDateBR = (isoString: string) => {

  if (!isoString) return "";

  const date = new Date(isoString);

  date.setMinutes(date.getMinutes() + date.getTimezoneOffset());

  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;

};



const calculateAge = (birthDateString: string) => {

  if (!birthDateString) return 30;

  const birthDate = new Date(birthDateString);

  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();

  if (today.getMonth() - birthDate.getMonth() < 0 || (today.getMonth() - birthDate.getMonth() === 0 && today.getDate() < birthDate.getDate())) age--;

  return age;

};



// --- LÓGICA ESPELHO (OMRON & VISCERAL) ---



const getLocalBodyFatStatus = (value: any, gender: string, age: number) => {

  const v = Number(value);

  if (isNaN(v) || v <= 0) return null;

  const isMale = gender === 'M' || gender === 'Masculino';

  let L1 = 0, L2 = 0, L3 = 0;

  if (isMale) {

    if (age < 40) { L1 = 8.0; L2 = 20.0; L3 = 25.0; }

    else if (age < 60) { L1 = 11.0; L2 = 22.0; L3 = 28.0; }

    else { L1 = 13.0; L2 = 25.0; L3 = 30.0; }

  } else {

    if (age < 40) { L1 = 21.0; L2 = 33.0; L3 = 39.0; }

    else if (age < 60) { L1 = 23.0; L2 = 34.0; L3 = 40.0; }

    else { L1 = 24.0; L2 = 36.0; L3 = 42.0; }

  }

  let label = "BAIXO"; let bg = "#e0f2fe"; let color = "#0284c7"; let pos = 0;

  if (v < L1) { label = "BAIXO"; pos = (v / L1) * 25; }

  else if (v < L2) { label = "NORMAL"; bg = "#dcfce7"; color = "#16a34a"; pos = 25 + ((v - L1) / (L2 - L1)) * 25; }

  else if (v < L3) { label = "ALTO"; bg = "#fef08a"; color = "#ca8a04"; pos = 50 + ((v - L2) / (L3 - L2)) * 25; }

  else { label = "MUITO ALTO"; bg = "#fee2e2"; color = "#dc2626"; pos = 75 + Math.min(((v - L3) / 15), 1) * 25; }

  return { label, bg, color, pos: Math.min(Math.max(pos, 0), 100), limits: [L1, L2, L3] };

};



const getLocalMuscleStatus = (value: any, gender: string, age: number) => {

  const v = Number(value);

  if (isNaN(v) || v <= 0) return null;

  const isMale = gender === 'M' || gender === 'Masculino';

  let L1 = 0, L2 = 0, L3 = 0;

  if (isMale) {

    if (age < 40) { L1 = 33.3; L2 = 39.4; L3 = 44.1; }

    else if (age < 60) { L1 = 33.1; L2 = 39.2; L3 = 43.9; }

    else { L1 = 32.9; L2 = 39.0; L3 = 43.7; }

  } else {

    if (age < 40) { L1 = 24.3; L2 = 30.4; L3 = 35.4; }

    else if (age < 60) { L1 = 24.1; L2 = 30.2; L3 = 35.2; }

    else { L1 = 23.9; L2 = 30.0; L3 = 35.0; }

  }

  let label = "BAIXO"; let bg = "#fee2e2"; let color = "#dc2626"; let pos = 0;

  if (v < L1) { label = "BAIXO"; pos = (v / L1) * 25; }

  else if (v < L2) { label = "NORMAL"; bg = "#ecfccb"; color = "#65a30d"; pos = 25 + ((v - L1) / (L2 - L1)) * 25; }

  else if (v < L3) { label = "ALTO"; bg = "#dcfce7"; color = "#16a34a"; pos = 50 + ((v - L2) / (L3 - L2)) * 25; }

  else { label = "MUITO ALTO"; bg = "#e0f2fe"; color = "#0284c7"; pos = 75 + Math.min(((v - L3) / 10), 1) * 25; }

  return { label, bg, color, pos: Math.min(Math.max(pos, 0), 100), limits: [L1, L2, L3] };

};



const getLocalVisceralStatus = (value: any) => {

  const v = Number(value);

  if (isNaN(v) || v <= 0) return null;

  let label = "IDEAL"; let bg = "#dcfce7"; let color = "#16a34a"; let pos = 0;

  if (v <= 4) { label = "IDEAL"; bg = "#dcfce7"; color = "#16a34a"; pos = (v / 4) * 25; } 

  else if (v <= 9) { label = "ATENÇÃO"; bg = "#fef08a"; color = "#ca8a04"; pos = 25 + ((v - 4) / 5) * 25; } 

  else if (v <= 13) { label = "ALTO"; bg = "#ffedd5"; color = "#ea580c"; pos = 50 + ((v - 9) / 4) * 25; } 

  else { label = "CRÍTICO"; bg = "#fee2e2"; color = "#dc2626"; pos = 75 + ((Math.min(v, 20) - 13) / 7) * 25; }

  return { label, bg, color, pos: Math.min(Math.max(pos, 0), 100) };

};



export default function PublicAssessmentView() {

  const { id } = useLocalSearchParams(); 

  const clientId = id as string;



  const [loading, setLoading] = useState(true);

  const [client, setClient] = useState<any>(null);

  const [assessments, setAssessments] = useState<any[]>([]);

  const [currentAssessment, setCurrentAssessment] = useState<any>(null);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [referencesVisible, setReferencesVisible] = useState(false);



  useEffect(() => {

    if (clientId) loadPublicData();

  }, [clientId]);



  async function loadPublicData() {

    try {

      const { data: clientData, error: clientError } = await supabase.from("clients").select("name, gender, birth_date").eq("id", clientId).single();

      if (clientError || !clientData) throw new Error("Acesso indisponível.");

      setClient(clientData);



      const { data: historyData, error: historyError } = await supabase.from("physical_assessments").select(`id, date, anthropometry!anthropometry_assessment_id_fkey (*)`).eq("client_id", clientId).order("date", { ascending: false });

      if (historyError || !historyData || historyData.length === 0) throw new Error("Nenhuma avaliação encontrada.");



      setAssessments(historyData);

      setCurrentAssessment(historyData[0]);

    } catch (error: any) {

      setErrorMsg(error.message);

    } finally {

      setLoading(false);

    }

  }



  if (loading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#2563eb" /></View>;

  if (!currentAssessment) return <View style={styles.loadingContainer}><Text style={{ fontSize: 40 }}>😕</Text><Text style={{ fontWeight: 'bold', marginTop: 10 }}>{errorMsg || "Avaliação indisponível"}</Text></View>;



  const reversedAssessments = [...assessments].reverse();

  const fatData = reversedAssessments.map(a => a.anthropometry?.[0]?.body_fat).filter(Boolean);

  const muscleData = reversedAssessments.map(a => a.anthropometry?.[0]?.muscle_mass_percentage).filter(Boolean);

  const chartLabels = reversedAssessments.filter(a => a.anthropometry?.[0]?.body_fat).map(a => formatDateBR(a.date).substring(0, 5));



  const age = calculateAge(client?.birth_date);

  const anthro = currentAssessment.anthropometry?.[0];



  const ReferenceLink = () => (

    <TouchableOpacity style={{ marginTop: 8, alignSelf: 'flex-start' }} onPress={() => setReferencesVisible(true)}>

      <Text style={{ color: '#64748b', fontSize: 11, fontWeight: '600' }}>ℹ️ Referência Científica</Text>

    </TouchableOpacity>

  );



  return (

    <SafeAreaView style={styles.container}>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        <View style={styles.brandHeader}>

          <Text style={styles.brandTitle}>VORTEX PRIMUS</Text>

          <Text style={styles.brandSubtitle}>Relatório Oficial de Evolução</Text>

        </View>



        <View style={styles.clientCard}>

          <Text style={styles.clientName}>{client?.name}</Text>

          <Text style={styles.clientInfo}>Última Avaliação: {formatDateBR(currentAssessment.date)}</Text>

        </View>



        {/* GRÁFICO DE LINHAS */}

        {fatData.length > 0 && (

          <View style={{ backgroundColor: "#1e293b", paddingVertical: 20, paddingHorizontal: 10, borderRadius: 16, marginBottom: 24 }}>

            <LineChart

              data={fatData.map((val, index) => ({ value: Number(val) || 0, label: chartLabels[index] }))}

              data2={muscleData.map((val) => ({ value: Number(val) || 0 }))}

              height={200} width={screenWidth - 80} curved isAnimated

              color1="#ef4444" color2="#22c55e" dataPointsColor1="#ef4444" dataPointsColor2="#22c55e"

              thickness1={3} thickness2={3} yAxisTextStyle={{ color: "#94a3b8", fontSize: 11 }} xAxisLabelTextStyle={{ color: "#94a3b8", fontSize: 11 }}

            />

            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 20 }}>

              <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: '#ef4444' }]} /><Text style={styles.legendText}>% Gordura</Text></View>

              <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: '#22c55e' }]} /><Text style={styles.legendText}>% Músculo</Text></View>

            </View>

          </View>

        )}



        <EvolutionPanel currentAssessment={currentAssessment} prevAssessment={assessments[1]} firstAssessment={assessments[assessments.length - 1]} formatValue={formatValue} evolutionData={{}} />

        <MeasurementsEvolutionPanel currentAssessment={currentAssessment} prevAssessment={assessments[1]} firstAssessment={assessments[assessments.length - 1]} />



        {/* DIAGNÓSTICO (ESPELHO DO MODAL) */}

        <View style={styles.diagnosisSection}>

          <Text style={styles.sectionTitle}>📋 Diagnóstico Desta Avaliação</Text>

          <View style={styles.card}>

            <View style={styles.cardHeader}><Text style={{ fontSize: 14, fontWeight: '900', color: '#1e293b' }}>📊 COMPOSIÇÃO CORPORAL</Text></View>

            

            <View style={styles.diagRow}><Text style={styles.diagLabel}>Peso Corporal</Text><Text style={styles.diagValue}>{anthro?.weight ?? "-"} kg</Text></View>



            {/* BARRA GORDURA */}

            {(() => {

              const status = getLocalBodyFatStatus(anthro?.body_fat, client?.gender, age);

              return (

                <View style={styles.barContainer}>

                  <View style={styles.rowBetween}><Text style={styles.diagLabel}>% Gordura Corporal</Text>

                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>{status && (<View style={[styles.badge, { backgroundColor: status.bg }]}><Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text></View>)}<Text style={styles.diagValueLarge}>{anthro?.body_fat ?? "-"} %</Text></View>

                  </View>

                  <View style={styles.ruler}><Text style={styles.rulerText}>{status?.limits[0]}</Text><Text style={styles.rulerText}>{status?.limits[1]}</Text><Text style={styles.rulerText}>{status?.limits[2]}</Text></View>

                  <View style={styles.track}>

                    <View style={[styles.segment, { backgroundColor: '#38bdf8', borderTopLeftRadius: 5, borderBottomLeftRadius: 5 }]} /><View style={[styles.segment, { backgroundColor: '#22c55e' }]} /><View style={[styles.segment, { backgroundColor: '#eab308' }]} /><View style={[styles.segment, { backgroundColor: '#ef4444', borderTopRightRadius: 5, borderBottomRightRadius: 5 }]} />

                    {status && <View style={[styles.pointer, { left: `${status.pos}%` }]} />}

                  </View>

                  <View style={styles.labelsRow}><Text style={styles.miniLabel}>BAIXO</Text><Text style={styles.miniLabel}>NORMAL</Text><Text style={styles.miniLabel}>ALTO</Text><Text style={styles.miniLabel}>M. ALTO</Text></View>

                  <ReferenceLink />

                </View>

              );

            })()}



            {/* BARRA MÚSCULO */}

            {(() => {

              const status = getLocalMuscleStatus(anthro?.muscle_mass_percentage, client?.gender, age);

              return (

                <View style={styles.barContainer}>

                  <View style={styles.rowBetween}><Text style={styles.diagLabel}>% Massa Muscular</Text>

                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>{status && (<View style={[styles.badge, { backgroundColor: status.bg }]}><Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text></View>)}<Text style={styles.diagValueLarge}>{anthro?.muscle_mass_percentage ?? "-"} %</Text></View>

                  </View>

                  <View style={styles.ruler}><Text style={styles.rulerText}>{status?.limits[0]}</Text><Text style={styles.rulerText}>{status?.limits[1]}</Text><Text style={styles.rulerText}>{status?.limits[2]}</Text></View>

                  <View style={styles.track}>

                    <View style={[styles.segment, { backgroundColor: '#ef4444', borderTopLeftRadius: 5, borderBottomLeftRadius: 5 }]} /><View style={[styles.segment, { backgroundColor: '#84cc16' }]} /><View style={[styles.segment, { backgroundColor: '#22c55e' }]} /><View style={[styles.segment, { backgroundColor: '#38bdf8', borderTopRightRadius: 5, borderBottomRightRadius: 5 }]} />

                    {status && <View style={[styles.pointer, { left: `${status.pos}%` }]} />}

                  </View>

                  <View style={styles.labelsRow}><Text style={styles.miniLabel}>BAIXO</Text><Text style={styles.miniLabel}>NORMAL</Text><Text style={styles.miniLabel}>ALTO</Text><Text style={styles.miniLabel}>M. ALTO</Text></View>

                  <ReferenceLink />

                </View>

              );

            })()}



            {/* BARRA VISCERAL */}

            {(() => {

              const status = getLocalVisceralStatus(anthro?.body_fat_index);

              return (

                <View style={styles.barContainer}>

                  <View style={styles.rowBetween}><Text style={styles.diagLabel}>Gordura Visceral</Text>

                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>{status && (<View style={[styles.badge, { backgroundColor: status.bg }]}><Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text></View>)}<Text style={styles.diagValueLarge}>{anthro?.body_fat_index ?? "-"}</Text></View>

                  </View>

                  <View style={styles.ruler}><Text style={styles.rulerText}>4</Text><Text style={styles.rulerText}>9</Text><Text style={styles.rulerText}>13</Text></View>

                  <View style={styles.track}>

                    <View style={[styles.segment, { backgroundColor: '#22c55e', borderTopLeftRadius: 5, borderBottomLeftRadius: 5 }]} /><View style={[styles.segment, { backgroundColor: '#eab308' }]} /><View style={[styles.segment, { backgroundColor: '#f97316' }]} /><View style={[styles.segment, { backgroundColor: '#ef4444', borderTopRightRadius: 5, borderBottomRightRadius: 5 }]} />

                    {status && <View style={[styles.pointer, { left: `${status.pos}%` }]} />}

                  </View>

                  <View style={styles.labelsRow}><Text style={styles.miniLabel}>IDEAL</Text><Text style={styles.miniLabel}>ATENÇÃO</Text><Text style={styles.miniLabel}>ALTO</Text><Text style={styles.miniLabel}>CRÍTICO</Text></View>

                  <ReferenceLink />

                </View>

              );

            })()}

          </View>

        </View>



        <View style={styles.footer}><Text style={styles.footerText}>Gerado por Vortex Primus App</Text></View>

      </ScrollView>



            {/* REFERÊNCIAS */}

      <Modal visible={referencesVisible} animationType="fade" transparent><View style={styles.modalBackdrop}><View style={styles.modalCard}><Text style={styles.modalTitle}>Referências Científicas 📚</Text><ScrollView><Text style={styles.refText}>As classificações utilizam as diretrizes da Omron Healthcare e estudos de Gallagher et al. (American Journal of Clinical Nutrition). Avaliações à distância utilizam o protocolo RFM e Mifflin-St Jeor.</Text></ScrollView><TouchableOpacity style={styles.closeBtn} onPress={() => setReferencesVisible(false)}><Text style={{ color: '#fff', fontWeight: 'bold' }}>Entendido</Text></TouchableOpacity></View></View></Modal>

    </SafeAreaView>

  );

}



const styles = StyleSheet.create({

  container: { flex: 1, backgroundColor: "#f8fafc" },

  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },

  scrollContent: { padding: 16, paddingBottom: 40 },

  brandHeader: { alignItems: 'center', marginBottom: 24, marginTop: 20 },

  brandTitle: { fontSize: 24, fontWeight: '900', color: '#0f172a', letterSpacing: 2 },

  brandSubtitle: { fontSize: 12, color: '#3b82f6', fontWeight: '700', textTransform: 'uppercase', marginTop: 4 },

  clientCard: { backgroundColor: '#fff', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 24, alignItems: 'center' },

  clientName: { fontSize: 18, fontWeight: '900', color: '#1e293b' },

  clientInfo: { fontSize: 13, color: '#64748b', marginTop: 4 },

  legendItem: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 12 },

  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },

  legendText: { color: '#e2e8f0', fontSize: 12, fontWeight: '600' },

  diagnosisSection: { marginTop: 24, borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 20 },

  sectionTitle: { fontSize: 15, fontWeight: '900', color: '#0f172a', marginBottom: 16, textTransform: 'uppercase' },

  card: { backgroundColor: '#fff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#e2e8f0' },

  cardHeader: { marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 8 },

  diagRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },

  diagLabel: { color: '#475569', fontSize: 13, fontWeight: '500' },

  diagValue: { fontWeight: '900', color: '#0f172a', fontSize: 14 },

  diagValueLarge: { fontWeight: '900', color: '#0f172a', fontSize: 16 },

  barContainer: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },

  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },

  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginRight: 8 },

  badgeText: { fontSize: 10, fontWeight: '900' },

  ruler: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: '22%', marginBottom: 2 },

  rulerText: { fontSize: 10, color: '#64748b', fontWeight: '800' },

  track: { flexDirection: 'row', height: 10, borderRadius: 5, backgroundColor: '#e2e8f0', position: 'relative' },

  segment: { flex: 1 },

  pointer: { position: 'absolute', top: -5, width: 20, height: 20, borderRadius: 10, backgroundColor: '#ffffff', borderWidth: 4, borderColor: '#0f172a', marginLeft: -10 },

  labelsRow: { flexDirection: 'row', marginTop: 6 },

  miniLabel: { flex: 1, textAlign: 'center', fontSize: 9, color: '#94a3b8', fontWeight: 'bold' },

  footer: { marginTop: 40, alignItems: 'center' },

  footerText: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },

  modalCard: { backgroundColor: '#fff', padding: 24, borderRadius: 16, width: '100%' },

  modalTitle: { fontSize: 18, fontWeight: '900', marginBottom: 15 },

  refText: { fontSize: 13, color: '#64748b', lineHeight: 20 },

  closeBtn: { backgroundColor: '#0f172a', padding: 14, borderRadius: 10, marginTop: 20, alignItems: 'center' }

});

