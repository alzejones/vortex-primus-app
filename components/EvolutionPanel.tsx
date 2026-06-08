import React from 'react';
import { Text, View } from 'react-native';
import { getHistoryColor, getSmartWeightColor } from '../utils/assessmentCalculations';
import { T } from '../utils/theme';

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

  const calcInterval = (dateStr1: string, dateStr2: string): string => {
    if (!dateStr1 || !dateStr2) return '';
    const d1 = new Date(dateStr1);
    const d2 = new Date(dateStr2);
    const earlier = d1 < d2 ? d1 : d2;
    const later   = d1 > d2 ? d1 : d2;
    let months = (later.getFullYear() - earlier.getFullYear()) * 12
               + (later.getMonth() - earlier.getMonth());
    const tmp = new Date(earlier);
    tmp.setMonth(tmp.getMonth() + months);
    let days = Math.round((later.getTime() - tmp.getTime()) / 86400000);
    if (days < 0) {
      months--;
      const tmp2 = new Date(earlier);
      tmp2.setMonth(tmp2.getMonth() + months);
      days = Math.round((later.getTime() - tmp2.getTime()) / 86400000);
    }
    if (months === 0 && days === 0) return '';
    if (months === 0) return `${days} dia${days !== 1 ? 's' : ''}`;
    if (days === 0)   return `${months} ${months === 1 ? 'mês' : 'meses'}`;
    return `${months} ${months === 1 ? 'mês' : 'meses'} e ${days}d`;
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
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6, alignItems: 'center', gap: 4 }}>
          <Text style={{ fontSize: 11, color: T.t3, fontWeight: '500', flex: 1, flexWrap: 'nowrap' }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{label}</Text>
          <Text style={{ fontSize: 11, fontWeight: '900', color: T.t3, textAlign: 'right', flexShrink: 0 }}>-</Text>
        </View>
      );
    }

    let color = T.t3;
    if (type === 'weight') color = getSmartWeightColor(currW, prevW, currF, prevF, currM, prevM);
    else if (type === 'fat') color = getHistoryColor(currF, prevF, 'fat');
    else if (type === 'muscle') color = getHistoryColor(currM, prevM, 'muscle');
    else if (type === 'visceral' || type === 'metabolic') color = getHistoryColor(currF, prevF, 'fat');
    else if (type === 'basal') color = getHistoryColor(currM, prevM, 'muscle');

    const valFormatted = formatValue(diffValue);
    const emoji = getEmoji(diffValue);

    return (
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6, alignItems: 'center', gap: 4 }}>
        <Text style={{ fontSize: 11, color: T.t3, fontWeight: '500', flex: 1, flexWrap: 'nowrap' }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{label}</Text>
        <Text style={{ fontSize: 11, fontWeight: '900', color: color, textAlign: 'right', flexShrink: 0 }}>
           {valFormatted}{suffix} <Text style={{ fontSize: 10 }}>{emoji}</Text>
        </Text>
      </View>
    );
  };

  return (
    <View style={{ marginBottom: 24, marginTop: 10 }}>
      <Text style={{ fontSize: 15, fontWeight: '800', color: T.t1, marginBottom: 16, textTransform: 'uppercase', textAlign: 'center', letterSpacing: 0.5 }}>
        📈 Evolução da Composição Corporal
      </Text>

      <View style={{ flexDirection: 'row', gap: 12 }}>

        {/* Cartão 1: Última vs Anterior */}
        <View style={{ flex: 1, backgroundColor: T.card, padding: 12, borderRadius: 16, borderWidth: 1, borderColor: T.border }}>
          <Text style={{ fontSize: 12, fontWeight: '900', color: T.blue, marginBottom: 10, textAlign: 'center' }}>ÚLTIMA VS ANTERIOR</Text>

          <View style={{ backgroundColor: T.surface, padding: 8, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: T.border }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}><Text style={{ fontSize: 10, color: T.t3 }}>Atual:</Text><Text style={{ fontSize: 10, fontWeight: 'bold', color: T.t1 }}>{currDate}</Text></View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={{ fontSize: 10, color: T.t3 }}>Anterior:</Text><Text style={{ fontSize: 10, fontWeight: 'bold', color: T.t1 }}>{prevDate}</Text></View>
            {calcInterval(currentAssessment?.date, prevAssessment?.date) ? (
              <View style={{ marginTop: 6, alignItems: 'center' }}>
                <View style={{ backgroundColor: 'rgba(59,130,246,0.12)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 }}>
                  <Text style={{ fontSize: 10, color: T.blue, fontWeight: '700' }}>
                    ⏱ {calcInterval(currentAssessment?.date, prevAssessment?.date)}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>

          <DataRow label="Peso" diffValue={calcDiff(currAnthro?.weight, prevAnthro?.weight)} currW={currAnthro?.weight} prevW={prevAnthro?.weight} currF={currAnthro?.body_fat} prevF={prevAnthro?.body_fat} currM={currAnthro?.muscle_mass_percentage} prevM={prevAnthro?.muscle_mass_percentage} type="weight" suffix=" kg" />
          <DataRow label="% Gordura" diffValue={calcDiff(currAnthro?.body_fat, prevAnthro?.body_fat)} currF={currAnthro?.body_fat} prevF={prevAnthro?.body_fat} type="fat" suffix="%" />
          <DataRow label="% Músculo" diffValue={calcDiff(currAnthro?.muscle_mass_percentage, prevAnthro?.muscle_mass_percentage)} currM={currAnthro?.muscle_mass_percentage} prevM={prevAnthro?.muscle_mass_percentage} type="muscle" suffix="%" />

          <View style={{ height: 1, backgroundColor: T.border, marginVertical: 8 }} />

          <DataRow label="G. Visceral" diffValue={calcDiff(currAnthro?.body_fat_index, prevAnthro?.body_fat_index)} currF={currAnthro?.body_fat_index} prevF={prevAnthro?.body_fat_index} type="visceral" />
          <DataRow label="Id. Metab." diffValue={calcDiff(currAnthro?.metabolic_age, prevAnthro?.metabolic_age)} currF={currAnthro?.metabolic_age} prevF={prevAnthro?.metabolic_age} type="metabolic" suffix=" anos" />
          <DataRow label="Met. Basal" diffValue={calcDiff(currAnthro?.basal_metabolic_rate, prevAnthro?.basal_metabolic_rate)} currM={currAnthro?.basal_metabolic_rate} prevM={prevAnthro?.basal_metabolic_rate} type="basal" suffix=" kcal" />
        </View>

        {/* Cartão 2: Evolução Total */}
        <View style={{ flex: 1, backgroundColor: T.card, padding: 12, borderRadius: 16, borderWidth: 1, borderColor: T.border }}>
          <Text style={{ fontSize: 12, fontWeight: '900', color: T.blue, marginBottom: 10, textAlign: 'center' }}>EVOLUÇÃO TOTAL</Text>

          <View style={{ backgroundColor: T.surface, padding: 8, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: T.border }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}><Text style={{ fontSize: 10, color: T.t3 }}>Atual:</Text><Text style={{ fontSize: 10, fontWeight: 'bold', color: T.t1 }}>{currDate}</Text></View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={{ fontSize: 10, color: T.t3 }}>Início:</Text><Text style={{ fontSize: 10, fontWeight: 'bold', color: T.t1 }}>{firstDate}</Text></View>
            {calcInterval(currentAssessment?.date, firstAssessment?.date) ? (
              <View style={{ marginTop: 6, alignItems: 'center' }}>
                <View style={{ backgroundColor: 'rgba(59,130,246,0.12)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 }}>
                  <Text style={{ fontSize: 10, color: T.blue, fontWeight: '700' }}>
                    ⏱ {calcInterval(currentAssessment?.date, firstAssessment?.date)}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>

          <DataRow label="Peso" diffValue={calcDiff(currAnthro?.weight, firstAnthro?.weight)} currW={currAnthro?.weight} prevW={firstAnthro?.weight} currF={currAnthro?.body_fat} prevF={firstAnthro?.body_fat} currM={currAnthro?.muscle_mass_percentage} prevM={firstAnthro?.muscle_mass_percentage} type="weight" suffix=" kg" />
          <DataRow label="% Gordura" diffValue={calcDiff(currAnthro?.body_fat, firstAnthro?.body_fat)} currF={currAnthro?.body_fat} prevF={firstAnthro?.body_fat} type="fat" suffix="%" />
          <DataRow label="% Músculo" diffValue={calcDiff(currAnthro?.muscle_mass_percentage, firstAnthro?.muscle_mass_percentage)} currM={currAnthro?.muscle_mass_percentage} prevM={firstAnthro?.muscle_mass_percentage} type="muscle" suffix="%" />

          <View style={{ height: 1, backgroundColor: T.border, marginVertical: 8 }} />

          <DataRow label="G. Visceral" diffValue={calcDiff(currAnthro?.body_fat_index, firstAnthro?.body_fat_index)} currF={currAnthro?.body_fat_index} prevF={firstAnthro?.body_fat_index} type="visceral" />
          <DataRow label="Id. Metab." diffValue={calcDiff(currAnthro?.metabolic_age, firstAnthro?.metabolic_age)} currF={currAnthro?.metabolic_age} prevF={firstAnthro?.metabolic_age} type="metabolic" suffix=" anos" />
          <DataRow label="Met. Basal" diffValue={calcDiff(currAnthro?.basal_metabolic_rate, firstAnthro?.basal_metabolic_rate)} currM={currAnthro?.basal_metabolic_rate} prevM={firstAnthro?.basal_metabolic_rate} type="basal" suffix=" kcal" />
        </View>

      </View>
    </View>
  );
}
