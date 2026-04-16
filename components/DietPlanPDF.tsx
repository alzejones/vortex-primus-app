// DietPlanPDF.tsx — versão MOBILE
// Gera HTML e abre no navegador nativo via expo-web-browser.
// O usuário pode usar o menu "Compartilhar" / "Imprimir" do navegador.
import * as WebBrowser from "expo-web-browser";
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

  async function handleExport() {
    setLoading(true);
    try {
      const html = generateDietHTML({ ...data, generatedAt: new Date().toISOString() });
      // data URL: abre no navegador do dispositivo
      const url = "data:text/html;charset=utf-8," + encodeURIComponent(html);
      await WebBrowser.openBrowserAsync(url);
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
