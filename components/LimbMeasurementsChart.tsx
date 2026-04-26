import React from "react";
import { View, Text } from "react-native";
import { BarChart } from "react-native-gifted-charts";
import { T } from "../utils/theme";

interface LimbMeasurementsChartProps {
  chartAssessments: any[];
  chartWidth: number;
}

const LIMB_COLORS = {
  left: "#4A90D9",
  right: "#7ED321",
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

  // Componente para renderizar um gráfico de barras
  const renderLimbChart = (assessments: any[], title: string, fields: string[]) => {
    if (assessments.length < 2) return null;

    const labels = assessments.map((a: any) => {
      const d = new Date(a.date);
      return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
    });

    const barData = assessments.map((a: any, index: number) => {
      const anthro = a.anthropometry[0];
      const leftValue = anthro[fields[0]] != null ? Number(anthro[fields[0]]) : 0;
      const rightValue = anthro[fields[1]] != null ? Number(anthro[fields[1]]) : 0;

      return {
        stacks: [
          { value: leftValue, color: LIMB_COLORS.left, label: '' },
          { value: rightValue, color: LIMB_COLORS.right },
        ],
        label: labels[index],
        labelTextStyle: { color: "#94a3b8", fontSize: 10 },
      };
    });

    const allValues = assessments.flatMap((a: any) => {
      const anthro = a.anthropometry[0];
      const leftVal = anthro[fields[0]] != null ? Number(anthro[fields[0]]) : 0;
      const rightVal = anthro[fields[1]] != null ? Number(anthro[fields[1]]) : 0;
      return [leftVal, rightVal];
    }).filter((v) => v > 0);

    const maxVal = Math.ceil((Math.max(...allValues) + 5) / 5) * 5;
    const spacing = Math.max(40, (chartWidth - 140) / (assessments.length > 1 ? assessments.length - 1 : 1));

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
          {title}
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
            stackData={barData}
            width={chartWidth - 80}
            height={220}
            isAnimated
            animationDuration={1400}
            barBorderRadius={4}
            spacing={spacing}
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
                  backgroundColor: LIMB_COLORS.left,
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
                  backgroundColor: LIMB_COLORS.right,
                  marginRight: 6,
                }}
              />
              <Text style={{ color: "#e2e8f0", fontSize: 12, fontWeight: "600" }}>
                🟢 D. (Direito)
              </Text>
            </View>
          </View>
          {assessments.length > 7 && (
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
      {renderLimbChart(upperLimbAssessments, "💪 MEMBROS SUPERIORES", ["arm_left", "arm_right"])}
      {renderLimbChart(lowerLimbAssessments, "🦵 MEMBROS INFERIORES", ["thigh_left", "thigh_right"])}
      {lowerLimbAssessments.length >= 2 && (
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
            🦵 PANTURRILHA
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
            {(() => {
              const labels = lowerLimbAssessments.map((a: any) => {
                const d = new Date(a.date);
                return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
              });

              const barData = lowerLimbAssessments.map((a: any, index: number) => {
                const anthro = a.anthropometry[0];
                const leftValue = anthro.calf_left != null ? Number(anthro.calf_left) : 0;
                const rightValue = anthro.calf_right != null ? Number(anthro.calf_right) : 0;

                return {
                  stacks: [
                    { value: leftValue, color: LIMB_COLORS.left, label: '' },
                    { value: rightValue, color: LIMB_COLORS.right },
                  ],
                  label: labels[index],
                  labelTextStyle: { color: "#94a3b8", fontSize: 10 },
                };
              });

              const allValues = lowerLimbAssessments.flatMap((a: any) => {
                const anthro = a.anthropometry[0];
                const leftVal = anthro.calf_left != null ? Number(anthro.calf_left) : 0;
                const rightVal = anthro.calf_right != null ? Number(anthro.calf_right) : 0;
                return [leftVal, rightVal];
              }).filter((v) => v > 0);

              const maxVal = Math.ceil((Math.max(...allValues) + 5) / 5) * 5;
              const spacing = Math.max(40, (chartWidth - 140) / (lowerLimbAssessments.length > 1 ? lowerLimbAssessments.length - 1 : 1));

              return (
                <>
                  <BarChart
                    stackData={barData}
                    width={chartWidth - 80}
                    height={220}
                    isAnimated
                    animationDuration={1400}
                    barBorderRadius={4}
                    spacing={spacing}
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
                          backgroundColor: LIMB_COLORS.left,
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
                          backgroundColor: LIMB_COLORS.right,
                          marginRight: 6,
                        }}
                      />
                      <Text style={{ color: "#e2e8f0", fontSize: 12, fontWeight: "600" }}>
                        🟢 D. (Direito)
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
                </>
              );
            })()}
          </View>
        </View>
      )}
    </View>
  );
}