import React from 'react';
import { Text, View } from 'react-native';
import { T } from '../utils/theme';

interface MeasurementsEvolutionPanelProps {
  currentAssessment: any;
  prevAssessment: any;
  firstAssessment: any;
}

export default function MeasurementsEvolutionPanel({
  currentAssessment,
  prevAssessment,
  firstAssessment
}: MeasurementsEvolutionPanelProps) {

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

  // Calcula a diferença exata
  const calcDiff = (curr: any, prev: any) => {
    if (curr === undefined || curr === null || prev === undefined || prev === null) return null;
    const c = Number(curr);
    const p = Number(prev);
    if (isNaN(c) || isNaN(p)) return null;
    return c - p;
  };

  // Formata a diferença (+1.5, -2.0, 0)
  const formatDiff = (val: number | null) => {
    if (val === null) return "-";
    if (val === 0) return "0 cm";
    return `${val > 0 ? '+' : ''}${val.toFixed(1)} cm`;
  };

  // Formata diferença de membros (E/D) ex: +1.0 / -0.5 cm
  const formatLimbDiff = (valLeft: number | null, valRight: number | null) => {
    if (valLeft === null && valRight === null) return "-";
    const l = valLeft !== null ? `${valLeft > 0 ? '+' : ''}${valLeft.toFixed(1)}` : '-';
    const r = valRight !== null ? `${valRight > 0 ? '+' : ''}${valRight.toFixed(1)}` : '-';
    return `${l} / ${r}`;
  };

  const MeasureRow = ({ label, diffValue }: { label: string, diffValue: number | null }) => (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6, alignItems: 'center' }}>
      <Text style={{ fontSize: 12, color: T.t3, fontWeight: '500' }}>{label}</Text>
      <Text style={{ fontSize: 12, fontWeight: '900', color: diffValue === null ? T.t3 : T.t1 }}>
        {formatDiff(diffValue)}
      </Text>
    </View>
  );

  const LimbRow = ({ label, diffLeft, diffRight }: { label: string, diffLeft: number | null, diffRight: number | null }) => (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6, alignItems: 'center' }}>
      <Text style={{ fontSize: 12, color: T.t3, fontWeight: '500' }}>{label}</Text>
      <Text style={{ fontSize: 12, fontWeight: '900', color: (diffLeft === null && diffRight === null) ? T.t3 : T.t1 }}>
        {formatLimbDiff(diffLeft, diffRight)}
      </Text>
    </View>
  );

  return (
    <View style={{ marginBottom: 24 }}>
      <Text style={{ fontSize: 15, fontWeight: '800', color: T.t1, marginBottom: 16, textTransform: 'uppercase', textAlign: 'center', letterSpacing: 0.5 }}>
        📏 Evolução de Medidas Corporais
      </Text>

      <View style={{ flexDirection: 'row', gap: 12 }}>

        {/* Cartão 1: Última vs Anterior */}
        <View style={{ flex: 1, backgroundColor: T.card, padding: 12, borderRadius: 16, borderWidth: 1, borderColor: T.border }}>
          <Text style={{ fontSize: 12, fontWeight: '900', color: '#ea580c', marginBottom: 10, textAlign: 'center' }}>ÚLTIMA VS ANTERIOR</Text>

          <View style={{ backgroundColor: T.surface, padding: 8, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: T.border }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}><Text style={{ fontSize: 10, color: T.t3 }}>Atual:</Text><Text style={{ fontSize: 10, fontWeight: 'bold', color: T.t1 }}>{currDate}</Text></View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={{ fontSize: 10, color: T.t3 }}>Anterior:</Text><Text style={{ fontSize: 10, fontWeight: 'bold', color: T.t1 }}>{prevDate}</Text></View>
            {calcInterval(currentAssessment?.date, prevAssessment?.date) ? (
              <View style={{ marginTop: 6, alignItems: 'center' }}>
                <View style={{ backgroundColor: 'rgba(234,88,12,0.12)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 }}>
                  <Text style={{ fontSize: 10, color: '#ea580c', fontWeight: '700' }}>
                    ⏱ {calcInterval(currentAssessment?.date, prevAssessment?.date)}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>

          <Text style={{ fontSize: 11, fontWeight: '800', color: T.t2, marginBottom: 6 }}>TRONCO</Text>
          <MeasureRow label="Peitoral" diffValue={calcDiff(currAnthro?.chest, prevAnthro?.chest)} />
          <MeasureRow label="Abdômen" diffValue={calcDiff(currAnthro?.abdomen, prevAnthro?.abdomen)} />
          <MeasureRow label="Cintura" diffValue={calcDiff(currAnthro?.waist, prevAnthro?.waist)} />
          <MeasureRow label="Quadril" diffValue={calcDiff(currAnthro?.hip, prevAnthro?.hip)} />

          {(() => {
            const vals = [
              calcDiff(currAnthro?.chest,   prevAnthro?.chest),
              calcDiff(currAnthro?.abdomen, prevAnthro?.abdomen),
              calcDiff(currAnthro?.waist,   prevAnthro?.waist),
              calcDiff(currAnthro?.hip,     prevAnthro?.hip),
            ].filter(v => v !== null) as number[];
            if (vals.length === 0) return null;
            const total = vals.reduce((a, b) => a + b, 0);
            const color = total < 0 ? '#22c55e' : total > 0 ? '#ef4444' : T.t3;
            return (
              <View style={{ marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: T.border }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 11, color: T.t3, fontWeight: '700', flex: 1 }}>
                    {total <= 0 ? '✅ Eliminado' : '📈 Ganho'}
                  </Text>
                  <Text style={{ fontSize: 13, fontWeight: '900', color }}>
                    {total > 0 ? '+' : ''}{total.toFixed(1)} cm
                  </Text>
                </View>
              </View>
            );
          })()}

          <View style={{ height: 1, backgroundColor: T.border, marginVertical: 8 }} />

          <Text style={{ fontSize: 11, fontWeight: '800', color: T.t2, marginBottom: 6 }}>MEMBROS (E/D)</Text>
          <LimbRow label="Braço" diffLeft={calcDiff(currAnthro?.arm_left, prevAnthro?.arm_left)} diffRight={calcDiff(currAnthro?.arm_right, prevAnthro?.arm_right)} />
          <LimbRow label="Coxa" diffLeft={calcDiff(currAnthro?.thigh_left, prevAnthro?.thigh_left)} diffRight={calcDiff(currAnthro?.thigh_right, prevAnthro?.thigh_right)} />
          <LimbRow label="Panturrilha" diffLeft={calcDiff(currAnthro?.calf_left, prevAnthro?.calf_left)} diffRight={calcDiff(currAnthro?.calf_right, prevAnthro?.calf_right)} />
        </View>

        {/* Cartão 2: Evolução Total */}
        <View style={{ flex: 1, backgroundColor: T.card, padding: 12, borderRadius: 16, borderWidth: 1, borderColor: T.border }}>
          <Text style={{ fontSize: 12, fontWeight: '900', color: '#ea580c', marginBottom: 10, textAlign: 'center' }}>EVOLUÇÃO TOTAL</Text>

          <View style={{ backgroundColor: T.surface, padding: 8, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: T.border }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}><Text style={{ fontSize: 10, color: T.t3 }}>Atual:</Text><Text style={{ fontSize: 10, fontWeight: 'bold', color: T.t1 }}>{currDate}</Text></View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={{ fontSize: 10, color: T.t3 }}>Início:</Text><Text style={{ fontSize: 10, fontWeight: 'bold', color: T.t1 }}>{firstDate}</Text></View>
            {calcInterval(currentAssessment?.date, firstAssessment?.date) ? (
              <View style={{ marginTop: 6, alignItems: 'center' }}>
                <View style={{ backgroundColor: 'rgba(234,88,12,0.12)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 }}>
                  <Text style={{ fontSize: 10, color: '#ea580c', fontWeight: '700' }}>
                    ⏱ {calcInterval(currentAssessment?.date, firstAssessment?.date)}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>

          <Text style={{ fontSize: 11, fontWeight: '800', color: T.t2, marginBottom: 6 }}>TRONCO</Text>
          <MeasureRow label="Peitoral" diffValue={calcDiff(currAnthro?.chest, firstAnthro?.chest)} />
          <MeasureRow label="Abdômen" diffValue={calcDiff(currAnthro?.abdomen, firstAnthro?.abdomen)} />
          <MeasureRow label="Cintura" diffValue={calcDiff(currAnthro?.waist, firstAnthro?.waist)} />
          <MeasureRow label="Quadril" diffValue={calcDiff(currAnthro?.hip, firstAnthro?.hip)} />

          {(() => {
            const vals = [
              calcDiff(currAnthro?.chest,   firstAnthro?.chest),
              calcDiff(currAnthro?.abdomen, firstAnthro?.abdomen),
              calcDiff(currAnthro?.waist,   firstAnthro?.waist),
              calcDiff(currAnthro?.hip,     firstAnthro?.hip),
            ].filter(v => v !== null) as number[];
            if (vals.length === 0) return null;
            const total = vals.reduce((a, b) => a + b, 0);
            const color = total < 0 ? '#22c55e' : total > 0 ? '#ef4444' : T.t3;
            return (
              <View style={{ marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: T.border }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 11, color: T.t3, fontWeight: '700', flex: 1 }}>
                    {total <= 0 ? '✅ Eliminado' : '📈 Ganho'}
                  </Text>
                  <Text style={{ fontSize: 13, fontWeight: '900', color }}>
                    {total > 0 ? '+' : ''}{total.toFixed(1)} cm
                  </Text>
                </View>
              </View>
            );
          })()}

          <View style={{ height: 1, backgroundColor: T.border, marginVertical: 8 }} />

          <Text style={{ fontSize: 11, fontWeight: '800', color: T.t2, marginBottom: 6 }}>MEMBROS (E/D)</Text>
          <LimbRow label="Braço" diffLeft={calcDiff(currAnthro?.arm_left, firstAnthro?.arm_left)} diffRight={calcDiff(currAnthro?.arm_right, firstAnthro?.arm_right)} />
          <LimbRow label="Coxa" diffLeft={calcDiff(currAnthro?.thigh_left, firstAnthro?.thigh_left)} diffRight={calcDiff(currAnthro?.thigh_right, firstAnthro?.thigh_right)} />
          <LimbRow label="Panturrilha" diffLeft={calcDiff(currAnthro?.calf_left, firstAnthro?.calf_left)} diffRight={calcDiff(currAnthro?.calf_right, firstAnthro?.calf_right)} />
        </View>

      </View>
    </View>
  );
}
