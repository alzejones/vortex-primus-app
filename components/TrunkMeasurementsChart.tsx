import React from "react";
import { View, Text, Dimensions } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { T } from "../utils/theme";

interface Props {
  chartAssessments: any[];
  chartLabels: string[];
  chartWidth: number;
}

const TRUNK_COLORS = {
  chest:   "#f59e0b",
  abdomen: "#f97316",
  waist:   "#06b6d4",
  hip:     "#a855f7",
};

const TRUNK_LABELS = {
  chest:   "Peitoral",
  abdomen: "Abdômen",
  waist:   "Cintura",
  hip:     "Quadril",
};

export default function TrunkMeasurementsChart({ chartAssessments, chartLabels, chartWidth }: Props) {
  if (!chartAssessments || chartAssessments.length < 2) return null;

  const keys = ["chest", "abdomen", "waist", "hip"] as const;

  const dataSet = keys.map((key, idx) => ({
    data: chartAssessments.map((a, i) => ({
      value: Number(a.anthropometry[0][key]) || 0,
      label: i === 0 ? chartLabels[chartLabels.length - 1 - 0] : undefined,
      dataPointText:
        a.anthropometry[0][key] != null && a.anthropometry[0][key] !== ""
          ? `${Number(a.anthropometry[0][key]).toFixed(1)}`
          : "",
    })),
    color: TRUNK_COLORS[key],
    dataPointsColor: TRUNK_COLORS[key],
    thickness: 3,
    dataPointsRadius: 4,
    textColor: TRUNK_COLORS[key],
    textShiftY: -14,
    textShiftX: -8,
    textFontSize: 8,
  }));

  // labels do eixo X: mesmas do gráfico existente (mais recente → mais antigo)
  const xLabels = [...chartAssessments].reverse().map((a: any) => {
    const d = new Date(a.date);
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  // Adiciona label apenas no primeiro ponto de cada série para não poluir
  const dataSetWithLabels = keys.map((key, idx) => {
    const values = [...chartAssessments].map((a) =>
      Number(a.anthropometry[0][key]) || 0
    );
    return {
      data: values.map((val, i) => ({
        value: val,
        dataPointText: val > 0 ? `${val.toFixed(1)}` : "",
      })),
      color: TRUNK_COLORS[key],
      dataPointsColor: TRUNK_COLORS[key],
      thickness: 3,
      dataPointsRadius: 4,
      textColor: TRUNK_COLORS[key],
      textShiftY: -14,
      textShiftX: -8,
      textFontSize: 8,
    };
  });

  const allValues = keys.flatMap((key) =>
    chartAssessments.map((a) => Number(a.anthropometry[0][key]) || 0)
  ).filter((v) => v > 0);

  const minVal = Math.max(0, Math.floor((Math.min(...allValues) - 10) / 5) * 5);
  const maxVal = Math.ceil((Math.max(...allValues) + 10) / 5) * 5;
  const step = 5;
  const sections = Math.round((maxVal - minVal) / step);

  const spacing = Math.max(38, (chartWidth - 140) / (chartAssessments.length > 1 ? chartAssessments.length - 1 : 1));

  return (
    <View
      style={{
        marginBottom: 20,
        alignItems: "center",
        backgroundColor: T.card,
        borderRadius: 10,
        padding: 10,
        borderWidth: 1,
        borderColor: T.border,
      }}
    >
      <Text
        style={{
          color: T.t1,
          fontWeight: "bold",
          fontSize: 14,
          marginBottom: 4,
          alignSelf: "flex-start",
          paddingLeft: 8,
        }}
      >
        📐 Evolução do Tronco (cm)
      </Text>
      <View
        style={{
          backgroundColor: T.bgAlt,
          paddingVertical: 20,
          paddingHorizontal: 10,
          borderRadius: 16,
          marginVertical: 8,
          elevation: 4,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 5,
        }}
      >
        <LineChart
          dataSet={dataSetWithLabels}
          height={220}
          width={chartWidth - 80}
          isAnimated
          animationDuration={1400}
          curved
          spacing={spacing}
          initialSpacing={20}
          endSpacing={20}
          yAxisColor="rgba(255,255,255,0.3)"
          xAxisColor="rgba(255,255,255,0.3)"
          yAxisTextStyle={{ color: "#94a3b8", fontSize: 11 }}
          xAxisLabelTextStyle={{ color: "#94a3b8", fontSize: 11, marginBottom: -10 }}
          xAxisLabelTexts={xLabels}
          yAxisLabelSuffix="cm"
          stepValue={step}
          maxValue={maxVal}
          mostNegativeValue={minVal}
          noOfSections={sections}
          rulesColor="rgba(255,255,255,0.25)"
          hideRules={false}
          showVerticalLines
          verticalLinesColor="rgba(255,255,255,0.15)"
        />
        {/* Legenda */}
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "center",
            marginTop: 24,
            gap: 16,
          }}
        >
          {keys.map((key) => (
            <View
              key={key}
              style={{ flexDirection: "row", alignItems: "center" }}
            >
              <View
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: TRUNK_COLORS[key],
                  marginRight: 6,
                }}
              />
              <Text style={{ color: "#e2e8f0", fontSize: 12, fontWeight: "600" }}>
                {TRUNK_LABELS[key]}
              </Text>
            </View>
          ))}
        </View>
        {chartAssessments.length > 7 && (
          <Text
            style={{
              color: "#94a3b8",
              fontSize: 11,
              textAlign: "center",
              marginTop: 16,
              fontStyle: "italic",
            }}
          >
            ↔️ Deslize o gráfico para o lado para ver o histórico completo
          </Text>
        )}
      </View>
    </View>
  );
}