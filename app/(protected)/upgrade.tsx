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

  async function handleSubscribe(plan: Plan) {
    if (plan.id === currentPlanId) {
      Alert.alert("Aviso", "Este já é o seu plano atual!");
      return;
    }

    Alert.alert(
      "Confirmar Upgrade",
      `Deseja assinar o plano ${plan.name}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: async () => {
            setProcessing(true);
            try {
              if (!plan.stripe_price_id) {
                throw new Error("Este plano ainda não está configurado.");
              }

              const { data: { session } } = await supabase.auth.getSession();
              if (!session?.user) throw new Error("Sessão inválida.");

              const { data: trainer } = await supabase
                .from("trainers")
                .select("id")
                .eq("user_id", session.user.id)
                .single();

              if (!trainer) throw new Error("Perfil de treinador não encontrado.");

              // 1. Chama a Edge Function para gerar o Link Universal
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

              // 2. Abre a página segura do Stripe dependendo do dispositivo
              if (Platform.OS === 'web') {
                // Se estiver no Google Chrome/Vercel, redireciona a página
                window.location.href = checkoutUrl;
              } else {
                // Se estiver no App (Android/iOS), abre um navegador interno sobreposto
                await WebBrowser.openBrowserAsync(checkoutUrl);
              }

              // 3. Atualiza o banco de dados
              // NOTA TÉCNICA: Para o futuro (v2 do app), o ideal é usar "Stripe Webhooks" 
              // para atualizar o banco. Mas mantive a sua lógica atual para destravar seu deploy hoje.
              await supabase.from("trainer_subscriptions").update({ is_active: false }).eq("trainer_id", trainer.id);

              await supabase.from("trainer_subscriptions").insert([{
                trainer_id: trainer.id,
                plan_id: plan.id,
                start_date: new Date().toISOString(),
                is_active: true
              }]);

              await supabase.from("trainers").update({ plan_id: plan.id, plan_status: "active" }).eq("id", trainer.id);

              if (Platform.OS !== 'web') {
                 Alert.alert("Sucesso! 🎉", "Retornando ao aplicativo.");
                 router.replace("/(protected)");
              }

            } catch (error: any) {
              Alert.alert("Erro", error.message);
            } finally {
              setProcessing(false);
            }
          }
        }
      ]
    );
  }

  if (loading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#4f46e5" /></View>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Eleve a sua Autoridade Profissional</Text>
        <Text style={styles.subtitle}>Escolha o plano ideal para escalar a sua faturação. Ferramentas criadas para que os seus alunos vejam o seu valor real e nunca queiram parar de treinar.</Text>
      </View>

      <View style={styles.cardsContainer}>
        {plans.map((plan, index) => {
          const isCurrent = plan.id === currentPlanId;
          const isPopular = index === 1; 
          const isUnlimited = plan.max_clients >= 900;

          return (
            <View key={plan.id} style={[styles.planCard, isPopular && styles.planCardPopular, isCurrent && styles.planCardCurrent]}>
              {isPopular && !isCurrent && <View style={styles.badgePopular}><Text style={styles.badgePopularText}>MAIS ESCOLHIDO</Text></View>}
              {isCurrent && <View style={styles.badgeCurrent}><Text style={styles.badgeCurrentText}>SEU PLANO ATUAL</Text></View>}

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
                    {isUnlimited ? <Text style={{fontWeight: '900', color: isPopular ? '#fff' : '#10b981'}}>Alunos Ilimitados</Text> : <Text>Até <Text style={{fontWeight: 'bold'}}>{plan.max_clients} Alunos</Text> ativos</Text>}
                  </Text>
                </View>
                <View style={styles.featureItem}>
                  <Text style={[styles.featureIcon, isPopular && styles.textWhite]}>✨</Text>
                  <Text style={[styles.featureText, isPopular && styles.textWhite]}>Acesso VIP a <Text style={{fontWeight: 'bold'}}>todas</Text> as ferramentas</Text>
                </View>
              </View>

              <TouchableOpacity 
                style={[styles.subscribeBtn, isPopular && styles.subscribeBtnPopular, isCurrent && styles.subscribeBtnDisabled]}
                disabled={isCurrent || processing}
                onPress={() => handleSubscribe(plan)}
              >
                <Text style={[styles.subscribeBtnText, isPopular && styles.subscribeBtnTextPopular, isCurrent && styles.subscribeBtnTextDisabled]}>
                  {isCurrent ? "Plano Ativo" : processing ? "Aguarde..." : "Assinar Agora"}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { padding: 24, paddingTop: Platform.OS === "ios" ? 60 : 40, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  backBtn: { marginBottom: 16 },
  backBtnText: { color: "#4f46e5", fontWeight: "700", fontSize: 16 },
  title: { fontSize: 30, fontWeight: "900", color: "#0f172a", marginBottom: 8, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: "#64748b", lineHeight: 22 },
  cardsContainer: { padding: 20 },
  planCard: { backgroundColor: "#fff", borderRadius: 24, padding: 24, marginBottom: 24, borderWidth: 1, borderColor: "#e2e8f0", shadowColor: "#64748b", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },
  planCardPopular: { backgroundColor: "#0f172a", borderColor: "#0f172a", transform: [{ scale: 1.02 }] },
  planCardCurrent: { borderColor: "#10b981", borderWidth: 2 },
  badgePopular: { position: "absolute", top: -12, alignSelf: "center", backgroundColor: "#4f46e5", paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  badgePopularText: { color: "#fff", fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  badgeCurrent: { position: "absolute", top: -12, alignSelf: "center", backgroundColor: "#10b981", paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  badgeCurrentText: { color: "#fff", fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  textWhite: { color: "#fff" },
  planName: { fontSize: 22, fontWeight: "900", color: "#334155", marginBottom: 16 },
  priceRow: { flexDirection: "row", alignItems: "baseline", marginBottom: 24 },
  currency: { fontSize: 18, fontWeight: "700", color: "#0f172a", marginRight: 4 },
  price: { fontSize: 52, fontWeight: "900", color: "#0f172a", letterSpacing: -2 },
  period: { fontSize: 16, fontWeight: "600", color: "#64748b", marginLeft: 4 },
  featuresListShort: { marginBottom: 24 },
  featureItem: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  featureIcon: { fontSize: 16, marginRight: 12 },
  featureText: { fontSize: 15, color: "#475569", flex: 1 },
  subscribeBtn: { backgroundColor: "#f1f5f9", paddingVertical: 18, borderRadius: 16, alignItems: "center" },
  subscribeBtnPopular: { backgroundColor: "#4f46e5", shadowColor: "#4f46e5", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  subscribeBtnDisabled: { backgroundColor: "#f1f5f9", opacity: 0.5 },
  subscribeBtnText: { color: "#0f172a", fontWeight: "800", fontSize: 16, textTransform: "uppercase", letterSpacing: 0.5 },
  subscribeBtnTextPopular: { color: "#fff" },
  subscribeBtnTextDisabled: { color: "#94a3b8" },
});

