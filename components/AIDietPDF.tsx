// AIDietPDF.tsx — versão MOBILE
// Gera HTML premium preto/dourado e abre no navegador nativo via expo-web-browser.
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from "react-native";
import { AIDietPDFData, generateAIDietHTML } from "../utils/dietPDFTemplateAI";

interface AIDietPDFProps {
  data: AIDietPDFData;
}

export default function AIDietPDF({ data }: AIDietPDFProps) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const html = generateAIDietHTML(data);
      const url = "data:text/html;charset=utf-8," + encodeURIComponent(html);
      await WebBrowser.openBrowserAsync(url);
    } finally {
      setLoading(false);
    }
  }

  return (
    <TouchableOpacity style={styles.btn} onPress={handleExport} disabled={loading}>
      {loading
        ? <ActivityIndicator color="#0a0a0a" size="small" />
        : <Text style={styles.btnText}>📄 Exportar PDF Premium</Text>
      }
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#D4AF37",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  btnText: { color: "#0a0a0a", fontWeight: "800", fontSize: 14 },
});
