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
  const [isProcessing, setIsProcessing] = useState(false); // Trava visual para o botão

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
    if (!trainerId || !selectedPlan || !subscription) {
      Alert.alert("Erro", "Dados do treinador ou plano não carregados.");
      return;
    }

    if (!selectedPlan.stripe_price_id) {
      Alert.alert("Aviso", "Este plano ainda não tem um ID do Stripe configurado no banco de dados.");
      return;
    }

    try {
      setIsProcessing(true); // Impede duplo clique
      setModalVisible(false); // Fecha o modal imediatamente
      
      const { data: { session } } = await supabase.auth.getSession();
      
      console.log("Iniciando chamada para a Edge Function...");
      
      const { data: checkoutData, error: backendError } = await supabase.functions.invoke('stripe-checkout', {
        body: { 
          priceId: selectedPlan.stripe_price_id,
          email: session?.user?.email,
          name: session?.user?.user_metadata?.name || 'Treinador Vortex'
        }
      });

      if (backendError) {
        console.error("Erro no invoke:", backendError);
        throw new Error("Falha na comunicação com o servidor de pagamentos.");
      }

      if (checkoutData?.error) {
        console.error("Erro retornado pela Edge Function:", checkoutData.error);
        throw new Error(checkoutData.error);
      }

      console.log("Dados recebidos da Edge Function com sucesso!");

      const { paymentIntent, ephemeralKey, customer } = checkoutData;

      if (!paymentIntent || !ephemeralKey || !customer) {
        throw new Error("Dados de pagamento incompletos retornados pelo servidor.");
      }

      console.log("Inicializando o Payment Sheet do Stripe...");

      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'Vortex Primus',
        customerId: customer,
        customerEphemeralKeySecret: ephemeralKey,
        paymentIntentClientSecret: paymentIntent,
        allowsDelayedPaymentMethods: true,
      });

      if (initError) {
        console.error("Erro no initPaymentSheet:", initError);
        throw new Error(`Erro ao preparar pagamento: ${initError.message}`);
      }

      console.log("Abrindo a tela nativa do Stripe...");

      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        if (presentError.code === 'Canceled') {
          console.log("Usuário fechou a tela de pagamento.");
          // Não tratamos como erro crítico se ele apenas desistiu
          return; 
        } else {
           console.error("Erro no presentPaymentSheet:", presentError);
          throw new Error(presentError.message);
        }
      }

      // Se passou pelo presentPaymentSheet sem erro, o pagamento foi um sucesso!
      console.log("Pagamento confirmado no Stripe!");
      Alert.alert("Sucesso! 🎉", `Seu plano foi alterado para ${selectedPlan.name}.`);

      // Desativar assinatura atual
      const { error: deactivateError } = await supabase
        .from("trainer_subscriptions")
        .update({ is_active: false })
        .eq("id", subscription.id);
        
      if (deactivateError) console.error("Erro ao desativar plano antigo", deactivateError);

      // Criar nova assinatura
      const { error: createError } = await supabase.from("trainer_subscriptions").insert({
        trainer_id: trainerId,
        plan_id: selectedPlan.id,
        is_active: true,
        start_date: new Date().toISOString(),
      });

      if (createError) {
        console.error("Erro ao criar nova assinatura:", createError);
        Alert.alert("Aviso", "O pagamento foi aprovado, mas houve um erro ao atualizar seu status no banco. Contate o suporte.");
        return;
      }

      // Volta para a home atualizada
      router.replace("/" as any);

    } catch (error: any) {
      console.error("Erro geral no fluxo de pagamento:", error);
      Alert.alert("Ops!", error.message || "Ocorreu um erro inesperado ao processar o pagamento.");
    } finally {
      setIsProcessing(false); // Libera o botão novamente
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
                style={[styles.upgradeButton, isProcessing && { opacity: 0.5 }]}
                onPress={() => handleUpgrade(plan)}
                disabled={isProcessing}
              >
                <Text style={styles.upgradeText}>
                   {isProcessing ? "Aguarde..." : "Fazer Upgrade"}
                </Text>
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
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.confirmText}>
                  Confirmar Upgrade
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              disabled={isProcessing}
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
    height: 45, // Fixa a altura para não pular quando o spinner aparece
    justifyContent: "center"
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

