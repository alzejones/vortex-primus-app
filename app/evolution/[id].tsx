import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Dimensions, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { SafeAreaView } from "react-native-safe-area-context";
import EvolutionPanel from "../../components/EvolutionPanel";
import MeasurementsEvolutionPanel from "../../components/MeasurementsEvolutionPanel";
import TrunkMeasurementsChart from "../../components/TrunkMeasurementsChart";
import LimbMeasurementsChart from "../../components/LimbMeasurementsChart";
import BodyAvatarRow from "../../components/BodyAvatarRow";
import { supabase } from "../../lib/supabase";
import { getMetabolicStatus } from "../../utils/assessmentCalculations";
import { T } from "../../utils/theme";

const screenWidth = Dimensions.get("window").width;
const CONTENT_WIDTH = Platform.OS === 'web' ? Math.min(480, screenWidth) - 32 : screenWidth;

const formatValue = (val: any) => {
  if (val === null || val === undefined || val === "") return "-";
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

const calculateEvolution = (current: any, previous: any) => {
  if (!previous || !current) return null;
  const calcDiff = (curr: number, prev: number) => {
    if (curr == null || prev == null) return null;
    const diff = Number(curr) - Number(prev);
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
  const [prevAssessment, setPrevAssessment] = useState<any>(null);
  const [firstAssessment, setFirstAssessment] = useState<any>(null);
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
      const assessmentWithData = historyData.find(
        (a: any) => a.anthropometry && a.anthropometry.length > 0 && a.anthropometry[0]?.weight != null
      ) || historyData[0];
      setCurrentAssessment(assessmentWithData);

      const currentIdx = historyData.findIndex((a: any) => a.id === assessmentWithData.id);
      const prevWithData = historyData.slice(currentIdx + 1).find(
        (a: any) => a.anthropometry && a.anthropometry.length > 0 && a.anthropometry[0]?.weight != null
      ) || historyData[currentIdx + 1] || null;
      const firstWithData = [...historyData].reverse().find(
        (a: any) => a.anthropometry && a.anthropometry.length > 0 && a.anthropometry[0]?.weight != null
      ) || historyData[historyData.length - 1];

      setPrevAssessment(prevWithData);
      setFirstAssessment(firstWithData);
    } catch (error: any) {
      setErrorMsg(error.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color={T.blue} /></View>;
  if (!currentAssessment) return (
    <View style={styles.loadingContainer}>
      <Text style={{ fontSize: 40 }}>😕</Text>
      <Text style={{ fontWeight: 'bold', marginTop: 10, color: T.t1 }}>{errorMsg || "Avaliação indisponível"}</Text>
    </View>
  );

  const reversedAssessments = [...assessments].reverse();
  const fatData = reversedAssessments.map(a => a.anthropometry?.[0]?.body_fat).filter(Boolean);
  const muscleData = reversedAssessments.map(a => a.anthropometry?.[0]?.muscle_mass_percentage).filter(Boolean);
  const chartLabels = reversedAssessments.filter(a => a.anthropometry?.[0]?.body_fat).map((a: any) => {
    const d = new Date(a.date);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const age = calculateAge(client?.birth_date);
  const anthro = currentAssessment.anthropometry?.[0];
  const relativeEvolution = calculateEvolution(currentAssessment?.anthropometry?.[0], assessments[1]?.anthropometry?.[0]);

  const ReferenceLink = () => (
    <TouchableOpacity style={{ marginTop: 8, alignSelf: 'flex-start' }} onPress={() => setReferencesVisible(true)}>
      <Text style={{ color: T.t3, fontSize: 11, fontWeight: '600' }}>ℹ️ Referência Científica</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          Platform.OS === 'web' && styles.scrollContentWeb
        ]}
        showsVerticalScrollIndicator={false}
        style={Platform.OS === 'web' ? ({ height: '100dvh', overflowY: 'auto' } as any) : undefined}
      >
        <View style={styles.brandHeader}>
          <Text style={styles.brandTitle}>VORTEX PRIMUS</Text>
          <Text style={styles.brandSubtitle}>Relatório Oficial de Evolução</Text>
        </View>

        <View style={styles.clientCard}>
          <Text style={styles.clientName}>{client?.name}</Text>
          <Text style={styles.clientInfo}>Última Avaliação: {formatDateBR(currentAssessment.date)}</Text>
        </View>

        {currentAssessment?.anthropometry?.[0]?.body_fat != null && (
          <BodyAvatarRow
            bodyFatPercentage={Number(currentAssessment.anthropometry[0].body_fat)}
            gender={client?.gender}
          />
        )}

        {fatData.length > 0 && (
          <View style={{ backgroundColor: T.bgAlt, paddingVertical: 20, paddingHorizontal: 10, borderRadius: 16, marginBottom: 24, elevation: 4, borderWidth: 1, borderColor: T.border }}>
            <LineChart
              data={fatData.map((val, index) => ({
                value: Number(val) || 0,
                label: chartLabels[index],
                dataPointText: val != null && val !== '' ? `${Number(val).toFixed(1)}%` : '',
              }))}
              data2={muscleData.map((val) => ({
                value: Number(val) || 0,
                dataPointText: val != null && val !== '' ? `${Number(val).toFixed(1)}%` : '',
              }))}
              height={220} width={Platform.OS === 'web' ? CONTENT_WIDTH - 40 : screenWidth - 80} isAnimated animationDuration={1200} curved
              textShiftY={-14} textShiftX={-8} textFontSize={8} textColor1="#fca5a5" textColor2="#86efac"
              spacing={Math.max(28, (Platform.OS === 'web' ? CONTENT_WIDTH - 80 : screenWidth - 140) / (fatData.length > 1 ? fatData.length - 1 : 1))}
              initialSpacing={20} endSpacing={20} color1="#ef4444" color2="#22c55e" dataPointsColor1="#ef4444" dataPointsColor2="#22c55e"
              thickness1={3} thickness2={3} dataPointsRadius={4} yAxisColor="rgba(255,255,255,0.3)" xAxisColor="rgba(255,255,255,0.3)"
              yAxisTextStyle={{ color: "#94a3b8", fontSize: 11 }} xAxisLabelTextStyle={{ color: "#94a3b8", fontSize: 11, marginBottom: -10 }}
              yAxisLabelSuffix="%" stepValue={5}
              maxValue={Math.ceil((Math.max(10, ...fatData.map(Number), ...muscleData.map(Number)) + 5) / 5) * 5}
              noOfSections={Math.ceil((Math.max(10, ...fatData.map(Number), ...muscleData.map(Number)) + 5) / 5)}
              rulesColor="rgba(255,255,255,0.25)" hideRules={false} showVerticalLines={true} verticalLinesColor="rgba(255,255,255,0.15)"
            />
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24 }}>
              <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: '#ef4444' }]} /><Text style={styles.legendText}>% Gordura</Text></View>
              <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: '#22c55e' }]} /><Text style={styles.legendText}>% Músculo</Text></View>
            </View>
          </View>
        )}

        {relativeEvolution && (
          <EvolutionPanel
            evolutionData={relativeEvolution}
            currentAssessment={currentAssessment}
            prevAssessment={prevAssessment}
            firstAssessment={firstAssessment}
            formatValue={formatValue}
          />
        )}
        <MeasurementsEvolutionPanel
          currentAssessment={currentAssessment}
          prevAssessment={prevAssessment}
          firstAssessment={firstAssessment}
        />

        {/* DIAGNÓSTICO */}
        <View style={styles.diagnosisSection}>
          <Text style={styles.sectionTitle}>📋 Diagnóstico Desta Avaliação</Text>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <Text style={{ fontSize: 16 }}>📊</Text>
                <Text style={{ fontSize: 14, fontWeight: '900', color: T.t1, marginLeft: 6, textTransform: 'uppercase', flex: 1 }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>Composição Corporal</Text>
              </View>
            </View>

            <View style={styles.diagRow}>
              <Text style={styles.diagLabel}>Peso Corporal</Text>
              <Text style={styles.diagValueLarge}>{anthro?.weight ?? "-"} kg</Text>
            </View>

            {(() => {
              const status = getLocalBodyFatStatus(anthro?.body_fat, client?.gender, age);
              const peso = Number(anthro?.weight) || 0;
              const val = anthro?.body_fat ?? "-";
              const gorduraKg = peso > 0 && val !== "-"
                ? (Number(val) / 100 * peso).toFixed(1)
                : null;
              return (
                <View style={styles.barContainer}>
                  <View style={styles.rowBetween}><Text style={styles.diagLabel}>% Gordura Corporal</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>{status && (<View style={[styles.badge, { backgroundColor: status.bg }]}><Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text></View>)}<Text style={styles.diagValueLarge}>{val} %</Text>{gorduraKg && (
                      <Text style={{ fontWeight: '500', color: T.t3, fontSize: 12, marginLeft: 6 }}>
                        ({gorduraKg} kg)
                      </Text>
                    )}</View>
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

            {(() => {
              const status = getLocalMuscleStatus(anthro?.muscle_mass_percentage, client?.gender, age);
              const peso = Number(anthro?.weight) || 0;
              const val = anthro?.muscle_mass_percentage ?? "-";
              const musculoKg = peso > 0 && val !== "-"
                ? (Number(val) / 100 * peso).toFixed(1)
                : null;
              return (
                <View style={styles.barContainer}>
                  <View style={styles.rowBetween}><Text style={styles.diagLabel}>% Massa Muscular</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>{status && (<View style={[styles.badge, { backgroundColor: status.bg }]}><Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text></View>)}<Text style={styles.diagValueLarge}>{val} %</Text>{musculoKg && (
                      <Text style={{ fontWeight: '500', color: T.t3, fontSize: 12, marginLeft: 6 }}>
                        ({musculoKg} kg)
                      </Text>
                    )}</View>
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

            <View style={styles.barContainer}>
              <View style={styles.rowBetween}><Text style={styles.diagLabel}>Idade Metabólica</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {getMetabolicStatus(anthro?.metabolic_age, age) && (
                    <View style={[styles.badge, { backgroundColor: getMetabolicStatus(anthro?.metabolic_age, age)?.bg }]}><Text style={[styles.badgeText, { color: getMetabolicStatus(anthro?.metabolic_age, age)?.color }]}>{getMetabolicStatus(anthro?.metabolic_age, age)?.label}</Text></View>
                  )}<Text style={styles.diagValueLarge}>{anthro?.metabolic_age ?? "-"} anos</Text>
                </View>
              </View>
              <ReferenceLink />
            </View>

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

            <View style={[styles.diagRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
              <Text style={styles.diagLabel}>Metabolismo Basal</Text>
              <Text style={styles.diagValueLarge}>{anthro?.basal_metabolic_rate ?? "-"} kcal</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
            <View style={{ flex: 1, backgroundColor: T.card, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: T.border }}>
              <Text style={{ fontSize: 12, fontWeight: '800', color: '#ea580c', marginBottom: 10 }}>📏 TRONCO</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: T.border, paddingVertical: 4 }}>
                <Text style={{ color: T.t3, fontSize: 12 }}>Peitoral</Text>
                <Text style={{ fontWeight: '800', fontSize: 12, color: T.t1 }}>{formatValue(anthro?.chest)} cm</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: T.border, paddingVertical: 4 }}>
                <Text style={{ color: T.t3, fontSize: 12 }}>Abdômen</Text>
                <Text style={{ fontWeight: '800', fontSize: 12, color: T.t1 }}>{formatValue(anthro?.abdomen)} cm</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: T.border, paddingVertical: 4 }}>
                <Text style={{ color: T.t3, fontSize: 12 }}>Cintura</Text>
                <Text style={{ fontWeight: '800', fontSize: 12, color: T.t1 }}>{formatValue(anthro?.waist)} cm</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                <Text style={{ color: T.t3, fontSize: 12 }}>Quadril</Text>
                <Text style={{ fontWeight: '800', fontSize: 12, color: T.t1 }}>{formatValue(anthro?.hip)} cm</Text>
              </View>
            </View>

            <View style={{ flex: 1, backgroundColor: T.card, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: T.border }}>
              <Text style={{ fontSize: 12, fontWeight: '800', color: '#16a34a', marginBottom: 10 }}>🦵 MEMBROS (E/D)</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: T.border, paddingVertical: 4 }}>
                <Text style={{ color: T.t3, fontSize: 12 }}>Braço</Text>
                <Text style={{ fontWeight: '800', fontSize: 12, color: T.t1 }}>{formatValue(anthro?.arm_left)}/{formatValue(anthro?.arm_right)}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: T.border, paddingVertical: 4 }}>
                <Text style={{ color: T.t3, fontSize: 12 }}>Coxa</Text>
                <Text style={{ fontWeight: '800', fontSize: 12, color: T.t1 }}>{formatValue(anthro?.thigh_left)}/{formatValue(anthro?.thigh_right)}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                <Text style={{ color: T.t3, fontSize: 12 }}>Pantur.</Text>
                <Text style={{ fontWeight: '800', fontSize: 12, color: T.t1 }}>{formatValue(anthro?.calf_left)}/{formatValue(anthro?.calf_right)}</Text>
              </View>
            </View>
          </View>
        </View>

        <TrunkMeasurementsChart
          chartAssessments={(() => {
            const sorted = [...(assessments || [])].reverse();
            return sorted.filter((a: any) => a.anthropometry && a.anthropometry.length > 0);
          })()}
          chartLabels={assessments.filter((a: any) => a.anthropometry && a.anthropometry.length > 0).map((a: any) => {
            const d = new Date(a.date);
            return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
          })}
          chartWidth={Platform.OS === 'web' ? CONTENT_WIDTH - 20 : screenWidth - 60}
        />

        <LimbMeasurementsChart
          chartAssessments={(() => {
            const sorted = [...(assessments || [])].reverse();
            return sorted.filter((a: any) => a.anthropometry && a.anthropometry.length > 0);
          })()}
          chartWidth={Platform.OS === 'web' ? CONTENT_WIDTH - 20 : screenWidth - 60}
        />

        <View style={{ marginTop: 24, paddingVertical: 14, backgroundColor: T.bgAlt, borderRadius: 12, borderWidth: 1, borderColor: T.border }}>
          <Text style={{ color: '#fbbf24', textAlign: 'center', fontSize: 13, fontWeight: '900', letterSpacing: 1 }}>FOCO NO PROCESSO. OS RESULTADOS VIRÃO! 🔥</Text>
        </View>

        <View style={styles.footer}><Text style={styles.footerText}>Gerado por Vortex Primus App</Text></View>
      </ScrollView>

      <Modal visible={referencesVisible} animationType="fade" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Referências Científicas 📚</Text>
            <ScrollView>
              <Text style={styles.refText}>As classificações padrão do Cross utilizam as diretrizes da Omron Healthcare e estudos de Gallagher et al. (American Journal of Clinical Nutrition). Avaliações à distância utilizam o protocolo RFM e Mifflin-St Jeor.</Text>
            </ScrollView>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setReferencesVisible(false)}>
              <Text style={{ color: T.white, fontWeight: 'bold' }}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: T.bg },
  scrollContent: { padding: 16, paddingBottom: 40 },
  brandHeader: { alignItems: 'center', marginBottom: 24, marginTop: 20 },
  brandTitle: { fontSize: 24, fontWeight: '900', color: T.t1, letterSpacing: 2 },
  brandSubtitle: { fontSize: 12, color: T.blue, fontWeight: '700', textTransform: 'uppercase', marginTop: 4 },
  clientCard: { backgroundColor: T.card, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: T.border, marginBottom: 24, alignItems: 'center' },
  clientName: { fontSize: 18, fontWeight: '900', color: T.t1 },
  clientInfo: { fontSize: 13, color: T.t3, marginTop: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 12 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  legendText: { color: T.t1, fontSize: 12, fontWeight: '600' },
  diagnosisSection: { marginTop: 24, borderTopWidth: 1, borderTopColor: T.border, paddingTop: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '900', color: T.t1, marginBottom: 16, textTransform: 'uppercase' },
  card: { backgroundColor: T.card, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: T.border },
  cardHeader: { marginBottom: 12, borderBottomWidth: 1, borderBottomColor: T.border, paddingBottom: 8 },
  diagRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: T.border },
  diagLabel: { color: T.t3, fontSize: 13, fontWeight: '500' },
  diagValueLarge: { fontWeight: '900', color: T.t1, fontSize: 16 },
  barContainer: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: T.border },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginRight: 8 },
  badgeText: { fontSize: 10, fontWeight: '900' },
  ruler: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: '22%', marginBottom: 2 },
  rulerText: { fontSize: 10, color: T.t3, fontWeight: '800' },
  track: { flexDirection: 'row', height: 10, borderRadius: 5, backgroundColor: T.surface, position: 'relative' },
  segment: { flex: 1 },
  pointer: { position: 'absolute', top: -5, width: 20, height: 20, borderRadius: 10, backgroundColor: T.surface, borderWidth: 4, borderColor: T.t1, marginLeft: -10 },
  labelsRow: { flexDirection: 'row', marginTop: 6 },
  miniLabel: { flex: 1, textAlign: 'center', fontSize: 9, color: T.t3, fontWeight: 'bold' },
  footer: { marginTop: 40, alignItems: 'center' },
  scrollWeb: {},
  scrollContentWeb: {
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  footerText: { color: T.t3, fontSize: 12, fontWeight: '600' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { backgroundColor: T.card, padding: 24, borderRadius: 16, borderWidth: 1, borderColor: T.border, width: '100%' },
  modalTitle: { fontSize: 18, fontWeight: '900', marginBottom: 15, color: T.t1 },
  refText: { fontSize: 13, color: T.t3, lineHeight: 20 },
  closeBtn: { backgroundColor: T.bgAlt, padding: 14, borderRadius: 10, marginTop: 20, alignItems: 'center', borderWidth: 1, borderColor: T.border }
});
