// ============================================================
// (protected)/_layout.tsx — Layout do treinador (mobile-only)
// TabBar inferior absoluta + TRAVA DE TRIAL
// ============================================================
import { Redirect, Slot, useRouter } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import TabBar from '../../components/TabBar';
import { T } from '../../utils/theme';
import SupportButton from '../../components/SupportButton';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

type SubscriptionStatus = 'loading' | 'active' | 'trial_expired' | 'no_subscription';

export default function ProtectedLayout() {
  const insets = useSafeAreaInsets();
  const { session, loading, role } = useAuth();
  const router = useRouter();
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>('loading');

  useEffect(() => {
    if (!session?.user?.id || role !== 'trainer') return;
    checkSubscription(session.user.id);
  }, [session?.user?.id, role]);

  async function checkSubscription(userId: string) {
    try {
      // Busca o trainer
      const { data: trainer } = await supabase
        .from('trainers')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (!trainer) {
        setSubscriptionStatus('no_subscription');
        return;
      }

      // Busca a assinatura ativa
      const { data: sub } = await supabase
        .from('trainer_subscriptions')
        .select('id, is_active, expires_at, plan_id')
        .eq('trainer_id', trainer.id)
        .eq('is_active', true)
        .maybeSingle();

      if (!sub) {
        // Sem assinatura ativa — verifica se está dentro dos 7 dias de trial
        const { data: trainerData } = await supabase
          .from('trainers')
          .select('created_at')
          .eq('id', trainer.id)
          .single();

        if (trainerData) {
          const createdAt = new Date(trainerData.created_at);
          const trialEnd = new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000);
          const now = new Date();

          if (now <= trialEnd) {
            setSubscriptionStatus('active'); // Dentro do trial
          } else {
            setSubscriptionStatus('trial_expired'); // Trial vencido
          }
        } else {
          setSubscriptionStatus('no_subscription');
        }
        return;
      }

      // Tem assinatura — verifica se expirou
      if (sub.expires_at) {
        const expiresAt = new Date(sub.expires_at);
        const now = new Date();
        if (now > expiresAt) {
          setSubscriptionStatus('trial_expired');
          return;
        }
      }

      setSubscriptionStatus('active');
    } catch (error) {
      console.error('Erro ao verificar assinatura:', error);
      // Em caso de erro, permite acesso para não bloquear usuário por falha técnica
      setSubscriptionStatus('active');
    }
  }

  if (loading || subscriptionStatus === 'loading') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: T.bg }}>
        <ActivityIndicator size="large" color={T.blue} />
      </View>
    );
  }

  if (!session) return <Redirect href="/login" />;

  if (role === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: T.bg }}>
        <ActivityIndicator size="large" color={T.blue} />
      </View>
    );
  }

  if (role !== 'trainer') return <Redirect href="/login" />;

  // 🔒 TRAVA DE TRIAL: redireciona para upgrade se trial expirou
  if (subscriptionStatus === 'trial_expired' || subscriptionStatus === 'no_subscription') {
    return <Redirect href="/upgrade" />;
  }

  // Mobile: TabBar inferior absoluta
  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <View style={{ flex: 1, paddingBottom: 64 + insets.bottom }}>
        <Slot />
      </View>
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
        <TabBar />
      </View>
      <SupportButton bottom={72 + insets.bottom} />
    </View>
  );
}
