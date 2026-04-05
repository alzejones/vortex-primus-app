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

  // Função isolada apenas para processar o pagamento
  async function processPayment(plan: Plan) {
    console.log("=== DEBUG 1: Iniciando processPayment ===");
    setProcessing(true);
    
    try {
      if (!plan.stripe_price_id) {
        throw new Error("Este plano ainda não está configurado no banco de dados.");
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Sessão inválida. Faça login novamente.");

      console.log("=== DEBUG 2: Chamando Edge Function stripe-checkout ===");
      
      const { data: checkoutData, error: backendError } = await supabase.functions.invoke('stripe-checkout', {
        body: { 
          priceId: plan.stripe_price_id,
          email: session.user.email,
          name: session.user.user_metadata?.name || 'Treinador Vortex'
        }
      });

      if (backendError || checkoutData?.error) {
        console.error("=== DEBUG ERRO BACKEND ===", backendError || checkoutData?.error);
        throw new Error(checkoutData?.error || "Falha na comunicação com o servidor.");
      }

      const checkoutUrl = checkoutData.url;
      console.log("=== DEBUG 3: Link do Stripe recebido! ===", checkoutUrl);

      if (Platform.OS === 'web') {
        console.log("=== DEBUG 4: Redirecionando na WEB ===");
        window.location.href = checkoutUrl;
      } else {
        console.log("=== DEBUG 4: Abrindo WebBrowser no APP ===");
        await WebBrowser.openBrowserAsync(checkoutUrl);
      }

    } catch (error: any) {
      console.error("=== DEBUG ERRO GERAL ===", error);
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
    console.log(`=== DEBUG 0: Botão Clicado -> Plano: ${plan.name} ===`);

    if (plan.id === currentPlanId) {
      if (Platform.OS === 'web') window.alert("Este já é o seu plano atual!");
      else Alert.alert("Aviso", "Este já é o seu plano atual!");
      return;
    }

    // TRAVA DE SEGURANÇA PARA A WEB: Usamos window.confirm nativo do navegador
    if (Platform.OS === 'web') {
      const userConfirmed = window.confirm(`Deseja assinar o plano ${plan.name}?\n\nClique em OK para gerar seu link de pagamento.`);
      if (userConfirmed) {
        processPayment(plan);
      } else {
        console.log("=== DEBUG: Usuário cancelou na Web ===");
      }
    } 
    // FLUXO DO APLICATIVO NATIVO: Usamos o Alert.alert do React Native
    else {
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
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#4f46e5" /></View>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>← Voltar</Text>
        </TouchableOpacity>
        
        {/* TÍTULO PROVISÓRIO DE DEBUG PARA CONFIRMAR O DEPLOY DA VERCEL */}
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
                  {isCurrent ? "Plano Ativo" : processing ? "Processando..." : "Assinar Agora"}
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

