import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Dimensions, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { SafeAreaView } from "react-native-safe-area-context";
import EvolutionPanel from "../../components/EvolutionPanel";
import MeasurementsEvolutionPanel from "../../components/MeasurementsEvolutionPanel";
import { supabase } from "../../lib/supabase";
import {
  getBodyFatStatus,
  getMetabolicStatus,
  getMuscleStatus,
  getVisceralStatus
} from "../../utils/assessmentCalculations";

const screenWidth = Dimensions.get("window").width;

// Formatação de valores
const formatValue = (val: any) => {
  if (val === null || val === undefined) return "-";
  const num = Number(val);
  return isNaN(num) ? "-" : num.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
};

// Formatação de data
const formatDateBR = (isoString: string) => {
  if (!isoString) return "";
  const date = new Date(isoString);
  date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
};

// Cálculo de idade
const calculateAge = (birthDateString: string) => {
  if (!birthDateString) return 30;
  const birthDate = new Date(birthDateString);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  if (today.getMonth() - birthDate.getMonth() < 0 || (today.getMonth() - birthDate.getMonth() === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
};

// Cálculo de evolução relativa
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
    if (clientId) {
      loadPublicData();
    }
  }, [clientId]);

  async function loadPublicData() {
    try {
      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .select("name, gender, birth_date")
        .eq("id", clientId)
        .single();
      
      if (clientError) throw new Error("Erro ao buscar Cliente: " + clientError.message);
      if (!clientData) throw new Error("Aluno não encontrado na base de dados.");
      
      setClient(clientData);

      const { data: historyData, error: historyError } = await supabase
        .from("physical_assessments")
        .select(`
          id, date,
          anthropometry!anthropometry_assessment_id_fkey (*)
        `)
        .eq("client_id", clientId)
        .order("date", { ascending: false });

      if (historyError) throw new Error("Erro ao buscar Avaliações: " + historyError.message);
      if (!historyData || historyData.length === 0) {
        throw new Error("Nenhuma avaliação encontrada para este aluno.");
      }

      setAssessments(historyData);
      setCurrentAssessment(historyData[0]);

    } catch (error: any) {
      console.error("Erro ao carregar link público:", error);
      setErrorMsg(error.message || JSON.stringify(error));
    } finally {
      setLoading(false);
    }
  }

  const ReferenceLink = () => (
    <TouchableOpacity 
      style={{ marginTop: 8, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center' }}
      onPress={() => setReferencesVisible(true)}
    >
      <Text style={{ color: '#64748b', fontSize: 11, fontWeight: '600' }}>ℹ️ Referência Científica</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={{ marginTop: 12, color: '#64748b', fontWeight: '600' }}>A carregar a sua evolução...</Text>
      </View>
    );
  }

  if (!currentAssessment) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ fontSize: 40, marginBottom: 10 }}>😕</Text>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#0f172a' }}>Avaliação indisponível</Text>
        <Text style={{ color: '#64748b', marginTop: 8 }}>Este link pode ter expirado ou estar incorreto.</Text>
        {errorMsg && (
          <View style={{ marginTop: 24, padding: 16, backgroundColor: '#fee2e2', borderRadius: 8, marginHorizontal: 20 }}>
            <Text style={{ color: '#b91c1c', fontSize: 13, fontWeight: 'bold', marginBottom: 4 }}>DETALHE TÉCNICO PARA DEBUG:</Text>
            <Text style={{ color: '#b91c1c', fontSize: 13 }}>{errorMsg}</Text>
          </View>
        )}
      </View>
    );
  }

  // 🔴 PREPARAÇÃO DOS DADOS DO GRÁFICO (Espelho da tela do app)
  const reversedAssessments = [...assessments].reverse();
  const fatData = reversedAssessments.map(a => a.anthropometry?.[0]?.body_fat).filter(Boolean);
  const muscleData = reversedAssessments.map(a => a.anthropometry?.[0]?.muscle_mass_percentage).filter(Boolean);
  const chartLabels = reversedAssessments.filter(a => a.anthropometry?.[0]?.body_fat).map(a => formatDateBR(a.date).substring(0, 5));
  
  const relativeEvolution = calculateEvolution(currentAssessment?.anthropometry?.[0], assessments[1]?.anthropometry?.[0]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.brandHeader}>
          <Text style={styles.brandTitle}>VORTEX PRIMUS</Text>
          <Text style={styles.brandSubtitle}>Relatório Oficial de Evolução</Text>
        </View>

        <View style={styles.clientCard}>
          <Text style={styles.clientName}>{client?.name}</Text>
          <Text style={styles.clientInfo}>
            Última Avaliação: {formatDateBR(currentAssessment.date)}
          </Text>
        </View>

        {/* 🔴 GRÁFICO DE LINHAS */}
        {fatData.length > 0 && (
          <View style={{ alignItems: 'center', marginBottom: 24 }}>
            <View style={{ backgroundColor: "#1e293b", paddingVertical: 20, paddingHorizontal: 10, borderRadius: 16, elevation: 4, width: '100%' }}>
              <LineChart
                data={fatData.map((val, index) => ({ value: Number(val) || 0, label: chartLabels[index] }))}
                data2={muscleData.map((val) => ({ value: Number(val) || 0 }))}
                height={220} width={screenWidth - 80} isAnimated animationDuration={1200} curved
                spacing={Math.max(35, (screenWidth - 140) / (fatData.length > 1 ? fatData.length - 1 : 1))}
                initialSpacing={20} endSpacing={20} color1="#ef4444" color2="#22c55e" dataPointsColor1="#ef4444" dataPointsColor2="#22c55e"
                thickness1={3} thickness2={3} dataPointsRadius={4} yAxisColor="rgba(255,255,255,0.3)" xAxisColor="rgba(255,255,255,0.3)"
                yAxisTextStyle={{ color: "#94a3b8", fontSize: 11 }} xAxisLabelTextStyle={{ color: "#94a3b8", fontSize: 11, marginBottom: -10 }}
                yAxisLabelSuffix="%" stepValue={5}
                maxValue={Math.ceil((Math.max(10, ...fatData.map(Number), ...muscleData.map(Number)) + 5) / 5) * 5}
                noOfSections={Math.ceil((Math.max(10, ...fatData.map(Number), ...muscleData.map(Number)) + 5) / 5)}
                rulesColor="rgba(255,255,255,0.25)" hideRules={false} showVerticalLines={true} verticalLinesColor="rgba(255,255,255,0.15)"
              />
              <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 24 }}><View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#ef4444', marginRight: 8 }} /><Text style={{ color: '#e2e8f0', fontSize: 12, fontWeight: '600' }}>% Gordura</Text></View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}><View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#22c55e', marginRight: 8 }} /><Text style={{ color: '#e2e8f0', fontSize: 12, fontWeight: '600' }}>% Músculo</Text></View>
              </View>
            </View>
          </View>
        )}

        {assessments.length > 1 ? (
          <View>
            <EvolutionPanel 
              evolutionData={relativeEvolution} 
              currentAssessment={assessments[0]}
              prevAssessment={assessments[1]}
              firstAssessment={assessments[assessments.length - 1]}
              formatValue={formatValue}
            />
            <MeasurementsEvolutionPanel 
              currentAssessment={assessments[0]}
              prevAssessment={assessments[1]}
              firstAssessment={assessments[assessments.length - 1]}
            />
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 40, marginBottom: 10 }}>🌱</Text>
            <Text style={{ fontWeight: 'bold', color: '#0f172a', fontSize: 16 }}>Ponto de Partida Registado!</Text>
            <Text style={{ color: '#64748b', textAlign: 'center', marginTop: 8 }}>
              Esta é a sua primeira avaliação. Os comparativos começarão a aparecer aqui na sua próxima reavaliação.
            </Text>
          </View>
        )}

        {/* 🔴 DIAGNÓSTICO DESTA AVALIAÇÃO (Espelho Exato do Modal) */}
        <View style={{ marginTop: 24, borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 20 }}>
          <Text style={{ fontSize: 15, fontWeight: '900', color: '#0f172a', marginBottom: 16, textTransform: 'uppercase' }}>📋 Diagnóstico Desta Avaliação</Text>
          
          <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0', elevation: 2 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 8 }}><Text style={{ fontSize: 16 }}>📊</Text><Text style={{ fontSize: 14, fontWeight: '900', color: '#1e293b', marginLeft: 6, textTransform: 'uppercase' }}>Composição Corporal</Text></View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f8fafc' }}><Text style={{ color: '#475569', fontSize: 13, fontWeight: '500' }}>Peso Corporal</Text><Text style={{ fontWeight: '900', color: '#0f172a', fontSize: 14 }}>{currentAssessment?.anthropometry?.[0]?.weight ?? "-"} kg</Text></View>

            {/* 🟢 BARRA DE GORDURA CORPORAL */}
            {(() => {
              const bfStatus = getBodyFatStatus(currentAssessment?.anthropometry?.[0]?.body_fat, client?.gender, calculateAge(client?.birth_date));
              const val = currentAssessment?.anthropometry?.[0]?.body_fat ?? "-";
              return (
                <View style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f8fafc' }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}><Text style={{ color: '#475569', fontSize: 13, fontWeight: '500' }}>% Gordura Corporal</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>{bfStatus && (<View style={{ backgroundColor: bfStatus.bg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginRight: 8 }}><Text style={{ color: bfStatus.color, fontSize: 10, fontWeight: '900' }}>{bfStatus.label}</Text></View>)}<Text style={{ fontWeight: '900', color: '#0f172a', fontSize: 16 }}>{val} %</Text></View>
                  </View>
                  <View style={{ paddingHorizontal: 4, paddingBottom: 6 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: '22%', marginBottom: 2 }}>
                      <Text style={{ fontSize: 10, color: '#64748b', fontWeight: '800' }}>{(bfStatus as any)?.limits?.[0] || '10'}</Text>
                      <Text style={{ fontSize: 10, color: '#64748b', fontWeight: '800' }}>{(bfStatus as any)?.limits?.[1] || '20'}</Text>
                      <Text style={{ fontSize: 10, color: '#64748b', fontWeight: '800' }}>{(bfStatus as any)?.limits?.[2] || '30'}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'visible', backgroundColor: '#e2e8f0', position: 'relative' }}>
                      <View style={{ flex: 1, backgroundColor: '#38bdf8', borderTopLeftRadius: 5, borderBottomLeftRadius: 5 }} /><View style={{ flex: 1, backgroundColor: '#22c55e' }} /><View style={{ flex: 1, backgroundColor: '#eab308' }} /><View style={{ flex: 1, backgroundColor: '#ef4444', borderTopRightRadius: 5, borderBottomRightRadius: 5 }} />
                      {bfStatus && (<View style={[{ position: 'absolute', top: -5, width: 20, height: 20, borderRadius: 10, backgroundColor: '#ffffff', borderWidth: 4, borderColor: '#0f172a', marginLeft: -10, elevation: 5 }, { left: `${bfStatus.pos}%` } as any]} />)}
                    </View>
                    {bfStatus && (<View style={{ flexDirection: 'row', marginTop: 6 }}><View style={{ flex: 1, alignItems: 'center' }}><Text style={{ fontSize: 9, color: '#94a3b8', fontWeight: 'bold' }}>BAIXO</Text></View><View style={{ flex: 1, alignItems: 'center' }}><Text style={{ fontSize: 9, color: '#94a3b8', fontWeight: 'bold' }}>NORMAL</Text></View><View style={{ flex: 1, alignItems: 'center' }}><Text style={{ fontSize: 9, color: '#94a3b8', fontWeight: 'bold' }}>ALTO</Text></View><View style={{ flex: 1, alignItems: 'center' }}><Text style={{ fontSize: 9, color: '#94a3b8', fontWeight: 'bold' }}>CRÍTICO</Text></View></View>)}
                    <ReferenceLink />
                  </View>
                </View>
              );
            })()}

            {/* 🟢 BARRA DE MASSA MUSCULAR */}
            {(() => {
              const mmStatus = getMuscleStatus(currentAssessment?.anthropometry?.[0]?.muscle_mass_percentage, client?.gender, calculateAge(client?.birth_date));
              const val = currentAssessment?.anthropometry?.[0]?.muscle_mass_percentage ?? "-";
              return (
                <View style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f8fafc' }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}><Text style={{ color: '#475569', fontSize: 13, fontWeight: '500' }}>% Massa Muscular</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>{mmStatus && (<View style={{ backgroundColor: mmStatus.bg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginRight: 8 }}><Text style={{ color: mmStatus.color, fontSize: 10, fontWeight: '900' }}>{mmStatus.label}</Text></View>)}<Text style={{ fontWeight: '900', color: '#0f172a', fontSize: 16 }}>{val} %</Text></View>
                  </View>
                  <View style={{ paddingHorizontal: 4, paddingBottom: 6 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: '22%', marginBottom: 2 }}>
                      <Text style={{ fontSize: 10, color: '#64748b', fontWeight: '800' }}>{(mmStatus as any)?.limits?.[0] || '33'}</Text>
                      <Text style={{ fontSize: 10, color: '#64748b', fontWeight: '800' }}>{(mmStatus as any)?.limits?.[1] || '39'}</Text>
                      <Text style={{ fontSize: 10, color: '#64748b', fontWeight: '800' }}>{(mmStatus as any)?.limits?.[2] || '44'}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'visible', backgroundColor: '#e2e8f0', position: 'relative' }}>
                      <View style={{ flex: 1, backgroundColor: '#ef4444', borderTopLeftRadius: 5, borderBottomLeftRadius: 5 }} /><View style={{ flex: 1, backgroundColor: '#84cc16' }} /><View style={{ flex: 1, backgroundColor: '#22c55e' }} /><View style={{ flex: 1, backgroundColor: '#38bdf8', borderTopRightRadius: 5, borderBottomRightRadius: 5 }} />
                      {mmStatus && (<View style={[{ position: 'absolute', top: -5, width: 20, height: 20, borderRadius: 10, backgroundColor: '#ffffff', borderWidth: 4, borderColor: '#0f172a', marginLeft: -10, elevation: 5 }, { left: `${mmStatus.pos}%` } as any]} />)}
                    </View>
                    {mmStatus && (<View style={{ flexDirection: 'row', marginTop: 6 }}><View style={{ flex: 1, alignItems: 'center' }}><Text style={{ fontSize: 9, color: '#94a3b8', fontWeight: 'bold' }}>BAIXO</Text></View><View style={{ flex: 1, alignItems: 'center' }}><Text style={{ fontSize: 9, color: '#94a3b8', fontWeight: 'bold' }}>NORMAL</Text></View><View style={{ flex: 1, alignItems: 'center' }}><Text style={{ fontSize: 9, color: '#94a3b8', fontWeight: 'bold' }}>ALTO</Text></View><View style={{ flex: 1, alignItems: 'center' }}><Text style={{ fontSize: 9, color: '#94a3b8', fontWeight: 'bold' }}>ELITE</Text></View></View>)}
                    <ReferenceLink />
                  </View>
                </View>
              );
            })()}

            <View style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f8fafc' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: '#475569', fontSize: 13, fontWeight: '500' }}>Idade Metabólica</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {getMetabolicStatus(currentAssessment?.anthropometry?.[0]?.metabolic_age, calculateAge(client?.birth_date)) && (
                    <View style={{ backgroundColor: getMetabolicStatus(currentAssessment?.anthropometry?.[0]?.metabolic_age, calculateAge(client?.birth_date))?.bg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginRight: 8 }}><Text style={{ color: getMetabolicStatus(currentAssessment?.anthropometry?.[0]?.metabolic_age, calculateAge(client?.birth_date))?.color, fontSize: 10, fontWeight: '800' }}>{getMetabolicStatus(currentAssessment?.anthropometry?.[0]?.metabolic_age, calculateAge(client?.birth_date))?.label}</Text></View>
                  )}<Text style={{ fontWeight: '900', color: '#0f172a', fontSize: 14 }}>{currentAssessment?.anthropometry?.[0]?.metabolic_age ?? "-"} anos</Text>
                </View>
              </View>
              <ReferenceLink />
            </View>

            {/* 🟢 BARRA DE GORDURA VISCERAL */}
            {(() => {
              const vsStatus = getVisceralStatus(currentAssessment?.anthropometry?.[0]?.body_fat_index);
              const val = currentAssessment?.anthropometry?.[0]?.body_fat_index ?? "-";
              return (
                <View style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f8fafc' }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}><Text style={{ color: '#475569', fontSize: 13, fontWeight: '500' }}>Gordura Visceral</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>{vsStatus && (<View style={{ backgroundColor: vsStatus.bg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginRight: 8 }}><Text style={{ color: vsStatus.color, fontSize: 10, fontWeight: '900' }}>{vsStatus.label}</Text></View>)}<Text style={{ fontWeight: '900', color: '#0f172a', fontSize: 16 }}>{val}</Text></View>
                  </View>
                  <View style={{ paddingHorizontal: 4, paddingBottom: 6 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: '22%', marginBottom: 2 }}>
                      <Text style={{ fontSize: 10, color: '#64748b', fontWeight: '800' }}>{(vsStatus as any)?.limits?.[0] || '9'}</Text>
                      <Text style={{ fontSize: 10, color: '#64748b', fontWeight: '800' }}>{(vsStatus as any)?.limits?.[1] || '14'}</Text>
                      <Text style={{ fontSize: 10, color: '#64748b', fontWeight: '800' }}>{(vsStatus as any)?.limits?.[2] || '30'}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'visible', backgroundColor: '#e2e8f0', position: 'relative' }}>
                      <View style={{ flex: 1, backgroundColor: '#22c55e', borderTopLeftRadius: 5, borderBottomLeftRadius: 5 }} /> <View style={{ flex: 1, backgroundColor: '#84cc16' }} /> <View style={{ flex: 1, backgroundColor: '#eab308' }} /> <View style={{ flex: 1, backgroundColor: '#ef4444', borderTopRightRadius: 5, borderBottomRightRadius: 5 }} /> 
                      {vsStatus && (<View style={[{ position: 'absolute', top: -5, width: 20, height: 20, borderRadius: 10, backgroundColor: '#ffffff', borderWidth: 4, borderColor: '#0f172a', marginLeft: -10, elevation: 5 }, { left: `${vsStatus.pos}%` } as any]} />)}
                    </View>
                    {vsStatus && (<View style={{ flexDirection: 'row', marginTop: 6 }}><View style={{ flex: 1, alignItems: 'center' }}><Text style={{ fontSize: 9, color: '#94a3b8', fontWeight: 'bold' }}>IDEAL</Text></View><View style={{ flex: 1, alignItems: 'center' }}><Text style={{ fontSize: 9, color: '#94a3b8', fontWeight: 'bold' }}>BOM</Text></View><View style={{ flex: 1, alignItems: 'center' }}><Text style={{ fontSize: 9, color: '#94a3b8', fontWeight: 'bold' }}>RUIM</Text></View><View style={{ flex: 1, alignItems: 'center' }}><Text style={{ fontSize: 9, color: '#94a3b8', fontWeight: 'bold' }}>CRÍTICO</Text></View></View>)}
                    <ReferenceLink />
                  </View>
                </View>
              );
            })()}

            <View style={{ paddingVertical: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: '#475569', fontSize: 13, fontWeight: '500' }}>Metabolismo Basal</Text>
                <Text style={{ fontWeight: '900', color: '#0f172a', fontSize: 14 }}>{currentAssessment?.anthropometry?.[0]?.basal_metabolic_rate ?? "-"} kcal</Text>
              </View>
              <ReferenceLink />
            </View>

          </View>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#e2e8f0' }}><Text style={{ fontSize: 12, fontWeight: '800', color: '#ea580c', marginBottom: 10 }}>📏 TRONCO</Text><View style={{ flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingVertical: 4 }}><Text style={{ color: '#475569', fontSize: 12 }}>Peitoral</Text><Text style={{ fontWeight: '800', fontSize: 12, color: '#0f172a' }}>{currentAssessment?.anthropometry?.[0]?.chest ?? "-"} cm</Text></View><View style={{ flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingVertical: 4 }}><Text style={{ color: '#475569', fontSize: 12 }}>Abdômen</Text><Text style={{ fontWeight: '800', fontSize: 12, color: '#0f172a' }}>{currentAssessment?.anthropometry?.[0]?.abdomen ?? "-"} cm</Text></View><View style={{ flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingVertical: 4 }}><Text style={{ color: '#475569', fontSize: 12 }}>Cintura</Text><Text style={{ fontWeight: '800', fontSize: 12, color: '#0f172a' }}>{currentAssessment?.anthropometry?.[0]?.waist ?? "-"} cm</Text></View><View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}><Text style={{ color: '#475569', fontSize: 12 }}>Quadril</Text><Text style={{ fontWeight: '800', fontSize: 12, color: '#0f172a' }}>{currentAssessment?.anthropometry?.[0]?.hip ?? "-"} cm</Text></View></View>
            <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#e2e8f0' }}><Text style={{ fontSize: 12, fontWeight: '800', color: '#16a34a', marginBottom: 10 }}>🦵 MEMBROS (E/D)</Text><View style={{ flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingVertical: 4 }}><Text style={{ color: '#475569', fontSize: 12 }}>Braço</Text><Text style={{ fontWeight: '800', fontSize: 12, color: '#0f172a' }}>{currentAssessment?.anthropometry?.[0]?.arm_left ?? "-"}/{currentAssessment?.anthropometry?.[0]?.arm_right ?? "-"}</Text></View><View style={{ flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingVertical: 4 }}><Text style={{ color: '#475569', fontSize: 12 }}>Coxa</Text><Text style={{ fontWeight: '800', fontSize: 12, color: '#0f172a' }}>{currentAssessment?.anthropometry?.[0]?.thigh_left ?? "-"}/{currentAssessment?.anthropometry?.[0]?.thigh_right ?? "-"}</Text></View><View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}><Text style={{ color: '#475569', fontSize: 12 }}>Pantur.</Text><Text style={{ fontWeight: '800', fontSize: 12, color: '#0f172a' }}>{currentAssessment?.anthropometry?.[0]?.calf_left ?? "-"}/{currentAssessment?.anthropometry?.[0]?.calf_right ?? "-"}</Text></View></View>
          </View>
        </View>

        <View style={{ marginTop: 24, paddingVertical: 14, backgroundColor: '#0f172a', borderRadius: 12 }}><Text style={{ color: '#fbbf24', textAlign: 'center', fontSize: 13, fontWeight: '900', letterSpacing: 1 }}>FOCO NO PROCESSO. OS RESULTADOS VIRÃO! 🔥</Text></View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Gerado por Vortex Primus App</Text>
        </View>
      </ScrollView>

      {/* 🔴 MODAL DE REFERÊNCIAS CIENTÍFICAS */}
      <Modal visible={referencesVisible} animationType="fade" transparent={true} onRequestClose={() => setReferencesVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ backgroundColor: '#fff', padding: 24, borderRadius: 16, width: '100%', maxHeight: '85%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 18, fontWeight: '900', color: '#0f172a' }}>Referências Científicas 📚</Text>
              <TouchableOpacity onPress={() => setReferencesVisible(false)}><Text style={{ fontSize: 20, color: '#64748b' }}>✕</Text></TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ backgroundColor: '#eff6ff', padding: 14, borderRadius: 10, marginBottom: 20, borderWidth: 1, borderColor: '#bfdbfe' }}>
                <Text style={{ fontSize: 15, fontWeight: '900', color: '#1d4ed8', marginBottom: 6 }}>🪄 Avaliação à Distância (IA Antropométrica)</Text>
                <Text style={{ fontSize: 13, color: '#1e3a8a', lineHeight: 20 }}>
                  Na ausência de bioimpedância, o sistema calcula os dados utilizando o <Text style={{fontWeight: 'bold'}}>RFM (Relative Fat Mass)</Text>, validado pelo <Text style={{fontStyle: 'italic'}}>Cedars-Sinai Medical Center</Text>, e a equação de <Text style={{fontWeight: 'bold'}}>Mifflin-St Jeor</Text>, considerada o padrão-ouro clínico moderno para estimar o metabolismo e a composição corporal com altíssima precisão utilizando apenas medidas antropométricas.
                </Text>
              </View>

              <Text style={{ fontSize: 14, color: '#475569', marginBottom: 20, lineHeight: 22 }}>
                As classificações padrão do Cross utilizam as rigorosas diretrizes da <Text style={{fontWeight: 'bold'}}>Omron Healthcare</Text> (modelo HBF-514C) e estudos reconhecidos internacionalmente:
              </Text>

              <Text style={{ fontSize: 15, fontWeight: '800', color: '#1e293b', marginBottom: 6 }}>% Gordura Corporal</Text>
              <Text style={{ fontSize: 13, color: '#64748b', marginBottom: 16, lineHeight: 20 }}>As faixas baseiam-se na pesquisa de <Text style={{fontStyle: 'italic'}}>Gallagher et al.</Text>, do <Text style={{fontWeight: 'bold'}}>American Journal of Clinical Nutrition</Text> (2000), cruzando género e faixa etária.</Text>

              <Text style={{ fontSize: 15, fontWeight: '800', color: '#1e293b', marginBottom: 6 }}>Gordura Visceral</Text>
              <Text style={{ fontSize: 13, color: '#64748b', marginBottom: 16, lineHeight: 20 }}>Níveis (1 a 30) alinhados com as diretrizes médicas para prevenção de síndromes metabólicas.</Text>

              <Text style={{ fontSize: 15, fontWeight: '800', color: '#1e293b', marginBottom: 6 }}>Idade Metabólica & Metabolismo Basal</Text>
              <Text style={{ fontSize: 13, color: '#64748b', marginBottom: 16, lineHeight: 20 }}>Cálculo clínico comparativo usando a equação preditiva de gasto energético em repouso ajustada pela massa livre de gordura.</Text>
            </ScrollView>

            <TouchableOpacity style={{ backgroundColor: '#0f172a', padding: 14, borderRadius: 10, marginTop: 10, alignItems: 'center' }} onPress={() => setReferencesVisible(false)}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f8fafc" },
  scrollContent: { padding: 16, paddingBottom: 40 },
  brandHeader: { alignItems: 'center', marginBottom: 24, marginTop: 20 },
  brandTitle: { fontSize: 24, fontWeight: '900', color: '#0f172a', letterSpacing: 2 },
  brandSubtitle: { fontSize: 12, color: '#3b82f6', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 },
  clientCard: { backgroundColor: '#fff', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 24, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
  clientName: { fontSize: 18, fontWeight: '900', color: '#1e293b', marginBottom: 4 },
  clientInfo: { fontSize: 13, color: '#64748b', fontWeight: '500' },
  emptyState: { backgroundColor: '#fff', padding: 24, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', marginTop: 20 },
  footer: { marginTop: 40, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 20 },
  footerText: { color: '#94a3b8', fontSize: 12, fontWeight: '600' }
});
