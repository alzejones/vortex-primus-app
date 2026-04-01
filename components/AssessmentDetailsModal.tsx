import React, { useState } from 'react';
import { Dimensions, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import {
  getBodyFatStatus,
  getMetabolicStatus,
  getMuscleStatus
} from '../utils/assessmentCalculations';
import EvolutionPanel from './EvolutionPanel';
import MeasurementsEvolutionPanel from './MeasurementsEvolutionPanel';

const screenWidth = Dimensions.get('window').width;

interface AssessmentDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  client: any;
  selectedAssessment: any;
  relativeEvolution: any;
  assessments: any;
  fatData: any[];
  muscleData: any[];
  chartLabels: string[];
  viewRef: any;
  onShare: () => void;
  calculateAge: (date: any) => any;
  getColor: (val: any, type: any) => any;
  formatValue: (val: any) => any;
  styles: any; 
}

// 🔴 NOVA LÓGICA DE GORDURA VISCERAL (Substitui a lógica antiga)
const getLocalVisceralStatus = (value: any) => {
  const v = Number(value);
  if (isNaN(v) || v <= 0) return null;
  let label = "IDEAL"; let bg = "#dcfce7"; let color = "#16a34a"; let pos = 0;
  
  if (v <= 4) {
    label = "IDEAL"; bg = "#dcfce7"; color = "#16a34a";
    pos = (v / 4) * 25;
  } else if (v <= 9) {
    label = "ATENÇÃO"; bg = "#fef08a"; color = "#ca8a04";
    pos = 25 + ((v - 4) / 5) * 25;
  } else if (v <= 13) {
    label = "ALTO"; bg = "#ffedd5"; color = "#ea580c";
    pos = 50 + ((v - 9) / 4) * 25;
  } else {
    label = "CRÍTICO"; bg = "#fee2e2"; color = "#dc2626";
    pos = 75 + ((Math.min(v, 20) - 13) / 7) * 25; // Limita o máximo visual em 20 para o ponto não sumir da tela
  }
  
  return { label, bg, color, pos: Math.min(Math.max(pos, 0), 100) };
};

export default function AssessmentDetailsModal({
  visible,
  onClose,
  client,
  selectedAssessment,
  relativeEvolution,
  assessments,
  fatData,
  muscleData,
  chartLabels,
  viewRef,
  onShare,
  calculateAge,
  getColor,
  formatValue,
  styles
}: AssessmentDetailsModalProps) {

  const [referencesVisible, setReferencesVisible] = useState(false);

  const ReferenceLink = () => (
    <TouchableOpacity 
      style={{ marginTop: 8, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center' }}
      onPress={() => setReferencesVisible(true)}
    >
      <Text style={{ color: '#64748b', fontSize: 11, fontWeight: '600' }}>ℹ️ Referência Científica</Text>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
            <Text style={styles.pageTitle}>Detalhes da Avaliação</Text>
            <TouchableOpacity onPress={onClose} style={{ padding: 5 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#64748b' }}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View ref={viewRef} collapsable={false} style={{ backgroundColor: '#fff', padding: 12, borderRadius: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: '900', color: '#0f172a', textAlign: 'center', marginBottom: 15, textTransform: 'uppercase' }}>
                Vortex Primus - Evolução de {client?.name?.split(' ')[0]}
              </Text> 

              <View style={{ alignItems: 'center', marginBottom: 24 }}>
                <View style={{ backgroundColor: "#1e293b", paddingVertical: 20, paddingHorizontal: 10, borderRadius: 16, elevation: 4 }}>
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
              
              {relativeEvolution && (
                <EvolutionPanel evolutionData={relativeEvolution} currentAssessment={selectedAssessment} prevAssessment={assessments?.[(assessments?.findIndex((a: any) => a.id === selectedAssessment?.id) ?? 0) + 1]} firstAssessment={assessments?.[assessments.length - 1]} formatValue={formatValue} />
              )}
              
              <MeasurementsEvolutionPanel currentAssessment={selectedAssessment} prevAssessment={assessments?.[(assessments?.findIndex((a: any) => a.id === selectedAssessment?.id) ?? 0) + 1]} firstAssessment={assessments?.[assessments.length - 1]} />

              <View style={{ marginTop: 10, borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 20 }}>
                <Text style={{ fontSize: 15, fontWeight: '900', color: '#0f172a', marginBottom: 16, textTransform: 'uppercase' }}>📋 Diagnóstico Desta Avaliação</Text>
                
                <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0', elevation: 2 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 8 }}><Text style={{ fontSize: 16 }}>📊</Text><Text style={{ fontSize: 14, fontWeight: '900', color: '#1e293b', marginLeft: 6, textTransform: 'uppercase' }}>Composição Corporal</Text></View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f8fafc' }}><Text style={{ color: '#475569', fontSize: 13, fontWeight: '500' }}>Peso Corporal</Text><Text style={{ fontWeight: '900', color: '#0f172a', fontSize: 14 }}>{selectedAssessment?.anthropometry?.[0]?.weight ?? "-"} kg</Text></View>

                  {/* 🟢 BARRA DE GORDURA CORPORAL */}
                  {(() => {
                    const bfStatus = getBodyFatStatus(selectedAssessment?.anthropometry?.[0]?.body_fat, client?.gender, calculateAge(client?.birth_date));
                    const val = selectedAssessment?.anthropometry?.[0]?.body_fat ?? "-";
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
                    const mmStatus = getMuscleStatus(selectedAssessment?.anthropometry?.[0]?.muscle_mass_percentage, client?.gender, calculateAge(client?.birth_date));
                    const val = selectedAssessment?.anthropometry?.[0]?.muscle_mass_percentage ?? "-";
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
                        {getMetabolicStatus(selectedAssessment?.anthropometry?.[0]?.metabolic_age, calculateAge(client?.birth_date)) && (
                          <View style={{ backgroundColor: getMetabolicStatus(selectedAssessment?.anthropometry?.[0]?.metabolic_age, calculateAge(client?.birth_date))?.bg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginRight: 8 }}><Text style={{ color: getMetabolicStatus(selectedAssessment?.anthropometry?.[0]?.metabolic_age, calculateAge(client?.birth_date))?.color, fontSize: 10, fontWeight: '800' }}>{getMetabolicStatus(selectedAssessment?.anthropometry?.[0]?.metabolic_age, calculateAge(client?.birth_date))?.label}</Text></View>
                        )}<Text style={{ fontWeight: '900', color: '#0f172a', fontSize: 14 }}>{selectedAssessment?.anthropometry?.[0]?.metabolic_age ?? "-"} anos</Text>
                      </View>
                    </View>
                    <ReferenceLink />
                  </View>

                  {/* 🟢 BARRA DE GORDURA VISCERAL (ATUALIZADA) */}
                  {(() => {
                    const vsStatus = getLocalVisceralStatus(selectedAssessment?.anthropometry?.[0]?.body_fat_index);
                    const val = selectedAssessment?.anthropometry?.[0]?.body_fat_index ?? "-";
                    return (
                      <View style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f8fafc' }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}><Text style={{ color: '#475569', fontSize: 13, fontWeight: '500' }}>Gordura Visceral</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>{vsStatus && (<View style={{ backgroundColor: vsStatus.bg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginRight: 8 }}><Text style={{ color: vsStatus.color, fontSize: 10, fontWeight: '900' }}>{vsStatus.label}</Text></View>)}<Text style={{ fontWeight: '900', color: '#0f172a', fontSize: 16 }}>{val}</Text></View>
                        </View>
                        <View style={{ paddingHorizontal: 4, paddingBottom: 6 }}>
   
                          {/* Novas Réguas Numéricas */}
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: '22%', marginBottom: 2 }}>
                            <Text style={{ fontSize: 10, color: '#64748b', fontWeight: '800' }}>4</Text>
                            <Text style={{ fontSize: 10, color: '#64748b', fontWeight: '800' }}>9</Text>
                            <Text style={{ fontSize: 10, color: '#64748b', fontWeight: '800' }}>13</Text>
                          </View>
                          {/* Novas Cores */}
                          <View style={{ flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'visible', backgroundColor: '#e2e8f0', position: 'relative' }}>
                            <View style={{ flex: 1, backgroundColor: '#22c55e', borderTopLeftRadius: 5, borderBottomLeftRadius: 5 }} /> 
                            <View style={{ flex: 1, backgroundColor: '#eab308' }} /> 
                            <View style={{ flex: 1, backgroundColor: '#f97316' }} /> 
                            <View style={{ flex: 1, backgroundColor: '#ef4444', borderTopRightRadius: 5, borderBottomRightRadius: 5 }} /> 
                            {vsStatus && (<View style={[{ position: 'absolute', top: -5, width: 20, height: 20, borderRadius: 10, backgroundColor: '#ffffff', borderWidth: 4, borderColor: '#0f172a', marginLeft: -10, elevation: 5 }, { left: `${vsStatus.pos}%` } as any]} />)}
                          </View>
                          {/* Novos Textos */}
                          {vsStatus && (<View style={{ flexDirection: 'row', marginTop: 6 }}><View style={{ flex: 1, alignItems: 'center' }}><Text style={{ fontSize: 9, color: '#94a3b8', fontWeight: 'bold' }}>IDEAL</Text></View><View style={{ flex: 1, alignItems: 'center' }}><Text style={{ fontSize: 9, color: '#94a3b8', fontWeight: 'bold' }}>ATENÇÃO</Text></View><View style={{ flex: 1, alignItems: 'center' }}><Text style={{ fontSize: 9, color: '#94a3b8', fontWeight: 'bold' }}>ALTO</Text></View><View style={{ flex: 1, alignItems: 'center' }}><Text style={{ fontSize: 9, color: '#94a3b8', fontWeight: 'bold' }}>CRÍTICO</Text></View></View>)}
                          <ReferenceLink />
                        </View>
                      </View>
                    );
                  })()}

                  <View style={{ paddingVertical: 12 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ color: '#475569', fontSize: 13, fontWeight: '500' }}>Metabolismo Basal</Text>
                      <Text style={{ fontWeight: '900', color: '#0f172a', fontSize: 14 }}>{selectedAssessment?.anthropometry?.[0]?.basal_metabolic_rate ?? "-"} kcal</Text>
                    </View>
                    <ReferenceLink />
                  </View>

                </View>

                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#e2e8f0' }}><Text style={{ fontSize: 12, fontWeight: '800', color: '#ea580c', marginBottom: 10 }}>📏 TRONCO</Text><View style={{ flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingVertical: 4 }}><Text style={{ color: '#475569', fontSize: 12 }}>Peitoral</Text><Text style={{ fontWeight: '800', fontSize: 12, color: '#0f172a' }}>{selectedAssessment?.anthropometry?.[0]?.chest ?? "-"} cm</Text></View><View style={{ flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingVertical: 4 }}><Text style={{ color: '#475569', fontSize: 12 }}>Abdômen</Text><Text style={{ fontWeight: '800', fontSize: 12, color: '#0f172a' }}>{selectedAssessment?.anthropometry?.[0]?.abdomen ?? "-"} cm</Text></View><View style={{ flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingVertical: 4 }}><Text style={{ color: '#475569', fontSize: 12 }}>Cintura</Text><Text style={{ fontWeight: '800', fontSize: 12, color: '#0f172a' }}>{selectedAssessment?.anthropometry?.[0]?.waist ?? "-"} cm</Text></View><View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}><Text style={{ color: '#475569', fontSize: 12 }}>Quadril</Text><Text style={{ fontWeight: '800', fontSize: 12, color: '#0f172a' }}>{selectedAssessment?.anthropometry?.[0]?.hip ?? "-"} cm</Text></View></View>
                  <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#e2e8f0' }}><Text style={{ fontSize: 12, fontWeight: '800', color: '#16a34a', marginBottom: 10 }}>🦵 MEMBROS (E/D)</Text><View style={{ flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingVertical: 4 }}><Text style={{ color: '#475569', fontSize: 12 }}>Braço</Text><Text style={{ fontWeight: '800', fontSize: 12, color: '#0f172a' }}>{selectedAssessment?.anthropometry?.[0]?.arm_left ?? "-"}/{selectedAssessment?.anthropometry?.[0]?.arm_right ?? "-"}</Text></View><View style={{ flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingVertical: 4 }}><Text style={{ color: '#475569', fontSize: 12 }}>Coxa</Text><Text style={{ fontWeight: '800', fontSize: 12, color: '#0f172a' }}>{selectedAssessment?.anthropometry?.[0]?.thigh_left ?? "-"}/{selectedAssessment?.anthropometry?.[0]?.thigh_right ?? "-"}</Text></View><View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}><Text style={{ color: '#475569', fontSize: 12 }}>Pantur.</Text><Text style={{ fontWeight: '800', fontSize: 12, color: '#0f172a' }}>{selectedAssessment?.anthropometry?.[0]?.calf_left ?? "-"}/{selectedAssessment?.anthropometry?.[0]?.calf_right ?? "-"}</Text></View></View>
                </View>
              </View>
              
              <View style={{ marginTop: 24, paddingVertical: 14, backgroundColor: '#0f172a', borderRadius: 12 }}><Text style={{ color: '#fbbf24', textAlign: 'center', fontSize: 13, fontWeight: '900', letterSpacing: 1 }}>FOCO NO PROCESSO. OS RESULTADOS VIRÃO! 🔥</Text></View>
            </View>
            <View style={{ marginTop: 16, paddingBottom: 20 }}>
              <TouchableOpacity style={[styles.button, { backgroundColor: '#2563eb', paddingVertical: 14, borderRadius: 12 }]} onPress={onShare}><Text style={{ color: "#fff", textAlign: "center", fontWeight: '900', fontSize: 15, textTransform: 'uppercase' }}>📸 Compartilhar Evolução</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.button, { marginTop: 12, backgroundColor: '#f1f5f9', paddingVertical: 14, borderRadius: 12 }]} onPress={onClose}><Text style={{ color: "#475569", textAlign: "center", fontWeight: '800', fontSize: 15 }}>FECHAR PAINEL</Text></TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>

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
              <Text style={{ fontSize: 13, color: '#64748b', marginBottom: 16, lineHeight: 20 }}>Níveis alinhados com as diretrizes médicas para prevenção de síndromes metabólicas.</Text>

              <Text style={{ fontSize: 15, fontWeight: '800', color: '#1e293b', marginBottom: 6 }}>Idade Metabólica & Metabolismo Basal</Text>
              <Text style={{ fontSize: 13, color: '#64748b', marginBottom: 16, lineHeight: 20 }}>Cálculo clínico comparativo usando a equação preditiva de gasto energético em repouso ajustada pela massa livre de gordura.</Text>
            </ScrollView>

            <TouchableOpacity style={{ backgroundColor: '#0f172a', padding: 14, borderRadius: 10, marginTop: 10, alignItems: 'center' }} onPress={() => setReferencesVisible(false)}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </Modal>
  );
}




