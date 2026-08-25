import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { XMLParser } from "fast-xml-parser";
import React, { useState, useEffect } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../lib/supabase";
import { GradientPrimary } from "../../utils/gradients";
import { T } from "../../utils/theme";

type NFeParsed = {
  nfe_key: string;
  nfe_number: string;
  issue_date: string;
  total_value: number;
  total_freight: number;
  raw_xml: string;
  items: Array<{
    cprod: string;
    xprod: string;
    qty: number;
    unit_value: number;
    freight_value: number;
    total_value: number;
  }>;
};

type StockBalance = {
  supplement_id: string;
  supplement_name: string;
  balance: number;
  unit: 'dose' | 'unidade';
};

type InvoiceRow = {
  id: string;
  nfe_number: string;
  issue_date: string;
  total_value: number;
};

async function readFileContent(uri: string): Promise<string> {
  // Na web (build Vercel), expo-file-system não lê o arquivo — o uri é um
  // blob: gerado pelo navegador, então usamos fetch(). No app nativo
  // (iOS/Android), usamos a API legada do expo-file-system.
  if (Platform.OS === "web") {
    const res = await fetch(uri);
    return await res.text();
  }
  return await FileSystem.readAsStringAsync(uri);
}

export default function HerbalifeStock() {
  const router = useRouter();
  const [nfeParsed, setNfeParsed] = useState<NFeParsed | null>(null);
  const [loading, setLoading] = useState<"pick" | "import" | "data" | null>(null);
  const [importResult, setImportResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [isDuplicate, setIsDuplicate] = useState(false);
  
  const [stockBalance, setStockBalance] = useState<StockBalance[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<InvoiceRow[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading("data");
    try {
      // Carregar saldo atual
      const { data: balanceData, error: balanceErr } = await supabase
        .from('v_herbalife_stock_balance')
        .select('*')
        .order('supplement_name');
      
      if (balanceErr) throw balanceErr;
      setStockBalance(balanceData ?? []);

      // Carregar notas recentes
      const { data: invoicesData, error: invoicesErr } = await supabase
        .from('herbalife_invoices')
        .select('id, nfe_number, issue_date, total_value')
        .order('imported_at', { ascending: false })
        .limit(10);
      
      if (invoicesErr) throw invoicesErr;
      setRecentInvoices(invoicesData ?? []);
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(null);
    }
  }

  async function pickXml() {
    setErrorMsg("");
    setImportResult(null);
    setNfeParsed(null);
    setIsDuplicate(false);
    
    try {
      setLoading("pick");
      const picked = await DocumentPicker.getDocumentAsync({
        type: ["text/xml", "application/xml", "*/*"],
        copyToCacheDirectory: true,
      });
      if (picked.canceled || !picked.assets?.[0]) return;

      const asset = picked.assets[0];
      const content = await readFileContent(asset.uri);

      // Parsear XML
      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "@_",
      });
      const parsed = parser.parse(content);

      // Navegar na estrutura: nfeProc > NFe > infNFe
      const nfeProc = parsed.nfeProc;
      if (!nfeProc?.NFe?.infNFe) {
        throw new Error("Estrutura de NF-e inválida");
      }

      const infNFe = nfeProc.NFe.infNFe;
      const ide = infNFe.ide;
      const total = infNFe.total;
      const det = infNFe.det;

      // Extrair dados principais
      const nfe_key = infNFe["@_Id"] || "";
      const nfe_number = String(ide.nNF || "");
      const dhEmi = String(ide.dhEmi || "");
      const issue_date = dhEmi.split("T")[0]; // pegar só YYYY-MM-DD
      const total_value = parseFloat(total?.ICMSTot?.vNF || "0");
      const total_freight = parseFloat(total?.ICMSTot?.vFrete || "0");

      // Processar itens (det pode ser objeto único ou array)
      const detArray = Array.isArray(det) ? det : [det];
      const items = detArray.map((item: any) => {
        const prod = item.prod;
        return {
          cprod: String(prod.cProd || ""),
          xprod: String(prod.xProd || ""),
          qty: parseFloat(prod.qCom || "0"),
          unit_value: parseFloat(prod.vUnCom || "0"),
          freight_value: parseFloat(prod.vFrete || "0"),
          total_value: parseFloat(prod.vProd || "0"),
        };
      });

      // Verificar duplicidade
      const { data: existingInvoice } = await supabase
        .from('herbalife_invoices')
        .select('id')
        .eq('nfe_key', nfe_key)
        .maybeSingle();
      
      if (existingInvoice) {
        setIsDuplicate(true);
      }

      setNfeParsed({
        nfe_key,
        nfe_number,
        issue_date,
        total_value,
        total_freight,
        raw_xml: content,
        items,
      });
    } catch (error: any) {
      setErrorMsg(error.message || "Erro ao ler o arquivo XML.");
    } finally {
      setLoading(null);
    }
  }

  async function handleImport() {
    if (!nfeParsed) return;
    setErrorMsg("");
    setImportResult(null);
    
    try {
      setLoading("import");
      const { data, error } = await supabase.functions.invoke("import-herbalife-invoice", {
        body: nfeParsed,
      });
      
      if (error) {
        // supabase-js só expõe uma mensagem genérica em "error.message" quando a
        // Edge Function retorna status != 2xx. O corpo real (com a causa
        // específica) vem em error.context, que é o Response cru.
        let detail = error.message;
        try {
          const body = await error.context?.json?.();
          if (body?.error) detail = body.error;
        } catch {
          // mantém a mensagem genérica se não der pra ler o corpo
        }
        throw new Error(detail);
      }
      
      if (data?.error) throw new Error(data.error);
      setImportResult(data);
      setNfeParsed(null);
      
      // Recarregar dados
      await loadData();
    } catch (error: any) {
      setErrorMsg(error.message || "Erro ao importar a nota fiscal.");
    } finally {
      setLoading(null);
    }
  }

  const negativeCount = stockBalance.filter(s => s.balance < 0).length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.title}>Estoque Herbalife</Text>
        <Text style={styles.subtitle}>
          Entrada = nota fiscal · Saída = vendas (automático)
        </Text>
      </View>

      {recentInvoices.length > 0 && (
        <View style={styles.recentHeader}>
          <Text style={styles.recentHeaderTitle}>Últimas notas importadas</Text>
          {recentInvoices.slice(0, 3).map((inv, idx) => (
            <View key={inv.id} style={styles.recentHeaderRow}>
              <Text style={styles.recentHeaderNumber}>NF-e {inv.nfe_number}</Text>
              <Text style={styles.recentHeaderDate}>{inv.issue_date}</Text>
              <Text style={styles.recentHeaderValue}>
                R$ {inv.total_value.toFixed(2).replace('.', ',')}
              </Text>
            </View>
          ))}
        </View>
      )}

      {errorMsg !== "" && (
        <View style={styles.statusError}>
          <Text style={styles.statusErrorText}>⚠️ {errorMsg}</Text>
        </View>
      )}

      {importResult && (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Importação concluída ✅</Text>
          <Text style={styles.resultLine}>
            📦 {importResult.itemsProcessed} itens processados
          </Text>
          <Text style={styles.resultLine}>
            💰 Total: R$ {importResult.totalValue?.toFixed(2).replace('.', ',')}
          </Text>
          {importResult.newProductsCreated?.length > 0 && (
            <View style={styles.warningBox}>
              <Text style={styles.warningTitle}>
                ⚠️ {importResult.newProductsCreated.length} produto(s) novo(s) criado(s) automaticamente
              </Text>
              <Text style={styles.warningText}>
                Complete o cadastro em Suplementos:
              </Text>
              {importResult.newProductsCreated.map((p: any, idx: number) => (
                <Text key={idx} style={styles.warningText}>
                  • {p.name} (SKU: {p.sku})
                </Text>
              ))}
            </View>
          )}
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Registrar Entrada (Nota Fiscal)</Text>
        <Text style={styles.cardSubtitle}>Arquivo .xml da NF-e de compra</Text>
        
        <TouchableOpacity
          style={styles.pickButton}
          onPress={pickXml}
          disabled={loading !== null}
        >
          {loading === "pick" ? (
            <ActivityIndicator color={T.blue} />
          ) : (
            <Text style={styles.pickButtonText}>
              {nfeParsed ? `✅ Nota ${nfeParsed.nfe_number}` : "📄 Selecionar arquivo .xml"}
            </Text>
          )}
        </TouchableOpacity>

        {nfeParsed && (
          <View style={styles.preview}>
            {isDuplicate && (
              <View style={styles.duplicateWarning}>
                <Text style={styles.duplicateWarningText}>
                  ⚠️ Esta nota fiscal já foi importada anteriormente
                </Text>
              </View>
            )}
            <Text style={styles.previewTitle}>Pré-visualização:</Text>
            <Text style={styles.previewText}>Nota: {nfeParsed.nfe_number}</Text>
            <Text style={styles.previewText}>Data: {nfeParsed.issue_date}</Text>
            <Text style={styles.previewText}>Itens: {nfeParsed.items.length}</Text>
            <Text style={styles.previewText}>
              Total: R$ {nfeParsed.total_value.toFixed(2).replace('.', ',')}
            </Text>
            <View style={styles.itemsList}>
              <Text style={styles.itemsListTitle}>Produtos da nota:</Text>
              {nfeParsed.items.map((item, idx) => (
                <Text key={idx} style={styles.itemsListRow}>
                  {item.cprod} {item.xprod} — {item.qty} un.
                </Text>
              ))}
            </View>
          </View>
        )}

        {nfeParsed && (
          <TouchableOpacity
            style={[styles.confirmButton, (loading === "import" || isDuplicate) && styles.confirmButtonDisabled]}
            onPress={handleImport}
            disabled={loading === "import" || isDuplicate}
            activeOpacity={0.85}
          >
            <LinearGradient {...GradientPrimary} style={styles.confirmButtonGradient}>
              {loading === "import" ? (
                <ActivityIndicator color={T.white} />
              ) : (
                <Text style={styles.confirmButtonText}>CONFIRMAR IMPORTAÇÃO</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Saldo Atual</Text>
        {negativeCount > 0 && (
          <View style={styles.negativeBanner}>
            <Text style={styles.negativeBannerText}>
              ⚠️ {negativeCount} produto(s) com saldo negativo
            </Text>
          </View>
        )}
        
        {loading === "data" ? (
          <ActivityIndicator color={T.blue} style={{ marginTop: 16 }} />
        ) : stockBalance.length === 0 ? (
          <Text style={styles.emptyText}>
            Nenhuma movimentação de estoque ainda. Importe sua primeira nota fiscal acima.
          </Text>
        ) : (
          <FlatList
            data={stockBalance}
            scrollEnabled={false}
            keyExtractor={(item) => item.supplement_id}
            renderItem={({ item }) => (
              <View style={[styles.stockRow, item.balance < 0 && styles.stockRowNegative]}>
                {item.balance < 0 && <Text style={styles.warningIcon}>⚠️</Text>}
                <View style={styles.stockInfo}>
                  <Text style={styles.stockName}>{item.supplement_name}</Text>
                  <Text style={styles.stockBalance}>
                    Saldo: {item.balance} {item.unit === 'dose' ? 'doses' : 'unidades'}
                  </Text>
                </View>
              </View>
            )}
          />
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Notas Importadas Recentemente</Text>
        {recentInvoices.length === 0 ? (
          <Text style={styles.emptyText}>Nenhuma nota importada ainda.</Text>
        ) : (
          <FlatList
            data={recentInvoices}
            scrollEnabled={false}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.invoiceRow}>
                <Text style={styles.invoiceNumber}>NF-e {item.nfe_number}</Text>
                <Text style={styles.invoiceDate}>{item.issue_date}</Text>
                <Text style={styles.invoiceValue}>
                  R$ {item.total_value.toFixed(2).replace('.', ',')}
                </Text>
              </View>
            )}
          />
        )}
      </View>

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

  warningBox: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: T.orange,
  },
  warningTitle: { fontSize: 13, fontWeight: "700", color: T.orange, marginBottom: 6 },
  warningText: { fontSize: 12, color: T.t2, marginBottom: 3 },

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

  preview: {
    marginTop: 16,
    padding: 12,
    backgroundColor: T.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: T.border,
  },
  previewTitle: { fontSize: 13, fontWeight: "700", color: T.t2, marginBottom: 6 },
  previewText: { fontSize: 13, color: T.t3, marginBottom: 3 },

  duplicateWarning: {
    backgroundColor: "rgba(251,146,60,0.12)",
    borderWidth: 1,
    borderColor: T.orange,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  duplicateWarningText: {
    fontSize: 13,
    fontWeight: "700",
    color: T.orange,
    textAlign: "center",
  },

  itemsList: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: T.border,
  },
  itemsListTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: T.t2,
    marginBottom: 8,
  },
  itemsListRow: {
    fontSize: 12,
    color: T.t3,
    marginBottom: 4,
    paddingLeft: 8,
  },

  recentHeader: {
    backgroundColor: T.surface,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  recentHeaderTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: T.t2,
    marginBottom: 10,
  },
  recentHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  recentHeaderNumber: {
    fontSize: 12,
    fontWeight: "600",
    color: T.t1,
    flex: 1,
  },
  recentHeaderDate: {
    fontSize: 11,
    color: T.t3,
    marginHorizontal: 8,
  },
  recentHeaderValue: {
    fontSize: 12,
    fontWeight: "600",
    color: T.blue,
  },

  confirmButton: { borderRadius: 16, overflow: "hidden", marginTop: 16 },
  confirmButtonDisabled: { opacity: 0.4 },
  confirmButtonGradient: { height: 56, alignItems: "center", justifyContent: "center", borderRadius: 16 },
  confirmButtonText: { color: T.white, fontWeight: "800", fontSize: 16, letterSpacing: 0.5 },

  negativeBanner: {
    backgroundColor: "rgba(251,146,60,0.1)",
    borderWidth: 1,
    borderColor: T.orange,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  negativeBannerText: { fontSize: 13, fontWeight: "700", color: T.orange },

  emptyText: { fontSize: 13, color: T.t3, fontStyle: "italic", marginTop: 8 },

  stockRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  stockRowNegative: {
    backgroundColor: "rgba(239,68,68,0.05)",
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.2)",
  },
  warningIcon: { fontSize: 18, marginRight: 8 },
  stockInfo: { flex: 1 },
  stockName: { fontSize: 14, fontWeight: "700", color: T.t1, marginBottom: 2 },
  stockBalance: { fontSize: 12, color: T.t3 },

  invoiceRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  invoiceNumber: { fontSize: 14, fontWeight: "700", color: T.t1, marginBottom: 2 },
  invoiceDate: { fontSize: 12, color: T.t3, marginBottom: 2 },
  invoiceValue: { fontSize: 13, fontWeight: "600", color: T.blue },

  backButton: { alignItems: "center", paddingVertical: 12, marginTop: 16 },
  backButtonText: { color: T.t4, fontSize: 13, fontWeight: "500" },
});
