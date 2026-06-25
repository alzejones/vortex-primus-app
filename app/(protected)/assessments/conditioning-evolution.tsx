import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { supabase } from "../../../lib/supabase";
import { T } from "../../../utils/theme";
import StrengthDotMatrixChart from "../../../components/StrengthDotMatrixChart";
import EnduranceDotMatrixChart from "../../../components/EnduranceDotMatrixChart";

export default function ConditioningEvolution() {
  const { client_id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<any[]>([]);
  const [clientName, setClientName] = useState("");

  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    async function fetchEvolution() {
      if (!client_id) return;
      try {
        setLoading(true);

        const { data: clientData } = await supabase.from("clients").select("name").eq("id", client_id).single();
        if (clientData) setClientName(clientData.name);

        const { data, error } = await supabase
          .from("physical_assessments")
          .select(`
            id, date,
            conditioning:conditioning_tests (
              id,
              strength:strength_tests (exercise_name, load_kg, repetitions),
              endurance:endurance_tests (test_type, distance_m, time_seconds, repetitions),
              mobility:mobility_tests (test_name, notes)
            )
          `)
          .eq("client_id", client_id)
          .order("date", { ascending: false });

        if (error) throw error;

        const filteredData = (data as any[] || []).filter(a => a.conditioning && a.conditioning.length > 0);
        setHistory(filteredData);
      } catch (err: any) {
        console.log("Erro:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchEvolution();
  }, [client_id]);

  const formatDate = (dateString: string) => {
    const [y, m, d] = dateString.split('-');
    return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  };
  const calcDays = (d1: string, d2: string) => {
    const [y1, m1, d1s] = d1.split('-');
    const [y2, m2, d2s] = d2.split('-');
    const date1 = new Date(Number(y1), Number(m1) - 1, Number(d1s));
    const date2 = new Date(Number(y2), Number(m2) - 1, Number(d2s));
    return Math.ceil(Math.abs(date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getDiff = (curr: any, prev: any) => {
    if (curr === null || curr === undefined || curr === "") return "-";
    if (prev === null || prev === undefined || prev === "") return "-";
    const diff = Number(curr) - Number(prev);
    if (isNaN(diff)) return "-";
    return diff > 0 ? `+${diff}` : diff;
  };

  const getDiffColor = (val: string | number, isTime: boolean = false) => {
    if (val === "-") return T.t3;
    const strVal = String(val);
    if (isTime) {
      if (strVal.startsWith("-")) return "#16a34a";
      if (strVal.startsWith("+")) return "#dc2626";
    } else {
      if (strVal.startsWith("+")) return "#16a34a";
      if (strVal.startsWith("-")) return "#dc2626";
    }
    return T.t2;
  };

  const normalizeExerciseName = (name: string) => {
    if (!name) return "";
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 8);
  };

  const renderStrengthCard = (currentAss: any, previousAss: any, initialAss: any) => {
    const condCurr = currentAss.conditioning[0];
    const condPrev = previousAss ? previousAss.conditioning[0] : null;
    const condInit = initialAss ? initialAss.conditioning[0] : null;

    if (!condCurr.strength || condCurr.strength.length === 0) return null;

    const dateCurr = formatDate(currentAss.date);
    const datePrev = previousAss ? formatDate(previousAss.date) : "--/--/--";
    const daysPrev = previousAss ? calcDays(currentAss.date, previousAss.date) : 0;
    const daysInit = initialAss ? calcDays(currentAss.date, initialAss.date) : 0;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}><Text style={styles.cardTitle}>Teste de Força</Text></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.tableContainer}>
            <View style={styles.headerRow}>
              <View style={[styles.headerCell, { width: 130 }]}>
                <Text style={styles.headerLabel}>Data da Última</Text><Text style={styles.headerDate}>{dateCurr}</Text>
                <View style={styles.subHeaderArea}>
                  <Text style={[styles.subHeaderText, { flex: 1, textAlign: 'left' }]}>Exercício</Text>
                </View>
              </View>
              <View style={[styles.headerCell, { width: 60 }]}>
                <Text style={styles.headerLabel}> </Text><Text style={styles.headerDate}> </Text>
                <View style={styles.subHeaderArea}>
                  <Text style={[styles.subHeaderText, { flex: 1 }]}>Carga</Text>
                </View>
              </View>
              <View style={[styles.headerCell, { width: 60 }]}>
                <Text style={styles.headerLabel}> </Text><Text style={styles.headerDate}> </Text>
                <View style={styles.subHeaderArea}>
                  <Text style={[styles.subHeaderText, { flex: 1 }]}>Reps</Text>
                </View>
              </View>
              <View style={[styles.headerCell, { width: 100, backgroundColor: T.surfaceAlt }]}>
                <Text style={styles.headerLabel}>Avaliação Anterior</Text><Text style={styles.headerDate}>{datePrev}</Text>
                <View style={styles.subHeaderArea}>
                  <Text style={[styles.subHeaderText, { flex: 1 }]}>Carga</Text><Text style={[styles.subHeaderText, { flex: 1 }]}>Reps</Text>
                </View>
              </View>
              <View style={[styles.headerCell, { width: 180 }]}>
                <Text style={styles.headerLabel}>Evolução no Período</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
                  <Text style={styles.headerDate}>{daysPrev} Dias</Text><Text style={styles.headerDate}>{daysInit} Dias</Text>
                </View>
                <View style={styles.subHeaderArea}>
                  <Text style={[styles.subHeaderText, { flex: 1, color: T.blue }]}>x Anterior</Text>
                  <Text style={[styles.subHeaderText, { flex: 1, color: T.blue }]}>x Total</Text>
                </View>
                <View style={styles.subHeaderArea}>
                  <Text style={[styles.subHeaderText, { flex: 1 }]}>Cg | Rp</Text><Text style={[styles.subHeaderText, { flex: 1 }]}>Cg | Rp</Text>
                </View>
              </View>
            </View>
            {condCurr.strength.map((item: any, i: number) => {
              const prevItem = condPrev?.strength?.find((p: any) => normalizeExerciseName(p.exercise_name) === normalizeExerciseName(item.exercise_name));
              const initItem = condInit?.strength?.find((p: any) => normalizeExerciseName(p.exercise_name) === normalizeExerciseName(item.exercise_name));
              const diffLoadPrev = getDiff(item.load_kg, prevItem?.load_kg);
              const diffRepsPrev = getDiff(item.repetitions, prevItem?.repetitions);
              const diffLoadInit = getDiff(item.load_kg, initItem?.load_kg);
              const diffRepsInit = getDiff(item.repetitions, initItem?.repetitions);

              return (
                <View key={i} style={[styles.dataRow, i % 2 === 0 && styles.rowEven]}>
                  <View style={[styles.dataCell, { width: 130 }]}>
                    <Text style={[styles.exerciseText]} numberOfLines={1}>{item.exercise_name}</Text>
                  </View>
                  <View style={[styles.dataCell, { width: 60 }]}>
                    <Text style={[styles.valueText]}>{item.load_kg || '-'}</Text>
                  </View>
                  <View style={[styles.dataCell, { width: 60 }]}>
                    <Text style={[styles.valueText]}>{item.repetitions || '-'}</Text>
                  </View>
                  <View style={[styles.dataCell, { width: 100, flexDirection: 'row', backgroundColor: T.surfaceAlt }]}>
                    <Text style={[styles.valueText, { flex: 1, color: T.t3 }]}>{prevItem?.load_kg || '-'}</Text>
                    <Text style={[styles.valueText, { flex: 1, color: T.t3 }]}>{prevItem?.repetitions || '-'}</Text>
                  </View>
                  <View style={[styles.dataCell, { width: 180, flexDirection: 'row' }]}>
                    <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'center' }}>
                      {diffLoadPrev === "-" && diffRepsPrev === "-" ? (
                        <Text style={[styles.diffText, { color: T.t3 }]}>-</Text>
                      ) : (
                        <><Text style={[styles.diffText, { color: getDiffColor(diffLoadPrev) }]}>{diffLoadPrev}</Text><Text style={styles.divider}>|</Text><Text style={[styles.diffText, { color: getDiffColor(diffRepsPrev) }]}>{diffRepsPrev}</Text></>
                      )}
                    </View>
                    <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'center' }}>
                      {diffLoadInit === "-" && diffRepsInit === "-" ? (
                        <Text style={[styles.diffText, { color: T.t3 }]}>-</Text>
                      ) : (
                        <><Text style={[styles.diffText, { color: getDiffColor(diffLoadInit) }]}>{diffLoadInit}</Text><Text style={styles.divider}>|</Text><Text style={[styles.diffText, { color: getDiffColor(diffRepsInit) }]}>{diffRepsInit}</Text></>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderEnduranceCard = (currentAss: any, previousAss: any, initialAss: any) => {
    const condCurr = currentAss.conditioning[0];
    const condPrev = previousAss ? previousAss.conditioning[0] : null;
    const condInit = initialAss ? initialAss.conditioning[0] : null;

    if (!condCurr.endurance || condCurr.endurance.length === 0) return null;

    const dateCurr = formatDate(currentAss.date);
    const datePrev = previousAss ? formatDate(previousAss.date) : "--/--/--";
    const daysPrev = previousAss ? calcDays(currentAss.date, previousAss.date) : 0;
    const daysInit = initialAss ? calcDays(currentAss.date, initialAss.date) : 0;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}><Text style={styles.cardTitle}>Resistência Cárdio</Text></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.tableContainer}>
            <View style={styles.headerRow}>
              <View style={[styles.headerCell, { width: 130 }]}>
                <Text style={styles.headerLabel}>Data da Última</Text><Text style={styles.headerDate}>{dateCurr}</Text>
                <View style={styles.subHeaderArea}>
                  <Text style={[styles.subHeaderText, { flex: 1, textAlign: 'left' }]}>Exercício</Text>
                </View>
              </View>
              <View style={[styles.headerCell, { width: 60 }]}>
                <Text style={styles.headerLabel}> </Text><Text style={styles.headerDate}> </Text>
                <View style={styles.subHeaderArea}>
                  <Text style={[styles.subHeaderText, { flex: 1 }]}>Dist/Reps</Text>
                </View>
              </View>
              <View style={[styles.headerCell, { width: 60 }]}>
                <Text style={styles.headerLabel}> </Text><Text style={styles.headerDate}> </Text>
                <View style={styles.subHeaderArea}>
                  <Text style={[styles.subHeaderText, { flex: 1 }]}>Tempo</Text>
                </View>
              </View>
              <View style={[styles.headerCell, { width: 100, backgroundColor: T.surfaceAlt }]}>
                <Text style={styles.headerLabel}>Avaliação Anterior</Text><Text style={styles.headerDate}>{datePrev}</Text>
                <View style={styles.subHeaderArea}>
                  <Text style={[styles.subHeaderText, { flex: 1 }]}>Dist/Reps</Text><Text style={[styles.subHeaderText, { flex: 1 }]}>Tempo</Text>
                </View>
              </View>
              <View style={[styles.headerCell, { width: 180 }]}>
                <Text style={styles.headerLabel}>Evolução no Período</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
                  <Text style={styles.headerDate}>{daysPrev} Dias</Text><Text style={styles.headerDate}>{daysInit} Dias</Text>
                </View>
                <View style={styles.subHeaderArea}>
                  <Text style={[styles.subHeaderText, { flex: 1, color: T.blue }]}>x Anterior</Text>
                  <Text style={[styles.subHeaderText, { flex: 1, color: T.blue }]}>x Total</Text>
                </View>
                <View style={styles.subHeaderArea}>
                  <Text style={[styles.subHeaderText, { flex: 1 }]}>D/R | Tmp</Text><Text style={[styles.subHeaderText, { flex: 1 }]}>D/R | Tmp</Text>
                </View>
              </View>
            </View>
            {condCurr.endurance.map((item: any, i: number) => {
              const prevItem = condPrev?.endurance?.find((p: any) => normalizeExerciseName(p.test_type) === normalizeExerciseName(item.test_type));
              const initItem = condInit?.endurance?.find((p: any) => normalizeExerciseName(p.test_type) === normalizeExerciseName(item.test_type));
              const currVal1 = item.distance_m ?? item.repetitions ?? '-';
              const prevVal1 = prevItem?.distance_m ?? prevItem?.repetitions ?? '-';
              const initVal1 = initItem?.distance_m ?? initItem?.repetitions ?? '-';
              const currVal2 = item.time_seconds ?? '-';
              const prevVal2 = prevItem?.time_seconds ?? '-';
              const initVal2 = initItem?.time_seconds ?? '-';
              const diff1Prev = getDiff(currVal1, prevVal1);
              const diff2Prev = getDiff(currVal2, prevVal2);
              const diff1Init = getDiff(currVal1, initVal1);
              const diff2Init = getDiff(currVal2, initVal2);

              return (
                <View key={i} style={[styles.dataRow, i % 2 === 0 && styles.rowEven]}>
                  <View style={[styles.dataCell, { width: 130 }]}>
                    <Text style={[styles.exerciseText]} numberOfLines={1}>{item.test_type}</Text>
                  </View>
                  <View style={[styles.dataCell, { width: 60 }]}>
                    <Text style={[styles.valueText]}>{currVal1}</Text>
                  </View>
                  <View style={[styles.dataCell, { width: 60 }]}>
                    <Text style={[styles.valueText]}>{currVal2}</Text>
                  </View>
                  <View style={[styles.dataCell, { width: 100, flexDirection: 'row', backgroundColor: T.surfaceAlt }]}>
                    <Text style={[styles.valueText, { flex: 1, color: T.t3 }]}>{prevVal1}</Text>
                    <Text style={[styles.valueText, { flex: 1, color: T.t3 }]}>{prevVal2}</Text>
                  </View>
                  <View style={[styles.dataCell, { width: 180, flexDirection: 'row' }]}>
                    <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'center' }}>
                      {diff1Prev === "-" && diff2Prev === "-" ? (
                        <Text style={[styles.diffText, { color: T.t3 }]}>-</Text>
                      ) : (
                        <><Text style={[styles.diffText, { color: getDiffColor(diff1Prev) }]}>{diff1Prev}</Text><Text style={styles.divider}>|</Text><Text style={[styles.diffText, { color: getDiffColor(diff2Prev, true) }]}>{diff2Prev}</Text></>
                      )}
                    </View>
                    <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'center' }}>
                      {diff1Init === "-" && diff2Init === "-" ? (
                        <Text style={[styles.diffText, { color: T.t3 }]}>-</Text>
                      ) : (
                        <><Text style={[styles.diffText, { color: getDiffColor(diff1Init) }]}>{diff1Init}</Text><Text style={styles.divider}>|</Text><Text style={[styles.diffText, { color: getDiffColor(diff2Init, true) }]}>{diff2Init}</Text></>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderMobilityCard = (currentAss: any, previousAss: any, initialAss: any) => {
    const condCurr = currentAss.conditioning[0];
    const condPrev = previousAss ? previousAss.conditioning[0] : null;
    const condInit = initialAss ? initialAss.conditioning[0] : null;

    if (!condCurr.mobility || condCurr.mobility.length === 0) return null;

    const dateCurr = formatDate(currentAss.date);
    const datePrev = previousAss ? formatDate(previousAss.date) : "--/--/--";
    const daysPrev = previousAss ? calcDays(currentAss.date, previousAss.date) : 0;
    const daysInit = initialAss ? calcDays(currentAss.date, initialAss.date) : 0;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}><Text style={styles.cardTitle}>Mobilidade e Estabilidade</Text></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.tableContainer}>
            <View style={styles.headerRow}>
              <View style={[styles.headerCell, { width: 130 }]}>
                <Text style={styles.headerLabel}>Data da Última</Text><Text style={styles.headerDate}>{dateCurr}</Text>
                <View style={styles.subHeaderArea}>
                  <Text style={[styles.subHeaderText, { flex: 1, textAlign: 'left' }]}>Exercício</Text>
                </View>
              </View>
              <View style={[styles.headerCell, { width: 120 }]}>
                <Text style={styles.headerLabel}> </Text><Text style={styles.headerDate}> </Text>
                <View style={styles.subHeaderArea}>
                  <Text style={[styles.subHeaderText, { flex: 1 }]}>Resultado</Text>
                </View>
              </View>
              <View style={[styles.headerCell, { width: 100, backgroundColor: T.surfaceAlt }]}>
                <Text style={styles.headerLabel}>Avaliação Anterior</Text><Text style={styles.headerDate}>{datePrev}</Text>
                <View style={styles.subHeaderArea}>
                  <Text style={[styles.subHeaderText, { flex: 1 }]}>Resultado</Text>
                </View>
              </View>
              <View style={[styles.headerCell, { width: 180 }]}>
                <Text style={styles.headerLabel}>Evolução no Período</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
                  <Text style={styles.headerDate}>{daysPrev} Dias</Text><Text style={styles.headerDate}>{daysInit} Dias</Text>
                </View>
                <View style={styles.subHeaderArea}>
                  <Text style={[styles.subHeaderText, { flex: 1, color: T.blue }]}>x Anterior</Text>
                  <Text style={[styles.subHeaderText, { flex: 1, color: T.blue }]}>x Total</Text>
                </View>
                <View style={styles.subHeaderArea}>
                  <Text style={[styles.subHeaderText, { flex: 1 }]}>Evolução</Text>
                  <Text style={[styles.subHeaderText, { flex: 1 }]}>Evolução</Text>
                </View>
              </View>
            </View>

            {condCurr.mobility.map((item: any, i: number) => {
              const prevItem = condPrev?.mobility?.find((p: any) => normalizeExerciseName(p.test_name) === normalizeExerciseName(item.test_name));
              const initItem = condInit?.mobility?.find((p: any) => normalizeExerciseName(p.test_name) === normalizeExerciseName(item.test_name));
              const currVal = item.notes ?? '-';
              const prevVal = prevItem?.notes ?? '-';
              const initVal = initItem?.notes ?? '-';
              const diffPrev = getDiff(currVal, prevVal);
              const diffInit = getDiff(currVal, initVal);

              return (
                <View key={i} style={[styles.dataRow, i % 2 === 0 && styles.rowEven]}>
                  <View style={[styles.dataCell, { width: 130 }]}>
                    <Text style={[styles.exerciseText]} numberOfLines={1}>{item.test_name}</Text>
                  </View>
                  <View style={[styles.dataCell, { width: 120 }]}>
                    <Text style={[styles.valueText]}>{currVal}</Text>
                  </View>
                  <View style={[styles.dataCell, { width: 100, flexDirection: 'row', backgroundColor: T.surfaceAlt }]}>
                    <Text style={[styles.valueText, { flex: 1, color: T.t3 }]}>{prevVal}</Text>
                  </View>
                  <View style={[styles.dataCell, { width: 180, flexDirection: 'row' }]}>
                    <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'center' }}>
                      <Text style={[styles.diffText, { color: diffPrev === "-" ? T.t3 : getDiffColor(diffPrev) }]}>{diffPrev}</Text>
                    </View>
                    <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'center' }}>
                      <Text style={[styles.diffText, { color: diffInit === "-" ? T.t3 : getDiffColor(diffInit) }]}>{diffInit}</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
    );
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={T.blue} /></View>;
  }

  if (history.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>Nenhum teste encontrado</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={{ color: T.white, fontWeight: "bold" }}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentAss = history[selectedIndex];
  const previousAss = history.length > selectedIndex + 1 ? history[selectedIndex + 1] : null;
  const initialAss = history.length > 1 ? history[history.length - 1] : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg, paddingTop: Platform.OS === "android" ? 40 : 0 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 16 }}>
          <Text style={{ color: T.blue, fontWeight: "700" }}>← Voltar para {clientName}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Condicionamento Físico</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
        <StrengthDotMatrixChart
          assessments={history}
          periodDays={history.length > 1 ? calcDays(history[0].date, history[1].date) : 0}
        />
        {renderStrengthCard(currentAss, previousAss, initialAss)}
        <EnduranceDotMatrixChart
          assessments={history}
          periodDays={history.length > 1 ? calcDays(history[0].date, history[1].date) : 0}
        />
        {renderEnduranceCard(currentAss, previousAss, initialAss)}
        {renderMobilityCard(currentAss, previousAss, initialAss)}

        <Text style={styles.listTitle}>📅 Histórico de Avaliações</Text>
        {history.map((assessment, index) => (
          <View key={assessment.id} style={[styles.historyItem, selectedIndex === index && styles.historyItemActive]}>
            <View>
              <Text style={[styles.historyDate, selectedIndex === index && { color: T.blue }]}>{formatDate(assessment.date)}</Text>
              {index === 0 && <Text style={styles.historyTag}>Mais Recente</Text>}
            </View>

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                style={[styles.detailsBtn, selectedIndex === index && styles.detailsBtnActive]}
                onPress={() => setSelectedIndex(index)}
              >
                <Text style={[styles.detailsBtnText, selectedIndex === index && { color: T.white }]}>
                  {selectedIndex === index ? "Em Exibição" : "Ver Detalhes"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.detailsBtn, { backgroundColor: T.orange, paddingHorizontal: 12 }]}
                onPress={() => router.push({
                  pathname: "/assessments/conditioning",
                  params: { client_id: client_id, assessment_id: assessment.id }
                } as any)}
              >
                <Text style={[styles.detailsBtnText, { color: T.white }]}>✏️ Editar</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: T.bg, padding: 20 },
  backBtn: { backgroundColor: T.blue, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8, marginTop: 20 },
  emptyTitle: { fontSize: 20, fontWeight: "bold", color: T.t1 },
  header: { paddingHorizontal: 20, paddingBottom: 16, paddingTop: 10, backgroundColor: T.card, borderBottomWidth: 1, borderBottomColor: T.border },
  title: { fontSize: 24, fontWeight: "900", color: T.t1, letterSpacing: -0.5 },

  card: { backgroundColor: T.card, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: T.border, overflow: "hidden" },
  cardHeader: { backgroundColor: T.bgAlt, padding: 12 },
  cardTitle: { color: T.white, fontSize: 16, fontWeight: "800", textTransform: "uppercase" },

  tableContainer: { flexDirection: 'column', minWidth: 460 },
  headerRow: { flexDirection: 'row', borderBottomWidth: 2, borderBottomColor: T.border, backgroundColor: T.card },
  headerCell: { padding: 10, borderRightWidth: 1, borderRightColor: T.border },
  headerLabel: { fontSize: 11, fontWeight: "700", color: T.t3, textTransform: "uppercase", marginBottom: 4 },
  headerDate: { fontSize: 13, fontWeight: "800", color: T.t1 },

  subHeaderArea: { flexDirection: 'row', marginTop: 8, justifyContent: 'space-between' },
  subHeaderText: { fontSize: 10, fontWeight: "700", color: T.t3, textAlign: 'center' },

  dataRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: T.border },
  rowEven: { backgroundColor: T.bgAlt },
  dataCell: { paddingVertical: 12, paddingHorizontal: 10, borderRightWidth: 1, borderRightColor: T.border, alignItems: 'center' },

  exerciseText: { fontSize: 13, fontWeight: "700", color: T.t1, textAlign: 'left' },
  valueText: { fontSize: 13, fontWeight: "600", color: T.t2, textAlign: 'center' },
  diffText: { fontSize: 12, fontWeight: "800", textAlign: 'center' },
  divider: { fontSize: 12, color: T.t4, marginHorizontal: 4 },

  listTitle: { fontSize: 18, fontWeight: "800", color: T.t1, marginTop: 10, marginBottom: 12, marginLeft: 4 },
  historyItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: T.card, padding: 16, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: T.border },
  historyItemActive: { borderColor: T.blue, backgroundColor: T.blueGlow },
  historyDate: { fontSize: 16, fontWeight: "800", color: T.t2 },
  historyTag: { fontSize: 10, color: T.t3, fontWeight: "600", marginTop: 2 },
  detailsBtn: { backgroundColor: T.surfaceAlt, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  detailsBtnActive: { backgroundColor: T.blue },
  detailsBtnText: { fontSize: 12, fontWeight: "700", color: T.t3 },
});
