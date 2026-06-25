import React from "react";
import { View, Text } from "react-native";
import { T } from "../utils/theme";

interface Props {
  assessments: any[];
  periodDays: number;
}

const EX_STYLES = [
  { colorOn: '#00D1DF', colorOff: 'rgba(0,209,223,0.10)', symReps: '◉', symLoad: '●' },
  { colorOn: '#BF3DFB', colorOff: 'rgba(191,61,251,0.10)', symReps: '▪', symLoad: '■' },
  { colorOn: '#FF9F1C', colorOff: 'rgba(255,159,28,0.10)', symReps: '◀', symLoad: '▲' },
  { colorOn: '#3DDC84', colorOff: 'rgba(61,220,132,0.10)', symReps: '★', symLoad: '◆' },
];

const TOTAL_DOTS = 16;
const MAX_FILLED = TOTAL_DOTS - 3;

function normalizeExerciseName(name: string): string {
  return name.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 8);
}

function calcFilled(val: number, maxVal: number): number {
  if (!val || val <= 0 || maxVal <= 0) return 0;
  return Math.min(Math.max(Math.round((val / maxVal) * TOTAL_DOTS), 1), MAX_FILLED);
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

  const exerciseData = currStrength.map((ex: any, idx: number) => {
    const currLoad = Number(ex.load_kg) || 0;
    const currReps = Number(ex.repetitions) || 0;

    const normalizedName = normalizeExerciseName(ex.exercise_name);
    const prevEx = prevStrength.find((p: any) => normalizeExerciseName(p.exercise_name) === normalizedName);
    const prevLoad = prevEx ? (Number(prevEx.load_kg) || 0) : 0;
    const prevReps = prevEx ? (Number(prevEx.repetitions) || 0) : 0;

    const maxLoad = Math.max(currLoad, prevLoad) * 1.6;
    const maxReps = Math.max(currReps, prevReps) * 1.6;

    const filledCurrLoad = calcFilled(currLoad, maxLoad);
    const filledCurrReps = calcFilled(currReps, maxReps);
    const filledPrevLoad = calcFilled(prevLoad, maxLoad);
    const filledPrevReps = calcFilled(prevReps, maxReps);

    const deltaLoad = prevLoad > 0 && currLoad > 0 ? currLoad - prevLoad : null;
    const deltaReps = prevReps > 0 && currReps > 0 ? currReps - prevReps : null;

    const pctLoad = deltaLoad !== null && prevLoad > 0 ? Math.round((deltaLoad / prevLoad) * 100) : null;
    const pctReps = deltaReps !== null && prevReps > 0 ? Math.round((deltaReps / prevReps) * 100) : null;

    let percentText = '1ª aval.';
    if (pctLoad !== null || pctReps !== null) {
      const validPcts = [pctLoad, pctReps].filter(p => p !== null) as number[];
      const avgPct = Math.round(validPcts.reduce((a, b) => a + b, 0) / validPcts.length);
      percentText = (avgPct >= 0 ? '+' : '') + avgPct + '%';
    }

    const style = EX_STYLES[idx % EX_STYLES.length];
    const anyLoad = currLoad > 0 || prevLoad > 0;

    return {
      name: ex.exercise_name,
      style,
      percentText,
      currLoad,
      currReps,
      prevLoad,
      prevReps,
      filledCurrLoad,
      filledCurrReps,
      filledPrevLoad,
      filledPrevReps,
      deltaLoad,
      deltaReps,
      pctLoad,
      pctReps,
      anyLoad,
      currDate: formatShortDate(curr.date),
      prevDate: prev ? formatShortDate(prev.date) : '',
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

      <View style={{ padding: 16 }}>
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

            <View>
              <Text style={{
                color: T.t3,
                fontSize: 11,
                fontWeight: '600',
                marginBottom: 6,
              }}>
                {ex.currDate}
              </Text>

              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
                <Text style={{
                  fontSize: 10,
                  fontWeight: '700',
                  color: `${ex.style.colorOn}73`,
                  width: 28,
                  textAlign: 'right',
                  marginRight: 6,
                }}>
                  Rep
                </Text>
                <View style={{ flexDirection: 'row' }}>
                  {Array.from({ length: TOTAL_DOTS }).map((_, i) => (
                    <Text key={i} style={{
                      fontSize: 12,
                      color: i < ex.filledCurrReps ? ex.style.colorOn : ex.style.colorOff,
                      textShadowColor: i < ex.filledCurrReps ? ex.style.colorOn : 'transparent',
                      textShadowRadius: i < ex.filledCurrReps ? 6 : 0,
                      textShadowOffset: { width: 0, height: 0 },
                      marginRight: i < TOTAL_DOTS - 1 ? 3 : 0,
                    }}>
                      {ex.style.symReps}
                    </Text>
                  ))}
                </View>
                <View style={{ marginLeft: 7, flexDirection: 'column', alignItems: 'flex-start', flexShrink: 0 }}>
                  <Text style={{
                    color: ex.style.colorOn,
                    fontSize: 12,
                    fontWeight: '800',
                  }}>
                    {ex.currReps}×
                  </Text>
                  {ex.deltaReps !== null && (
                    <Text style={{
                      color: ex.deltaReps > 0 ? ex.style.colorOn : '#FF5C5C',
                      fontSize: 10,
                      fontWeight: '700',
                    }}>
                      {ex.deltaReps > 0 ? '+' : ''}{ex.deltaReps} ({ex.pctReps! >= 0 ? '+' : ''}{ex.pctReps}%)
                    </Text>
                  )}
                </View>
              </View>

              {ex.anyLoad && ex.currLoad > 0 && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
                  <Text style={{
                    fontSize: 10,
                    fontWeight: '700',
                    color: `${ex.style.colorOn}73`,
                    width: 28,
                    textAlign: 'right',
                    marginRight: 6,
                  }}>
                    Cg
                  </Text>
                  <View style={{ flexDirection: 'row' }}>
                    {Array.from({ length: TOTAL_DOTS }).map((_, i) => (
                      <Text key={i} style={{
                        fontSize: 12,
                        color: i < ex.filledCurrLoad ? ex.style.colorOn : ex.style.colorOff,
                        textShadowColor: i < ex.filledCurrLoad ? ex.style.colorOn : 'transparent',
                        textShadowRadius: i < ex.filledCurrLoad ? 6 : 0,
                        textShadowOffset: { width: 0, height: 0 },
                        marginRight: i < TOTAL_DOTS - 1 ? 3 : 0,
                      }}>
                        {ex.style.symLoad}
                      </Text>
                    ))}
                  </View>
                  <View style={{ marginLeft: 7, flexDirection: 'column', alignItems: 'flex-start', flexShrink: 0 }}>
                    <Text style={{
                      color: ex.style.colorOn,
                      fontSize: 12,
                      fontWeight: '800',
                    }}>
                      {ex.currLoad}kg
                    </Text>
                    {ex.deltaLoad !== null && (
                      <Text style={{
                        color: ex.deltaLoad > 0 ? ex.style.colorOn : '#FF5C5C',
                        fontSize: 10,
                        fontWeight: '700',
                      }}>
                        {ex.deltaLoad > 0 ? '+' : ''}{ex.deltaLoad} ({ex.pctLoad! >= 0 ? '+' : ''}{ex.pctLoad}%)
                      </Text>
                    )}
                  </View>
                </View>
              )}

              {prev && (
                <>
                  <View style={{ height: 1, backgroundColor: T.border, marginVertical: 8 }} />
                  <Text style={{
                    color: T.t3,
                    fontSize: 11,
                    fontWeight: '600',
                    marginBottom: 6,
                  }}>
                    {ex.prevDate}
                  </Text>

                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
                    <Text style={{
                      fontSize: 10,
                      fontWeight: '700',
                      color: `${ex.style.colorOn}73`,
                      width: 28,
                      textAlign: 'right',
                      marginRight: 6,
                    }}>
                      Rep
                    </Text>
                    <View style={{ flexDirection: 'row' }}>
                      {Array.from({ length: TOTAL_DOTS }).map((_, i) => (
                        <Text key={i} style={{
                          fontSize: 12,
                          color: i < ex.filledPrevReps ? ex.style.colorOn : ex.style.colorOff,
                          textShadowColor: i < ex.filledPrevReps ? ex.style.colorOn : 'transparent',
                          textShadowRadius: i < ex.filledPrevReps ? 6 : 0,
                          textShadowOffset: { width: 0, height: 0 },
                          marginRight: i < TOTAL_DOTS - 1 ? 3 : 0,
                        }}>
                          {ex.style.symReps}
                        </Text>
                      ))}
                    </View>
                    <View style={{ marginLeft: 7, flexDirection: 'column', alignItems: 'flex-start', flexShrink: 0 }}>
                      <Text style={{
                        color: ex.style.colorOn,
                        fontSize: 12,
                        fontWeight: '800',
                      }}>
                        {ex.prevReps > 0 ? (ex.anyLoad ? `${ex.prevReps}×` : `${ex.prevReps}rep`) : '–'}
                      </Text>
                    </View>
                  </View>

                  {ex.anyLoad && ex.prevLoad > 0 && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
                      <Text style={{
                        fontSize: 10,
                        fontWeight: '700',
                        color: `${ex.style.colorOn}73`,
                        width: 28,
                        textAlign: 'right',
                        marginRight: 6,
                      }}>
                        Cg
                      </Text>
                      <View style={{ flexDirection: 'row' }}>
                        {Array.from({ length: TOTAL_DOTS }).map((_, i) => (
                          <Text key={i} style={{
                            fontSize: 12,
                            color: i < ex.filledPrevLoad ? ex.style.colorOn : ex.style.colorOff,
                            textShadowColor: i < ex.filledPrevLoad ? ex.style.colorOn : 'transparent',
                            textShadowRadius: i < ex.filledPrevLoad ? 6 : 0,
                            textShadowOffset: { width: 0, height: 0 },
                            marginRight: i < TOTAL_DOTS - 1 ? 3 : 0,
                          }}>
                            {ex.style.symLoad}
                          </Text>
                        ))}
                      </View>
                      <View style={{ marginLeft: 7, flexDirection: 'column', alignItems: 'flex-start', flexShrink: 0 }}>
                        <Text style={{
                          color: ex.style.colorOn,
                          fontSize: 12,
                          fontWeight: '800',
                        }}>
                          {ex.prevLoad}kg
                        </Text>
                      </View>
                    </View>
                  )}
                </>
              )}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
