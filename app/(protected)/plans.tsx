import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useStripeProxy } from "../../hooks/useStripeProxy";
import { useTrainer } from "../../hooks/useTrainer";
import { supabase } from "../../lib/supabase";
import { GradientPrimary } from "../../utils/gradients";
import { T } from "../../utils/theme";

interface Plan {
  id: string;
  name: string;
  price_monthly: number;
  max_clients: number | null;
  stripe_price_id: string;
}

export default function PlansScreen() {
  const { trainerId, plan: currentPlan, subscription, loadingTrainer } = useTrainer();
  const { initPaymentSheet, presentPaymentSheet } = useStripeProxy();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  async function fetchPlans() {
    const { data, error } = await supabase
      .from("plans")
      .select("*")
      .order("price_monthly", { ascending: true });

    if (error) {
      console.error("Erro ao buscar planos:", error);
    } else {
      setPlans(data || []);
    }
    setLoadingPlans(false);
  }

  function handleUpgrade(plan: Plan) {
    Alert.alert("Atenção", `Você selecionou o plano: ${plan.name}`);
    setSelectedPlan(plan);
    setModalVisible(true);
  }

  async function confirmUpgrade() {
    if (!trainerId) {
      Alert.alert("Erro", "Treinador não identificado. Faça login novamente.");
      return;
    }
    if (!selectedPlan) {
      Alert.alert("Erro", "Nenhum plano selecionado.");
      return;
    }

    try {
      setModalVisible(false);

      if (!selectedPlan.stripe_price_id) {
        Alert.alert("Erro", "Este plano ainda não tem um ID do Stripe configurado.");
        return;
      }

      Alert.alert("Aguarde", "Conectando ao Stripe...");

      const { data: { session } } = await supabase.auth.getSession();

      const { data: checkoutData, error: backendError } = await supabase.functions.invoke('stripe-checkout', {
        body: {
          priceId: selectedPlan.stripe_price_id,
          email: session?.user?.email,
          name: session?.user?.user_metadata?.name || 'Treinador Vortex'
        }
      });

      if (backendError || checkoutData?.error) {
        throw new Error(checkoutData?.error || backendError?.message || "Falha na Edge Function");
      }

      const { paymentIntent, ephemeralKey, customer } = checkoutData;

      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'Vortex Primus',
        customerId: customer,
        customerEphemeralKeySecret: ephemeralKey,
        paymentIntentClientSecret: paymentIntent,
        allowsDelayedPaymentMethods: true,
      });

      if (initError) throw new Error(initError.message);

      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        if (presentError.code === 'Canceled') return;
        throw new Error(presentError.message);
      }

      Alert.alert("Sucesso! 🎉", "Pagamento aprovado!");

      if (subscription) {
        await supabase.from("trainer_subscriptions").update({ is_active: false }).eq("id", subscription.id);
      }

      const { error } = await supabase.from("trainer_subscriptions").insert({
        trainer_id: trainerId,
        plan_id: selectedPlan.id,
        is_active: true,
        start_date: new Date().toISOString(),
      });

      if (error) throw new Error("Erro ao salvar no banco de dados.");

      router.replace("/" as any);

    } catch (error: any) {
      Alert.alert("Erro no pagamento", error.message);
    }
  }

  if (loadingTrainer || loadingPlans) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={T.blue} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
      <Text style={styles.title}>Planos Disponíveis</Text>

      {plans.map((plan) => {
        const isCurrent = currentPlan?.id === plan.id;
        const canSubscribe = !currentPlan || plan.price_monthly > currentPlan.price_monthly;

        return (
          <View key={plan.id} style={[styles.card, isCurrent && styles.currentCard]}>
            <Text style={styles.planName}>{plan.name}</Text>
            <Text style={styles.price}>R$ {plan.price_monthly.toFixed(2)} / mês</Text>
            <Text style={styles.limit}>
              Limite: {plan.max_clients ? `${plan.max_clients} alunos` : "Ilimitado"}
            </Text>

            {isCurrent && (
              <View style={styles.currentBadge}>
                <Text style={styles.currentText}>Plano Atual</Text>
              </View>
            )}

            {!isCurrent && canSubscribe && (
              <TouchableOpacity style={styles.upgradeButton} onPress={() => handleUpgrade(plan)}>
                <LinearGradient {...GradientPrimary} style={styles.upgradeButtonGradient}>
                  <Text style={styles.upgradeText}>Assinar Plano</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {!isCurrent && !canSubscribe && (
              <Text style={styles.blockedText}>Downgrade indisponível</Text>
            )}
          </View>
        );
      })}

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Confirmar Assinatura</Text>
            <Text style={styles.modalText}>Plano selecionado: {selectedPlan?.name}</Text>

            <TouchableOpacity style={styles.confirmButton} onPress={confirmUpgrade}>
              <LinearGradient {...GradientPrimary} style={styles.confirmGradient}>
                <Text style={styles.confirmText}>Confirmar e Pagar</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: T.bg },
  title: { fontSize: 26, fontWeight: "800", color: T.t1, marginBottom: 20 },
  card: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: T.card,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: T.border,
  },
  currentCard: { borderColor: T.green, borderWidth: 2 },
  planName: { fontSize: 18, fontWeight: "800", color: T.t1, marginBottom: 4 },
  price: { color: T.t2, marginTop: 4, fontSize: 15 },
  limit: { color: T.t3, marginTop: 4, fontSize: 13 },
  currentBadge: { marginTop: 15, backgroundColor: T.green, padding: 8, borderRadius: 8, alignItems: "center" },
  currentText: { color: T.white, fontWeight: "700", textAlign: "center" },
  upgradeButton: { marginTop: 15, borderRadius: 10, overflow: "hidden" },
  upgradeButtonGradient: { padding: 12, alignItems: "center", borderRadius: 10 },
  upgradeText: { color: T.white, textAlign: "center", fontWeight: "800" },
  blockedText: { marginTop: 15, color: T.t4, fontSize: 13 },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: 20,
  },
  modalBox: {
    backgroundColor: T.card,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: T.border,
  },
  modalTitle: { fontSize: 18, fontWeight: "800", color: T.t1, marginBottom: 10 },
  modalText: { marginBottom: 20, color: T.t2, fontSize: 15 },
  confirmButton: { borderRadius: 10, overflow: "hidden", marginBottom: 4 },
  confirmGradient: { padding: 14, alignItems: "center", borderRadius: 10 },
  confirmText: { color: T.white, textAlign: "center", fontWeight: "800", fontSize: 15 },
  cancelText: { marginTop: 15, textAlign: "center", color: T.red, fontWeight: "700" },
});
