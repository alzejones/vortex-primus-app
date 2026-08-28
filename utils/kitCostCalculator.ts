export interface PricingData {
  supplement_id: string;
  price_venda: number;
  price_50: number;
  price_42: number;
  price_35: number;
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

export type DiscountLevel = "25" | "35" | "42" | "50";

/**
 * Calcula o preço unitário do trainer com base no nível de desconto
 * Usa EXATAMENTE o mesmo mapeamento de SaleFormModal.tsx:trainerUnitCost()
 */
export function trainerUnitCost(pricing: PricingData, level: DiscountLevel): number {
  const map: Record<DiscountLevel, number> = {
    "25": pricing.price_25,
    "35": pricing.price_35,
    "42": pricing.price_42,
    "50": pricing.price_50,
  };
  return Number(map[level] ?? pricing.price_50);
}

/**
 * Calcula o custo e PV de um kit usando mapeamento kitItemId -> chosenSupplementId
 * (para uso no contexto EVS onde temos mapeamento direto dos sabores escolhidos)
 */
export function calculateKitCostWithChoices(
  kitId: string,
  kitItems: KitItemData[],
  pricingData: PricingData[],
  chosenSupplements: { [kitItemId: string]: string },
  trainerDiscountLevel: DiscountLevel
): { cost: number; pv: number } {
  let cost = 0;
  let pv = 0;

  const relevantItems = kitItems.filter((i) => i.kit_id === kitId);

  for (const item of relevantItems) {
    const supplementIdToUse = chosenSupplements[item.supplement_id] || item.supplement_id;

    const p = pricingData.find((pr) => pr.supplement_id === supplementIdToUse);
    if (!p) continue;

    const doses = p.doses_per_package || 1;
    cost += (trainerUnitCost(p, trainerDiscountLevel) / doses) * Number(item.doses_used);
    pv += (Number(p.pv) / doses) * Number(item.doses_used);
  }

  return { cost, pv };
}
