import React from "react";
import { View, Text } from "react-native";
import { BarChart } from "react-native-gifted-charts";
import { T } from "../utils/theme";

interface LimbMeasurementsChartProps {
  chartAssessments: any[];
  chartWidth: number;
}

const UPPER_LIMB_COLORS = {
  left: "#4A90D9",
  right: "#7ED321",
};

const LOWER_LIMB_COLORS = {
  thigh_left: "#1E5799",
  thigh_right: "#4A90D9", 
  calf_left: "#B85C00",
  calf_right: "#F5A623",
};

export default function LimbMeasurementsChart({ chartAssessments, chartWidth }: LimbMeasurementsChartProps) {
  // Filtro para membros superiores
  const upperLimbAssessments = (chartAssessments || []).filter((a: any) => {
    const t = a.anthropometry?.[0];
    if (!t) return false;
    const leftVal = t.arm_left != null ? Number(t.arm_left) : 0;
    const rightVal = t.arm_right != null ? Number(t.arm_right) : 0;
    return (leftVal > 0) || (rightVal > 0);
  });

  // Filtro para membros inferiores
  const lowerLimbAssessments = (chartAssessments || []).filter((a: any) => {
    const t = a.anthropometry?.[0];
    if (!t) return false;
    const thighLeft = t.thigh_left != null ? Number(t.thigh_left) : 0;
    const thighRight = t.thigh_right != null ? Number(t.thigh_right) : 0;
    const calfLeft = t.calf_left != null ? Number(t.calf_left) : 0;
    const calfRight = t.calf_right != null ? Number(t.calf_right) : 0;
    return (thighLeft > 0) || (thighRight > 0) || (calfLeft > 0) || (calfRight > 0);
  });

  // Função para criar dados agrupados
  const createGroupedData = (assessments: any[], fields: [string, string], colors: [string, string]) => {
    const data: any[] = [];
    
    assessments.forEach((a: any, index: number) => {
      const anthro = a.anthropometry[0];
      const leftValue = anthro[fields[0]] != null ? Number(anthro[fields[0]]) : 0;
      const rightValue = anthro[fields[1]] != null ? Number(anthro[fields[1]]) : 0;
      
      const d = new Date(a.date);
      const label = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;

      // Barra esquerda (com label da data)
      data.push({
        value: leftValue,
        label: label,
        frontColor: colors[0],
        labelTextStyle: { color: "#94a3b8", fontSize: 10 },
        barBorderRadius: 4,
        topLabelComponent: leftValue >= 5 ? () => (
          <Text style={{ color: "white", fontSize: 10, textAlign: "center" }}>
            {leftValue.toFixed(0)}
          </Text>
        ) : undefined,
      });

      // Barra direita (sem label, com spacing para próxima data)
      data.push({
        value: rightValue,
        label: "",
        frontColor: colors[1],
        spacing: index < assessments.length - 1 ? 20 : 0, // Spacing maior após o par
        barBorderRadius: 4,
        topLabelComponent: rightValue >= 5 ? () => (
          <Text style={{ color: "white", fontSize: 10, textAlign: "center" }}>
            {rightValue.toFixed(0)}
          </Text>
        ) : undefined,
      });
    });

    return data;
  };

  // Gráfico de membros superiores
  const renderUpperLimbChart = () => {
    if (upperLimbAssessments.length < 2) return null;

    const barData = createGroupedData(
      upperLimbAssessments,
      ["arm_left", "arm_right"],
      [UPPER_LIMB_COLORS.left, UPPER_LIMB_COLORS.right]
    );

    const allValues = upperLimbAssessments.flatMap((a: any) => {
      const anthro = a.anthropometry[0];
      const leftVal = anthro.arm_left != null ? Number(anthro.arm_left) : 0;
      const rightVal = anthro.arm_right != null ? Number(anthro.arm_right) : 0;
      return [leftVal, rightVal];
    }).filter((v) => v > 0);

    const maxVal = Math.ceil((Math.max(...allValues) + 5) / 5) * 5;

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
          💪 MEMBROS SUPERIORES
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
          <BarChart
            data={barData}
            width={chartWidth - 80}
            height={220}
            isAnimated
            animationDuration={1400}
            spacing={4}
            initialSpacing={20}
            endSpacing={0}
            paddingRight={0}
            yAxisColor="rgba(255,255,255,0.3)"
            xAxisColor="rgba(255,255,255,0.3)"
            yAxisTextStyle={{ color: "#94a3b8", fontSize: 11 }}
            xAxisLabelTextStyle={{ color: "#94a3b8", fontSize: 11 }}
            yAxisLabelSuffix="cm"
            stepValue={5}
            maxValue={maxVal}
            noOfSections={Math.round(maxVal / 5)}
            rulesColor="rgba(255,255,255,0.12)"
            rulesThickness={0.5}
            hideRules={false}
            showVerticalLines
            verticalLinesColor="rgba(255,255,255,0.15)"
          />
          {/* Legenda */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              marginTop: 24,
              gap: 16,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  backgroundColor: UPPER_LIMB_COLORS.left,
                  marginRight: 6,
                }}
              />
              <Text style={{ color: "#e2e8f0", fontSize: 12, fontWeight: "600" }}>
                🔵 E. (Esquerdo)
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  backgroundColor: UPPER_LIMB_COLORS.right,
                  marginRight: 6,
                }}
              />
              <Text style={{ color: "#e2e8f0", fontSize: 12, fontWeight: "600" }}>
                🟢 D. (Direito)
              </Text>
            </View>
          </View>
          {upperLimbAssessments.length > 7 && (
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
  };

  // Gráfico de membros inferiores
  const renderLowerLimbChart = () => {
    if (lowerLimbAssessments.length < 2) return null;

    // Dados para coxa
    const thighData = createGroupedData(
      lowerLimbAssessments,
      ["thigh_left", "thigh_right"],
      [LOWER_LIMB_COLORS.thigh_left, LOWER_LIMB_COLORS.thigh_right]
    );

    // Dados para panturrilha
    const calfData = createGroupedData(
      lowerLimbAssessments,
      ["calf_left", "calf_right"],
      [LOWER_LIMB_COLORS.calf_left, LOWER_LIMB_COLORS.calf_right]
    );

    const allValues = lowerLimbAssessments.flatMap((a: any) => {
      const anthro = a.anthropometry[0];
      const thighLeft = anthro.thigh_left != null ? Number(anthro.thigh_left) : 0;
      const thighRight = anthro.thigh_right != null ? Number(anthro.thigh_right) : 0;
      const calfLeft = anthro.calf_left != null ? Number(anthro.calf_left) : 0;
      const calfRight = anthro.calf_right != null ? Number(anthro.calf_right) : 0;
      return [thighLeft, thighRight, calfLeft, calfRight];
    }).filter((v) => v > 0);

    const maxVal = Math.ceil((Math.max(...allValues) + 5) / 5) * 5;

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
          🦵 MEMBROS INFERIORES
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
          {/* Seção COXA */}
          <Text style={{ color: "#e2e8f0", fontSize: 13, fontWeight: "bold", marginBottom: 12, textAlign: "center" }}>
            COXA
          </Text>
          <BarChart
            data={thighData}
            width={chartWidth - 80}
            height={180}
            isAnimated
            animationDuration={1400}
            spacing={4}
            initialSpacing={20}
            endSpacing={0}
            paddingRight={0}
            yAxisColor="rgba(255,255,255,0.3)"
            xAxisColor="rgba(255,255,255,0.3)"
            yAxisTextStyle={{ color: "#94a3b8", fontSize: 11 }}
            xAxisLabelTextStyle={{ color: "#94a3b8", fontSize: 11 }}
            yAxisLabelSuffix="cm"
            stepValue={5}
            maxValue={maxVal}
            noOfSections={Math.round(maxVal / 5)}
            rulesColor="rgba(255,255,255,0.12)"
            rulesThickness={0.5}
            hideRules={false}
            showVerticalLines
            verticalLinesColor="rgba(255,255,255,0.15)"
          />
          
          {/* Espaçamento */}
          <View style={{ height: 24 }} />
          
          {/* Seção PANTURRILHA */}
          <Text style={{ color: "#e2e8f0", fontSize: 13, fontWeight: "bold", marginBottom: 12, textAlign: "center" }}>
            PANTURRILHA
          </Text>
          <BarChart
            data={calfData}
            width={chartWidth - 80}
            height={180}
            isAnimated
            animationDuration={1400}
            spacing={4}
            initialSpacing={20}
            endSpacing={0}
            paddingRight={0}
            yAxisColor="rgba(255,255,255,0.3)"
            xAxisColor="rgba(255,255,255,0.3)"
            yAxisTextStyle={{ color: "#94a3b8", fontSize: 11 }}
            xAxisLabelTextStyle={{ color: "#94a3b8", fontSize: 11 }}
            yAxisLabelSuffix="cm"
            stepValue={5}
            maxValue={maxVal}
            noOfSections={Math.round(maxVal / 5)}
            rulesColor="rgba(255,255,255,0.12)"
            rulesThickness={0.5}
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
              gap: 12,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  backgroundColor: LOWER_LIMB_COLORS.thigh_left,
                  marginRight: 4,
                }}
              />
              <Text style={{ color: "#e2e8f0", fontSize: 11, fontWeight: "600" }}>
                🔵 Coxa E.
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  backgroundColor: LOWER_LIMB_COLORS.thigh_right,
                  marginRight: 4,
                }}
              />
              <Text style={{ color: "#e2e8f0", fontSize: 11, fontWeight: "600" }}>
                🩵 Coxa D.
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  backgroundColor: LOWER_LIMB_COLORS.calf_left,
                  marginRight: 4,
                }}
              />
              <Text style={{ color: "#e2e8f0", fontSize: 11, fontWeight: "600" }}>
                🟠 Pant. E.
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  backgroundColor: LOWER_LIMB_COLORS.calf_right,
                  marginRight: 4,
                }}
              />
              <Text style={{ color: "#e2e8f0", fontSize: 11, fontWeight: "600" }}>
                🟡 Pant. D.
              </Text>
            </View>
          </View>
          {lowerLimbAssessments.length > 7 && (
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
  };

  return (
    <View>
      {renderUpperLimbChart()}
      {renderLowerLimbChart()}
    </View>
  );
}