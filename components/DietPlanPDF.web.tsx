// DietPlanPDF.web.tsx — versão WEB
// Abre o HTML em nova aba e dispara window.print() automaticamente.
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from "react-native";
import { DietPDFData, generateDietHTML } from "../utils/dietPDFTemplate";
import { GradientPrimary } from "../utils/gradients";

interface DietPlanPDFProps {
  data: DietPDFData;
}

export default function DietPlanPDF({ data }: DietPlanPDFProps) {
  const [loading, setLoading] = useState(false);

  function handleExport() {
    setLoading(true);
    try {
      const html = generateDietHTML({ ...data, generatedAt: new Date().toISOString() });
      const win = window.open("", "_blank");
      if (!win) {
        // Pop-up bloqueado: fallback para data URL na mesma aba
        const url = "data:text/html;charset=utf-8," + encodeURIComponent(html);
        window.open(url, "_blank");
        return;
      }
      win.document.write(html);
      win.document.close();
      // Aguarda renderização antes de imprimir
      win.onload = () => {
        win.focus();
        win.print();
      };
      // Fallback: alguns browsers não disparam onload em document.write
      setTimeout(() => {
        try { win.focus(); win.print(); } catch (_) {}
      }, 600);
    } finally {
      setLoading(false);
    }
  }

  return (
    <TouchableOpacity style={styles.btn} onPress={handleExport} disabled={loading}>
      <LinearGradient {...GradientPrimary} style={styles.btnGradient}>
        {loading
          ? <ActivityIndicator color="#fff" size="small" />
          : <Text style={styles.btnText}>📄 Exportar PDF</Text>
        }
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: 12,
    overflow: "hidden",
  },
  btnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  btnText: { color: "#fff", fontWeight: "800", fontSize: 14 },
});
