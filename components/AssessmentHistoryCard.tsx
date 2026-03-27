import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { getHistoryColor, getSmartWeightColor } from '../utils/assessmentCalculations';

interface AssessmentHistoryCardProps {
  assessment: any;
  previousAnthro: any;
  index: number;
  totalAssessments: number;
  onViewDetails: (assessment: any) => void;
  onEdit: (assessment: any) => void;
  onDelete: (id: string) => void;
  onWhatsApp: (assessment: any) => void;
  onPhysicalTests: (assessment: any) => void; 
}

export default function AssessmentHistoryCard({
  assessment,
  previousAnthro,
  index,
  totalAssessments,
  onViewDetails,
  onEdit,
  onDelete,
  onWhatsApp,
  onPhysicalTests
}: AssessmentHistoryCardProps) {
  
  function renderTrendIndicator(currentValue: any, previousValue: any, type: "weight" | "fat" | "muscle") {
    if (!currentValue || !previousValue) return null;
    const diff = Number(currentValue) - Number(previousValue);
    if (diff === 0) return <Text style={{ color: '#9ca3af', fontSize: 12 }}> ➖</Text>; 

    if (type === "muscle") {
      return diff > 0 
        ? <Text style={{ color: '#16a34a', fontSize: 12, fontWeight: 'bold' }}> ⏫</Text> 
        : <Text style={{ color: '#dc2626', fontSize: 12, fontWeight: 'bold' }}> ⏬</Text>;
    } else {
      return diff < 0 
        ? <Text style={{ color: '#16a34a', fontSize: 12, fontWeight: 'bold' }}> ⏬</Text> 
        : <Text style={{ color: '#dc2626', fontSize: 12, fontWeight: 'bold' }}> ⏫</Text>;
    }
  }

  const anthro = assessment.anthropometry?.[0];
  const dateObj = new Date(assessment.date);
  const formattedDate = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const formattedTime = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  // Função auxiliar segura para 1 casa decimal
  const formatNum = (val: any) => val != null && val !== "" ? Number(val).toFixed(1) : '--';

  return (
    <View style={{
      backgroundColor: '#fff',
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: '#f1f5f9',
      elevation: 2,
    }}>
      {/* Cabeçalho */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <View>
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#1e293b' }}>{formattedDate}</Text>
          <Text style={{ fontSize: 11, color: '#64748b' }}>{formattedTime}</Text>
        </View>
        <TouchableOpacity onPress={() => onViewDetails(assessment)} style={{ backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#475569' }}>Consultar</Text>
        </TouchableOpacity>
      </View>

      {/* Dados (se houver) */}
      {anthro ? (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>Peso</Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
              <Text style={{ 
                fontSize: 18, 
                fontWeight: '800', 
                color: getSmartWeightColor(
                  anthro?.weight, previousAnthro?.weight,
                  anthro?.body_fat, previousAnthro?.body_fat,
                  anthro?.muscle_mass_percentage, previousAnthro?.muscle_mass_percentage
                ) 
              }}>
                {formatNum(anthro?.weight)}
              </Text>
              <Text style={{ fontSize: 11, color: '#64748b', marginLeft: 2 }}>kg</Text>
            </View>
            <View style={{ marginTop: 4 }}>{renderTrendIndicator(anthro?.weight, previousAnthro?.weight, "weight")}</View>
          </View>

          <View style={{ flex: 1, alignItems: 'center', borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#f1f5f9' }}>
            <Text style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>Gordura</Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: getHistoryColor(anthro?.body_fat, previousAnthro?.body_fat, 'fat') }}>
                {formatNum(anthro?.body_fat)}
              </Text>
              <Text style={{ fontSize: 11, color: '#64748b', marginLeft: 2 }}>%</Text>
            </View>
            <View style={{ marginTop: 4 }}>{renderTrendIndicator(anthro?.body_fat, previousAnthro?.body_fat, "fat")}</View>
          </View>

          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>Músculo</Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: getHistoryColor(anthro?.muscle_mass_percentage, previousAnthro?.muscle_mass_percentage, 'muscle') }}>
                {formatNum(anthro?.muscle_mass_percentage)}
              </Text>
              <Text style={{ fontSize: 11, color: '#64748b', marginLeft: 2 }}>%</Text>
            </View>
            <View style={{ marginTop: 4 }}>{renderTrendIndicator(anthro?.muscle_mass_percentage, previousAnthro?.muscle_mass_percentage, "muscle")}</View>
          </View>
        </View>
      ) : (
        <View style={{ backgroundColor: '#f8fafc', padding: 12, borderRadius: 8, marginBottom: 16, alignItems: 'center' }}>
          <Text style={{ color: '#94a3b8', fontSize: 12, fontStyle: 'italic' }}>Dados de antropometria não registrados</Text>
        </View>
      )}

      {/* RODAPÉ DE AÇÕES */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 12 }}>
        <View style={{ flexDirection: 'row', gap: 15, flex: 1 }}>
          <TouchableOpacity onPress={() => onEdit(assessment)}>
            <Text style={{ color: "#475569", fontSize: 13, fontWeight: "700" }}>✏️ Editar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => onPhysicalTests(assessment)}>
            <Text style={{ color: "#2563eb", fontSize: 13, fontWeight: "700" }}>💪 Testes</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => onDelete(assessment.id)}>
            <Text style={{ color: "#ef4444", fontSize: 13, fontWeight: "700" }}>🗑️ Excluir</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => onWhatsApp(assessment)}>
          <Text style={{ color: "#22c55e", fontSize: 13, fontWeight: "800" }}>📲 WhatsApp</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

