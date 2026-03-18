import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { getHistoryColor, getSmartWeightColor } from '../utils/assessmentCalculations';
// Nota: Se a sua função renderTrendIndicator usar alguma biblioteca de ícones (ex: Feather, Ionicons), importe-a aqui no topo!

interface AssessmentHistoryCardProps {
  assessment: any;
  previousAnthro: any;
  index: number;
  totalAssessments: number;
  onViewDetails: (assessment: any) => void;
  onEdit: (assessment: any) => void;
  onDelete: (id: string) => void;
  onWhatsApp: (assessment: any) => void;
}

export default function AssessmentHistoryCard({
  assessment,
  previousAnthro,
  index,
  totalAssessments,
  onViewDetails,
  onEdit,
  onDelete,
  onWhatsApp
}: AssessmentHistoryCardProps) {
  
function renderTrendIndicator(currentValue: any, previousValue: any, type: "weight" | "fat" | "muscle") {
    if (currentValue === null || previousValue === null || currentValue === undefined || previousValue === undefined || currentValue === "" || previousValue === "") {
      return null;
    }
    
    const diff = Number(currentValue) - Number(previousValue);
    if (diff === 0) return <Text style={{ color: '#9ca3af', fontSize: 12 }}> ➖</Text>; 

    if (type === "muscle") {
      return diff > 0 
        ? <Text style={{ color: '#16a34a', fontSize: 12, fontWeight: 'bold' }}> ⏫</Text> 
        : <Text style={{ color: '#dc2626', fontSize: 12, fontWeight: 'bold' }}> ⏬</Text>;
    } else {
      // Lógica restaurada para Peso e Gordura
      // diff > 0 (Subiu) -> Vermelho
      // diff < 0 (Desceu) -> Verde
      return diff > 0 
        ? <Text style={{ color: '#dc2626', fontSize: 12, fontWeight: 'bold' }}> ⏫</Text>
        : <Text style={{ color: '#16a34a', fontSize: 12, fontWeight: 'bold' }}> ⏬</Text>;
    }
  }

  const anthro = assessment.anthropometry?.[0];
  const dateStr = assessment.date ? new Date(assessment.date).toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit', year: 'numeric' }) : "-";

  return (
    <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 }}>
      
      {/* Cabeçalho do Cartão */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
            <Text style={{ fontSize: 20 }}>📅</Text>
          </View>
          <View>
            <Text style={{ fontSize: 16, fontWeight: '900', color: '#0f172a' }}>{dateStr}</Text>
            <Text style={{ fontSize: 12, color: '#64748b', fontWeight: '500' }}>{index === 0 ? "Última Avaliação" : `Avaliação ${totalAssessments - index}`}</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={{ backgroundColor: '#eff6ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}
          onPress={() => onViewDetails(assessment)}
        >
          <Text style={{ color: '#3b82f6', fontWeight: 'bold', fontSize: 12 }}>VER DETALHES</Text>
        </TouchableOpacity>
      </View>

      {/* Corpo do Cartão - Os 3 Pilares com Cores Inteligentes */}
      {anthro ? (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, backgroundColor: '#f8fafc', padding: 12, borderRadius: 12 }}>
          
          {/* Coluna: Peso */}
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 11, color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase', marginBottom: 4 }}>Peso</Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
              <Text style={{ fontSize: 24, color: getSmartWeightColor(anthro.weight, previousAnthro?.weight, anthro.body_fat, previousAnthro?.body_fat, anthro.muscle_mass_percentage, previousAnthro?.muscle_mass_percentage), fontWeight: '900' }}>{anthro?.weight ?? "-"}</Text>
              <Text style={{ fontSize: 12, color: getSmartWeightColor(anthro.weight, previousAnthro?.weight, anthro.body_fat, previousAnthro?.body_fat, anthro.muscle_mass_percentage, previousAnthro?.muscle_mass_percentage), fontWeight: '700', marginLeft: 2 }}>kg</Text>
            </View>
            <View style={{ marginTop: 4 }}>{renderTrendIndicator(anthro?.weight, previousAnthro?.weight, "weight")}</View>
          </View>

          {/* Divisor Vertical */}
          <View style={{ width: 1, backgroundColor: '#e2e8f0', height: '70%', alignSelf: 'center' }} />

          {/* Coluna: Gordura */}
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 11, color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase', marginBottom: 4 }}>Gordura</Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
              <Text style={{ fontSize: 24, color: getHistoryColor(anthro.body_fat, previousAnthro?.body_fat, 'fat'), fontWeight: '900' }}>{anthro?.body_fat ?? "-"}</Text>
              <Text style={{ fontSize: 12, color: getHistoryColor(anthro.body_fat, previousAnthro?.body_fat, 'fat'), fontWeight: '700', marginLeft: 2 }}>%</Text>
            </View>
            <View style={{ marginTop: 4 }}>{renderTrendIndicator(anthro?.body_fat, previousAnthro?.body_fat, "fat")}</View>
          </View>

          {/* Divisor Vertical */}
          <View style={{ width: 1, backgroundColor: '#e2e8f0', height: '70%', alignSelf: 'center' }} />

          {/* Coluna: Músculo */}
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 11, color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase', marginBottom: 4 }}>Músculo</Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
              <Text style={{ fontSize: 24, color: getHistoryColor(anthro.muscle_mass_percentage, previousAnthro?.muscle_mass_percentage, 'muscle'), fontWeight: '900' }}>{anthro?.muscle_mass_percentage ?? "-"}</Text>
              <Text style={{ fontSize: 12, color: getHistoryColor(anthro.muscle_mass_percentage, previousAnthro?.muscle_mass_percentage, 'muscle'), fontWeight: '700', marginLeft: 2 }}>%</Text>
            </View>
            <View style={{ marginTop: 4 }}>{renderTrendIndicator(anthro?.muscle_mass_percentage, previousAnthro?.muscle_mass_percentage, "muscle")}</View>
          </View>

        </View>
      ) : (
        <View style={{ backgroundColor: '#f8fafc', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 16 }}>
          <Text style={{ color: '#64748b', fontStyle: 'italic' }}>Sem dados de antropometria.</Text>
        </View>
      )}

      {/* Rodapé de Ações */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 12 }}>
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity onPress={() => onEdit(assessment)} style={{ marginRight: 20 }}>
            <Text style={{ color: "#475569", fontSize: 13, fontWeight: "700" }}>✏️ Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onDelete(assessment.id)}>
            <Text style={{ color: "#ef4444", fontSize: 13, fontWeight: "700" }}>🗑️ Excluir</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity onPress={() => onWhatsApp(assessment)}>
          <Text style={{ color: "#16a34a", fontSize: 13, fontWeight: "800" }}>📲 WhatsApp</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

