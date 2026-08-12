import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTrainerTermsStatus } from '../hooks/useTrainerTermsStatus';
import { supabase } from '../lib/supabase';
import { CURRENT_TRAINER_TERMS_VERSION } from '../utils/trainerTermsVersion';
import { GradientPrimary } from '../utils/gradients';
import { T } from '../utils/theme';

type TermsChecks = {
  qualification_declaration: boolean;
  data_processing_ack: boolean;
};

export default function TermsRequiredScreen() {
  const router = useRouter();
  const termsStatus = useTrainerTermsStatus();
  const [checks, setChecks] = useState<TermsChecks>({
    qualification_declaration: false,
    data_processing_ack: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!termsStatus.loading && !termsStatus.needsConsent) {
      router.replace('/(protected)/' as any);
    }
  }, [termsStatus.loading, termsStatus.needsConsent]);

  const toggleCheck = (key: keyof TermsChecks) => {
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

      const { data: trainers, error: trainerError } = await supabase
        .from('trainers')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)
        .single();

      if (trainerError) throw trainerError;
      if (!trainers) throw new Error('Trainer record not found');

      const { error: insertError } = await supabase
        .from('trainer_consents')
        .insert({
          trainer_id: trainers.id,
          terms_version: CURRENT_TRAINER_TERMS_VERSION,
          qualification_declaration: true,
          data_processing_ack: true,
        });

      if (insertError) throw insertError;

      router.replace('/(protected)/' as any);
    } catch (err) {
      console.error('Error saving trainer terms consent:', err);
      alert('Erro ao salvar aceite dos termos. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenFullTerms = () => {
    Linking.openURL('https://vortexprimus.com.br/termos-treinador');
  };

  if (termsStatus.loading || saving) {
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
          <Text style={styles.title}>Termos de Uso</Text>
          <Text style={styles.subtitle}>
            Antes de continuar usando o Vortex Primus como treinador, leia e confirme as declarações abaixo.
          </Text>

          <View style={styles.checkList}>
            <CheckItem
              checked={checks.qualification_declaration}
              onToggle={() => toggleCheck('qualification_declaration')}
              text="Declaro que atuarei dentro dos limites legais da minha qualificação profissional e formação. Estou ciente de que prescrição dietética individualizada, prescrição de exercícios físicos individualizados e diagnóstico ou tratamento de condições de saúde são atividades privativas de profissões regulamentadas (nutricionista, educador físico com CREF, e médico, respectivamente), e que não utilizarei a Plataforma para exercer tais atividades caso não possua a habilitação legal correspondente. Estou ciente de que o conteúdo gerado por IA na Plataforma tem natureza educacional e que sua utilização, adaptação e comunicação ao meu aluno é de minha exclusiva responsabilidade."
            />

            <CheckItem
              checked={checks.data_processing_ack}
              onToggle={() => toggleCheck('data_processing_ack')}
              text="Declaro que sou responsável por obter o consentimento dos meus alunos para o tratamento de seus dados pessoais, incluindo dados sensíveis de saúde, na forma da LGPD, e que li e concordo com os Termos de Uso completos do Vortex Primus."
            />
          </View>

          <TouchableOpacity onPress={handleOpenFullTerms} style={styles.linkButton}>
            <Text style={styles.linkText}>Ler os Termos de Uso completos</Text>
          </TouchableOpacity>

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
};

function CheckItem({ checked, onToggle, text }: CheckItemProps) {
  return (
    <TouchableOpacity onPress={onToggle} style={styles.checkItem}>
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked && <Ionicons name="checkmark" size={18} color="#fff" />}
      </View>
      <Text style={styles.checkText}>{text}</Text>
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
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.6)',
    backgroundColor: 'rgba(255,255,255,0.05)',
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
  linkButton: {
    marginTop: 20,
    alignSelf: 'center',
  },
  linkText: {
    fontSize: 15,
    color: T.blue,
    textDecorationLine: 'underline',
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
