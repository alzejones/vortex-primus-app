import { StyleSheet, Text, View } from "react-native";

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
// Helper
// ------------------------------------------------------------
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
            </View>
            {food.calories != null && (
              <Text style={styles.foodCal}>{food.calories} kcal</Text>
            )}
          </View>
        ))
      )}

      {/* Totais da refeição */}
      {meal.meal_plan_foods.length > 0 && (
        <View style={styles.totalsRow}>
          <Text style={styles.total}>{totals.calories} kcal</Text>
          <Text style={styles.total}>P: {totals.protein}g</Text>
          <Text style={styles.total}>C: {totals.carbs}g</Text>
          <Text style={styles.total}>G: {totals.fat}g</Text>
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
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  mealName: { fontSize: 15, fontWeight: "800", color: "#111827" },
  mealTime: { fontSize: 12, color: "#059669", fontWeight: "700" },
  empty: { color: "#9ca3af", fontSize: 13, fontStyle: "italic" },
  foodRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  foodName: { fontSize: 14, color: "#111827", fontWeight: "600" },
  foodQty: { fontSize: 12, color: "#6b7280" },
  foodCal: { fontSize: 13, color: "#374151", fontWeight: "700" },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  total: { fontSize: 11, color: "#6b7280", fontWeight: "700" },
});
