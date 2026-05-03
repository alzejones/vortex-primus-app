// ============================================================
// components/ScienceReferencesModal.tsx
// Botão de rodapé + Modal com referências científicas do
// protocolo High Protein adotado no Vortex Primus.
//
// Uso em client-diet.tsx:
//   import ScienceReferencesModal from "../../components/ScienceReferencesModal";
//   {dietResult && <ScienceReferencesModal />}
// ============================================================

import { useState } from "react";
import {
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { T } from "../utils/theme";

const REFERENCES = [
  {
    id: 1,
    tag: "BMR",
    title: "Mifflin-St Jeor Equation",
    authors: "Mifflin MD, St Jeor ST, Hill LA, Scott BJ, Daugherty SA, Koh YO.",
    journal: "American Journal of Clinical Nutrition, 1990;51(2):241–247.",
    description:
      "Validou a equação preditiva para Taxa Metabólica Basal (BMR) em adultos saudáveis. Considerada o padrão-ouro clínico atual por apresentar margem de erro de ±10%, superando Harris-Benedict em populações contemporâneas.",
    doi: "https://doi.org/10.1093/ajcn/51.2.241",
  },
  {
    id: 2,
    tag: "ISSN",
    title: "ISSN Position Stand: Protein and Exercise",
    authors: "Jäger R, Kerksick CM, Campbell BI, et al.",
    journal: "Journal of the International Society of Sports Nutrition, 2017;14:20.",
    description:
      "Posicionamento oficial da Sociedade Internacional de Nutrição Esportiva. Recomenda até 3,1 g/kg de massa magra para atletas em déficit calórico. Base principal para os alvos de proteína deste aplicativo.",
    doi: "https://doi.org/10.1186/s12970-017-0177-8",
  },
  {
    id: 3,
    tag: "Emagrecimento",
    title: "Increased Dietary Protein During Caloric Restriction",
    authors: "Helms ER, Zinn C, Rowlands DS, Brown SR.",
    journal: "International Journal of Sport Nutrition and Exercise Metabolism, 2014;24(2):190–198.",
    description:
      "Demonstrou que atletas em déficit calórico necessitam de 2,3–3,1 g/kg de LBM para preservação máxima de massa muscular. Alvo de 2,7 g/kg LBM adotado para Emagrecimento.",
    doi: "https://doi.org/10.1123/ijsnem.2013-0054",
  },
  {
    id: 4,
    tag: "Hipertrofia",
    title: "Effect of Protein Supplementation on Resistance Training Gains",
    authors: "Morton RW, Murphy KT, McKellar SR, et al.",
    journal: "British Journal of Sports Medicine, 2018;52(6):376–384.",
    description:
      "Meta-análise com 49 estudos e 1.800+ participantes. Recomenda 2,6–2,8 g/kg LBM para resposta anabólica ótima ao treinamento de força.",
    doi: "https://doi.org/10.1136/bjsports-2017-097608",
  },
  {
    id: 5,
    tag: "Manutenção",
    title: "Dietary Protein for Athletes: From Requirements to Optimum Adaptation",
    authors: "Phillips SM, Van Loon LJC.",
    journal: "Journal of Sports Sciences, 2011;29(Sup1):S29–S38.",
    description:
      "Estabelece 1,6–2,2 g/kg de LBM como faixa para manutenção de massa muscular em atletas. Alvo de 2,2 g/kg LBM garante suporte à função imune e hormonal.",
    doi: "https://doi.org/10.1080/02640414.2011.619204",
  },
  {
    id: 6,
    tag: "Recomposição",
    title: "Body Recomposition: Can Trained Individuals Build Muscle and Lose Fat Simultaneously?",
    authors: "Barakat C, Pearson J, Escalante G, Campbell B, De Souza EO.",
    journal: "Strength & Conditioning Journal, 2020;42(5):7–21.",
    description:
      "Demonstra que recomposição corporal simultânea é possível com ≥2,6 g/kg LBM mesmo em equilíbrio calórico. Suporta os alvos de Emagrecimento e Saúde.",
    doi: "https://doi.org/10.1519/SSC.0000000000000584",
  },
  {
    id: 7,
    tag: "Performance",
    title: "Toward a Common Understanding of Diet, Exercise, and Performance",
    authors: "Burke LM, Hawley JA, Wong SHS, Jeukendrup AE.",
    journal: "European Journal of Sport Science, 2019;19(1):115–129.",
    description:
      "Recomenda 2,4–3,0 g/kg LBM para atletas de alta intensidade. Suporta o alvo de 2,6 g/kg LBM adotado para Performance.",
    doi: "https://doi.org/10.1080/17461391.2018.1537645",
  },
];

const TAG_COLORS: Record<string, string> = {
  BMR:           "#94a3b8",
  ISSN:          T.blue,
  Emagrecimento: T.red,
  Hipertrofia:   T.green,
  Manutenção:    T.orange,
  Recomposição:  "#a78bfa",
  Performance:   "#f472b6",
};

export default function ScienceReferencesModal() {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <TouchableOpacity
        style={styles.footerBtn}
        onPress={() => setVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.footerIcon}>🔬</Text>
        <Text style={styles.footerText}>
          Protocolo High Protein · Ver embasamento científico
        </Text>
        <Text style={styles.footerChevron}>›</Text>
      </TouchableOpacity>

      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitle}>🔬 Embasamento Científico</Text>
              <Text style={styles.modalSubtitle}>
                Protocolo High Protein — Vortex Primus
              </Text>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setVisible(false)}
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.introCard}>
            <Text style={styles.introText}>
              Os cálculos seguem o{" "}
              <Text style={styles.introBold}>
                protocolo de dieta hiperproteica (High Protein)
              </Text>
              , com metas de proteína definidas sobre a{" "}
              <Text style={styles.introBold}>massa magra (LBM)</Text> de cada
              aluno, conforme as referências abaixo.
            </Text>
          </View>

          <ScrollView
            style={styles.refList}
            contentContainerStyle={{ paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          >
            {REFERENCES.map((ref) => (
              <View key={ref.id} style={styles.refCard}>
                <View style={styles.refCardTop}>
                  <View
                    style={[
                      styles.refTag,
                      {
                        backgroundColor: (TAG_COLORS[ref.tag] ?? T.blue) + "22",
                        borderColor: (TAG_COLORS[ref.tag] ?? T.blue) + "55",
                      },
                    ]}
                  >
                    <Text style={[styles.refTagText, { color: TAG_COLORS[ref.tag] ?? T.blue }]}>
                      {ref.tag}
                    </Text>
                  </View>
                  <Text style={styles.refNum}>[{ref.id}]</Text>
                </View>
                <Text style={styles.refTitle}>{ref.title}</Text>
                <Text style={styles.refAuthors}>{ref.authors}</Text>
                <Text style={styles.refJournal}>{ref.journal}</Text>
                <Text style={styles.refDesc}>{ref.description}</Text>
                <TouchableOpacity onPress={() => Linking.openURL(ref.doi)} activeOpacity={0.7}>
                  <Text style={styles.refLink}>🔗 Acessar estudo (DOI)</Text>
                </TouchableOpacity>
              </View>
            ))}
            <Text style={styles.disclaimer}>
              * Os alvos são estimativas baseadas em evidências populacionais.
              Recomenda-se validação com nutricionista para casos clínicos específicos.
            </Text>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  footerBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(59,130,246,0.07)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.2)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    gap: 8,
  },
  footerIcon: { fontSize: 16 },
  footerText: { flex: 1, color: T.blue, fontSize: 12, fontWeight: "600" },
  footerChevron: { color: T.blue, fontSize: 18, fontWeight: "700" },

  modalContainer: { flex: 1, backgroundColor: T.bg },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    paddingTop: 24,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  modalTitle: { fontSize: 20, fontWeight: "800", color: T.t1 },
  modalSubtitle: { fontSize: 12, color: T.t3, marginTop: 2 },
  closeBtn: {
    backgroundColor: T.surfaceAlt,
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: T.border,
  },
  closeBtnText: { color: T.t1, fontSize: 16, fontWeight: "700" },

  introCard: {
    backgroundColor: "rgba(59,130,246,0.07)",
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.2)",
  },
  introText: { color: T.t2, fontSize: 13, lineHeight: 20 },
  introBold: { color: T.t1, fontWeight: "700" },

  refList: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },
  refCard: {
    backgroundColor: T.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: T.border,
  },
  refCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  refTag: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1 },
  refTagText: { fontSize: 11, fontWeight: "800" },
  refNum: { fontSize: 11, color: T.t3, fontWeight: "600" },
  refTitle: { fontSize: 14, fontWeight: "800", color: T.t1, marginBottom: 4, lineHeight: 20 },
  refAuthors: { fontSize: 12, color: T.t2, fontStyle: "italic", marginBottom: 2, lineHeight: 17 },
  refJournal: { fontSize: 11, color: T.blue, fontWeight: "600", marginBottom: 8 },
  refDesc: { fontSize: 12, color: T.t2, lineHeight: 18, marginBottom: 10 },
  refLink: { fontSize: 12, color: T.blue, fontWeight: "700", textDecorationLine: "underline" },
  disclaimer: {
    fontSize: 11,
    color: T.t3,
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 8,
    lineHeight: 16,
  },
});