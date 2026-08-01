import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import Papa from "papaparse";
import React, { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../lib/supabase";
import { GradientPrimary } from "../../utils/gradients";
import { T } from "../../utils/theme";

type ParsedFile = {
  fileName: string;
  rows: any[];
};

export default function ImportFineshape() {
  const router = useRouter();
  const [clientsFile, setClientsFile] = useState<ParsedFile | null>(null);
  const [assessmentsFile, setAssessmentsFile] = useState<ParsedFile | null>(null);
  const [loading, setLoading] = useState<"clients" | "assessments" | "import" | null>(null);
  const [result, setResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState("");

  async function pickAndParse(kind: "clients" | "assessments") {
    setErrorMsg("");
    try {
      setLoading(kind);
      const picked = await DocumentPicker.getDocumentAsync({
        type: ["text/csv", "text/comma-separated-values", "*/*"],
        copyToCacheDirectory: true,
      });
      if (picked.canceled || !picked.assets?.[0]) return;

      const asset = picked.assets[0];
      const content = await FileSystem.readAsStringAsync(asset.uri);

      const parsed = Papa.parse(content, {
        header: true,
        delimiter: ";",
        skipEmptyLines: true,
      });

      if (parsed.errors?.length) {
        console.log("Avisos ao parsear CSV:", parsed.errors.slice(0, 3));
      }

      const rows = (parsed.data as any[]).filter(
        (r) => r && Object.keys(r).length > 0 && Object.values(r).some((v) => v !== "")
      );

      const fileData: ParsedFile = { fileName: asset.name, rows };
      if (kind === "clients") setClientsFile(fileData);
      else setAssessmentsFile(fileData);
    } catch (error: any) {
      setErrorMsg(error.message || "Erro ao ler o arquivo.");
    } finally {
      setLoading(null);
    }
  }

  async function handleImport() {
    if (!clientsFile || !assessmentsFile) return;
    setErrorMsg("");
    setResult(null);
    try {
      setLoading("import");
      const { data, error } = await supabase.functions.invoke("import-fineshape", {
        body: {
          clients: clientsFile.rows,
          assessments: assessmentsFile.rows,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data);
    } catch (error: any) {
      setErrorMsg(error.message || "Erro ao importar os dados.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.title}>Importar do Fineshape</Text>
        <Text style={styles.subtitle}>
          Envie os arquivos exportados pelo Fineshape (clientes e avaliações) para migrar o histórico dos seus alunos para o Vortex.
        </Text>
      </View>

      {errorMsg !== "" && (
        <View style={styles.statusError}>
          <Text style={styles.statusErrorText}>⚠️ {errorMsg}</Text>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>1. Arquivo de Clientes</Text>
        <Text style={styles.cardSubtitle}>Exportação "clientes.csv" do Fineshape</Text>
        <TouchableOpacity
          style={styles.pickButton}
          onPress={() => pickAndParse("clients")}
          disabled={loading !== null}
        >
          {loading === "clients" ? (
            <ActivityIndicator color={T.blue} />
          ) : (
            <Text style={styles.pickButtonText}>
              {clientsFile ? `✅ ${clientsFile.fileName} (${clientsFile.rows.length} registros)` : "📄 Selecionar arquivo"}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>2. Arquivo de Avaliações</Text>
        <Text style={styles.cardSubtitle}>Exportação "avaliacoes.csv" do Fineshape</Text>
        <TouchableOpacity
          style={styles.pickButton}
          onPress={() => pickAndParse("assessments")}
          disabled={loading !== null}
        >
          {loading === "assessments" ? (
            <ActivityIndicator color={T.blue} />
          ) : (
            <Text style={styles.pickButtonText}>
              {assessmentsFile ? `✅ ${assessmentsFile.fileName} (${assessmentsFile.rows.length} registros)` : "📄 Selecionar arquivo"}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {result && (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Importação concluída ✅</Text>
          <Text style={styles.resultLine}>
            👥 Clientes: {result.clientes.criados} criados · {result.clientes.ja_existiam} já existiam
            {result.clientes.invalidos > 0 ? ` · ${result.clientes.invalidos} inválidos` : ""}
          </Text>
          <Text style={styles.resultLine}>
            📋 Avaliações: {result.avaliacoes.importadas} importadas · {result.avaliacoes.ja_importadas_antes} já importadas antes
          </Text>
          {result.avaliacoes.sem_cliente_correspondente > 0 && (
            <Text style={styles.resultLineWarn}>
              ⚠️ {result.avaliacoes.sem_cliente_correspondente} avaliações sem cliente correspondente pelo nome
            </Text>
          )}
          {result.avaliacoes.data_invalida > 0 && (
            <Text style={styles.resultLineWarn}>
              ⚠️ {result.avaliacoes.data_invalida} avaliações com data inválida
            </Text>
          )}
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.importButton,
          (!clientsFile || !assessmentsFile || loading !== null) && styles.importButtonDisabled,
        ]}
        onPress={handleImport}
        disabled={!clientsFile || !assessmentsFile || loading !== null}
        activeOpacity={0.85}
      >
        <LinearGradient {...GradientPrimary} style={styles.importButtonGradient}>
          {loading === "import" ? (
            <ActivityIndicator color={T.white} />
          ) : (
            <Text style={styles.importButtonText}>CONFIRMAR IMPORTAÇÃO</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>Voltar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  scrollContent: { padding: 24, paddingBottom: 60, paddingTop: 60 },

  header: { marginBottom: 24 },
  title: { fontSize: 28, fontWeight: "900", color: T.t1, marginBottom: 8, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: T.t3, lineHeight: 22 },

  statusError: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    backgroundColor: "rgba(239,68,68,0.08)",
    borderColor: T.red,
  },
  statusErrorText: { fontWeight: "bold", fontSize: 14, color: T.red },

  card: {
    backgroundColor: T.card,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: T.border,
    marginBottom: 16,
  },
  cardTitle: { fontSize: 16, fontWeight: "800", color: T.t1, marginBottom: 4 },
  cardSubtitle: { fontSize: 13, color: T.t3, marginBottom: 16 },

  pickButton: {
    backgroundColor: T.surface,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  pickButtonText: { fontSize: 14, fontWeight: "700", color: T.t1, textAlign: "center" },

  resultCard: {
    backgroundColor: "rgba(16,185,129,0.08)",
    borderWidth: 1,
    borderColor: T.green,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  resultTitle: { fontSize: 16, fontWeight: "800", color: T.green, marginBottom: 10 },
  resultLine: { fontSize: 14, color: T.t1, marginBottom: 6, fontWeight: "600" },
  resultLineWarn: { fontSize: 13, color: T.orange, marginBottom: 6, fontWeight: "600" },

  importButton: { borderRadius: 16, overflow: "hidden", marginBottom: 16 },
  importButtonDisabled: { opacity: 0.4 },
  importButtonGradient: { height: 56, alignItems: "center", justifyContent: "center", borderRadius: 16 },
  importButtonText: { color: T.white, fontWeight: "800", fontSize: 16, letterSpacing: 0.5 },

  backButton: { alignItems: "center", paddingVertical: 12 },
  backButtonText: { color: T.t4, fontSize: 13, fontWeight: "500" },
});
