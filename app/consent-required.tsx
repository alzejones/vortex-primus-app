import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useConsentStatus } from '../hooks/useConsentStatus';
import { supabase } from '../lib/supabase';
import { CURRENT_CONSENT_VERSION } from '../utils/consentVersion';
import { GradientPrimary } from '../utils/gradients';
import { T } from '../utils/theme';

type ConsentChecks = {
  health_declaration: boolean;
  age_restriction: boolean;
  educational_content_ack: boolean;
  data_accuracy: boolean;
  lgpd_data_processing: boolean;
  ai_external_sharing: boolean;
};

export default function ConsentRequiredScreen() {
  const router = useRouter();
  const consentStatus = useConsentStatus();
  const [checks, setChecks] = useState<ConsentChecks>({
    health_declaration: false,
    age_restriction: false,
    educational_content_ack: false,
    data_accuracy: false,
    lgpd_data_processing: false,
    ai_external_sharing: false,
  });
  const [photosConsent, setPhotosConsent] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!consentStatus.loading && !consentStatus.needsConsent) {
      router.replace('/(client)/diet' as any);
    }
  }, [consentStatus.loading, consentStatus.needsConsent]);

  const toggleCheck = (key: keyof ConsentChecks) => {
    setChecks(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const allMandatoryChecked = Object.values(checks).every(v => v === true);

  const handleConfirm = async () => {
    if (!allMandatoryChecked) return;

    setSaving(true);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) throw new Error('User not found');

      const { data: clients, error: clientError } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)
        .single();

      if (clientError) throw clientError;
      if (!clients) throw new Error('Client record not found');

      const { error: insertError } = await supabase
        .from('client_consents')
        .insert({
          client_id: clients.id,
          consent_version: CURRENT_CONSENT_VERSION,
          health_declaration: true,
          age_restriction: true,
          educational_content_ack: true,
          data_accuracy: true,
          lgpd_data_processing: true,
          ai_external_sharing: true,
          photos_consent: photosConsent,
        });

      if (insertError) throw insertError;

      router.replace('/(client)/diet' as any);
    } catch (err) {
      console.error('Error saving consent:', err);
      alert('Erro ao salvar consentimento. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  if (consentStatus.loading || saving) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={T.blue} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.title}>Antes de começar</Text>
          <Text style={styles.subtitle}>
            Para continuar, é preciso confirmar as declarações abaixo:
          </Text>

          <View style={styles.checkList}>
            <CheckItem
              checked={checks.health_declaration}
              onToggle={() => toggleCheck('health_declaration')}
              text="Declaro que consultei um médico e fui liberado(a) para atividades físicas e/ou rotinas alimentares, ou estou em acompanhamento médico compatível. Estou ciente de que devo interromper qualquer atividade em caso de desconforto e buscar avaliação médica antes de retomar."
            />

            <CheckItem
              checked={checks.age_restriction}
              onToggle={() => toggleCheck('age_restriction')}
              text="Declaro ter 18 anos ou mais (ou que este cadastro é feito com autorização do meu responsável legal), e que não estou grávida ou amamentando — ou, se estiver, que qualquer sugestão alimentar será validada por médico/nutricionista antes de qualquer adoção."
            />

            <CheckItem
              checked={checks.educational_content_ack}
              onToggle={() => toggleCheck('educational_content_ack')}
              text="Estou ciente de que os planos alimentares, sugestões de suplementação e relatórios recebidos têm caráter educacional (podendo ser gerados com apoio de IA) e NÃO substituem consulta, diagnóstico ou prescrição de profissionais de saúde habilitados."
            />

            <CheckItem
              checked={checks.data_accuracy}
              onToggle={() => toggleCheck('data_accuracy')}
              text="Declaro que as informações que forneço (peso, altura, medidas, condições de saúde, objetivos) são verdadeiras e atualizadas."
            />

            <CheckItem
              checked={checks.lgpd_data_processing}
              onToggle={() => toggleCheck('lgpd_data_processing')}
              text="Autorizo o tratamento dos meus dados pessoais, incluindo dados sensíveis de saúde e composição corporal, pelo Vortex Primus e pelo profissional que me acompanha, para fins de acompanhamento e melhoria do serviço, nos termos da LGPD."
            />

            <CheckItem
              checked={checks.ai_external_sharing}
              onToggle={() => toggleCheck('ai_external_sharing')}
              text="Estou ciente de que meu treinador pode usar a funcionalidade 'Relatório para IA', que compartilha um resumo dos meus dados de saúde com ferramentas de IA externas (ex: ChatGPT, Claude), a critério dele, e autorizo esse compartilhamento."
            />
          </View>

          <View style={styles.separator} />

          <CheckItem
            checked={photosConsent}
            onToggle={() => setPhotosConsent(!photosConsent)}
            text="(Opcional) Autorizo o uso de fotos de 'antes e depois' exclusivamente para meu próprio acompanhamento dentro da plataforma. Qualquer divulgação pública dessas imagens exige minha autorização separada."
            optional
          />

          <TouchableOpacity
            onPress={handleConfirm}
            disabled={!allMandatoryChecked}
            style={[styles.button, !allMandatoryChecked && styles.buttonDisabled]}
          >
            <LinearGradient {...GradientPrimary} style={styles.gradient}>
              <Text style={styles.buttonText}>Li e concordo, continuar</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

type CheckItemProps = {
  checked: boolean;
  onToggle: () => void;
  text: string;
  optional?: boolean;
};

function CheckItem({ checked, onToggle, text, optional }: CheckItemProps) {
  return (
    <TouchableOpacity onPress={onToggle} style={styles.checkItem}>
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked && <Ionicons name="checkmark" size={18} color="#fff" />}
      </View>
      <Text style={[styles.checkText, optional && styles.checkTextOptional]}>
        {text}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.bg,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: T.card,
    borderRadius: 16,
    padding: 24,
    maxWidth: 680,
    width: '100%',
    alignSelf: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: T.t1,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: T.t2,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  checkList: {
    gap: 16,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: T.border,
    backgroundColor: T.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: T.blue,
    borderColor: T.blue,
  },
  checkText: {
    flex: 1,
    fontSize: 14,
    color: T.t2,
    lineHeight: 20,
  },
  checkTextOptional: {
    fontStyle: 'italic',
    color: T.t3,
  },
  separator: {
    height: 1,
    backgroundColor: T.border,
    marginVertical: 20,
  },
  button: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  gradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
