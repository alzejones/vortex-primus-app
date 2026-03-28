import { useRouter } from "expo-router";
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

      if (trainer.plan_id) {
        setCurrentPlanId(trainer.plan_id);
      } else {
        const { data: sub } = await supabase
          .from("trainer_subscriptions")
          .select("plan_id")
          .eq("trainer_id", trainer.id)
          .eq("is_active", true)
          .single();

        if (sub) setCurrentPlanId(sub.plan_id);
      }

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
      `Deseja assinar o plano ${plan.name} por R$ ${plan.price_monthly}/mês?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: async () => {
            setProcessing(true);
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) throw new Error("Sessão inválida.");

              const { data: trainer } = await supabase
                .from("trainers")
                .select("id")
                .eq("user_id", user.id)
                .single();

              if (!trainer) throw new Error("Perfil de treinador não encontrado.");

              await supabase
                .from("trainer_subscriptions")
                .update({ is_active: false })
                .eq("trainer_id", trainer.id);

              const { error: subError } = await supabase
                .from("trainer_subscriptions")
                .insert([{
                  trainer_id: trainer.id,
                  plan_id: plan.id,
                  start_date: new Date().toISOString(),
                  is_active: true
                }]);

              if (subError) throw subError;

              const { error: trainerError } = await supabase
                .from("trainers")
                .update({ 
                  plan_id: plan.id,
                  plan_status: "active" 
                })
                .eq("id", trainer.id);

              if (trainerError) throw trainerError;

              Alert.alert("Sucesso! 🎉", "O seu plano foi atualizado com sucesso. O seu limite de alunos aumentou!");
              router.replace("/(protected)");

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
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
      
      {/* CABEÇALHO DE ALTA CONVERSÃO */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Desbloqueie o Próximo Nível</Text>
        <Text style={styles.subtitle}>Escolha o limite ideal para escalar o seu negócio de consultoria. Sem taxas ocultas, cancele quando quiser.</Text>
      </View>

      {/* CARTÕES DE PREÇO OBJETIVOS E LIMPOS */}
      <View style={styles.cardsContainer}>
        {plans.map((plan, index) => {
          const isCurrent = plan.id === currentPlanId;
          const isPopular = index === 1; 
          
          // O limite ilimitado
          const isUnlimited = plan.max_clients >= 900;

          return (
            <View 
              key={plan.id} 
              style={[
                styles.planCard, 
                isPopular && styles.planCardPopular,
                isCurrent && styles.planCardCurrent
              ]}
            >
              {isPopular && !isCurrent && (
                <View style={styles.badgePopular}>
                  <Text style={styles.badgePopularText}>MAIS ESCOLHIDO</Text>
                </View>
              )}
              {isCurrent && (
                <View style={styles.badgeCurrent}>
                  <Text style={styles.badgeCurrentText}>SEU PLANO ATUAL</Text>
                </View>
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
                    {isUnlimited ? (
                      <Text style={{fontWeight: '900', color: isPopular ? '#fff' : '#10b981'}}>Alunos Ilimitados</Text>
                    ) : (
                      <Text>Até <Text style={{fontWeight: 'bold'}}>{plan.max_clients} Alunos</Text> ativos</Text>
                    )}
                  </Text>
                </View>
                <View style={styles.featureItem}>
                  <Text style={[styles.featureIcon, isPopular && styles.textWhite]}>✨</Text>
                  <Text style={[styles.featureText, isPopular && styles.textWhite]}>Acesso a <Text style={{fontWeight: 'bold'}}>todas</Text> as funcionalidades</Text>
                </View>
              </View>

              <TouchableOpacity 
                style={[
                  styles.subscribeBtn, 
                  isPopular && styles.subscribeBtnPopular,
                  isCurrent && styles.subscribeBtnDisabled
                ]}
                disabled={isCurrent || processing}
                onPress={() => handleSubscribe(plan)}
              >
                <Text style={[
                  styles.subscribeBtnText, 
                  isPopular && styles.subscribeBtnTextPopular,
                  isCurrent && styles.subscribeBtnTextDisabled
                ]}>
                  {isCurrent ? "Plano Ativo" : processing ? "Processando..." : "Assinar Agora"}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>

      {/* 🔴 SESSÃO DE COPYWRITING: O ARSENAL DO TREINADOR */}
      <View style={styles.benefitsSection}>
        <View style={styles.benefitsHeader}>
          <Text style={styles.benefitsMainTitle}>O arsenal que você leva em todos os planos</Text>
          <Text style={styles.benefitsMainSubtitle}>Ao assinar o Vortex Primus, você ganha acesso total e irrestrito a ferramentas de classe mundial desenhadas para aumentar o seu faturamento e fidelizar seus alunos.</Text>
        </View>

        {/* BENEFÍCIO 1: AGENDAMENTO */}
        <View style={styles.benefitBox}>
          <View style={[styles.benefitIconWrapper, { backgroundColor: '#e0e7ff' }]}>
            <Text style={styles.benefitIcon}>📅</Text>
          </View>
          <Text style={styles.benefitTitle}>Agendamento Inteligente</Text>
          <Text style={styles.benefitSubtitle}>Aumente a produtividade da sua operação e elimine esquecimentos.</Text>
          
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}><Text style={styles.bulletCheck}>✓ </Text><Text style={styles.bulletBold}>WhatsApp Integrado:</Text> Envie confirmações direto para o aluno com 1 clique.</Text>
            <Text style={styles.bulletItem}><Text style={styles.bulletCheck}>✓ </Text><Text style={styles.bulletBold}>Controle Total:</Text> Gestão clara de agendamentos feitos e status de presença.</Text>
            <Text style={styles.bulletItem}><Text style={styles.bulletCheck}>✓ </Text><Text style={styles.bulletBold}>Organização Visual:</Text> Interface limpa para os envios e recebimentos.</Text>
          </View>
        </View>

        {/* BENEFÍCIO 2: COMPOSIÇÃO CORPORAL */}
        <View style={styles.benefitBox}>
          <View style={[styles.benefitIconWrapper, { backgroundColor: '#fce7f3' }]}>
            <Text style={styles.benefitIcon}>⚖️</Text>
          </View>
          <Text style={styles.benefitTitle}>Composição Corporal Avançada</Text>
          <Text style={styles.benefitSubtitle}>Mostre visualmente que você e o aluno têm o controle absoluto dos resultados.</Text>
          
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}><Text style={styles.bulletCheck}>✓ </Text><Text style={styles.bulletBold}>Curvas de Evolução:</Text> Gráficos de alta precisão mostrando o progresso.</Text>
            <Text style={styles.bulletItem}><Text style={styles.bulletCheck}>✓ </Text><Text style={styles.bulletBold}>Inteligência Comparativa:</Text> Gráficos mostrando o "Resultado Atual vs. Número Ideal".</Text>
            <Text style={styles.bulletItem}><Text style={styles.bulletCheck}>✓ </Text><Text style={styles.bulletBold}>Histórico Comprovado:</Text> Tabelas que traduzem a melhora de cada marcador de saúde.</Text>
          </View>
        </View>

        {/* BENEFÍCIO 3: CONDICIONAMENTO CROSS */}
        <View style={styles.benefitBox}>
          <View style={[styles.benefitIconWrapper, { backgroundColor: '#dcfce7' }]}>
            <Text style={styles.benefitIcon}>🏃</Text>
          </View>
          <Text style={styles.benefitTitle}>Condicionamento Físico & Cross</Text>
          <Text style={styles.benefitSubtitle}>Prove na prática que o seu método de treino gera performance real.</Text>
          
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}><Text style={styles.bulletCheck}>✓ </Text><Text style={styles.bulletBold}>Flexibilidade Absoluta:</Text> Você no comando. Escolha exatamente quais exercícios quer avaliar.</Text>
            <Text style={styles.bulletItem}><Text style={styles.bulletCheck}>✓ </Text><Text style={styles.bulletBold}>Evolução de Força:</Text> Tabelas demonstrando aumentos de carga (PRs).</Text>
            <Text style={styles.bulletItem}><Text style={styles.bulletCheck}>✓ </Text><Text style={styles.bulletBold}>Resistência & Mobilidade:</Text> Registre a diminuição de tempo (Pace) e ganho de amplitude.</Text>
          </View>
        </View>

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
  
  planCard: { backgroundColor: "#fff", borderRadius: 24, padding: 24, marginBottom: 24, borderWidth: 1, borderColor: "#e2e8f0", shadowColor: "#64748b", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3, position: "relative" },
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

  // ESTILOS DA SESSÃO DE COPYWRITING
  benefitsSection: { padding: 20, paddingTop: 10, paddingBottom: 40 },
  benefitsHeader: { marginBottom: 30, paddingHorizontal: 8 },
  benefitsMainTitle: { fontSize: 24, fontWeight: "900", color: "#0f172a", marginBottom: 10, letterSpacing: -0.5, lineHeight: 30 },
  benefitsMainSubtitle: { fontSize: 15, color: "#475569", lineHeight: 22 },

  benefitBox: { backgroundColor: "#fff", padding: 24, borderRadius: 20, marginBottom: 20, borderWidth: 1, borderColor: "#e2e8f0", shadowColor: "#cbd5e1", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 2 },
  benefitIconWrapper: { width: 48, height: 48, borderRadius: 16, justifyContent: "center", alignItems: "center", marginBottom: 16 },
  benefitIcon: { fontSize: 24 },
  benefitTitle: { fontSize: 19, fontWeight: "800", color: "#0f172a", marginBottom: 6 },
  benefitSubtitle: { fontSize: 14, color: "#64748b", fontStyle: "italic", marginBottom: 16, lineHeight: 20 },
  
  bulletList: { gap: 10 },
  bulletItem: { fontSize: 14, color: "#334155", lineHeight: 22, flexDirection: "row" },
  bulletCheck: { color: "#10b981", fontWeight: "900" },
  bulletBold: { fontWeight: "800", color: "#0f172a" },
});

