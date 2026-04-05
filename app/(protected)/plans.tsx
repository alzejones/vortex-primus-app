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

interface Plan {
  id: string;
  name: string;
  price_monthly: number;
  max_clients: number | null;
  stripe_price_id: string;
}

export default function PlansScreen() {
  const { trainerId, plan: currentPlan, subscription, loadingTrainer } =
    useTrainer();
  
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
    setSelectedPlan(plan);
    setModalVisible(true);
  }

  async function confirmUpgrade() {
    if (!trainerId || !selectedPlan || !subscription) return;

    try {
      setModalVisible(false);
      
      if (!selectedPlan.stripe_price_id) {
        Alert.alert("Erro", "Este plano ainda não está configurado no Stripe.");
        return;
      }

      Alert.alert("Aguarde...", "Conectando ao ambiente seguro de pagamento.");

      const { data: { session } } = await supabase.auth.getSession();
      
      const { data: checkoutData, error: backendError } = await supabase.functions.invoke('stripe-checkout', {
        body: { 
          priceId: selectedPlan.stripe_price_id,
          email: session?.user?.email,
          name: session?.user?.user_metadata?.name || 'Treinador Vortex'
        }
      });

      if (backendError || checkoutData?.error) {
        throw new Error(checkoutData?.error || backendError?.message || "Falha ao contatar o servidor financeiro");
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
        if (presentError.code === 'Canceled') {
          Alert.alert("Cancelado", "O pagamento não foi concluído.");
        } else {
          throw new Error(presentError.message);
        }
        return;
      }

      Alert.alert("Pagamento Aprovado! 🎉", "Bem-vindo ao plano " + selectedPlan.name);

      // Desativar assinatura atual
      await supabase
        .from("trainer_subscriptions")
        .update({ is_active: false })
        .eq("id", subscription.id);

      // Criar nova assinatura
      const { error } = await supabase.from("trainer_subscriptions").insert({
        trainer_id: trainerId,
        plan_id: selectedPlan.id,
        is_active: true,
        start_date: new Date().toISOString(),
      });

      if (error) {
        console.error("Erro no upgrade:", error);
        return;
      }

      router.replace("/" as any);

    } catch (error: any) {
      console.error(error);
      Alert.alert("Erro no pagamento", error.message);
    }
  }

  if (loadingTrainer || loadingPlans) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Planos Disponíveis</Text>

      {plans.map((plan) => {
        const isCurrent = currentPlan?.id === plan.id;
        const isUpgrade =
          currentPlan &&
          plan.price_monthly > currentPlan.price_monthly;

        return (
          <View
            key={plan.id}
            style={[styles.card, isCurrent && styles.currentCard]}
          >
            <Text style={styles.planName}>{plan.name}</Text>

            <Text style={styles.price}>
              R$ {plan.price_monthly.toFixed(2)} / mês
            </Text>

            <Text style={styles.limit}>
              Limite:{" "}
              {plan.max_clients
                ? `${plan.max_clients} alunos`
                : "Ilimitado"}
            </Text>

            {isCurrent && (
              <View style={styles.currentBadge}>
                <Text style={styles.currentText}>Plano Atual</Text>
              </View>
            )}

            {!isCurrent && isUpgrade && (
              <TouchableOpacity
                style={styles.upgradeButton}
                onPress={() => handleUpgrade(plan)}
              >
                <Text style={styles.upgradeText}>Fazer Upgrade</Text>
              </TouchableOpacity>
            )}

            {!isCurrent && !isUpgrade && (
              <Text style={styles.blockedText}>
                Downgrade indisponível
              </Text>
            )}
          </View>
        );
      })}

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Confirmar Upgrade</Text>

            <Text style={styles.modalText}>
              De {currentPlan?.name} para {selectedPlan?.name}
            </Text>

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={confirmUpgrade}
            >
              <Text style={styles.confirmText}>
                Confirmar Upgrade
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },

  card: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: "#f2f2f2",
    marginBottom: 15,
  },

  currentCard: {
    borderWidth: 2,
    borderColor: "#4CAF50",
  },

  planName: {
    fontSize: 18,
    fontWeight: "bold",
  },

  price: {
    marginTop: 5,
  },

  limit: {
    marginTop: 5,
  },

  currentBadge: {
    marginTop: 15,
    backgroundColor: "#4CAF50",
    padding: 8,
    borderRadius: 8,
  },

  currentText: {
    color: "white",
    textAlign: "center",
  },

  upgradeButton: {
    marginTop: 15,
    backgroundColor: "#000",
    padding: 10,
    borderRadius: 8,
  },

  upgradeText: {
    color: "white",
    textAlign: "center",
    fontWeight: "bold",
  },

  blockedText: {
    marginTop: 15,
    color: "gray",
  },

  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 20,
  },

  modalBox: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },

  modalText: {
    marginBottom: 20,
  },

  confirmButton: {
    backgroundColor: "#000",
    padding: 12,
    borderRadius: 8,
  },

  confirmText: {
    color: "white",
    textAlign: "center",
    fontWeight: "bold",
  },

  cancelText: {
    marginTop: 15,
    textAlign: "center",
    color: "red",
  },
});

