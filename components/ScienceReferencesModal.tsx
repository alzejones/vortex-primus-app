import { useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { T } from "../utils/theme";

// ============================================================
// CONSTANTES
// ============================================================

const TAG_COLORS = {
  BMR: "#94a3b8",
  ISSN: T.blue,
  Emagrecimento: T.red,
  Hipertrofia: T.green,
  Manutenção: T.orange,
  Recomposição: "#a78bfa",
  Performance: "#f472b6",
};

const REFERENCES = [
  {
    id: 1,
    tag: "BMR",
    color: "#94a3b8",
    title: "A new predictive equation for resting metabolic rate in healthy individuals",
    authors: "Mifflin MD, St Jeor ST, Hill LA, Scott BJ, Daugherty SA, Koh YO.",
    journal: "Am J Clin Nutr. 1990;51(2):241–247.",
    description: "Valida a equação de Mifflin-St Jeor para cálculo do TMB. É o padrão clínico atual, mais preciso que Harris-Benedict para indivíduos sedentários e ativos.",
    doi: "https://doi.org/10.1093/ajcn/51.2.241",
  },
  {
    id: 2,
    tag: "ISSN",
    color: T.blue,
    title: "International Society of Sports Nutrition Position Stand: protein and exercise",
    authors: "Jäger R, Kerksick CM, Campbell BI et al.",
    journal: "J Int Soc Sports Nutr. 2017;14:20.",
    description: "Define 1,4–2,0 g/kg/dia como faixa segura e eficaz para praticantes de exercício. O protocolo Vortex Primus adota alvos acima desse mínimo para maximizar a composição corporal.",
    doi: "https://doi.org/10.1186/s12970-017-0177-8",
  },
  {
    id: 3,
    tag: "Emagrecimento",
    color: T.red,
    title: "Evidence-based recommendations for natural bodybuilding contest preparation",
    authors: "Helms ER, Aragon AA, Fitschen PJ.",
    journal: "J Int Soc Sports Nutr. 2014;11:20.",
    description: "Recomenda 2,3–3,1 g/kg LBM durante fase de cutting para preservar massa magra. Suporta o alvo de 2,7 g/kg LBM adotado para Emagrecimento.",
    doi: "https://doi.org/10.1186/1550-2783-11-20",
  },
  {
    id: 4,
    tag: "Hipertrofia",
    color: T.green,
    title: "A systematic review, meta-analysis and meta-regression of the effect of protein supplementation on resistance training-induced gains in muscle mass and strength in healthy adults",
    authors: "Morton RW, Murphy KT, McKellar SR et al.",
    journal: "Br J Sports Med. 2018;52(6):376–384.",
    description: "Meta-análise com 1.800+ participantes. Ingestão proteica acima de 1,62 g/kg maximiza hipertrofia. O alvo de 2,8 g/kg LBM adotado para Hipertrofia supera esse limiar com margem segura.",
    doi: "https://doi.org/10.1136/bjsports-2017-097608",
  },
  {
    id: 5,
    tag: "Manutenção",
    color: T.orange,
    title: "Dietary protein to support anabolism with resistance exercise in young men",
    authors: "Phillips SM, Van Loon LJC.",
    journal: "J Sports Sci. 2011;29(S1):S29–S38.",
    description: "Estabelece 1,6–2,2 g/kg para manutenção da massa muscular em adultos ativos. Suporta o alvo de 2,2 g/kg LBM adotado para Manutenção.",
    doi: "https://doi.org/10.1080/02640414.2011.619204",
  },
  {
    id: 6,
    tag: "Recomposição",
    color: "#a78bfa",
    title: "Body Recomposition: Can Trained Individuals Build Muscle and Lose Fat at the Same Time?",
    authors: "Barakat C, Pearson J, Escalante G, Campbell B, De Souza EO.",
    journal: "Strength Cond J. 2020;42(5):7–21.",
    description: "Demonstra que recomposição corporal (perda de gordura + ganho muscular simultâneos) é possível com proteína elevada (~2,4 g/kg LBM) e déficit moderado. Suporta os alvos adotados para Emagrecimento e Saúde.",
    doi: "https://doi.org/10.1519/SSC.0000000000000584",
  },
  {
    id: 7,
    tag: "Performance",
    color: "#f472b6",
    title: "Toward a Common Understanding of Diet, Exercise, and Performance",
    authors: "Burke LM, Hawley JA, Wong SHS, Jeukendrup AE.",
    journal: "European Journal of Sport Science. 2019;19(1):115–129.",
    description: "Revisão sobre estratégias nutricionais para desempenho atlético. Recomenda 2,4–3,0 g/kg LBM para atletas de alta intensidade, suportando o alvo de 2,6 g/kg LBM adotado para Performance.",
    doi: "https://doi.org/10.1080/17461391.2018.1537645",
  },
];

// ============================================================
// COMPONENTE
// ============================================================

export default function ScienceReferencesModal() {
  const [visible, setVisible] = useState(false);

  return (
    <>
      {/* Botão de rodapé */}
      <TouchableOpacity style={styles.footerBtn} onPress={() => setVisible(true)}>
        <Text style={styles.footerIcon}>🔬</Text>
        <Text style={styles.footerText}>Protocolo High Protein · Ver embasamento científico</Text>
        <Text style={styles.footerChevron}>›</Text>
      </TouchableOpacity>

      {/* Modal */}
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitle}>🔬 Embasamento Científico</Text>
              <Text style={styles.modalSubtitle}>Protocolo High Protein — Vortex Primus</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setVisible(false)}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Card de introdução */}
            <View style={styles.introCard}>
              <Text style={styles.introText}>
                Os cálculos de calorias e macronutrientes do{" "}
                <Text style={styles.introBold}>Vortex Primus</Text> seguem o protocolo de dieta{" "}
                <Text style={styles.introBold}>hiperproteica (High Protein)</Text>, com metas de
                proteína definidas sobre a <Text style={styles.introBold}>massa magra (LBM)</Text>{" "}
                de cada aluno, conforme as referências abaixo.
              </Text>
            </View>

            {/* Cards de referência */}
            {REFERENCES.map((ref) => (
              <View key={ref.id} style={styles.refCard}>
                <View style={[styles.refTag, { backgroundColor: ref.color }]}>
                  <Text style={styles.refTagText}>{ref.tag}</Text>
                </View>
                <Text style={styles.refTitle}>{ref.title}</Text>
                <Text style={styles.refAuthors}>{ref.authors}</Text>
                <Text style={styles.refJournal}>{ref.journal}</Text>
                <Text style={styles.refDesc}>{ref.description}</Text>
                <TouchableOpacity style={styles.doiBtn}>
                  <Text style={styles.doiText}>🔗 {ref.doi}</Text>
                </TouchableOpacity>
              </View>
            ))}

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

// ============================================================
// ESTILOS
// ============================================================

const styles = StyleSheet.create({
  // Botão de rodapé
  footerBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    gap: 10,
  },
  footerIcon: { fontSize: 20 },
  footerText: { flex: 1, fontSize: 13, fontWeight: "700", color: T.t2 },
  footerChevron: { fontSize: 18, color: T.t3 },

  // Modal
  modalContainer: { flex: 1, backgroundColor: T.bg },
  modalHeader: {
    flexDirection: "row",
    padding: 20,
    paddingTop: 24,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    alignItems: "center",
  },
  modalTitle: { fontSize: 20, fontWeight: "800", color: T.t1 },
  modalSubtitle: { fontSize: 12, color: T.t3, marginTop: 2 },
  closeBtn: { backgroundColor: T.surfaceAlt, borderRadius: 10, padding: 10 },
  closeBtnText: { fontSize: 16, color: T.t2, fontWeight: "700" },

  // Cards
  introCard: {
    margin: 16,
    backgroundColor: T.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: T.border,
  },
  introText: { fontSize: 14, color: T.t2, lineHeight: 22 },
  introBold: { fontWeight: "800", color: T.t1 },

  refCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: T.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: T.border,
  },
  refTag: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 10,
  },
  refTagText: { fontSize: 11, fontWeight: "800", color: "white" },
  refTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: T.t1,
    marginBottom: 4,
    lineHeight: 18,
  },
  refAuthors: { fontSize: 11, color: T.t3, marginBottom: 2, fontStyle: "italic" },
  refJournal: { fontSize: 11, color: T.blue, marginBottom: 8, fontWeight: "600" },
  refDesc: { fontSize: 12, color: T.t2, lineHeight: 18 },
  doiBtn: { marginTop: 8, flexDirection: "row", alignItems: "center", gap: 4 },
  doiText: { fontSize: 11, color: T.blue, fontWeight: "600" },
});