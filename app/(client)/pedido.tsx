import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
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

export default function PedidoEVS() {
  const { session, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);
  const [trainerId, setTrainerId] = useState<string | null>(null);
  const [kits, setKits] = useState<KitWithItems[]>([]);
  const [selectedKitId, setSelectedKitId] = useState<string | null>(null);
  const [flavorSelections, setFlavorSelections] = useState<FlavorSelections>({});
  const [flavorOptions, setFlavorOptions] = useState<{ [flavorGroup: string]: FlavorOption[] }>({});
  const [addons, setAddons] = useState<{ id: string; name: string }[]>([]);
  const [addonSelection, setAddonSelection] = useState<AddonSelection | null>(null);
  const [addonFlavorOptions, setAddonFlavorOptions] = useState<FlavorOption[]>([]);

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
        .select("id, trainer_id")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (clientError || !clientData) {
        Alert.alert("Erro", "Cliente não encontrado.");
        setLoading(false);
        return;
      }

      setClientId(clientData.id);
      setTrainerId(clientData.trainer_id);

      const { data: kitsData, error: kitsError } = await supabase
        .from("herbalife_kits")
        .select("id, name, default_price, is_access_kit, is_recipe")
        .eq("trainer_id", clientData.trainer_id)
        .eq("active", true)
        .or("is_access_kit.eq.true,is_recipe.eq.true");

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

      const { data: addonsData, error: addonsError } = await supabase
        .from("supplements")
        .select("id, name")
        .eq("flavor_group", "fiber_concentrate_450ml");

      if (!addonsError && addonsData) {
        setAddons(addonsData);
      }

      setLoading(false);
    } catch (err: any) {
      Alert.alert("Erro ao carregar dados", err.message || "Erro desconhecido.");
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

  const handleAddAddon = async () => {
    if (!addons.length) {
      Alert.alert("Sem adicionais disponíveis", "Nenhum adicional cadastrado.");
      return;
    }

    const firstAddon = addons[0];
    const { data, error } = await supabase
      .from("supplements")
      .select("id, name")
      .eq("flavor_group", "fiber_concentrate_450ml");

    if (!error && data) {
      setAddonFlavorOptions(data);
      setAddonSelection({
        supplement_id: firstAddon.id,
        name: firstAddon.name,
        flavor_id: data[0]?.id || "",
        flavor_name: data[0]?.name || "",
        unit_price: 0,
      });
    }
  };

  const handleConfirmOrder = async () => {
    if (!selectedKitId || !clientId || !trainerId) {
      Alert.alert("Erro", "Selecione um kit antes de confirmar o pedido.");
      return;
    }

    const selectedKit = kits.find((k) => k.id === selectedKitId);
    if (!selectedKit) return;

    try {
      setSubmitting(true);

      const totalAmount = selectedKit.default_price + (addonSelection ? addonSelection.unit_price : 0);

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

      const { error: orderItemError } = await supabase.from("evs_order_items").insert({
        order_id: orderId,
        kit_id: selectedKitId,
        kit_name: selectedKit.name,
        quantity: 1,
        unit_price: selectedKit.default_price,
      }).select("id").single();

      if (orderItemError) throw orderItemError;

      const { data: orderItemData } = await supabase
        .from("evs_order_items")
        .select("id")
        .eq("order_id", orderId)
        .eq("kit_id", selectedKitId)
        .single();

      if (orderItemData) {
        const orderItemId = orderItemData.id;

        for (const [kitItemId, chosenSupplementId] of Object.entries(flavorSelections)) {
          const kitItem = selectedKit.items.find((i) => i.id === kitItemId);
          if (!kitItem) continue;

          await supabase.from("evs_order_item_flavors").insert({
            order_item_id: orderItemId,
            kit_item_id: kitItemId,
            flavor_group: kitItem.flavor_group,
            chosen_supplement_id: chosenSupplementId,
          });
        }

        if (addonSelection) {
          await supabase.from("evs_order_item_addons").insert({
            order_item_id: orderItemId,
            supplement_id: addonSelection.supplement_id,
            quantity: 1,
            unit_price: addonSelection.unit_price,
          });
        }
      }

      setSubmitting(false);
      Alert.alert("Pedido enviado!", "Aguarde a confirmação do pagamento no balcão.");
      setSelectedKitId(null);
      setFlavorSelections({});
      setAddonSelection(null);
    } catch (err: any) {
      setSubmitting(false);
      Alert.alert("Erro ao enviar pedido", err.message || "Erro desconhecido.");
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

  return (
    <View style={[styles.root, { alignItems: isDesktop ? 'center' : undefined }]}>
      <View style={{ flex: 1, width: '100%', maxWidth: isDesktop ? 900 : undefined }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={true}>
          <Text style={styles.pageTitle}>Fazer Pedido</Text>
          <Text style={styles.pageSubtitle}>Escolha seu kit e personalize os sabores.</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Selecione um Kit</Text>
            {kits.map((kit) => (
              <TouchableOpacity
                key={kit.id}
                style={[styles.kitCard, selectedKitId === kit.id && styles.kitCardSelected]}
                onPress={() => handleKitSelect(kit)}
                activeOpacity={0.8}
              >
                <Text style={styles.kitName}>{kit.name}</Text>
                <Text style={styles.kitPrice}>R$ {kit.default_price.toFixed(2).replace(".", ",")}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {selectedKit && selectedKit.items.filter((i) => i.is_flavor_choice).length > 0 && (
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
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Adicionais (Opcional)</Text>
              {addonSelection ? (
                <View style={styles.addonCard}>
                  <Text style={styles.addonName}>{addonSelection.name}</Text>
                  <View style={styles.flavorChips}>
                    {addonFlavorOptions.map((option) => (
                      <TouchableOpacity
                        key={option.id}
                        style={[
                          styles.flavorChip,
                          addonSelection.flavor_id === option.id && styles.flavorChipActive,
                        ]}
                        onPress={() =>
                          setAddonSelection({
                            ...addonSelection,
                            flavor_id: option.id,
                            flavor_name: option.name,
                          })
                        }
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.flavorChipText,
                            addonSelection.flavor_id === option.id && styles.flavorChipTextActive,
                          ]}
                        >
                          {option.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TouchableOpacity onPress={() => setAddonSelection(null)}>
                    <Text style={styles.removeAddon}>Remover</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.addAddonButton} onPress={handleAddAddon} activeOpacity={0.8}>
                  <Text style={styles.addAddonText}>+ Adicionar Fibra Concentrada</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {selectedKit && (
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
});
