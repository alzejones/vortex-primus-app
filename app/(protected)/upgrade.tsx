import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../lib/supabase";
import { GradientPrimary } from "../../utils/gradients";
import { T } from "../../utils/theme";

interface Plan {
  id: string;
  name: string;
  price_monthly: number;
  max_clients: number;
  stripe_price_id?: string;
}

export default function UpgradeScreen() {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadPlansAndSubscription();
  }, []);

  async function loadPlansAndSubscription() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: trainer } = await supabase
        .from("trainers")
        .select("id, plan_id")
        .eq("user_id", user.id)
        .single();

      if (!trainer) return;
      if (trainer.plan_id) setCurrentPlanId(trainer.plan_id);

      const { data: plansData, error } = await supabase
        .from("plans")
        .select("*")
        .order("max_clients", { ascending: true });

      if (error) throw error;
      if (plansData) setPlans(plansData);

    } catch (error) {
      console.log("Erro ao carregar planos:", error);
    } finally {
      setLoading(false);
    }
  }

  async function processPayment(plan: Plan) {
    setProcessing(true);
    try {
      if (!plan.stripe_price_id) {
        throw new Error("Este plano ainda não está configurado no banco de dados.");
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Sessão inválida. Faça login novamente.");

      const { data: checkoutData, error: backendError } = await supabase.functions.invoke('stripe-checkout', {
        body: {
          priceId: plan.stripe_price_id,
          email: session.user.email,
          name: session.user.user_metadata?.name || 'Treinador Vortex'
        }
      });

      if (backendError || checkoutData?.error) {
        throw new Error(checkoutData?.error || "Falha na comunicação com o servidor.");
      }

      const checkoutUrl = checkoutData.url;

      if (Platform.OS === 'web') {
        window.location.href = checkoutUrl;
      } else {
        await WebBrowser.openBrowserAsync(checkoutUrl);
      }

    } catch (error: any) {
      if (Platform.OS === 'web') {
        window.alert("Erro: " + error.message);
      } else {
        Alert.alert("Erro", error.message);
      }
    } finally {
      setProcessing(false);
    }
  }

  function handleSubscribe(plan: Plan) {
    if (plan.id === currentPlanId) {
      if (Platform.OS === 'web') window.alert("Este já é o seu plano atual!");
      else Alert.alert("Aviso", "Este já é o seu plano atual!");
      return;
    }

    if (Platform.OS === 'web') {
      const userConfirmed = window.confirm(`Deseja assinar o plano ${plan.name}?\n\nClique em OK para gerar seu link de pagamento.`);
      if (userConfirmed) processPayment(plan);
    } else {
      Alert.alert(
        "Confirmar Upgrade",
        `Deseja assinar o plano ${plan.name}?`,
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Confirmar", onPress: () => processPayment(plan) }
        ]
      );
    }
  }

  if (loading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color={T.blue} /></View>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🔥 TELA DE UPGRADE (DEBUG)</Text>
        <Text style={styles.subtitle}>Escolha o plano ideal para escalar a sua faturação. Ferramentas criadas para que os seus alunos vejam o seu valor real e nunca queiram parar de treinar.</Text>
      </View>

      <View style={styles.cardsContainer}>
        {plans.map((plan, index) => {
          const isCurrent = plan.id === currentPlanId;
          const isPopular = index === 1;
          const isUnlimited = plan.max_clients >= 900;

          return (
            <View key={plan.id} style={[styles.planCard, isPopular && styles.planCardPopular, isCurrent && styles.planCardCurrent]}>
              {isPopular && !isCurrent && (
                <View style={styles.badgePopular}><Text style={styles.badgePopularText}>MAIS ESCOLHIDO</Text></View>
              )}
              {isCurrent && (
                <View style={styles.badgeCurrent}><Text style={styles.badgeCurrentText}>SEU PLANO ATUAL</Text></View>
              )}

              <Text style={[styles.planName, isPopular && styles.textWhite]}>{plan.name}</Text>

              <View style={styles.priceRow}>
                <Text style={[styles.currency, isPopular && styles.textWhite]}>R$</Text>
                <Text style={[styles.price, isPopular && styles.textWhite]}>{plan.price_monthly}</Text>
                <Text style={[styles.period, isPopular && styles.textWhite]}>/mês</Text>
              </View>

              <View style={styles.featuresListShort}>
                <View style={styles.featureItem}>
                  <Text style={[styles.featureIcon, isPopular && styles.textWhite]}>👤</Text>
                  <Text style={[styles.featureText, isPopular && styles.textWhite]}>
                    {isUnlimited
                      ? <Text style={{ fontWeight: '900', color: isPopular ? '#fff' : T.green }}>Alunos Ilimitados</Text>
                      : <Text>Até <Text style={{ fontWeight: 'bold' }}>{plan.max_clients} Alunos</Text> ativos</Text>}
                  </Text>
                </View>
                <View style={styles.featureItem}>
                  <Text style={[styles.featureIcon, isPopular && styles.textWhite]}>✨</Text>
                  <Text style={[styles.featureText, isPopular && styles.textWhite]}>
                    Acesso VIP a <Text style={{ fontWeight: 'bold' }}>todas</Text> as ferramentas
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.subscribeBtn, isCurrent && styles.subscribeBtnDisabled]}
                disabled={isCurrent || processing}
                onPress={() => handleSubscribe(plan)}
              >
                {!isCurrent ? (
                  <LinearGradient
                    {...GradientPrimary}
                    style={styles.subscribeBtnGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={styles.subscribeBtnTextActive}>
                      {processing ? "Processando..." : "Assinar Agora"}
                    </Text>
                  </LinearGradient>
                ) : (
                  <Text style={styles.subscribeBtnTextDisabled}>Plano Ativo</Text>
                )}
              </TouchableOpacity>
            </View>
          );
        })}
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: T.bg },
  header: {
    padding: 24,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    backgroundColor: T.card,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  backBtn: { marginBottom: 16 },
  backBtnText: { color: T.blue, fontWeight: "700", fontSize: 16 },
  title: { fontSize: 28, fontWeight: "900", color: T.t1, marginBottom: 8, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: T.t3, lineHeight: 22 },
  cardsContainer: { padding: 20 },
  planCard: {
    backgroundColor: T.card,
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: T.border,
  },
  planCardPopular: { backgroundColor: T.bgAlt, borderColor: T.blue, transform: [{ scale: 1.02 }] },
  planCardCurrent: { borderColor: T.green, borderWidth: 2 },
  badgePopular: {
    position: "absolute",
    top: -12,
    alignSelf: "center",
    backgroundColor: T.blue,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgePopularText: { color: T.white, fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  badgeCurrent: {
    position: "absolute",
    top: -12,
    alignSelf: "center",
    backgroundColor: T.green,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeCurrentText: { color: T.white, fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  textWhite: { color: T.white },
  planName: { fontSize: 22, fontWeight: "900", color: T.t1, marginBottom: 16 },
  priceRow: { flexDirection: "row", alignItems: "baseline", marginBottom: 24 },
  currency: { fontSize: 18, fontWeight: "700", color: T.t1, marginRight: 4 },
  price: { fontSize: 52, fontWeight: "900", color: T.t1, letterSpacing: -2 },
  period: { fontSize: 16, fontWeight: "600", color: T.t3, marginLeft: 4 },
  featuresListShort: { marginBottom: 24 },
  featureItem: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  featureIcon: { fontSize: 16, marginRight: 12 },
  featureText: { fontSize: 15, color: T.t2, flex: 1 },
  subscribeBtn: { borderRadius: 16, overflow: "hidden" },
  subscribeBtnGradient: { paddingVertical: 18, alignItems: "center", borderRadius: 16 },
  subscribeBtnDisabled: { backgroundColor: T.surfaceAlt, paddingVertical: 18, alignItems: "center", borderRadius: 16, opacity: 0.5 },
  subscribeBtnTextActive: { color: T.white, fontWeight: "800", fontSize: 16, textTransform: "uppercase", letterSpacing: 0.5 },
  subscribeBtnTextDisabled: { color: T.t3, fontWeight: "800", fontSize: 16, textTransform: "uppercase", letterSpacing: 0.5, textAlign: "center" },
});
