import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import { T } from "../../utils/theme";
import { PricingData, KitItemData, DiscountLevel, trainerUnitCost } from "../../utils/kitCostCalculator";
import { todayBR } from "../../utils/dateBR";
import { notify } from "../../components/business/SaleFormModal";

interface EVSOrder {
  id: string;
  client_id: string;
  status: string;
  total_amount: number;
  created_at: string;
  client_name: string;
  items: EVSOrderItem[];
}

interface EVSOrderItem {
  id: string;
  kit_id: string | null;
  supplement_id?: string | null;
  kit_name: string;
  quantity: number;
  unit_price: number;
  flavors: EVSOrderItemFlavor[];
  addons: EVSOrderItemAddon[];
}

interface EVSOrderItemFlavor {
  kit_item_id: string;
  flavor_group: string | null;
  chosen_supplement_id: string;
  chosen_supplement_name: string;
}

interface EVSOrderItemAddon {
  supplement_id: string;
  supplement_name: string;
  quantity: number;
  unit_price: number;
}

type OrderStatus = "aguardando_pagamento" | "pago" | "em_preparo" | "pronto" | "entregue" | "cancelado";

const STATUS_LABELS: Record<OrderStatus, string> = {
  aguardando_pagamento: "Aguardando Pagamento",
  pago: "Pago",
  em_preparo: "Em Preparo",
  pronto: "Pronto",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

export default function EVSAtendente() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [trainerId, setTrainerId] = useState<string | null>(null);
  const [orders, setOrders] = useState<EVSOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<EVSOrder | null>(null);
  const [processingOrder, setProcessingOrder] = useState<string | null>(null);

  const [screenWidth, setScreenWidth] = useState(() => Dimensions.get('window').width || 375);
  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => setScreenWidth(window.width));
    return () => sub.remove();
  }, []);
  const isDesktop = screenWidth >= 768;

  async function loadTrainer() {
    if (!session?.user?.id) return;

    const { data, error } = await supabase
      .from("trainers")
      .select("id")
      .eq("user_id", session.user.id)
      .single();

    if (error) {
      notify("Erro ao carregar treinador", error.message);
      return;
    }

    setTrainerId(data.id);
  }

  async function loadOrders(currentTrainerId: string) {
    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from("evs_orders")
        .select("id, client_id, status, total_amount, created_at, clients(name)")
        .eq("trainer_id", currentTrainerId)
        .in("status", ["aguardando_pagamento", "em_preparo", "pronto"])
        .order("created_at", { ascending: true });

      if (ordersError) throw ordersError;

      const ordersWithDetails: EVSOrder[] = [];

      for (const order of ordersData || []) {
        const { data: itemsData, error: itemsError } = await supabase
          .from("evs_order_items")
          .select("id, kit_id, supplement_id, kit_name, quantity, unit_price")
          .eq("order_id", order.id);

        if (itemsError) throw itemsError;

        const items: EVSOrderItem[] = [];

        for (const item of itemsData || []) {
          const { data: flavorsData } = await supabase
            .from("evs_order_item_flavors")
            .select("kit_item_id, flavor_group, chosen_supplement_id, supplements(name)")
            .eq("order_item_id", item.id);

          const { data: addonsData } = await supabase
            .from("evs_order_item_addons")
            .select("supplement_id, quantity, unit_price, supplements(name)")
            .eq("order_item_id", item.id);

          items.push({
            ...item,
            flavors: (flavorsData || []).map((f: any) => ({
              kit_item_id: f.kit_item_id,
              flavor_group: f.flavor_group,
              chosen_supplement_id: f.chosen_supplement_id,
              chosen_supplement_name: f.supplements?.name || "",
            })),
            addons: (addonsData || []).map((a: any) => ({
              supplement_id: a.supplement_id,
              supplement_name: a.supplements?.name || "",
              quantity: a.quantity,
              unit_price: a.unit_price,
            })),
          });
        }

        ordersWithDetails.push({
          ...order,
          client_name: (order as any).clients?.name || "Cliente",
          items,
        });
      }

      setOrders(ordersWithDetails);
      setLoading(false);
    } catch (err: any) {
      notify("Erro ao carregar pedidos", err.message || "Erro desconhecido.");
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTrainer();
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      if (trainerId) {
        loadOrders(trainerId);
      }
    }, [trainerId])
  );

  useEffect(() => {
    if (!trainerId) return;

    const channel = supabase
      .channel("evs_orders_realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "evs_orders",
          filter: `trainer_id=eq.${trainerId}`,
        },
        () => {
          loadOrders(trainerId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [trainerId]);

  async function handleConfirmPayment(order: EVSOrder) {
    if (!trainerId) return;

    try {
      setProcessingOrder(order.id);

      const kitIds = order.items.filter((i) => i.kit_id).map((i) => i.kit_id!);
      const { data: kitsData, error: kitsError } = await supabase
        .from('herbalife_kits')
        .select('id, is_redemption_only, redemption_credits_granted')
        .in('id', kitIds);

      if (kitsError) throw kitsError;

      for (const item of order.items) {
        if (!item.kit_id) continue;
        const kit = (kitsData || []).find((k: any) => k.id === item.kit_id);
        if (!kit) continue;

        if (kit.redemption_credits_granted && kit.redemption_credits_granted > 0) {
          const { error: creditErr } = await supabase.rpc('adjust_redemption_balance', {
            p_client_id: order.client_id,
            p_delta: kit.redemption_credits_granted * item.quantity,
            p_reason: 'cartela_compra',
            p_sale_id: null,
          });
          if (creditErr) {
            setProcessingOrder(null);
            notify('Erro', creditErr.message || 'Erro ao creditar fichas de resgate');
            return;
          }
        }

        if (kit.is_redemption_only === true) {
          const { error: debitErr } = await supabase.rpc('adjust_redemption_balance', {
            p_client_id: order.client_id,
            p_delta: -1 * item.quantity,
            p_reason: 'resgate_kit_acesso',
            p_sale_id: null,
          });
          if (debitErr) {
            setProcessingOrder(null);
            notify('Erro', debitErr.message || 'Erro ao debitar fichas de resgate');
            return;
          }
        }
      }

      const { data: trainerData, error: trainerError } = await supabase
        .from("trainers")
        .select("herbalife_discount_level")
        .eq("id", trainerId)
        .single();

      if (trainerError) throw trainerError;

      const trainerDiscountLevel = (trainerData?.herbalife_discount_level || "50") as DiscountLevel;

      const { data: pricingData, error: pricingError } = await supabase
        .from("herbalife_pricing")
        .select("supplement_id, price_venda, price_50, price_42, price_35, price_25, pv, doses_per_package");

      if (pricingError) throw pricingError;

      const pricing: PricingData[] = pricingData || [];

      const { data: kitItemsData, error: kitItemsError } = await supabase
        .from("herbalife_kit_items")
        .select("kit_id, supplement_id, doses_used, is_flavor_choice");

      if (kitItemsError) throw kitItemsError;

      const kitItems: KitItemData[] = (kitItemsData || []).map((ki: any) => ({
        kit_id: ki.kit_id,
        supplement_id: ki.supplement_id,
        doses_used: Number(ki.doses_used),
        is_flavor_choice: ki.is_flavor_choice,
      }));

      let totalCost = 0;
      let totalPV = 0;
      const saleItems: any[] = [];

      for (const item of order.items) {
        if (item.kit_id) {
          for (const flavor of item.flavors) {
            const flavorPricing = pricing.find((p) => p.supplement_id === flavor.chosen_supplement_id);
            if (!flavorPricing) continue;

            const kitItem = kitItems.find(
              (ki) => ki.kit_id === item.kit_id && ki.is_flavor_choice
            );
            if (!kitItem) continue;

            const dosesUsed = kitItem.doses_used;
            const doses = flavorPricing.doses_per_package || 1;
            const unitCost = (trainerUnitCost(flavorPricing, trainerDiscountLevel) / doses) * dosesUsed;
            const unitPV = (flavorPricing.pv / doses) * dosesUsed;

            totalCost += unitCost * item.quantity;
            totalPV += unitPV * item.quantity;

            saleItems.push({
              kit_id: item.kit_id,
              supplement_id: flavor.chosen_supplement_id,
              quantity: item.quantity,
              unit_charged: item.unit_price,
              unit_cost: unitCost,
              pv: unitPV,
              kit_name: item.kit_name,
            });
          }

          for (const addon of item.addons) {
            const addonPricing = pricing.find((p) => p.supplement_id === addon.supplement_id);
            if (!addonPricing) continue;

            const doses = addonPricing.doses_per_package || 1;
            const unitCost = trainerUnitCost(addonPricing, trainerDiscountLevel) / doses;
            const unitPV = addonPricing.pv / doses;
            totalCost += unitCost * addon.quantity;
            totalPV += unitPV * addon.quantity;

            saleItems.push({
              kit_id: null,
              supplement_id: addon.supplement_id,
              quantity: addon.quantity,
              unit_charged: addon.unit_price,
              unit_cost: unitCost,
              pv: unitPV,
              kit_name: null,
            });
          }
        } else if (item.supplement_id) {
          const standalonePricing = pricing.find((p) => p.supplement_id === item.supplement_id);
          if (!standalonePricing) continue;

          const unitCost = trainerUnitCost(standalonePricing, trainerDiscountLevel);
          const unitPV = standalonePricing.pv;

          totalCost += unitCost * item.quantity;
          totalPV += unitPV * item.quantity;

          saleItems.push({
            kit_id: null,
            supplement_id: item.supplement_id,
            quantity: item.quantity,
            unit_charged: item.unit_price,
            unit_cost: unitCost,
            pv: unitPV,
            kit_name: item.kit_name,
          });
        }
      }

      const { data: saleData, error: saleError } = await supabase
        .from("herbalife_sales")
        .insert({
          trainer_id: trainerId,
          client_id: order.client_id,
          sale_date: todayBR(),
          sale_type: "acesso",
          origin: "evs_autoatendimento",
          total_charged: order.total_amount,
          total_cost: totalCost,
          total_pv: totalPV,
        })
        .select("id")
        .single();

      if (saleError) throw saleError;

      const saleId = saleData.id;

      for (const saleItem of saleItems) {
        await supabase.from("herbalife_sale_items").insert({
          sale_id: saleId,
          ...saleItem,
        });
      }

      const { error: updateError } = await supabase
        .from("evs_orders")
        .update({
          status: "pago",
          paid_at: new Date().toISOString(),
          sale_id: saleId,
        })
        .eq("id", order.id);

      if (updateError) throw updateError;

      const { error: statusError } = await supabase
        .from("evs_orders")
        .update({ status: "em_preparo" })
        .eq("id", order.id);

      if (statusError) throw statusError;

      setProcessingOrder(null);
      loadOrders(trainerId);
      notify("Sucesso", "Pagamento confirmado e venda registrada.");
    } catch (err: any) {
      setProcessingOrder(null);
      notify("Erro ao confirmar pagamento", err.message || "Erro desconhecido.");
    }
  }

  async function handleMarkAsReady(orderId: string) {
    try {
      const { error } = await supabase
        .from("evs_orders")
        .update({ status: "pronto" })
        .eq("id", orderId);

      if (error) throw error;

      if (trainerId) loadOrders(trainerId);
    } catch (err: any) {
      notify("Erro ao marcar como pronto", err.message || "Erro desconhecido.");
    }
  }

  async function handleDeliver(orderId: string) {
    try {
      const { error } = await supabase
        .from("evs_orders")
        .update({ status: "entregue" })
        .eq("id", orderId);

      if (error) throw error;

      if (trainerId) loadOrders(trainerId);
      notify("Sucesso", "Pedido marcado como entregue.");
    } catch (err: any) {
      notify("Erro ao entregar pedido", err.message || "Erro desconhecido.");
    }
  }

  async function handleCancelOrder(orderId: string) {
    const confirmed = confirm("Tem certeza que deseja cancelar este pedido?");
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from("evs_orders")
        .update({ status: "cancelado" })
        .eq("id", orderId);

      if (error) throw error;

      if (trainerId) loadOrders(trainerId);
    } catch (err: any) {
      notify("Erro ao cancelar pedido", err.message || "Erro desconhecido.");
    }
  }

  const renderOrderCard = (order: EVSOrder) => {
    const isProcessing = processingOrder === order.id;

    return (
      <TouchableOpacity
        key={order.id}
        style={styles.orderCard}
        onPress={() => setSelectedOrder(order)}
        activeOpacity={0.8}
      >
        <Text style={styles.orderClient}>{order.client_name}</Text>
        <Text style={styles.orderTotal}>R$ {order.total_amount.toFixed(2).replace(".", ",")}</Text>
        <View style={styles.orderItems}>
          {order.items.map((item) => (
            <View key={item.id} style={styles.orderItemRow}>
              <Text style={styles.orderItemName}>
                {item.kit_name} x{item.quantity}
              </Text>
              {item.flavors.map((flavor) => (
                <Text key={flavor.kit_item_id} style={styles.orderFlavor}>
                  • {flavor.chosen_supplement_name}
                </Text>
              ))}
              {item.addons.map((addon) => (
                <Text key={addon.supplement_id} style={styles.orderAddon}>
                  + {addon.supplement_name} x{addon.quantity}
                </Text>
              ))}
            </View>
          ))}
        </View>

        {order.status === "aguardando_pagamento" && (
          <TouchableOpacity
            style={[styles.actionButton, styles.confirmButton]}
            onPress={() => handleConfirmPayment(order)}
            disabled={isProcessing}
            activeOpacity={0.8}
          >
            {isProcessing ? (
              <ActivityIndicator color={T.white} size="small" />
            ) : (
              <Text style={styles.actionButtonText}>Confirmar Pagamento</Text>
            )}
          </TouchableOpacity>
        )}

        {order.status === "em_preparo" && (
          <TouchableOpacity
            style={[styles.actionButton, styles.readyButton]}
            onPress={() => handleMarkAsReady(order.id)}
            activeOpacity={0.8}
          >
            <Text style={styles.actionButtonText}>Marcar como Pronto</Text>
          </TouchableOpacity>
        )}

        {order.status === "pronto" && (
          <TouchableOpacity
            style={[styles.actionButton, styles.deliverButton]}
            onPress={() => handleDeliver(order.id)}
            activeOpacity={0.8}
          >
            <Text style={styles.actionButtonText}>Entregar</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.actionButton, styles.cancelButton]}
          onPress={() => handleCancelOrder(order.id)}
          activeOpacity={0.8}
        >
          <Text style={styles.cancelButtonText}>Cancelar Pedido</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const aguardandoPagamento = orders.filter((o) => o.status === "aguardando_pagamento");
  const emPreparo = orders.filter((o) => o.status === "em_preparo");
  const prontos = orders.filter((o) => o.status === "pronto");

  if (loading) {
    return (
      <View style={[styles.root, { alignItems: isDesktop ? 'center' : undefined }]}>
        <View style={{ flex: 1, width: '100%', maxWidth: isDesktop ? 1200 : undefined, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={T.blue} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { alignItems: isDesktop ? 'center' : undefined }]}>
      <View style={{ flex: 1, width: '100%', maxWidth: isDesktop ? 1200 : undefined }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.kanban}>
          <View style={styles.column}>
            <Text style={styles.columnTitle}>Aguardando Pagamento ({aguardandoPagamento.length})</Text>
            <FlatList
              data={aguardandoPagamento}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => renderOrderCard(item)}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.columnContent}
            />
          </View>

          <View style={styles.column}>
            <Text style={styles.columnTitle}>Em Preparo ({emPreparo.length})</Text>
            <FlatList
              data={emPreparo}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => renderOrderCard(item)}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.columnContent}
            />
          </View>

          <View style={styles.column}>
            <Text style={styles.columnTitle}>Pronto ({prontos.length})</Text>
            <FlatList
              data={prontos}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => renderOrderCard(item)}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.columnContent}
            />
          </View>
        </ScrollView>
      </View>

      {selectedOrder && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setSelectedOrder(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Detalhes do Pedido</Text>
              <Text style={styles.modalClient}>{selectedOrder.client_name}</Text>
              <Text style={styles.modalStatus}>Status: {STATUS_LABELS[selectedOrder.status as OrderStatus]}</Text>
              <Text style={styles.modalTotal}>Total: R$ {selectedOrder.total_amount.toFixed(2).replace(".", ",")}</Text>

              <View style={styles.modalItems}>
                {selectedOrder.items.map((item) => (
                  <View key={item.id} style={styles.modalItem}>
                    <Text style={styles.modalItemName}>
                      {item.kit_name} x{item.quantity}
                    </Text>
                    {item.flavors.map((flavor) => (
                      <Text key={flavor.kit_item_id} style={styles.modalFlavor}>
                        • {flavor.chosen_supplement_name}
                      </Text>
                    ))}
                    {item.addons.map((addon) => (
                      <Text key={addon.supplement_id} style={styles.modalAddon}>
                        + {addon.supplement_name} x{addon.quantity}
                      </Text>
                    ))}
                  </View>
                ))}
              </View>

              <TouchableOpacity style={styles.modalCloseButton} onPress={() => setSelectedOrder(null)} activeOpacity={0.8}>
                <Text style={styles.modalCloseText}>Fechar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: T.bg,
  },
  kanban: {
    padding: 16,
    gap: 16,
  },
  column: {
    width: 300,
    backgroundColor: T.surfaceAlt,
    borderRadius: 16,
    padding: 12,
  },
  columnTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: T.t1,
    marginBottom: 12,
  },
  columnContent: {
    paddingBottom: 12,
  },
  orderCard: {
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  orderClient: {
    fontSize: 15,
    fontWeight: "700",
    color: T.t1,
    marginBottom: 4,
  },
  orderTotal: {
    fontSize: 14,
    fontWeight: "600",
    color: T.t2,
    marginBottom: 8,
  },
  orderItems: {
    marginBottom: 10,
  },
  orderItemRow: {
    marginBottom: 6,
  },
  orderItemName: {
    fontSize: 14,
    fontWeight: "600",
    color: T.t1,
  },
  orderFlavor: {
    fontSize: 12,
    color: T.t3,
    marginLeft: 8,
  },
  orderAddon: {
    fontSize: 12,
    color: T.purple,
    marginLeft: 8,
  },
  actionButton: {
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 6,
  },
  confirmButton: {
    backgroundColor: T.blue,
  },
  readyButton: {
    backgroundColor: T.green,
  },
  deliverButton: {
    backgroundColor: T.purple,
  },
  cancelButton: {
    backgroundColor: T.surfaceAlt,
    borderWidth: 1,
    borderColor: T.border,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: T.white,
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: T.red,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: T.card,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: T.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: T.t1,
    marginBottom: 12,
  },
  modalClient: {
    fontSize: 16,
    fontWeight: "700",
    color: T.t1,
    marginBottom: 6,
  },
  modalStatus: {
    fontSize: 14,
    color: T.t2,
    marginBottom: 6,
  },
  modalTotal: {
    fontSize: 16,
    fontWeight: "700",
    color: T.blue,
    marginBottom: 16,
  },
  modalItems: {
    marginBottom: 16,
  },
  modalItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  modalItemName: {
    fontSize: 14,
    fontWeight: "600",
    color: T.t1,
    marginBottom: 4,
  },
  modalFlavor: {
    fontSize: 13,
    color: T.t3,
    marginLeft: 8,
  },
  modalAddon: {
    fontSize: 13,
    color: T.purple,
    marginLeft: 8,
  },
  modalCloseButton: {
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: T.surfaceAlt,
    borderWidth: 1,
    borderColor: T.border,
    alignItems: "center",
  },
  modalCloseText: {
    fontSize: 14,
    fontWeight: "700",
    color: T.t2,
  },
});
