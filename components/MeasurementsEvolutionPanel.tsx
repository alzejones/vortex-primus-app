import React from 'react';
import { Text, View } from 'react-native';

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
      <Text style={{ fontSize: 12, color: '#475569', fontWeight: '500' }}>{label}</Text>
      <Text style={{ fontSize: 12, fontWeight: '900', color: diffValue === null ? '#94a3b8' : '#1e293b' }}>
        {formatDiff(diffValue)}
      </Text>
    </View>
  );

  const LimbRow = ({ label, diffLeft, diffRight }: { label: string, diffLeft: number | null, diffRight: number | null }) => (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6, alignItems: 'center' }}>
      <Text style={{ fontSize: 12, color: '#475569', fontWeight: '500' }}>{label}</Text>
      <Text style={{ fontSize: 12, fontWeight: '900', color: (diffLeft === null && diffRight === null) ? '#94a3b8' : '#1e293b' }}>
        {formatLimbDiff(diffLeft, diffRight)}
      </Text>
    </View>
  );

  return (
    <View style={{ marginBottom: 24 }}>
      <Text style={{ fontSize: 16, fontWeight: '900', color: '#0f172a', marginBottom: 16, textTransform: 'uppercase', textAlign: 'center' }}>
        📏 Evolução de Medidas Corporais
      </Text>
      
      <View style={{ flexDirection: 'row', gap: 12 }}>
        
        {/* Cartão 1: Última vs Anterior */}
        <View style={{ flex: 1, backgroundColor: '#fff', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3 }}>
          <Text style={{ fontSize: 12, fontWeight: '900', color: '#ea580c', marginBottom: 10, textAlign: 'center' }}>ÚLTIMA VS ANTERIOR</Text>
          
          <View style={{ backgroundColor: '#f8fafc', padding: 8, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#f1f5f9' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}><Text style={{ fontSize: 10, color: '#64748b' }}>Atual:</Text><Text style={{ fontSize: 10, fontWeight: 'bold', color: '#1e293b' }}>{currDate}</Text></View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={{ fontSize: 10, color: '#64748b' }}>Anterior:</Text><Text style={{ fontSize: 10, fontWeight: 'bold', color: '#1e293b' }}>{prevDate}</Text></View>
          </View>

          <Text style={{ fontSize: 11, fontWeight: '800', color: '#94a3b8', marginBottom: 6 }}>TRONCO</Text>
          <MeasureRow label="Peitoral" diffValue={calcDiff(currAnthro?.chest, prevAnthro?.chest)} />
          <MeasureRow label="Abdômen" diffValue={calcDiff(currAnthro?.abdomen, prevAnthro?.abdomen)} />
          <MeasureRow label="Cintura" diffValue={calcDiff(currAnthro?.waist, prevAnthro?.waist)} />
          <MeasureRow label="Quadril" diffValue={calcDiff(currAnthro?.hip, prevAnthro?.hip)} />
          
          <View style={{ height: 1, backgroundColor: '#e2e8f0', marginVertical: 8 }} />
          
          <Text style={{ fontSize: 11, fontWeight: '800', color: '#94a3b8', marginBottom: 6 }}>MEMBROS (E/D)</Text>
          <LimbRow label="Braço" diffLeft={calcDiff(currAnthro?.arm_left, prevAnthro?.arm_left)} diffRight={calcDiff(currAnthro?.arm_right, prevAnthro?.arm_right)} />
          <LimbRow label="Coxa" diffLeft={calcDiff(currAnthro?.thigh_left, prevAnthro?.thigh_left)} diffRight={calcDiff(currAnthro?.thigh_right, prevAnthro?.thigh_right)} />
          <LimbRow label="Panturrilha" diffLeft={calcDiff(currAnthro?.calf_left, prevAnthro?.calf_left)} diffRight={calcDiff(currAnthro?.calf_right, prevAnthro?.calf_right)} />
        </View>

        {/* Cartão 2: Evolução Total */}
        <View style={{ flex: 1, backgroundColor: '#fff', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3 }}>
          <Text style={{ fontSize: 12, fontWeight: '900', color: '#ea580c', marginBottom: 10, textAlign: 'center' }}>EVOLUÇÃO TOTAL</Text>
          
          <View style={{ backgroundColor: '#f8fafc', padding: 8, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#f1f5f9' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}><Text style={{ fontSize: 10, color: '#64748b' }}>Atual:</Text><Text style={{ fontSize: 10, fontWeight: 'bold', color: '#1e293b' }}>{currDate}</Text></View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={{ fontSize: 10, color: '#64748b' }}>Início:</Text><Text style={{ fontSize: 10, fontWeight: 'bold', color: '#1e293b' }}>{firstDate}</Text></View>
          </View>

          <Text style={{ fontSize: 11, fontWeight: '800', color: '#94a3b8', marginBottom: 6 }}>TRONCO</Text>
          <MeasureRow label="Peitoral" diffValue={calcDiff(currAnthro?.chest, firstAnthro?.chest)} />
          <MeasureRow label="Abdômen" diffValue={calcDiff(currAnthro?.abdomen, firstAnthro?.abdomen)} />
          <MeasureRow label="Cintura" diffValue={calcDiff(currAnthro?.waist, firstAnthro?.waist)} />
          <MeasureRow label="Quadril" diffValue={calcDiff(currAnthro?.hip, firstAnthro?.hip)} />
          
          <View style={{ height: 1, backgroundColor: '#e2e8f0', marginVertical: 8 }} />
          
          <Text style={{ fontSize: 11, fontWeight: '800', color: '#94a3b8', marginBottom: 6 }}>MEMBROS (E/D)</Text>
          <LimbRow label="Braço" diffLeft={calcDiff(currAnthro?.arm_left, firstAnthro?.arm_left)} diffRight={calcDiff(currAnthro?.arm_right, firstAnthro?.arm_right)} />
          <LimbRow label="Coxa" diffLeft={calcDiff(currAnthro?.thigh_left, firstAnthro?.thigh_left)} diffRight={calcDiff(currAnthro?.thigh_right, firstAnthro?.thigh_right)} />
          <LimbRow label="Panturrilha" diffLeft={calcDiff(currAnthro?.calf_left, firstAnthro?.calf_left)} diffRight={calcDiff(currAnthro?.calf_right, firstAnthro?.calf_right)} />
        </View>

      </View>
    </View>
  );
}

