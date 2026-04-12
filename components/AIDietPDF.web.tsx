// AIDietPDF.web.tsx — versão WEB
// Abre o HTML premium em nova aba e dispara window.print() automaticamente.
import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from "react-native";
import { AIDietPDFData, generateAIDietHTML } from "../utils/dietPDFTemplateAI";

interface AIDietPDFProps {
  data: AIDietPDFData;
}

export default function AIDietPDF({ data }: AIDietPDFProps) {
  const [loading, setLoading] = useState(false);

  function handleExport() {
    setLoading(true);
    try {
      const html = generateAIDietHTML(data);
      const win = window.open("", "_blank");
      if (!win) {
        const url = "data:text/html;charset=utf-8," + encodeURIComponent(html);
        window.open(url, "_blank");
        return;
      }
      win.document.write(html);
      win.document.close();
      win.onload = () => {
        win.focus();
        win.print();
      };
      setTimeout(() => {
        try { win.focus(); win.print(); } catch (_) {}
      }, 600);
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
