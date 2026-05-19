import * as Clipboard from 'expo-clipboard';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../lib/supabase';
import {
  ACTIVITY_LABELS,
  ActivityLevel,
  OBJECTIVE_LABELS,
  Objective,
  calculateDietPlan,
} from '../utils/dietCalculations';
import { T } from '../utils/theme';

const DEFAULT_PROMPT = `Com base nos dados acima, gere um cardápio semanal (7 dias) personalizado para este aluno, respeitando:
- Protocolo de dieta de alto teor de proteínas e baixo de carboidratos
- O objetivo declarado e as metas nutricionais calculadas
- As restrições alimentares informadas
- Distribuição das refeições conforme o plano atual
- Alimentos conforme o Guia de Alimentos Ideais enviados anteriormente
- Variedade entre os dias da semana`;

interface AIReportModalProps {
  visible: boolean;
  onClose: () => void;
  client: any;
  assessment: any;
}

function calcAge(birthDate: string): number {
  if (!birthDate) return 0;
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function fmt(val: any, dec = 1): string {
  if (val == null || val === '' || isNaN(Number(val))) return '-';
  return Number(val).toFixed(dec);
}

export default function AIReportModal({ visible, onClose, client, assessment }: AIReportModalProps) {
  const [mealPlan, setMealPlan] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [customPrompt, setCustomPrompt] = useState(DEFAULT_PROMPT);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (visible && client?.id) {
      fetchMealPlan();
    }
    if (!visible) {
      setCopied(false);
      setCustomPrompt(DEFAULT_PROMPT);
    }
  }, [visible, client?.id]);

  async function fetchMealPlan() {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('meal_plans')
        .select('title, notes, meals_per_day')
        .eq('client_id', client.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      setMealPlan(data);
    } catch (e) {
      console.error('AIReportModal: erro ao buscar plano:', e);
    } finally {
      setLoading(false);
    }
  }

  function buildReport(): string {
    const anthro = assessment?.anthropometry?.[0];
    const age = calcAge(client?.birth_date);
    const genderLabel =
      client?.gender === 'M' || client?.gender === 'Masculino' ? 'Masculino' : 'Feminino';
    const dateStr = assessment?.date
      ? new Date(assessment.date).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
      : '-';

    const weight = Number(anthro?.weight) || 0;
    const fatPct = Number(anthro?.body_fat) || 0;
    const musclePct = Number(anthro?.muscle_mass_percentage) || 0;
    const fatKg = weight > 0 && fatPct > 0 ? (weight * fatPct / 100).toFixed(1) : null;
    const muscleKg = weight > 0 && musclePct > 0 ? (weight * musclePct / 100).toFixed(1) : null;
    const leanMassKg = weight > 0 && fatKg ? (weight - Number(fatKg)).toFixed(1) : null;

    // Bloco de metas calculadas
    let dietBlock = '';
    if (
      weight > 0 &&
      client?.height_cm &&
      client?.birth_date &&
      client?.gender &&
      client?.objective &&
      client?.activity_level
    ) {
      try {
        const result = calculateDietPlan({
          weight_kg: weight,
          height_cm: client.height_cm,
          age,
          gender: client.gender as 'M' | 'F',
          body_fat_percent: fatPct,
          activity: client.activity_level as ActivityLevel,
          objective: client.objective as Objective,
        });
        dietBlock = `\n\n📊 METAS NUTRICIONAIS CALCULADAS (protocolo High Protein)
Calorias alvo: ${fmt(result.macros.calories, 0)} kcal | Proteína: ${fmt(result.macros.protein, 0)}g | Carboidratos: ${fmt(result.macros.carbs, 0)}g | Gorduras: ${fmt(result.macros.fat, 0)}g
BMR: ${fmt(result.bmr, 0)} kcal | TDEE: ${fmt(result.tdee, 0)} kcal | Massa Magra: ${fmt(result.lean_mass, 1)} kg`;
      } catch (_) {
        // dados insuficientes para cálculo
      }
    }

    // Labels legíveis de objetivo e atividade
    const objLabel = client?.objective
      ? (OBJECTIVE_LABELS[client.objective as Objective] ?? client.objective)
      : '-';
    const actLabel = client?.activity_level
      ? (ACTIVITY_LABELS[client.activity_level as ActivityLevel] ?? client.activity_level)
      : '-';

    // Bloco de medidas (só inclui campos preenchidos)
    let measuresBlock = '';
    const hasTrunk = anthro?.chest || anthro?.abdomen || anthro?.waist || anthro?.hip;
    const hasLimbs =
      anthro?.arm_left || anthro?.arm_right ||
      anthro?.thigh_left || anthro?.thigh_right ||
      anthro?.calf_left || anthro?.calf_right;

    if (hasTrunk || hasLimbs) {
      measuresBlock = '\n\n📏 MEDIDAS CORPORAIS';
      if (hasTrunk) {
        const parts: string[] = [];
        if (anthro?.chest)   parts.push(`Peitoral: ${fmt(anthro.chest)} cm`);
        if (anthro?.abdomen) parts.push(`Abdômen: ${fmt(anthro.abdomen)} cm`);
        if (anthro?.waist)   parts.push(`Cintura: ${fmt(anthro.waist)} cm`);
        if (anthro?.hip)     parts.push(`Quadril: ${fmt(anthro.hip)} cm`);
        measuresBlock += `\nTronco — ${parts.join(' | ')}`;
      }
      if (anthro?.arm_left || anthro?.arm_right)
        measuresBlock += `\nBraço E/D: ${fmt(anthro?.arm_left)}/${fmt(anthro?.arm_right)} cm`;
      if (anthro?.thigh_left || anthro?.thigh_right)
        measuresBlock += `\nCoxa E/D: ${fmt(anthro?.thigh_left)}/${fmt(anthro?.thigh_right)} cm`;
      if (anthro?.calf_left || anthro?.calf_right)
        measuresBlock += `\nPanturrilha E/D: ${fmt(anthro?.calf_left)}/${fmt(anthro?.calf_right)} cm`;
    }

    // Bloco do plano alimentar
    let mealPlanBlock = '';
    if (mealPlan) {
      mealPlanBlock = `\n\n🍽️ PLANO ALIMENTAR ATUAL
Título: ${mealPlan.title ?? '-'}
Refeições por dia: ${mealPlan.meals_per_day ?? '-'}${mealPlan.notes ? `\nObservações: ${mealPlan.notes}` : ''}`;
    } else {
      mealPlanBlock = '\n\n🍽️ PLANO ALIMENTAR: não cadastrado ainda';
    }

    return `===== RELATÓRIO VORTEX PRIMUS — PARA IA =====

📋 DADOS PESSOAIS
Nome: ${client?.name ?? '-'}
Sexo: ${genderLabel} | Idade: ${age} anos | Altura: ${client?.height_cm ?? '-'} cm

⚖️ COMPOSIÇÃO CORPORAL (avaliação de ${dateStr})
Peso atual: ${fmt(weight)} kg
% Gordura: ${fmt(fatPct)}%${fatKg ? ` → ${fatKg} kg de gordura` : ''}
% Massa Muscular: ${fmt(musclePct)}%${muscleKg ? ` → ${muscleKg} kg de músculo` : ''}${leanMassKg ? `\nMassa Magra total: ${leanMassKg} kg` : ''}${anthro?.basal_metabolic_rate ? `\nMetabolismo Basal: ${fmt(anthro.basal_metabolic_rate, 0)} kcal` : ''}${anthro?.body_fat_index ? ` | Gordura Visceral: ${fmt(anthro.body_fat_index, 0)}` : ''}${anthro?.metabolic_age ? ` | Idade Metabólica: ${fmt(anthro.metabolic_age, 0)} anos` : ''}${measuresBlock}

🎯 PERFIL DO ALUNO
Objetivo: ${objLabel}
Nível de atividade: ${actLabel}
Restrições alimentares: ${client?.food_restrictions || 'Nenhuma informada'}${dietBlock}${mealPlanBlock}

===== INSTRUÇÃO PARA A IA =====
${customPrompt}

==============================================`;
  }

  async function handleCopy() {
    try {
      await Clipboard.setStringAsync(buildReport());
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (e) {
      console.error('AIReportModal: erro ao copiar:', e);
    }
  }

  const monoFont = Platform.OS === 'ios' ? 'Courier' : 'monospace';

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' }}>
        <View
          style={{
            backgroundColor: T.card,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            borderWidth: 1,
            borderColor: T.border,
            maxHeight: '92%',
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: T.border,
            }}
          >
            <Text style={{ fontSize: 17, fontWeight: '800', color: T.t1 }}>
              🤖 Relatório para IA
            </Text>
            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
              <Text style={{ fontSize: 18, color: T.t3, fontWeight: 'bold' }}>✕</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={{ padding: 48, alignItems: 'center' }}>
              <ActivityIndicator color={T.blue} size="large" />
              <Text style={{ color: T.t3, marginTop: 12, fontSize: 13 }}>
                Carregando plano alimentar...
              </Text>
            </View>
          ) : (
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
              showsVerticalScrollIndicator
            >
              {/* Prévia do relatório */}
              <Text
                style={{
                  fontSize: 11,
                  color: T.t3,
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  marginBottom: 8,
                }}
              >
                Prévia do Relatório
              </Text>
              <View
                style={{
                  backgroundColor: T.surface,
                  borderRadius: 12,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: T.border,
                  marginBottom: 20,
                }}
              >
                <Text
                  style={{ fontSize: 11.5, color: T.t1, lineHeight: 19, fontFamily: monoFont }}
                  selectable
                >
                  {buildReport().split('===== INSTRUÇÃO PARA A IA =====')[0].trim()}
                </Text>
              </View>

              {/* Prompt editável */}
              <Text
                style={{
                  fontSize: 11,
                  color: T.t3,
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  marginBottom: 8,
                }}
              >
                ✏️ Instrução para a IA (editável)
              </Text>
              <TextInput
                style={{
                  backgroundColor: T.surface,
                  borderRadius: 12,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: T.borderActive,
                  color: T.t1,
                  fontSize: 13,
                  lineHeight: 20,
                  minHeight: 160,
                  textAlignVertical: 'top',
                  marginBottom: 20,
                  fontFamily: monoFont,
                }}
                value={customPrompt}
                onChangeText={setCustomPrompt}
                multiline
                placeholderTextColor={T.t3}
              />

              {/* Botão copiar */}
              <TouchableOpacity
                onPress={handleCopy}
                style={{
                  backgroundColor: copied ? '#16a34a' : T.blue,
                  padding: 16,
                  borderRadius: 14,
                  alignItems: 'center',
                  marginBottom: 10,
                }}
                activeOpacity={0.85}
              >
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>
                  {copied ? '✅ Copiado! Cole em qualquer IA' : '📋 Copiar Relatório Completo'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={onClose}
                style={{
                  padding: 14,
                  borderRadius: 14,
                  alignItems: 'center',
                  backgroundColor: T.surfaceAlt,
                  borderWidth: 1,
                  borderColor: T.border,
                }}
                activeOpacity={0.85}
              >
                <Text style={{ color: T.t2, fontWeight: '700', fontSize: 15 }}>Fechar</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}