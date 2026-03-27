import React from 'react';
import { Text, View } from 'react-native';
import { getHistoryColor, getSmartWeightColor } from '../utils/assessmentCalculations';

interface EvolutionPanelProps {
  evolutionData?: any; 
  currentAssessment: any;
  prevAssessment: any;
  firstAssessment: any;
  formatValue: (val: any) => string;
}

export default function EvolutionPanel({
  currentAssessment,
  prevAssessment,
  firstAssessment,
  formatValue
}: EvolutionPanelProps) {
  
  const currAnthro = currentAssessment?.anthropometry?.[0];
  const prevAnthro = prevAssessment?.anthropometry?.[0];
  const firstAnthro = firstAssessment?.anthropometry?.[0];

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const currDate = formatDate(currentAssessment?.date);
  const prevDate = formatDate(prevAssessment?.date);
  const firstDate = formatDate(firstAssessment?.date);

  // 🔴 CORREÇÃO AQUI: Força o JavaScript a calcular a diferença travando em 1 casa decimal
  const calcDiff = (curr: any, prev: any) => {
    if (curr === undefined || curr === null || prev === undefined || prev === null) return null;
    const c = Number(curr);
    const p = Number(prev);
    if (isNaN(c) || isNaN(p)) return null;
    return parseFloat((c - p).toFixed(1)); 
  };

  const getEmoji = (val: any) => {
    const num = Number(val);
    if (isNaN(num) || num === 0) return '➖';
    return num > 0 ? '⏫' : '⏬';
  };

  const DataRow = ({ label, diffValue, currW, prevW, currF, prevF, currM, prevM, type, suffix = "" }: any) => {
    if (diffValue === null || diffValue === undefined) {
      return (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6, alignItems: 'center' }}>
          <Text style={{ fontSize: 12, color: '#475569', fontWeight: '500' }}>{label}</Text>
          <Text style={{ fontSize: 12, fontWeight: '900', color: '#94a3b8' }}>-</Text>
        </View>
      );
    }

    let color = '#475569'; 
    if (type === 'weight') color = getSmartWeightColor(currW, prevW, currF, prevF, currM, prevM);
    else if (type === 'fat') color = getHistoryColor(currF, prevF, 'fat');
    else if (type === 'muscle') color = getHistoryColor(currM, prevM, 'muscle');
    else if (type === 'visceral' || type === 'metabolic') color = getHistoryColor(currF, prevF, 'fat');
    else if (type === 'basal') color = getHistoryColor(currM, prevM, 'muscle');

    const valFormatted = formatValue(diffValue);
    const emoji = getEmoji(diffValue);

    return (
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6, alignItems: 'center' }}>
        <Text style={{ fontSize: 12, color: '#475569', fontWeight: '500' }}>{label}</Text>
        <Text style={{ fontSize: 12, fontWeight: '900', color: color }}>
           {valFormatted}{suffix} <Text style={{ fontSize: 10 }}>{emoji}</Text>
        </Text>
      </View>
    );
  };

  return (
    <View style={{ marginBottom: 24, marginTop: 10 }}>
      <Text style={{ fontSize: 16, fontWeight: '900', color: '#0f172a', marginBottom: 16, textTransform: 'uppercase', textAlign: 'center' }}>
        📈 Evolução da Composição Corporal
      </Text>
      
      <View style={{ flexDirection: 'row', gap: 12 }}>
        
        {/* Cartão 1: Última vs Anterior */}
        <View style={{ flex: 1, backgroundColor: '#f8fafc', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3 }}>
          <Text style={{ fontSize: 12, fontWeight: '900', color: '#3b82f6', marginBottom: 10, textAlign: 'center' }}>ÚLTIMA VS ANTERIOR</Text>
          
          <View style={{ backgroundColor: '#fff', padding: 8, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#f1f5f9' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}><Text style={{ fontSize: 10, color: '#64748b' }}>Atual:</Text><Text style={{ fontSize: 10, fontWeight: 'bold', color: '#1e293b' }}>{currDate}</Text></View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={{ fontSize: 10, color: '#64748b' }}>Anterior:</Text><Text style={{ fontSize: 10, fontWeight: 'bold', color: '#1e293b' }}>{prevDate}</Text></View>
          </View>

          <DataRow label="Peso" diffValue={calcDiff(currAnthro?.weight, prevAnthro?.weight)} currW={currAnthro?.weight} prevW={prevAnthro?.weight} currF={currAnthro?.body_fat} prevF={prevAnthro?.body_fat} currM={currAnthro?.muscle_mass_percentage} prevM={prevAnthro?.muscle_mass_percentage} type="weight" suffix=" kg" />
          <DataRow label="% Gordura" diffValue={calcDiff(currAnthro?.body_fat, prevAnthro?.body_fat)} currF={currAnthro?.body_fat} prevF={prevAnthro?.body_fat} type="fat" suffix="%" />
          <DataRow label="% Músculo" diffValue={calcDiff(currAnthro?.muscle_mass_percentage, prevAnthro?.muscle_mass_percentage)} currM={currAnthro?.muscle_mass_percentage} prevM={prevAnthro?.muscle_mass_percentage} type="muscle" suffix="%" />
          
          <View style={{ height: 1, backgroundColor: '#e2e8f0', marginVertical: 8 }} />
          
          <DataRow label="G. Visceral" diffValue={calcDiff(currAnthro?.body_fat_index, prevAnthro?.body_fat_index)} currF={currAnthro?.body_fat_index} prevF={prevAnthro?.body_fat_index} type="visceral" />
          <DataRow label="Id. Metab." diffValue={calcDiff(currAnthro?.metabolic_age, prevAnthro?.metabolic_age)} currF={currAnthro?.metabolic_age} prevF={prevAnthro?.metabolic_age} type="metabolic" suffix=" anos" />
          <DataRow label="Met. Basal" diffValue={calcDiff(currAnthro?.basal_metabolic_rate, prevAnthro?.basal_metabolic_rate)} currM={currAnthro?.basal_metabolic_rate} prevM={prevAnthro?.basal_metabolic_rate} type="basal" suffix=" kcal" />
        </View>

        {/* Cartão 2: Evolução Total */}
        <View style={{ flex: 1, backgroundColor: '#f8fafc', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3 }}>
          <Text style={{ fontSize: 12, fontWeight: '900', color: '#3b82f6', marginBottom: 10, textAlign: 'center' }}>EVOLUÇÃO TOTAL</Text>
          
          <View style={{ backgroundColor: '#fff', padding: 8, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#f1f5f9' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}><Text style={{ fontSize: 10, color: '#64748b' }}>Atual:</Text><Text style={{ fontSize: 10, fontWeight: 'bold', color: '#1e293b' }}>{currDate}</Text></View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={{ fontSize: 10, color: '#64748b' }}>Início:</Text><Text style={{ fontSize: 10, fontWeight: 'bold', color: '#1e293b' }}>{firstDate}</Text></View>
          </View>

          <DataRow label="Peso" diffValue={calcDiff(currAnthro?.weight, firstAnthro?.weight)} currW={currAnthro?.weight} prevW={firstAnthro?.weight} currF={currAnthro?.body_fat} prevF={firstAnthro?.body_fat} currM={currAnthro?.muscle_mass_percentage} prevM={firstAnthro?.muscle_mass_percentage} type="weight" suffix=" kg" />
          <DataRow label="% Gordura" diffValue={calcDiff(currAnthro?.body_fat, firstAnthro?.body_fat)} currF={currAnthro?.body_fat} prevF={firstAnthro?.body_fat} type="fat" suffix="%" />
          <DataRow label="% Músculo" diffValue={calcDiff(currAnthro?.muscle_mass_percentage, firstAnthro?.muscle_mass_percentage)} currM={currAnthro?.muscle_mass_percentage} prevM={firstAnthro?.muscle_mass_percentage} type="muscle" suffix="%" />
          
          <View style={{ height: 1, backgroundColor: '#e2e8f0', marginVertical: 8 }} />
          
          <DataRow label="G. Visceral" diffValue={calcDiff(currAnthro?.body_fat_index, firstAnthro?.body_fat_index)} currF={currAnthro?.body_fat_index} prevF={firstAnthro?.body_fat_index} type="visceral" />
          <DataRow label="Id. Metab." diffValue={calcDiff(currAnthro?.metabolic_age, firstAnthro?.metabolic_age)} currF={currAnthro?.metabolic_age} prevF={firstAnthro?.metabolic_age} type="metabolic" suffix=" anos" />
          <DataRow label="Met. Basal" diffValue={calcDiff(currAnthro?.basal_metabolic_rate, firstAnthro?.basal_metabolic_rate)} currM={currAnthro?.basal_metabolic_rate} prevM={firstAnthro?.basal_metabolic_rate} type="basal" suffix=" kcal" />
        </View>

      </View>
    </View>
  );
}

