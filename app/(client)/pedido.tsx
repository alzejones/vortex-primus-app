import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { notify } from "../../components/business/SaleFormModal";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import { GradientPrimary } from "../../utils/gradients";
import { T } from "../../utils/theme";

interface Kit {
  id: string;
  name: string;
  default_price: number;
  is_access_kit: boolean;
  is_recipe: boolean;
  is_redemption_only: boolean;
  redemption_credits_granted: number;
}

interface KitItem {
  id: string;
  supplement_id: string;
  is_flavor_choice: boolean;
  supplement_name: string;
  flavor_group: string | null;
}

interface FlavorOption {
  id: string;
  name: string;
}

interface KitWithItems extends Kit {
  items: KitItem[];
}

interface FlavorSelections {
  [kitItemId: string]: string;
}

interface AddonSelection {
  supplement_id: string;
  name: string;
  flavor_id: string;
  flavor_name: string;
  unit_price: number;
}

interface CartItem {
  type: 'kit' | 'standalone';
  kit_id?: string;
  kit_name?: string;
  kit_price?: number;
  supplement_id?: string;
  supplement_name?: string;
  supplement_price?: number;
  flavor_selections?: FlavorSelections;
  flavor_group?: string | null;
  chosen_flavor_id?: string;
  chosen_flavor_name?: string;
}

interface StandaloneProduct {
  supplement_id: string;
  name: string;
  price_venda: number;
  flavor_group: string | null;
}

export default function PedidoEVS() {
  const { session, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);
  const [trainerId, setTrainerId] = useState<string | null>(null);
  const [redemptionBalance, setRedemptionBalance] = useState(0);
  const [kits, setKits] = useState<KitWithItems[]>([]);
  const [selectedKitId, setSelectedKitId] = useState<string | null>(null);
  const [flavorSelections, setFlavorSelections] = useState<FlavorSelections>({});
  const [flavorOptions, setFlavorOptions] = useState<{ [flavorGroup: string]: FlavorOption[] }>({});
  const [standaloneProducts, setStandaloneProducts] = useState<StandaloneProduct[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [expandedFlavorGroup, setExpandedFlavorGroup] = useState<string | null>(null);

  const [screenWidth, setScreenWidth] = useState(() => Dimensions.get('window').width || 375);
  const isDesktop = screenWidth >= 768;

  async function loadData() {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .select("id, trainer_id, redemption_balance")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (clientError || !clientData) {
        notify("Erro", "Cliente não encontrado.");
        setLoading(false);
        return;
      }

      setClientId(clientData.id);
      setTrainerId(clientData.trainer_id);
      setRedemptionBalance(clientData.redemption_balance || 0);

      const { data: kitsData, error: kitsError } = await supabase
        .from("herbalife_kits")
        .select("id, name, default_price, is_access_kit, is_recipe, is_redemption_only, redemption_credits_granted")
        .eq("active", true)
        .or(`trainer_id.is.null,trainer_id.eq.${clientData.trainer_id}`);

      if (kitsError) throw kitsError;

      const kitsWithItems: KitWithItems[] = [];

      for (const kit of kitsData || []) {
        const { data: itemsData, error: itemsError } = await supabase
          .from("herbalife_kit_items")
          .select("id, supplement_id, is_flavor_choice, supplements(name, flavor_group)")
          .eq("kit_id", kit.id);

        if (itemsError) throw itemsError;

        const items: KitItem[] = (itemsData || []).map((item: any) => ({
          id: item.id,
          supplement_id: item.supplement_id,
          is_flavor_choice: item.is_flavor_choice,
          supplement_name: item.supplements?.name || "",
          flavor_group: item.supplements?.flavor_group || null,
        }));

        kitsWithItems.push({ ...kit, items });
      }

      setKits(kitsWithItems);

      const { data: standaloneData, error: standaloneError } = await supabase
        .from("herbalife_pricing")
        .select("supplement_id, supplements!inner(name, flavor_group), price_venda")
        .not("supplements.flavor_group", "is", null);

      if (!standaloneError && standaloneData) {
        const products: StandaloneProduct[] = standaloneData.map((item: any) => ({
          supplement_id: item.supplement_id,
          name: item.supplements?.name || "",
          price_venda: item.price_venda,
          flavor_group: item.supplements?.flavor_group || null,
        }));
        setStandaloneProducts(products);
      }

      setLoading(false);
    } catch (err: any) {
      notify("Erro ao carregar dados", err.message || "Erro desconhecido.");
      setLoading(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [session])
  );

  async function loadFlavorOptionsForGroup(flavorGroup: string) {
    const { data, error } = await supabase
      .from("supplements")
      .select("id, name")
      .eq("flavor_group", flavorGroup);

    if (!error && data) {
      setFlavorOptions((prev) => ({ ...prev, [flavorGroup]: data }));
    }
  }

  const handleKitSelect = async (kit: KitWithItems) => {
    setSelectedKitId(kit.id);
    const newSelections: FlavorSelections = {};

    for (const item of kit.items) {
      if (item.is_flavor_choice && item.flavor_group) {
        newSelections[item.id] = item.supplement_id;
        if (!flavorOptions[item.flavor_group]) {
          await loadFlavorOptionsForGroup(item.flavor_group);
        }
      }
    }

    setFlavorSelections(newSelections);
  };

  const handleAddKitToCart = () => {
    if (!selectedKitId) return;
    const kit = kits.find((k) => k.id === selectedKitId);
    if (!kit) return;

    const cartItem: CartItem = {
      type: 'kit',
      kit_id: kit.id,
      kit_name: kit.name,
      kit_price: kit.default_price,
      flavor_selections: { ...flavorSelections },
    };

    setCart((prev) => [...prev, cartItem]);
    setSelectedKitId(null);
    setFlavorSelections({});
  };

  const handleAddStandaloneToCart = (product: StandaloneProduct, flavorId: string, flavorName: string) => {
    const cartItem: CartItem = {
      type: 'standalone',
      supplement_id: product.supplement_id,
      supplement_name: product.name,
      supplement_price: product.price_venda,
      flavor_group: product.flavor_group,
      chosen_flavor_id: flavorId,
      chosen_flavor_name: flavorName,
    };

    setCart((prev) => [...prev, cartItem]);
    setExpandedFlavorGroup(null);
  };

  const handleRemoveFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };


  const handleConfirmOrder = async () => {
    if (cart.length === 0 || !clientId || !trainerId) {
      notify("Erro", "Adicione itens ao carrinho antes de confirmar o pedido.");
      return;
    }

    try {
      setSubmitting(true);

      const totalAmount = cart.reduce((sum, item) => {
        if (item.type === 'kit') return sum + (item.kit_price || 0);
        return sum + (item.supplement_price || 0);
      }, 0);

      const { data: orderData, error: orderError } = await supabase
        .from("evs_orders")
        .insert({
          trainer_id: trainerId,
          client_id: clientId,
          status: "aguardando_pagamento",
          total_amount: totalAmount,
        })
        .select("id")
        .single();

      if (orderError) throw orderError;

      const orderId = orderData.id;

      for (const cartItem of cart) {
        if (cartItem.type === 'kit' && cartItem.kit_id) {
          const { data: orderItemData, error: orderItemError } = await supabase
            .from("evs_order_items")
            .insert({
              order_id: orderId,
              kit_id: cartItem.kit_id,
              kit_name: cartItem.kit_name,
              quantity: 1,
              unit_price: cartItem.kit_price,
            })
            .select("id")
            .single();

          if (orderItemError) throw orderItemError;

          const orderItemId = orderItemData.id;
          const kit = kits.find((k) => k.id === cartItem.kit_id);
          if (!kit) continue;

          for (const [kitItemId, chosenSupplementId] of Object.entries(cartItem.flavor_selections || {})) {
            const kitItem = kit.items.find((i) => i.id === kitItemId);
            if (!kitItem) continue;

            await supabase.from("evs_order_item_flavors").insert({
              order_item_id: orderItemId,
              kit_item_id: kitItemId,
              flavor_group: kitItem.flavor_group,
              chosen_supplement_id: chosenSupplementId,
            });
          }
        } else if (cartItem.type === 'standalone' && cartItem.supplement_id) {
          const { error: orderItemError } = await supabase
            .from("evs_order_items")
            .insert({
              order_id: orderId,
              supplement_id: cartItem.supplement_id,
              kit_id: null,
              kit_name: cartItem.supplement_name,
              quantity: 1,
              unit_price: cartItem.supplement_price,
            });

          if (orderItemError) throw orderItemError;
        }
      }

      setSubmitting(false);
      notify("Pedido enviado!", "Aguarde a confirmação do pagamento no balcão.");
      setCart([]);
      setSelectedKitId(null);
      setFlavorSelections({});
    } catch (err: any) {
      setSubmitting(false);
      notify("Erro ao enviar pedido", err.message || "Erro desconhecido.");
    }
  };

  if (loading) {
    return (
      <View style={[styles.root, { alignItems: isDesktop ? 'center' : undefined }]}>
        <View style={{ flex: 1, width: '100%', maxWidth: isDesktop ? 900 : undefined, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={T.blue} />
        </View>
      </View>
    );
  }

  const selectedKit = kits.find((k) => k.id === selectedKitId);

  const totalCartAmount = cart.reduce((sum, item) => {
    if (item.type === 'kit') return sum + (item.kit_price || 0);
    return sum + (item.supplement_price || 0);
  }, 0);

  const groupedStandalone = standaloneProducts.reduce((acc, product) => {
    const group = product.flavor_group || 'outros';
    if (!acc[group]) acc[group] = [];
    acc[group].push(product);
    return acc;
  }, {} as Record<string, StandaloneProduct[]>);

  return (
    <View style={[styles.root, { alignItems: isDesktop ? 'center' : undefined }]}>
      <View style={{ flex: 1, width: '100%', maxWidth: isDesktop ? 900 : undefined }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={true}>
          <Text style={styles.pageTitle}>Fazer Pedido</Text>
          <Text style={styles.pageSubtitle}>Escolha seus produtos e confirme no final.</Text>

          {cart.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🛒 Carrinho ({cart.length} {cart.length === 1 ? 'item' : 'itens'})</Text>
              {cart.map((item, idx) => (
                <View key={idx} style={styles.cartItemCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cartItemName}>
                      {item.type === 'kit' ? item.kit_name : item.supplement_name}
                      {item.type === 'standalone' && item.chosen_flavor_name ? ` (${item.chosen_flavor_name})` : ''}
                    </Text>
                    <Text style={styles.cartItemPrice}>
                      R$ {((item.type === 'kit' ? item.kit_price : item.supplement_price) || 0).toFixed(2).replace(".", ",")}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => handleRemoveFromCart(idx)} activeOpacity={0.7}>
                    <Text style={styles.removeCartItem}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
              <View style={styles.cartTotal}>
                <Text style={styles.cartTotalLabel}>Total:</Text>
                <Text style={styles.cartTotalValue}>R$ {totalCartAmount.toFixed(2).replace(".", ",")}</Text>
              </View>
            </View>
          )}

          {redemptionBalance > 0 && (
            <View style={{ backgroundColor: T.surfaceAlt, borderRadius: 12, padding: 14, marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: T.blue }}>
                Você tem {redemptionBalance} {redemptionBalance === 1 ? 'ficha' : 'fichas'} de resgate {redemptionBalance === 1 ? 'disponível' : 'disponíveis'}
              </Text>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Kits</Text>
            {selectedKitId === null ? (
              kits.filter((kit) => kit.is_redemption_only !== true || redemptionBalance > 0).map((kit) => (
                <TouchableOpacity
                  key={kit.id}
                  style={styles.kitCard}
                  onPress={() => handleKitSelect(kit)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.kitName}>{kit.name}</Text>
                  <Text style={styles.kitPrice}>R$ {kit.default_price.toFixed(2).replace(".", ",")}</Text>
                </TouchableOpacity>
              ))
            ) : (
              selectedKit && (
                <TouchableOpacity
                  style={[styles.kitCard, styles.kitCardSelected]}
                  onPress={() => handleKitSelect(selectedKit)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.kitName}>{selectedKit.name}</Text>
                  <Text style={styles.kitPrice}>R$ {selectedKit.default_price.toFixed(2).replace(".", ",")}</Text>
                </TouchableOpacity>
              )
            )}
          </View>

          {selectedKit && selectedKit.redemption_credits_granted === 0 && selectedKit.items.filter((i) => i.is_flavor_choice).length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Escolha os Sabores</Text>
              {selectedKit.items
                .filter((i) => i.is_flavor_choice)
                .map((item) => (
                  <View key={item.id} style={styles.flavorGroup}>
                    <Text style={styles.flavorLabel}>{item.supplement_name}</Text>
                    <View style={styles.flavorChips}>
                      {(flavorOptions[item.flavor_group || ""] || []).map((option) => (
                        <TouchableOpacity
                          key={option.id}
                          style={[
                            styles.flavorChip,
                            flavorSelections[item.id] === option.id && styles.flavorChipActive,
                          ]}
                          onPress={() =>
                            setFlavorSelections((prev) => ({ ...prev, [item.id]: option.id }))
                          }
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.flavorChipText,
                              flavorSelections[item.id] === option.id && styles.flavorChipTextActive,
                            ]}
                          >
                            {option.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ))}
            </View>
          )}

          {selectedKit && (
            <TouchableOpacity
              style={styles.addToCartButton}
              onPress={handleAddKitToCart}
              activeOpacity={0.85}
            >
              <Text style={styles.addToCartText}>Adicionar ao Carrinho</Text>
            </TouchableOpacity>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Produtos Avulsos</Text>
            {Object.entries(groupedStandalone).map(([group, products]) => {
              const isExpanded = expandedFlavorGroup === group;
              return (
                <View key={group} style={styles.standaloneGroup}>
                  <TouchableOpacity
                    style={styles.standaloneHeader}
                    onPress={() => setExpandedFlavorGroup(isExpanded ? null : group)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.standaloneGroupName}>{group.replace(/_/g, ' ').toUpperCase()}</Text>
                    <Text style={styles.standaloneToggle}>{isExpanded ? '▼' : '▶'}</Text>
                  </TouchableOpacity>
                  {isExpanded && (
                    <View style={styles.flavorChips}>
                      {products.map((product) => (
                        <TouchableOpacity
                          key={product.supplement_id}
                          style={styles.flavorChip}
                          onPress={() => handleAddStandaloneToCart(product, product.supplement_id, product.name)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.flavorChipText}>{product.name}</Text>
                          <Text style={[styles.flavorChipText, { fontSize: 11, marginTop: 2 }]}>
                            R$ {product.price_venda.toFixed(2).replace(".", ",")}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          {cart.length > 0 && (
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirmOrder}
              disabled={submitting}
              activeOpacity={0.85}
            >
              <LinearGradient {...GradientPrimary} style={styles.confirmGradient}>
                {submitting ? (
                  <ActivityIndicator color={T.white} />
                ) : (
                  <Text style={styles.confirmText}>Confirmar Pedido</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.logoutButton} onPress={signOut} activeOpacity={0.7}>
            <Text style={styles.logoutText}>Sair</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: T.bg,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 80,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: T.t1,
    marginBottom: 6,
  },
  pageSubtitle: {
    fontSize: 14,
    color: T.t3,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: T.t2,
    marginBottom: 12,
  },
  kitCard: {
    backgroundColor: T.card,
    borderWidth: 2,
    borderColor: T.border,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
  kitCardSelected: {
    borderColor: T.blue,
  },
  kitName: {
    fontSize: 16,
    fontWeight: "700",
    color: T.t1,
    marginBottom: 4,
  },
  kitPrice: {
    fontSize: 14,
    color: T.t2,
  },
  flavorGroup: {
    marginBottom: 16,
  },
  flavorLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: T.t2,
    marginBottom: 8,
  },
  flavorChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  flavorChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: T.surfaceAlt,
    borderWidth: 1,
    borderColor: T.border,
  },
  flavorChipActive: {
    backgroundColor: T.blue,
    borderColor: T.blue,
  },
  flavorChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: T.t2,
  },
  flavorChipTextActive: {
    color: T.white,
  },
  addonCard: {
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 14,
    padding: 16,
  },
  addonName: {
    fontSize: 15,
    fontWeight: "700",
    color: T.t1,
    marginBottom: 10,
  },
  removeAddon: {
    fontSize: 13,
    fontWeight: "700",
    color: T.red,
    marginTop: 10,
  },
  addAddonButton: {
    backgroundColor: T.surfaceAlt,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  addAddonText: {
    fontSize: 14,
    fontWeight: "700",
    color: T.t2,
  },
  confirmButton: {
    borderRadius: 14,
    overflow: "hidden",
    marginTop: 12,
  },
  confirmGradient: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmText: {
    color: T.white,
    fontWeight: "800",
    fontSize: 16,
  },
  logoutButton: {
    marginTop: 24,
    alignItems: "center",
    paddingVertical: 12,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: "700",
    color: T.t3,
  },
  cartItemCard: {
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cartItemName: {
    fontSize: 15,
    fontWeight: "700",
    color: T.t1,
    marginBottom: 4,
  },
  cartItemPrice: {
    fontSize: 13,
    color: T.t2,
  },
  removeCartItem: {
    fontSize: 20,
    fontWeight: "700",
    color: T.red,
    paddingHorizontal: 8,
  },
  cartTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: T.border,
  },
  cartTotalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: T.t1,
  },
  cartTotalValue: {
    fontSize: 18,
    fontWeight: "800",
    color: T.blue,
  },
  addToCartButton: {
    backgroundColor: T.blue,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 12,
  },
  addToCartText: {
    color: T.white,
    fontWeight: "700",
    fontSize: 15,
  },
  standaloneGroup: {
    marginBottom: 12,
  },
  standaloneHeader: {
    backgroundColor: T.surfaceAlt,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  standaloneGroupName: {
    fontSize: 14,
    fontWeight: "700",
    color: T.t1,
  },
  standaloneToggle: {
    fontSize: 14,
    color: T.t3,
  },
});
