import { StyleSheet, Text, View } from "react-native";
import { T } from "../utils/theme";

// ------------------------------------------------------------
// Tipos
// ------------------------------------------------------------
export interface FoodItem {
  id: string;
  name: string;
  quantity: string | null;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  order_index: number;
}

export interface MealItem {
  id: string;
  name: string;
  time_suggestion: string | null;
  order_index: number;
  meal_plan_foods: FoodItem[];
}

interface MealCardProps {
  meal: MealItem;
}

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------
function fmt(n: number | null | undefined): string | null {
  if (n == null || n === 0) return null;
  const s = parseFloat(n.toFixed(1)).toString(); // remove ".0" desnecessário
  return s;
}

function sumMacros(foods: FoodItem[]) {
  return foods.reduce(
    (acc, f) => ({
      calories: acc.calories + (f.calories || 0),
      protein:  acc.protein  + (f.protein  || 0),
      carbs:    acc.carbs    + (f.carbs    || 0),
      fat:      acc.fat      + (f.fat      || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

// ------------------------------------------------------------
// Componente
// ------------------------------------------------------------
export default function MealCard({ meal }: MealCardProps) {
  const totals = sumMacros(meal.meal_plan_foods);

  return (
    <View style={styles.card}>
      {/* Cabeçalho da refeição */}
      <View style={styles.header}>
        <Text style={styles.mealName}>{meal.name}</Text>
        {meal.time_suggestion ? (
          <Text style={styles.mealTime}>{meal.time_suggestion}</Text>
        ) : null}
      </View>

      {/* Lista de alimentos */}
      {meal.meal_plan_foods.length === 0 ? (
        <Text style={styles.empty}>Nenhum alimento cadastrado</Text>
      ) : (
        meal.meal_plan_foods.map((food) => (
          <View key={food.id} style={styles.foodRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.foodName}>{food.name}</Text>
              {food.quantity ? (
                <Text style={styles.foodQty}>{food.quantity}</Text>
              ) : null}
              {/* Linha de macros */}
              {(() => {
                const p = fmt(food.protein);
                const c = fmt(food.carbs);
                const g = fmt(food.fat);
                const parts = [];
                if (p) parts.push(`P: ${p}g`);
                if (c) parts.push(`C: ${c}g`);
                if (g) parts.push(`G: ${g}g`);
                return parts.length > 0 ? (
                  <Text style={styles.foodMacros}>{parts.join(' · ')}</Text>
                ) : null;
              })()}
            </View>
            {food.calories != null && (
              <Text style={styles.foodCal}>{parseFloat(food.calories.toFixed(1))} kcal</Text>
            )}
          </View>
        ))
      )}

      {/* Totais da refeição */}
      {meal.meal_plan_foods.length > 0 && (
        <View style={styles.totalsRow}>
          <Text style={styles.total}>{parseFloat(totals.calories.toFixed(1))} kcal</Text>
          <Text style={styles.total}>P: {parseFloat(totals.protein.toFixed(1))}g</Text>
          <Text style={styles.total}>C: {parseFloat(totals.carbs.toFixed(1))}g</Text>
          <Text style={styles.total}>G: {parseFloat(totals.fat.toFixed(1))}g</Text>
        </View>
      )}
    </View>
  );
}

// ------------------------------------------------------------
// Estilos
// ------------------------------------------------------------
const styles = StyleSheet.create({
  card: {
    backgroundColor: T.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: T.border,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  mealName: { fontSize: 15, fontWeight: "800", color: T.t1 },
  mealTime: { fontSize: 12, color: T.green, fontWeight: "700" },
  empty: { color: T.t3, fontSize: 13, fontStyle: "italic" },
  foodRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  foodName: { fontSize: 14, color: T.t1, fontWeight: "600" },
  foodQty: { fontSize: 12, color: T.t3 },
  foodMacros: { fontSize: 12, color: T.t3 },
  foodCal: { fontSize: 13, color: T.t2, fontWeight: "700" },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: T.border,
  },
  total: { fontSize: 11, color: T.t2, fontWeight: "700" },
});
