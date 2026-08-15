import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { T } from "../utils/theme";

export interface CoachQuestionnaireData {
  grupo: string;
  objetivos: string[];
  objetivos_outros: string;
  peso_bem_estar: string;
  momento_afastamento: string;
  tamanho_roupa_feliz: string;
  partes_corpo_melhorar: string;
  evento_planejado: string;
  peca_guarda_roupa: string;
  maior_desafio_comida: string;
  como_se_sentiria: string;
  motivacao_atual: string;
  escala_prontidao: number | null;
  nota_avaliacao_bem_estar: number | null;
  indicacoes: Array<{ nome: string; parentesco: string; whatsapp: string }>;
  notas: string;
}

interface CoachQuestionnaireFormProps {
  value: CoachQuestionnaireData;
  onChange: (data: CoachQuestionnaireData) => void;
  onGoToAssessment: () => void;
}

const OBJETIVOS_OPTIONS = [
  "Emagrecer",
  "Tonificar/Perder gordura",
  "Melhorar a saúde e bem-estar",
  "Aumentar a energia",
  "Ganhar massa muscular",
  "Melhorar desempenho esportivo",
];

export function CoachQuestionnaireForm({
  value,
  onChange,
  onGoToAssessment,
}: CoachQuestionnaireFormProps) {
  const handleChange = (field: keyof CoachQuestionnaireData, val: any) => {
    onChange({ ...value, [field]: val });
  };

  const toggleObjetivo = (objetivo: string) => {
    const current = value.objetivos || [];
    const newObjetivos = current.includes(objetivo)
      ? current.filter((o) => o !== objetivo)
      : [...current, objetivo];
    handleChange("objetivos", newObjetivos);
  };

  const updateIndicacao = (index: number, field: "nome" | "parentesco" | "whatsapp", val: string) => {
    const newIndicacoes = [...value.indicacoes];
    while (newIndicacoes.length <= index) {
      newIndicacoes.push({ nome: "", parentesco: "", whatsapp: "" });
    }
    newIndicacoes[index] = { ...newIndicacoes[index], [field]: val };
    handleChange("indicacoes", newIndicacoes);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={true}>
      {/* BOAS VINDAS */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>BOAS VINDAS (Conte sua história)</Text>
        <Text style={styles.infoText}>
          Que bom ter você aqui c/ a gente hoje!{"\n\n"}
          Vamos conversar rapidinho sobre sua saúde e estilo de vida.{"\n\n"}
          A ideia é entender seus objetivos e como podemos te ajudar de uma forma simples, segura e personalizada. <Text style={styles.bold}>Tudo bem pra você?</Text>
          {"\n\n"}
          No clube nos concentramos em 2 coisas:{"\n"}
          #1 SOMOS ORIENTADOS POR RESULTADOS{"\n"}
          #2 AJUDAMOS AS PESSOAS A MUDAR SEUS HÁBITOS DIARIAMENTE{"\n\n"}
          Então conseguimos ajudar 3 grupos: Emagrecimento & Transformação corporal, Bem-Estar & Energia e Desempenho esportivo.
        </Text>
        <Text style={styles.label}>Então, em qual grupo você se encaixa?</Text>
        <TextInput
          style={styles.input}
          value={value.grupo}
          onChangeText={(v) => handleChange("grupo", v)}
          placeholder="Ex: Emagrecimento & Transformação corporal"
          placeholderTextColor={T.t3}
          multiline
        />
      </View>

      {/* OBJETIVOS */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>OBJETIVOS</Text>
        <Text style={styles.label}>Quais são atualmente os seus principais objetivos físicos e de bem-estar?</Text>
        {OBJETIVOS_OPTIONS.map((objetivo) => (
          <TouchableOpacity
            key={objetivo}
            style={[
              styles.checkboxBtn,
              (value.objetivos || []).includes(objetivo) && styles.checkboxBtnActive,
            ]}
            onPress={() => toggleObjetivo(objetivo)}
          >
            <View style={[
              styles.checkbox,
              (value.objetivos || []).includes(objetivo) && styles.checkboxActive,
            ]}>
              {(value.objetivos || []).includes(objetivo) && <Text style={styles.checkboxCheck}>✓</Text>}
            </View>
            <Text style={[
              styles.checkboxText,
              (value.objetivos || []).includes(objetivo) && styles.checkboxTextActive,
            ]}>
              {objetivo}
            </Text>
          </TouchableOpacity>
        ))}
        <Text style={[styles.label, { marginTop: 12 }]}>Outros objetivos:</Text>
        <TextInput
          style={styles.input}
          value={value.objetivos_outros}
          onChangeText={(v) => handleChange("objetivos_outros", v)}
          placeholder="Descreva outros objetivos..."
          placeholderTextColor={T.t3}
          multiline
        />
      </View>

      {/* CONEXÃO */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>CONEXÃO</Text>

        <Text style={styles.label}>Com quantos quilos você se sente bem?</Text>
        <TextInput
          style={styles.input}
          value={value.peso_bem_estar}
          onChangeText={(v) => handleChange("peso_bem_estar", v)}
          placeholder="Ex: 70kg"
          placeholderTextColor={T.t3}
        />

        <Text style={styles.label}>Qual foi o momento que começou a perceber que estava se afastando desse peso?</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={value.momento_afastamento}
          onChangeText={(v) => handleChange("momento_afastamento", v)}
          placeholder="Descreva o momento..."
          placeholderTextColor={T.t3}
          multiline
          numberOfLines={3}
        />

        <Text style={styles.label}>Qual tamanho de roupa te deixa feliz?</Text>
        <TextInput
          style={styles.input}
          value={value.tamanho_roupa_feliz}
          onChangeText={(v) => handleChange("tamanho_roupa_feliz", v)}
          placeholder="Ex: M, 42, etc."
          placeholderTextColor={T.t3}
        />

        <Text style={styles.label}>Quais as 3 partes do seu corpo que gostaria de melhorar? (E por quê?)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={value.partes_corpo_melhorar}
          onChangeText={(v) => handleChange("partes_corpo_melhorar", v)}
          placeholder="Ex: Barriga (porque quero usar roupas mais justas)..."
          placeholderTextColor={T.t3}
          multiline
          numberOfLines={3}
        />

        <Text style={styles.label}>Você tem algum evento planejado para os próximos 3 a 6 meses?</Text>
        <TextInput
          style={styles.input}
          value={value.evento_planejado}
          onChangeText={(v) => handleChange("evento_planejado", v)}
          placeholder="Ex: Casamento, viagem, formatura..."
          placeholderTextColor={T.t3}
        />

        <Text style={styles.label}>Tem alguma peça no seu guarda-roupa que você gostaria de usar novamente? (Por quê? Qual a cor? Qual o tamanho?)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={value.peca_guarda_roupa}
          onChangeText={(v) => handleChange("peca_guarda_roupa", v)}
          placeholder="Ex: Vestido preto tamanho 38, porque me sentia linda..."
          placeholderTextColor={T.t3}
          multiline
          numberOfLines={3}
        />

        <Text style={styles.label}>Qual é seu maior desafio com relação à comida neste momento?</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={value.maior_desafio_comida}
          onChangeText={(v) => handleChange("maior_desafio_comida", v)}
          placeholder="Ex: Não consigo resistir a doces..."
          placeholderTextColor={T.t3}
          multiline
          numberOfLines={3}
        />
      </View>

      {/* RECAPITULAÇÃO */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>RECAPITULAÇÃO</Text>
        <Text style={styles.infoText}>
          (Fantástico!) Então o que vamos fazer agora é recapitular seus objetivos, apenas para garantirmos que esteja tudo certo. <Text style={styles.bold}>Tudo bem?</Text>
        </Text>

        <Text style={styles.label}>Como se sentiria alcançando esses objetivos?</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={value.como_se_sentiria}
          onChangeText={(v) => handleChange("como_se_sentiria", v)}
          placeholder="Descreva como se sentiria..."
          placeholderTextColor={T.t3}
          multiline
          numberOfLines={3}
        />

        <Text style={styles.label}>O que está te impulsionando a finalmente cuidar disto agora?</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={value.motivacao_atual}
          onChangeText={(v) => handleChange("motivacao_atual", v)}
          placeholder="Descreva sua motivação..."
          placeholderTextColor={T.t3}
          multiline
          numberOfLines={3}
        />

        <Text style={styles.label}>
          Em uma escala de 1 a 10, quão preparada você se sente agora para começar a fazer algumas mudanças diárias?
        </Text>
        <Text style={styles.hintText}>
          1 = não está pronta para fazer mudanças{"\n"}
          5 = talvez você esteja confortável{"\n"}
          8, 9 ou 10 = você acredita estar pronta para começar{"\n"}
          (Nós só trabalhamos com pessoas que estejam no nível 8 ou acima.)
        </Text>
        <View style={styles.scaleRow}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
            <TouchableOpacity
              key={num}
              style={[
                styles.scaleBtn,
                value.escala_prontidao === num && styles.scaleBtnActive,
              ]}
              onPress={() => handleChange("escala_prontidao", num)}
            >
              <Text style={[
                styles.scaleBtnText,
                value.escala_prontidao === num && styles.scaleBtnTextActive,
              ]}>
                {num}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.infoText}>
          E a razão pela qual perguntamos isso é que somos um ambiente orientados por resultados. Então se alguém não foi nota 8 ou superior, talvez o clube não seja p/ ele. Mas, você é nota <Text style={styles.bold}>{value.escala_prontidao || "__"}</Text>. Então isso é fantástico.
        </Text>
      </View>

      {/* BIOIMPEDÂNCIA & PASTA */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>BIOIMPEDÂNCIA & PASTA</Text>
        <Text style={styles.infoText}>
          O que vamos fazer agora é um escaneamento com uma balança de bioimpedância, para verificarmos seu bem-estar de dentro para fora. <Text style={styles.bold}>Tudo bem?</Text>
        </Text>
        <TouchableOpacity style={styles.assessmentBtn} onPress={onGoToAssessment} activeOpacity={0.85}>
          <Text style={styles.assessmentBtnText}>📊 Ir para Avaliação Física</Text>
        </TouchableOpacity>
      </View>

      {/* SOLUÇÃO 80/20 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>SOLUÇÃO 80/20</Text>
        <Text style={styles.infoText}>
          A maioria das pessoas quando querem perder peso, simplesmente deixa de comer para "baixar calorias" sem se preocupar na qualidade nutricional do que comem. Quando se faz isso sentem-se mal, ficam irritados e cansados.
          {"\n\n"}
          Com nosso plano baixaremos o consumo calórico ao mesmo tempo que aumentamos os nutrientes de sua dieta.
          {"\n\n"}
          <Text style={styles.bold}>Se seguir nossas orientações, 3 coisas vão acontecer:</Text>
          {"\n"}
          1. Aumento de energia;{"\n"}
          2. Não sentirá com fome;{"\n"}
          3. Seu corpo começará a mudar — sem parar, pois é algo comprovado pela ciência.
        </Text>
      </View>

      {/* 11 PASSOS */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>11 PASSOS</Text>
        <Text style={styles.infoText}>
          A última coisa que vou fazer é um pequeno tour pelo clube, para te mostrar exatamente o que você fará cada vez que vier ao clube. <Text style={styles.bold}>Vamos lá?</Text>
        </Text>
      </View>

      {/* APOIO */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>APOIO</Text>
        <Text style={styles.infoText}>
          Não se preocupe, vamos estar sempre juntos em toda a sua jornada rumo aos seus objetivos.
          {"\n\n"}
          <Text style={styles.bold}>E para garantirmos seus resultados, ainda teremos:</Text>
          {"\n"}
          1. Período de indução de 2 semanas;{"\n"}
          2. Mini seções de coaching individuais;{"\n"}
          3. e toda a comunidade de suporte.
        </Text>
      </View>

      {/* INDICAÇÕES */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>INDICAÇÕES</Text>
        <Text style={styles.label}>De 0 a 5, que nota daria para esta Avaliação de Bem-Estar?</Text>
        <View style={styles.scaleRow}>
          {[0, 1, 2, 3, 4, 5].map((num) => (
            <TouchableOpacity
              key={num}
              style={[
                styles.scaleBtn,
                value.nota_avaliacao_bem_estar === num && styles.scaleBtnActive,
              ]}
              onPress={() => handleChange("nota_avaliacao_bem_estar", num)}
            >
              <Text style={[
                styles.scaleBtnText,
                value.nota_avaliacao_bem_estar === num && styles.scaleBtnTextActive,
              ]}>
                {num}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.label, { marginTop: 16 }]}>
          Queremos te presentear com 5 vouchers de Avaliação de Bem-Estar Grátis:
        </Text>
        {[0, 1, 2, 3, 4].map((index) => (
          <View key={index} style={styles.indicacaoCard}>
            <Text style={styles.indicacaoTitle}>Indicação {index + 1}</Text>
            <Text style={styles.indicacaoLabel}>Nome:</Text>
            <TextInput
              style={styles.input}
              value={value.indicacoes[index]?.nome || ""}
              onChangeText={(v) => updateIndicacao(index, "nome", v)}
              placeholder="Nome completo"
              placeholderTextColor={T.t3}
            />
            <Text style={styles.indicacaoLabel}>Parentesco:</Text>
            <TextInput
              style={styles.input}
              value={value.indicacoes[index]?.parentesco || ""}
              onChangeText={(v) => updateIndicacao(index, "parentesco", v)}
              placeholder="Ex: Amigo, irmã, primo..."
              placeholderTextColor={T.t3}
            />
            <Text style={styles.indicacaoLabel}>WhatsApp:</Text>
            <TextInput
              style={styles.input}
              value={value.indicacoes[index]?.whatsapp || ""}
              onChangeText={(v) => updateIndicacao(index, "whatsapp", v)}
              placeholder="(__) _____-____"
              placeholderTextColor={T.t3}
              keyboardType="phone-pad"
            />
          </View>
        ))}
      </View>

      {/* NOTAS */}
      <View style={[styles.section, { marginBottom: 40 }]}>
        <Text style={styles.sectionTitle}>NOTAS</Text>
        <TextInput
          style={[styles.input, { minHeight: 120 }]}
          value={value.notas}
          onChangeText={(v) => handleChange("notas", v)}
          placeholder="Anotações adicionais do coach..."
          placeholderTextColor={T.t3}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.bg,
  },
  section: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: T.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: T.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: T.white,
    backgroundColor: "#2E7D32",
    padding: 12,
    marginBottom: 16,
    borderRadius: 8,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: T.t2,
    marginBottom: 8,
    marginTop: 4,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 22,
    color: T.t2,
    marginBottom: 12,
  },
  bold: {
    fontWeight: "700",
    color: T.t1,
  },
  hintText: {
    fontSize: 12,
    lineHeight: 18,
    color: T.t3,
    marginBottom: 12,
    fontStyle: "italic",
  },
  input: {
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 10,
    padding: 12,
    backgroundColor: T.surface,
    fontSize: 15,
    color: T.t1,
    marginBottom: 12,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  checkboxBtn: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: T.border,
    backgroundColor: T.surface,
    marginBottom: 8,
  },
  checkboxBtnActive: {
    backgroundColor: "rgba(33,150,243,0.08)",
    borderColor: T.blue,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: T.border,
    backgroundColor: T.surface,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxActive: {
    backgroundColor: T.blue,
    borderColor: T.blue,
  },
  checkboxCheck: {
    color: T.white,
    fontSize: 16,
    fontWeight: "700",
  },
  checkboxText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: T.t2,
  },
  checkboxTextActive: {
    color: T.t1,
  },
  scaleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  scaleBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: T.border,
    backgroundColor: T.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  scaleBtnActive: {
    backgroundColor: T.blue,
    borderColor: T.blue,
  },
  scaleBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: T.t2,
  },
  scaleBtnTextActive: {
    color: T.white,
  },
  assessmentBtn: {
    backgroundColor: T.blue,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  assessmentBtnText: {
    color: T.white,
    fontSize: 16,
    fontWeight: "800",
  },
  indicacaoCard: {
    backgroundColor: T.surface,
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: T.border,
  },
  indicacaoTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: T.t1,
    marginBottom: 8,
  },
  indicacaoLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: T.t3,
    marginBottom: 4,
    marginTop: 4,
  },
});
