import React from "react";
import { View, Text, ScrollView } from "react-native";
import { T } from "../utils/theme";

interface Props {
  assessments: any[];
  periodDays: number;
}

const EX_STYLES = [
  { colorOn: '#00D1DF', colorOff: 'rgba(0,209,223,0.10)', symbol: '●' },
  { colorOn: '#BF3DFB', colorOff: 'rgba(191,61,251,0.10)', symbol: '■' },
  { colorOn: '#FF9F1C', colorOff: 'rgba(255,159,28,0.10)',  symbol: '▲' },
  { colorOn: '#3DDC84', colorOff: 'rgba(61,220,132,0.10)', symbol: '◆' },
];

const TOTAL_DOTS = 20;

function normalizeExerciseName(name: string): string {
  return name.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 8);
}

export default function StrengthDotMatrixChart({ assessments, periodDays }: Props) {
  if (assessments.length === 0) return null;

  const curr = assessments[0];
  const prev = assessments.length > 1 ? assessments[1] : null;

  const currStrength = curr.conditioning?.[0]?.strength || [];
  const prevStrength = prev?.conditioning?.[0]?.strength || [];

  if (currStrength.length === 0) return null;

  const formatShortDate = (dateString: string) => {
    const [y, m, d] = dateString.split('-');
    return `${d}/${m}`;
  };

  const formatValue = (loadKg: number, reps: number) => {
    if (loadKg > 0 && reps > 0) return `${loadKg}kg×${reps}r`;
    if (reps > 0) return `${reps}rep`;
    return '–';
  };

  const exerciseData = currStrength.map((ex: any, idx: number) => {
    const currLoad = Number(ex.load_kg) || 0;
    const currReps = Number(ex.repetitions) || 0;
    const currVal = currLoad > 0 ? currLoad : currReps;

    const normalizedName = normalizeExerciseName(ex.exercise_name);
    const prevEx = prevStrength.find((p: any) => normalizeExerciseName(p.exercise_name) === normalizedName);
    const prevLoad = prevEx ? (Number(prevEx.load_kg) || 0) : 0;
    const prevReps = prevEx ? (Number(prevEx.repetitions) || 0) : 0;
    const prevVal = prevLoad > 0 ? prevLoad : prevReps;

    const maxVal = Math.max(currVal, prevVal > 0 ? prevVal : currVal);
    const currDots = Math.max(1, Math.round((currVal / maxVal) * TOTAL_DOTS));
    const prevDots = prevVal > 0 ? Math.max(1, Math.round((prevVal / maxVal) * TOTAL_DOTS)) : 0;

    let percentText = '1ª aval.';
    if (prevVal > 0) {
      const percent = Math.round(((currVal - prevVal) / prevVal) * 100);
      percentText = percent > 0 ? `+${percent}%` : `${percent}%`;
    }

    const style = EX_STYLES[idx % EX_STYLES.length];

    return {
      name: ex.exercise_name,
      style,
      percentText,
      currDots,
      prevDots,
      currDate: formatShortDate(curr.date),
      prevDate: prev ? formatShortDate(prev.date) : '',
      currValText: formatValue(currLoad, currReps),
      prevValText: prevVal > 0 ? formatValue(prevLoad, prevReps) : '–',
      sequenceNum: String(idx + 1).padStart(2, '0'),
    };
  });

  return (
    <View style={{
      backgroundColor: T.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: T.border,
      overflow: 'hidden',
      marginBottom: 20,
    }}>
      <View style={{
        backgroundColor: T.bgAlt,
        padding: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <Text style={{
          color: T.white,
          fontSize: 16,
          fontWeight: '800',
          textTransform: 'uppercase',
        }}>
          TESTE DE FORÇA — EVOLUÇÃO
        </Text>
        <View style={{
          backgroundColor: 'rgba(0,209,223,0.12)',
          borderWidth: 1,
          borderColor: 'rgba(0,209,223,0.3)',
          borderRadius: 20,
          paddingVertical: 3,
          paddingHorizontal: 10,
        }}>
          <Text style={{
            color: '#00D1DF',
            fontSize: 11,
            fontWeight: '700',
          }}>
            {periodDays} dias
          </Text>
        </View>
      </View>

      <ScrollView style={{ padding: 16 }}>
        {exerciseData.map((ex, idx) => (
          <View key={idx} style={{
            paddingBottom: 16,
            marginBottom: 16,
            borderBottomWidth: idx < exerciseData.length - 1 ? 1 : 0,
            borderBottomColor: T.border,
          }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <Text style={{
                  color: ex.style.colorOn,
                  fontSize: 14,
                  fontWeight: '800',
                  marginRight: 8,
                }}>
                  {ex.sequenceNum}
                </Text>
                <Text style={{
                  color: T.t1,
                  fontSize: 14,
                  fontWeight: '700',
                  flex: 1,
                }} numberOfLines={1}>
                  {ex.name}
                </Text>
              </View>
              <View style={{
                backgroundColor: `${ex.style.colorOn}21`,
                borderWidth: 1,
                borderColor: ex.style.colorOn,
                borderRadius: 12,
                paddingVertical: 4,
                paddingHorizontal: 10,
              }}>
                <Text style={{
                  color: ex.style.colorOn,
                  fontSize: 11,
                  fontWeight: '700',
                }}>
                  {ex.percentText}
                </Text>
              </View>
            </View>

            <View style={{ marginBottom: 8 }}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 6,
              }}>
                <Text style={{
                  color: T.t3,
                  fontSize: 11,
                  fontWeight: '600',
                  width: 40,
                }}>
                  {ex.currDate}
                </Text>
                <View style={{
                  flexDirection: 'row',
                  flex: 1,
                  marginHorizontal: 8,
                }}>
                  {Array.from({ length: TOTAL_DOTS }).map((_, i) => (
                    <Text key={i} style={{
                      fontSize: 14,
                      color: i < ex.currDots ? ex.style.colorOn : ex.style.colorOff,
                      textShadowColor: i < ex.currDots ? ex.style.colorOn : 'transparent',
                      textShadowRadius: i < ex.currDots ? 6 : 0,
                      textShadowOffset: { width: 0, height: 0 },
                    }}>
                      {ex.style.symbol}
                    </Text>
                  ))}
                </View>
                <Text style={{
                  color: T.t2,
                  fontSize: 11,
                  fontWeight: '700',
                  width: 70,
                  textAlign: 'right',
                }}>
                  {ex.currValText}
                </Text>
              </View>

              {prev && (
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                }}>
                  <Text style={{
                    color: T.t3,
                    fontSize: 11,
                    fontWeight: '600',
                    width: 40,
                  }}>
                    {ex.prevDate}
                  </Text>
                  <View style={{
                    flexDirection: 'row',
                    flex: 1,
                    marginHorizontal: 8,
                  }}>
                    {Array.from({ length: TOTAL_DOTS }).map((_, i) => (
                      <Text key={i} style={{
                        fontSize: 14,
                        color: i < ex.prevDots ? ex.style.colorOn : ex.style.colorOff,
                        textShadowColor: i < ex.prevDots ? ex.style.colorOn : 'transparent',
                        textShadowRadius: i < ex.prevDots ? 6 : 0,
                        textShadowOffset: { width: 0, height: 0 },
                      }}>
                        {ex.style.symbol}
                      </Text>
                    ))}
                  </View>
                  <Text style={{
                    color: T.t3,
                    fontSize: 11,
                    fontWeight: '700',
                    width: 70,
                    textAlign: 'right',
                  }}>
                    {ex.prevValText}
                  </Text>
                </View>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
