import React from 'react';
import { Dimensions, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import {
    getBodyFatStatus,
    getMetabolicStatus,
    getMuscleStatus,
    getVisceralStatus
} from '../utils/assessmentCalculations';

const screenWidth = Dimensions.get('window').width;

interface AssessmentDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  client: any;
  selectedAssessment: any;
  relativeEvolution: any;
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

export default function AssessmentDetailsModal({
  visible,
  onClose,
  client,
  selectedAssessment,
  relativeEvolution,
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

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
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

              {/* GRÁFICO PREMIUM */}
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
                </View>
              </View>
              
              {/* PAINEL DE EVOLUÇÃO COMPARATIVA */}
              {relativeEvolution && (
                <View style={{ marginBottom: 24 }}>
                  <Text style={{ fontSize: 15, fontWeight: '900', color: '#0f172a', marginBottom: 12, textTransform: 'uppercase' }}>📉 Análise de Evolução</Text>
                  {/* Cartões de Evolução (Agora Completos) */}
                  <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                    
                    {/* Cartão: Última vs Anterior */}
                    <View style={{ flex: 1, backgroundColor: '#f8fafc', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' }}>
                      <Text style={{ fontSize: 12, fontWeight: '800', color: '#3b82f6', marginBottom: 8 }}>COMPOSIÇÃO CORPORAL</Text>
                      
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}><Text style={{ fontSize: 12, color: '#475569' }}>Peso</Text><Text style={{ fontSize: 12, fontWeight: '800', color: getColor(relativeEvolution.diffRecentWeight, "weight") }}>{formatValue(relativeEvolution.diffRecentWeight)} kg</Text></View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}><Text style={{ fontSize: 12, color: '#475569' }}>% Gord</Text><Text style={{ fontSize: 12, fontWeight: '800', color: getColor(relativeEvolution.diffRecentFat, "fat") }}>{formatValue(relativeEvolution.diffRecentFat)}</Text></View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}><Text style={{ fontSize: 12, color: '#475569' }}>% Musc</Text><Text style={{ fontSize: 12, fontWeight: '800', color: getColor(relativeEvolution.diffRecentMuscle, "muscle") }}>{formatValue(relativeEvolution.diffRecentMuscle)}</Text></View>
                      
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}><Text style={{ fontSize: 12, color: '#475569' }}>Id. Metab</Text><Text style={{ fontSize: 12, fontWeight: '800', color: getColor(relativeEvolution.diffRecentMetabolicAge, "fat") }}>{formatValue(relativeEvolution.diffRecentMetabolicAge)}</Text></View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}><Text style={{ fontSize: 12, color: '#475569' }}>G. Visceral</Text><Text style={{ fontSize: 12, fontWeight: '800', color: getColor(relativeEvolution.diffRecentVisceral, "fat") }}>{formatValue(relativeEvolution.diffRecentVisceral)}</Text></View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={{ fontSize: 12, color: '#475569' }}>Met. Basal</Text><Text style={{ fontSize: 12, fontWeight: '800', color: getColor(relativeEvolution.diffRecentBasal, "muscle") }}>{formatValue(relativeEvolution.diffRecentBasal)} kcal</Text></View>
                    </View>
                    
                    {/* Cartão: Evolução Total */}
                    <View style={{ flex: 1, backgroundColor: '#f8fafc', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' }}>
                      <Text style={{ fontSize: 12, fontWeight: '800', color: '#3b82f6', marginBottom: 8 }}>COMPOSIÇÃO CORPORAL</Text>
                      
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}><Text style={{ fontSize: 12, color: '#475569' }}>Peso</Text><Text style={{ fontSize: 12, fontWeight: '800', color: getColor(relativeEvolution.diffTotalWeight, "weight") }}>{formatValue(relativeEvolution.diffTotalWeight)} kg</Text></View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}><Text style={{ fontSize: 12, color: '#475569' }}>% Gord</Text><Text style={{ fontSize: 12, fontWeight: '800', color: getColor(relativeEvolution.diffTotalFat, "fat") }}>{formatValue(relativeEvolution.diffTotalFat)}</Text></View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}><Text style={{ fontSize: 12, color: '#475569' }}>% Musc</Text><Text style={{ fontSize: 12, fontWeight: '800', color: getColor(relativeEvolution.diffTotalMuscle, "muscle") }}>{formatValue(relativeEvolution.diffTotalMuscle)}</Text></View>
                      
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}><Text style={{ fontSize: 12, color: '#475569' }}>Id. Metab</Text><Text style={{ fontSize: 12, fontWeight: '800', color: getColor(relativeEvolution.diffTotalMetabolicAge, "fat") }}>{formatValue(relativeEvolution.diffTotalMetabolicAge)}</Text></View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}><Text style={{ fontSize: 12, color: '#475569' }}>G. Visceral</Text><Text style={{ fontSize: 12, fontWeight: '800', color: getColor(relativeEvolution.diffTotalVisceral, "fat") }}>{formatValue(relativeEvolution.diffTotalVisceral)}</Text></View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={{ fontSize: 12, color: '#475569' }}>Met. Basal</Text><Text style={{ fontSize: 12, fontWeight: '800', color: getColor(relativeEvolution.diffTotalBasal, "muscle") }}>{formatValue(relativeEvolution.diffTotalBasal)} kcal</Text></View>
                    </View>

                  </View>
                </View>
              )}

              {/* DIAGNÓSTICO ATUAL UNIFICADO */}
              <View style={{ marginTop: 10, borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 20 }}>
                <Text style={{ fontSize: 15, fontWeight: '900', color: '#0f172a', marginBottom: 16, textTransform: 'uppercase' }}>📋 Diagnóstico Desta Avaliação</Text>
                
                {/* Bloco Composição Corporal */}
                <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 8 }}>
                    <Text style={{ fontSize: 16 }}>📊</Text>
                    <Text style={{ fontSize: 14, fontWeight: '900', color: '#1e293b', marginLeft: 6, textTransform: 'uppercase' }}>Composição Corporal</Text>
                  </View>

                  {/* Peso Corporal */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f8fafc' }}>
                    <Text style={{ color: '#475569', fontSize: 13, fontWeight: '500' }}>Peso Corporal</Text>
                    <Text style={{ fontWeight: '900', color: '#0f172a', fontSize: 14 }}>{selectedAssessment?.anthropometry?.[0]?.weight ?? "-"} kg</Text>
                  </View>

                  {/* Gordura Corporal (COM FAIXAS NUMÉRICAS) */}
                  {(() => {
                    const bfStatus = getBodyFatStatus(selectedAssessment?.anthropometry?.[0]?.body_fat, client?.gender, calculateAge(client?.birth_date));
                    const val = selectedAssessment?.anthropometry?.[0]?.body_fat ?? "-";
                    return (
                      <View style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f8fafc' }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                          <Text style={{ color: '#475569', fontSize: 13, fontWeight: '500' }}>% Gordura Corporal</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            {bfStatus && (
                              <View style={{ backgroundColor: bfStatus.bg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginRight: 8 }}>
                                <Text style={{ color: bfStatus.color, fontSize: 10, fontWeight: '900' }}>{bfStatus.label}</Text>
                              </View>
                            )}
                            <Text style={{ fontWeight: '900', color: '#0f172a', fontSize: 16 }}>{val} %</Text>
                          </View>
                        </View>
                        <View style={{ paddingHorizontal: 4, paddingBottom: 6 }}>
                          <View style={{ flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'hidden', backgroundColor: '#e2e8f0', position: 'relative' }}>
                            <View style={{ flex: 1, backgroundColor: '#38bdf8' }} />
                            <View style={{ flex: 1, backgroundColor: '#22c55e' }} />
                            <View style={{ flex: 1, backgroundColor: '#eab308' }} />
                            <View style={{ flex: 1, backgroundColor: '#ef4444' }} />
                            {bfStatus && (
                              <View style={[{ position: 'absolute', top: -2, bottom: -2, width: 4, backgroundColor: '#0f172a', borderRadius: 2, borderWidth: 1, borderColor: '#fff' }, { left: `${bfStatus.pos}%` } as any]} />
                            )}
                          </View>
                          {bfStatus && (
                            <View style={{ flexDirection: 'row', marginTop: 8 }}>
                              <View style={{ flex: 1, alignItems: 'center' }}>
                                <Text style={{ fontSize: 9, color: '#94a3b8', fontWeight: 'bold' }}>BAIXO</Text>
                                <Text style={{ fontSize: 9, color: '#64748b', fontWeight: 'bold' }}>{bfStatus.ranges.baixo}</Text>
                              </View>
                              <View style={{ flex: 1, alignItems: 'center' }}>
                                <Text style={{ fontSize: 9, color: '#94a3b8', fontWeight: 'bold' }}>NORMAL</Text>
                                <Text style={{ fontSize: 9, color: '#64748b', fontWeight: 'bold' }}>{bfStatus.ranges.normal}</Text>
                              </View>
                              <View style={{ flex: 1, alignItems: 'center' }}>
                                <Text style={{ fontSize: 9, color: '#94a3b8', fontWeight: 'bold' }}>ALTO</Text>
                                <Text style={{ fontSize: 9, color: '#64748b', fontWeight: 'bold' }}>{bfStatus.ranges.alto}</Text>
                              </View>
                              <View style={{ flex: 1, alignItems: 'center' }}>
                                <Text style={{ fontSize: 9, color: '#94a3b8', fontWeight: 'bold' }}>CRÍTICO</Text>
                                <Text style={{ fontSize: 9, color: '#64748b', fontWeight: 'bold' }}>{bfStatus.ranges.muitoAlto}</Text>
                              </View>
                            </View>
                          )}
                        </View>
                      </View>
                    );
                  })()}

                  {/* Massa Muscular (COM FAIXAS NUMÉRICAS) */}
                  {(() => {
                    const mmStatus = getMuscleStatus(selectedAssessment?.anthropometry?.[0]?.muscle_mass_percentage, client?.gender, calculateAge(client?.birth_date));
                    const val = selectedAssessment?.anthropometry?.[0]?.muscle_mass_percentage ?? "-";
                    return (
                      <View style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f8fafc' }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                          <Text style={{ color: '#475569', fontSize: 13, fontWeight: '500' }}>% Massa Muscular</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            {mmStatus && (
                              <View style={{ backgroundColor: mmStatus.bg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginRight: 8 }}>
                                <Text style={{ color: mmStatus.color, fontSize: 10, fontWeight: '900' }}>{mmStatus.label}</Text>
                              </View>
                            )}
                            <Text style={{ fontWeight: '900', color: '#0f172a', fontSize: 16 }}>{val} %</Text>
                          </View>
                        </View>
                        <View style={{ paddingHorizontal: 4, paddingBottom: 6 }}>
                          <View style={{ flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'hidden', backgroundColor: '#e2e8f0', position: 'relative' }}>
                            <View style={{ flex: 1, backgroundColor: '#ef4444' }} />
                            <View style={{ flex: 1, backgroundColor: '#84cc16' }} />
                            <View style={{ flex: 1, backgroundColor: '#22c55e' }} />
                            <View style={{ flex: 1, backgroundColor: '#38bdf8' }} />
                            {mmStatus && (
                              <View style={[{ position: 'absolute', top: -2, bottom: -2, width: 4, backgroundColor: '#0f172a', borderRadius: 2, borderWidth: 1, borderColor: '#fff' }, { left: `${mmStatus.pos}%` } as any]} />
                            )}
                          </View>
                          {mmStatus && (
                            <View style={{ flexDirection: 'row', marginTop: 8 }}>
                              <View style={{ flex: 1, alignItems: 'center' }}>
                                <Text style={{ fontSize: 9, color: '#94a3b8', fontWeight: 'bold' }}>BAIXO</Text>
                                <Text style={{ fontSize: 9, color: '#64748b', fontWeight: 'bold' }}>{mmStatus.ranges.baixo}</Text>
                              </View>
                              <View style={{ flex: 1, alignItems: 'center' }}>
                                <Text style={{ fontSize: 9, color: '#94a3b8', fontWeight: 'bold' }}>NORMAL</Text>
                                <Text style={{ fontSize: 9, color: '#64748b', fontWeight: 'bold' }}>{mmStatus.ranges.normal}</Text>
                              </View>
                              <View style={{ flex: 1, alignItems: 'center' }}>
                                <Text style={{ fontSize: 9, color: '#94a3b8', fontWeight: 'bold' }}>ALTO</Text>
                                <Text style={{ fontSize: 9, color: '#64748b', fontWeight: 'bold' }}>{mmStatus.ranges.alto}</Text>
                              </View>
                              <View style={{ flex: 1, alignItems: 'center' }}>
                                <Text style={{ fontSize: 9, color: '#94a3b8', fontWeight: 'bold' }}>ELITE</Text>
                                <Text style={{ fontSize: 9, color: '#64748b', fontWeight: 'bold' }}>{mmStatus.ranges.muitoAlto}</Text>
                              </View>
                            </View>
                          )}
                        </View>
                      </View>
                    );
                  })()}

                  {/* Idade Metabólica */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f8fafc' }}>
                    <Text style={{ color: '#475569', fontSize: 13, fontWeight: '500' }}>Idade Metabólica</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      {getMetabolicStatus(selectedAssessment?.anthropometry?.[0]?.metabolic_age, calculateAge(client?.birth_date)) && (
                        <View style={{ backgroundColor: getMetabolicStatus(selectedAssessment?.anthropometry?.[0]?.metabolic_age, calculateAge(client?.birth_date))?.bg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginRight: 8 }}>
                          <Text style={{ color: getMetabolicStatus(selectedAssessment?.anthropometry?.[0]?.metabolic_age, calculateAge(client?.birth_date))?.color, fontSize: 10, fontWeight: '800' }}>
                            {getMetabolicStatus(selectedAssessment?.anthropometry?.[0]?.metabolic_age, calculateAge(client?.birth_date))?.label}
                          </Text>
                        </View>
                      )}
                      <Text style={{ fontWeight: '900', color: '#0f172a', fontSize: 14 }}>{selectedAssessment?.anthropometry?.[0]?.metabolic_age ?? "-"} anos</Text>
                    </View>
                  </View>

                  {/* Gordura Visceral (COM FAIXAS NUMÉRICAS) */}
                  {(() => {
                    const vsStatus = getVisceralStatus(selectedAssessment?.anthropometry?.[0]?.body_fat_index);
                    const val = selectedAssessment?.anthropometry?.[0]?.body_fat_index ?? "-";
                    return (
                      <View style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f8fafc' }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                          <Text style={{ color: '#475569', fontSize: 13, fontWeight: '500' }}>Gordura Visceral</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            {vsStatus && (
                              <View style={{ backgroundColor: vsStatus.bg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginRight: 8 }}>
                                <Text style={{ color: vsStatus.color, fontSize: 10, fontWeight: '900' }}>{vsStatus.label}</Text>
                              </View>
                            )}
                            <Text style={{ fontWeight: '900', color: '#0f172a', fontSize: 16 }}>{val}</Text>
                          </View>
                        </View>
                        <View style={{ paddingHorizontal: 4, paddingBottom: 6 }}>
                          <View style={{ flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'hidden', backgroundColor: '#e2e8f0', position: 'relative' }}>
                            <View style={{ flex: 1, backgroundColor: '#22c55e' }} /> 
                            <View style={{ flex: 1, backgroundColor: '#84cc16' }} /> 
                            <View style={{ flex: 1, backgroundColor: '#eab308' }} /> 
                            <View style={{ flex: 1, backgroundColor: '#ef4444' }} /> 
                            {vsStatus && (
                              <View style={[{ position: 'absolute', top: -2, bottom: -2, width: 4, backgroundColor: '#0f172a', borderRadius: 2, borderWidth: 1, borderColor: '#fff' }, { left: `${vsStatus.pos}%` } as any]} />
                            )}
                          </View>
                          {vsStatus && (
                            <View style={{ flexDirection: 'row', marginTop: 8 }}>
                              <View style={{ flex: 1, alignItems: 'center' }}>
                                <Text style={{ fontSize: 9, color: '#94a3b8', fontWeight: 'bold' }}>IDEAL</Text>
                                <Text style={{ fontSize: 9, color: '#64748b', fontWeight: 'bold' }}>{vsStatus.ranges.ideal}</Text>
                              </View>
                              <View style={{ flex: 1, alignItems: 'center' }}>
                                <Text style={{ fontSize: 9, color: '#94a3b8', fontWeight: 'bold' }}>BOM</Text>
                                <Text style={{ fontSize: 9, color: '#64748b', fontWeight: 'bold' }}>{vsStatus.ranges.bom}</Text>
                              </View>
                              <View style={{ flex: 1, alignItems: 'center' }}>
                                <Text style={{ fontSize: 9, color: '#94a3b8', fontWeight: 'bold' }}>RUIM</Text>
                                <Text style={{ fontSize: 9, color: '#64748b', fontWeight: 'bold' }}>{vsStatus.ranges.ruim}</Text>
                              </View>
                              <View style={{ flex: 1, alignItems: 'center' }}>
                                <Text style={{ fontSize: 9, color: '#94a3b8', fontWeight: 'bold' }}>CRÍTICO</Text>
                                <Text style={{ fontSize: 9, color: '#64748b', fontWeight: 'bold' }}>{vsStatus.ranges.atencao}</Text>
                              </View>
                            </View>
                          )}
                        </View>
                      </View>
                    );
                  })()}

                  {/* Metabolismo Basal */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 }}>
                    <Text style={{ color: '#475569', fontSize: 13, fontWeight: '500' }}>Metabolismo Basal</Text>
                    <Text style={{ fontWeight: '900', color: '#0f172a', fontSize: 14 }}>{selectedAssessment?.anthropometry?.[0]?.basal_metabolic_rate ?? "-"} kcal</Text>
                  </View>
                </View>

                {/* Bloco Tronco & Membros */}
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
                onPress={onShare}
              >
                <Text style={{ color: "#fff", textAlign: "center", fontWeight: '900', fontSize: 15, textTransform: 'uppercase' }}>📸 Compartilhar Evolução</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, { marginTop: 12, backgroundColor: '#f1f5f9', paddingVertical: 14, borderRadius: 12 }]} 
                onPress={onClose}
              >
                <Text style={{ color: "#475569", textAlign: "center", fontWeight: '800', fontSize: 15 }}>FECHAR PAINEL</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
