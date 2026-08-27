import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { XMLParser } from "fast-xml-parser";
import React, { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
  sku: string;
  pending_catalog_data: boolean;
  internal_unit: 'dose' | 'unidade';
  balance_raw: number;
  doses_per_package: number | null;
  pv: number | null;
  price_venda: number | null;
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
  
  const [adjustMode, setAdjustMode] = useState(false);
  const [adjustQuantities, setAdjustQuantities] = useState<Record<string, string>>({});
  const [zeroMode, setZeroMode] = useState(false);
  const [selectedForZero, setSelectedForZero] = useState<Record<string, boolean>>({});
  const [trainerId, setTrainerId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function getTrainerId() {
    if (trainerId) return trainerId;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: trainer } = await supabase
      .from('trainers')
      .select('id')
      .eq('user_id', user.id)
      .single();
    if (trainer) {
      setTrainerId(trainer.id);
      return trainer.id;
    }
    return null;
  }

  // Converter saldo bruto para unidades de embalagem
  function toUnits(item: StockBalance): number {
    if (item.doses_per_package && item.doses_per_package > 0) {
      return item.balance_raw / item.doses_per_package;
    }
    return item.balance_raw;
  }

  // Formatar número de unidades (sem casas decimais se for inteiro, 1 casa se decimal)
  function formatUnits(units: number): string {
    const isInteger = units === Math.floor(units);
    return isInteger ? units.toFixed(0) : units.toFixed(1);
  }

  // Formatar valor em reais (padrão brasileiro)
  function formatCurrency(value: number): string {
    return value.toFixed(2).replace('.', ',');
  }

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

  async function handleAdjustStock() {
    const tid = await getTrainerId();
    if (!tid) {
      setErrorMsg("Não foi possível identificar o treinador.");
      return;
    }
    
    const movements: Array<{supplement_id: string, quantity: number}> = [];
    
    for (const [supplement_id, qtyStr] of Object.entries(adjustQuantities)) {
      const qty = parseFloat(qtyStr.replace(',', '.'));
      if (isNaN(qty) || qty === 0) continue;
      
      const item = stockBalance.find(s => s.supplement_id === supplement_id);
      if (!item) continue;
      
      // Converter unidades de pacote para quantidade bruta
      let quantity_bruto: number;
      if (item.doses_per_package && item.doses_per_package > 0) {
        quantity_bruto = qty * item.doses_per_package;
      } else {
        quantity_bruto = qty;
      }
      
      movements.push({ supplement_id, quantity: quantity_bruto });
    }
    
    if (movements.length === 0) {
      setErrorMsg("Nenhum ajuste para aplicar.");
      return;
    }
    
    try {
      setLoading("import");
      
      for (const mov of movements) {
        const { error } = await supabase
          .from('herbalife_stock_movements')
          .insert({
            trainer_id: tid,
            supplement_id: mov.supplement_id,
            movement_type: 'ajuste',
            quantity: mov.quantity,
          });
        
        if (error) throw error;
      }
      
      setAdjustMode(false);
      setAdjustQuantities({});
      setImportResult({ message: `${movements.length} ajuste(s) aplicado(s) com sucesso.` });
      await loadData();
    } catch (error: any) {
      setErrorMsg(error.message || "Erro ao aplicar ajustes.");
    } finally {
      setLoading(null);
    }
  }

  async function handleZeroStock() {
    const tid = await getTrainerId();
    if (!tid) {
      setErrorMsg("Não foi possível identificar o treinador.");
      return;
    }
    
    const toZero = stockBalance.filter(s => selectedForZero[s.supplement_id] && s.balance_raw !== 0);
    
    if (toZero.length === 0) {
      setErrorMsg("Nenhum item selecionado para zerar.");
      return;
    }
    
    const confirmFn = () => {
      return new Promise<boolean>((resolve) => {
        if (Platform.OS === 'web') {
          resolve(window.confirm(`Isso vai zerar o saldo de ${toZero.length} item(ns). Confirma?`));
        } else {
          Alert.alert(
            "Confirmar Operação",
            `Isso vai zerar o saldo de ${toZero.length} item(ns). Confirma?`,
            [
              { text: "Cancelar", onPress: () => resolve(false), style: "cancel" },
              { text: "Confirmar", onPress: () => resolve(true) },
            ]
          );
        }
      });
    };
    
    const confirmed = await confirmFn();
    if (!confirmed) return;
    
    try {
      setLoading("import");
      
      for (const item of toZero) {
        const { error } = await supabase
          .from('herbalife_stock_movements')
          .insert({
            trainer_id: tid,
            supplement_id: item.supplement_id,
            movement_type: 'ajuste',
            quantity: -item.balance_raw,
          });
        
        if (error) throw error;
      }
      
      setZeroMode(false);
      setSelectedForZero({});
      setImportResult({ message: `${toZero.length} item(ns) zerado(s) com sucesso.` });
      await loadData();
    } catch (error: any) {
      setErrorMsg(error.message || "Erro ao zerar estoque.");
    } finally {
      setLoading(null);
    }
  }

  async function handleInitializeStock() {
    const tid = await getTrainerId();
    if (!tid) {
      setErrorMsg("Não foi possível identificar o treinador.");
      return;
    }
    
    try {
      setLoading("import");
      setErrorMsg("");
      setImportResult(null);
      
      // Buscar todos os produtos Herbalife oficiais do Brasil
      const { data: allProducts, error: productsErr } = await supabase
        .from('herbalife_pricing')
        .select('supplement_id, supplements!inner(name)')
        .order('supplements(name)');
      
      if (productsErr) throw productsErr;
      if (!allProducts || allProducts.length === 0) {
        setErrorMsg("Nenhum produto encontrado em herbalife_pricing.");
        return;
      }
      
      // IDs dos produtos que já têm movimentação
      const existingIds = new Set(stockBalance.map(s => s.supplement_id));
      
      // Produtos que ainda não têm movimentação
      const missingProducts = allProducts.filter(p => !existingIds.has(p.supplement_id));
      
      if (missingProducts.length === 0) {
        setImportResult({ message: "✅ Estoque já inicializado — nenhum produto novo encontrado." });
        return;
      }
      
      // Inserir linha com saldo 0 para cada produto faltante
      for (const product of missingProducts) {
        const { error } = await supabase
          .from('herbalife_stock_movements')
          .insert({
            trainer_id: tid,
            supplement_id: product.supplement_id,
            movement_type: 'ajuste',
            quantity: 0,
          });
        
        if (error) throw error;
      }
      
      setImportResult({ 
        message: `✅ ${missingProducts.length} produto(s) adicionado(s) ao controle de estoque com saldo inicial zero.` 
      });
      await loadData();
    } catch (error: any) {
      setErrorMsg(error.message || "Erro ao inicializar estoque.");
    } finally {
      setLoading(null);
    }
  }

  function toggleSelectAll() {
    if (Object.keys(selectedForZero).length === stockBalance.length) {
      setSelectedForZero({});
    } else {
      const all: Record<string, boolean> = {};
      stockBalance.forEach(s => { all[s.supplement_id] = true; });
      setSelectedForZero(all);
    }
  }

  const negativeCount = stockBalance.filter(s => toUnits(s) < 0).length;

  // Calcular totais de PV e valor financeiro
  const totalPV = stockBalance.reduce((acc, item) => {
    if (!item.pv) return acc;
    return acc + (item.pv * toUnits(item));
  }, 0);

  const totalValue = stockBalance.reduce((acc, item) => {
    if (!item.price_venda) return acc;
    return acc + (item.price_venda * toUnits(item));
  }, 0);

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
          <Text style={styles.resultTitle}>
            {importResult.message ? importResult.message : 'Importação concluída ✅'}
          </Text>
          {importResult.itemsProcessed && (
            <Text style={styles.resultLine}>
              📦 {importResult.itemsProcessed} itens processados
            </Text>
          )}
          {importResult.totalValue && (
            <Text style={styles.resultLine}>
              💰 Total: R$ {importResult.totalValue?.toFixed(2).replace('.', ',')}
            </Text>
          )}
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
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>Saldo Atual</Text>
          {!adjustMode && !zeroMode && (
            <View style={styles.cardHeaderButtons}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleInitializeStock}
                disabled={loading !== null}
              >
                <Text style={styles.actionButtonText}>Inicializar Controle de Estoque</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  setAdjustMode(true);
                  setErrorMsg("");
                  setImportResult(null);
                }}
                disabled={loading !== null}
              >
                <Text style={styles.actionButtonText}>Ajustar Estoque</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  setZeroMode(true);
                  setErrorMsg("");
                  setImportResult(null);
                }}
                disabled={loading !== null}
              >
                <Text style={styles.actionButtonText}>Zerar Estoque</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        {adjustMode && (
          <View style={styles.modeBox}>
            <Text style={styles.modeBoxTitle}>🔧 Modo Ajuste de Estoque</Text>
            <Text style={styles.modeBoxText}>
              Digite a quantidade em unidades de pacote para cada produto (positivo = somar, negativo = descontar).
            </Text>
            <View style={{ flexDirection: 'row', marginTop: 12 }}>
              <TouchableOpacity
                style={[styles.confirmButton, { flex: 1, marginRight: 6 }]}
                onPress={handleAdjustStock}
                disabled={loading === "import"}
                activeOpacity={0.85}
              >
                <LinearGradient {...GradientPrimary} style={styles.confirmButtonGradient}>
                  {loading === "import" ? (
                    <ActivityIndicator color={T.white} size="small" />
                  ) : (
                    <Text style={styles.confirmButtonText}>CONFIRMAR</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.cancelButton, { flex: 1 }]}
                onPress={() => {
                  setAdjustMode(false);
                  setAdjustQuantities({});
                }}
                disabled={loading === "import"}
              >
                <Text style={styles.cancelButtonText}>CANCELAR</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        
        {zeroMode && (
          <View style={styles.modeBox}>
            <Text style={styles.modeBoxTitle}>🗑️ Modo Zerar Estoque</Text>
            <Text style={styles.modeBoxText}>
              Selecione os produtos que deseja zerar. Itens com saldo zero serão ignorados.
            </Text>
            <TouchableOpacity
              style={styles.selectAllButton}
              onPress={toggleSelectAll}
            >
              <Text style={styles.selectAllButtonText}>
                {Object.keys(selectedForZero).length === stockBalance.length ? '✓ Desmarcar todos' : 'Selecionar todos'}
              </Text>
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', marginTop: 12 }}>
              <TouchableOpacity
                style={[styles.confirmButton, { flex: 1, marginRight: 6 }]}
                onPress={handleZeroStock}
                disabled={loading === "import"}
                activeOpacity={0.85}
              >
                <LinearGradient {...GradientPrimary} style={styles.confirmButtonGradient}>
                  {loading === "import" ? (
                    <ActivityIndicator color={T.white} size="small" />
                  ) : (
                    <Text style={styles.confirmButtonText}>CONFIRMAR</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.cancelButton, { flex: 1 }]}
                onPress={() => {
                  setZeroMode(false);
                  setSelectedForZero({});
                }}
                disabled={loading === "import"}
              >
                <Text style={styles.cancelButtonText}>CANCELAR</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        
        {negativeCount > 0 && (
          <View style={styles.negativeBanner}>
            <Text style={styles.negativeBannerText}>
              ⚠️ {negativeCount} produto(s) com saldo negativo
            </Text>
          </View>
        )}
        
        {stockBalance.length > 0 && (
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLine}>
              Pontuação total do estoque: {formatCurrency(totalPV)} PV
            </Text>
            <Text style={styles.summaryLine}>
              Valor Financeiro do estoque: R$ {formatCurrency(totalValue)}
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
            renderItem={({ item }) => {
              const units = toUnits(item);
              const isNegative = units < 0;
              const unitLabel = units === 1 ? 'unidade' : 'unidades';
              const isSelected = selectedForZero[item.supplement_id];
              return (
                <View style={[styles.stockRow, isNegative && styles.stockRowNegative]}>
                  {zeroMode && (
                    <TouchableOpacity
                      style={styles.checkbox}
                      onPress={() => {
                        setSelectedForZero(prev => ({
                          ...prev,
                          [item.supplement_id]: !prev[item.supplement_id]
                        }));
                      }}
                    >
                      <View style={[styles.checkboxInner, isSelected && styles.checkboxInnerChecked]}>
                        {isSelected && <Text style={styles.checkboxCheck}>✓</Text>}
                      </View>
                    </TouchableOpacity>
                  )}
                  {isNegative && <Text style={styles.warningIcon}>⚠️</Text>}
                  <View style={styles.stockInfo}>
                    <Text style={styles.stockName}>{item.supplement_name}</Text>
                    <Text style={styles.stockBalance}>
                      Saldo: {formatUnits(units)} {unitLabel}
                    </Text>
                    {item.pv ? (
                      <Text style={styles.stockPV}>
                        PV Unitário: {formatCurrency(item.pv)} · Total em estoque: {formatCurrency(item.pv * units)}
                      </Text>
                    ) : (
                      <Text style={styles.stockPVMissing}>PV não cadastrado</Text>
                    )}
                    {adjustMode && (
                      <TextInput
                        style={styles.adjustInput}
                        placeholder="+10 ou -5"
                        placeholderTextColor={T.t3}
                        value={adjustQuantities[item.supplement_id] || ''}
                        onChangeText={(text) => {
                          setAdjustQuantities(prev => ({
                            ...prev,
                            [item.supplement_id]: text
                          }));
                        }}
                        keyboardType="numeric"
                      />
                    )}
                  </View>
                </View>
              );
            }}
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
  stockBalance: { fontSize: 12, color: T.t3, marginBottom: 4 },
  stockPV: { fontSize: 11, color: T.t2, fontWeight: "500" },
  stockPVMissing: { fontSize: 11, color: T.t4, fontStyle: "italic" },
  
  summaryBox: {
    backgroundColor: "rgba(59,130,246,0.08)",
    borderWidth: 1,
    borderColor: T.blue,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  summaryLine: { fontSize: 13, fontWeight: "700", color: T.blue, marginBottom: 4 },

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
  
  cardHeaderRow: {
    flexDirection: 'column',
    marginBottom: 12,
  },
  cardHeaderButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  actionButton: {
    backgroundColor: T.blue,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    minWidth: '30%',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: T.white,
  },
  modeBox: {
    backgroundColor: 'rgba(59,130,246,0.08)',
    borderWidth: 1,
    borderColor: T.blue,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  modeBoxTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: T.blue,
    marginBottom: 6,
  },
  modeBoxText: {
    fontSize: 12,
    color: T.t2,
  },
  selectAllButton: {
    backgroundColor: T.surface,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 8,
    alignItems: 'center',
  },
  selectAllButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: T.t1,
  },
  cancelButton: {
    backgroundColor: T.surface,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: T.t2,
  },
  checkbox: {
    marginRight: 12,
  },
  checkboxInner: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: T.border,
    borderRadius: 6,
    backgroundColor: T.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxInnerChecked: {
    backgroundColor: T.blue,
    borderColor: T.blue,
  },
  checkboxCheck: {
    fontSize: 14,
    fontWeight: '700',
    color: T.white,
  },
  adjustInput: {
    backgroundColor: T.surface,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: T.t1,
    marginTop: 8,
  },
});
