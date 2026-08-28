export interface PricingData {
  supplement_id: string;
  price_venda: number;
  price_50: number;
  price_25: number;
  pv: number;
  doses_per_package: number | null;
}

export interface KitItemData {
  kit_id: string;
  supplement_id: string;
  doses_used: number;
  is_flavor_choice?: boolean;
}

export interface FlavorChoices {
  [flavorGroup: string]: string;
}

export type DiscountLevel = "venda" | "50" | "25";

/**
 * Calcula o preço unitário do trainer com base no nível de desconto
 */
export function trainerUnitCost(pricing: PricingData, level: DiscountLevel = "50"): number {
  const map: Record<DiscountLevel, number> = {
    "venda": pricing.price_venda,
    "50": pricing.price_50 || pricing.price_venda,
    "25": pricing.price_25 || pricing.price_venda,
  };
  return Number(map[level] ?? pricing.price_venda);
}

/**
 * Calcula o custo e PV de um kit
 * Se flavorChoices for fornecido, usa os sabores escolhidos para os itens com is_flavor_choice
 */
export function calculateKitCost(
  kitId: string,
  kitItems: KitItemData[],
  pricingData: PricingData[],
  trainerDiscountLevel: DiscountLevel = "50",
  flavorChoices?: FlavorChoices
): { cost: number; pv: number } {
  let cost = 0;
  let pv = 0;

  const relevantItems = kitItems.filter((i) => i.kit_id === kitId);

  for (const item of relevantItems) {
    let supplementIdToUse = item.supplement_id;

    if (item.is_flavor_choice && flavorChoices) {
      const originalPricing = pricingData.find((p) => p.supplement_id === item.supplement_id);
      if (originalPricing) {
        const flavorGroupKey = Object.keys(flavorChoices).find((key) => {
          const chosenSupplementId = flavorChoices[key];
          return chosenSupplementId !== item.supplement_id;
        });

        if (flavorGroupKey) {
          supplementIdToUse = flavorChoices[flavorGroupKey] || item.supplement_id;
        }
      }
    }

    const p = pricingData.find((pr) => pr.supplement_id === supplementIdToUse);
    if (!p) continue;

    const doses = p.doses_per_package || 1;
    cost += (trainerUnitCost(p, trainerDiscountLevel) / doses) * Number(item.doses_used);
    pv += (Number(p.pv) / doses) * Number(item.doses_used);
  }

  return { cost, pv };
}

/**
 * Calcula o custo e PV de um kit usando uma estrutura de sabores escolhidos mais direta
 * (para uso no contexto EVS onde temos mapeamento kitItemId -> chosenSupplementId)
 */
export function calculateKitCostWithChoices(
  kitId: string,
  kitItems: KitItemData[],
  pricingData: PricingData[],
  chosenSupplements: { [kitItemId: string]: string },
  trainerDiscountLevel: DiscountLevel = "50"
): { cost: number; pv: number } {
  let cost = 0;
  let pv = 0;

  const relevantItems = kitItems.filter((i) => i.kit_id === kitId);

  for (const item of relevantItems) {
    const itemId = `${item.kit_id}_${item.supplement_id}`;
    const supplementIdToUse = chosenSupplements[itemId] || item.supplement_id;

    const p = pricingData.find((pr) => pr.supplement_id === supplementIdToUse);
    if (!p) continue;

    const doses = p.doses_per_package || 1;
    cost += (trainerUnitCost(p, trainerDiscountLevel) / doses) * Number(item.doses_used);
    pv += (Number(p.pv) / doses) * Number(item.doses_used);
  }

  return { cost, pv };
}
