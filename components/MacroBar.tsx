import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";

interface MacroBarProps {
  label: string;
  current: number;
  target: number;
  unit: string;
  color: string;
}

/**
 * Barra de progresso para um macro nutriente.
 * Exibe: label, valor atual / meta, barra preenchida proporcionalmente.
 * Cor muda para laranja se o aluno estiver abaixo de 85% ou acima de 115% da meta.
 */
export default function MacroBar({ label, current, target, unit, color }: MacroBarProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const ratio   = target > 0 ? Math.min(current / target, 1) : 0;
  const percent = Math.round(ratio * 100);
  const inRange = target > 0 && current >= target * 0.85 && current <= target * 1.15;
  const barColor = target === 0 ? "#d1d5db" : inRange ? color : "#f59e0b";

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.values, { color: barColor }]}>
          {Number(current).toFixed(1)} / {Number(target).toFixed(1)} {unit}
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${percent}%`, backgroundColor: barColor }]} />
      </View>
    </View>
  );
}

const createStyles = (theme: import("@/contexts/ThemeContext").AppTheme) => StyleSheet.create({
  container: { marginBottom: 10 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  label: { fontSize: 12, fontWeight: "700", color: theme.colors.textSecondary },
  values: { fontSize: 12, fontWeight: "800" },
  track: {
    height: 8,
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 99,
    overflow: "hidden",
  },
  fill: {
    height: 8,
    borderRadius: 99,
  },
});
