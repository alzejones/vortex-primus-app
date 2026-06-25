import React from "react";
import { View, Text } from "react-native";
import { T } from "../utils/theme";

interface Props {
  assessments: any[];
  periodDays: number;
}

const EX_STYLES = [
  { colorOn: '#00D1DF', colorOff: 'rgba(0,209,223,0.10)', symA: '●', symB: '◉' },
  { colorOn: '#BF3DFB', colorOff: 'rgba(191,61,251,0.10)', symA: '■', symB: '▪' },
  { colorOn: '#FF9F1C', colorOff: 'rgba(255,159,28,0.10)', symA: '▲', symB: '◀' },
  { colorOn: '#3DDC84', colorOff: 'rgba(61,220,132,0.10)', symA: '◆', symB: '★' },
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

export default function EnduranceDotMatrixChart({ assessments, periodDays }: Props) {
  if (assessments.length === 0) return null;

  const curr = assessments[0];
  const prev = assessments.length > 1 ? assessments[1] : null;

  const currEndurance = curr.conditioning?.[0]?.endurance || [];
  const prevEndurance = prev?.conditioning?.[0]?.endurance || [];

  if (currEndurance.length === 0) return null;

  const formatShortDate = (dateString: string) => {
    const [y, m, d] = dateString.split('-');
    return `${d}/${m}`;
  };

  const exerciseData = currEndurance.map((item: any, idx: number) => {
    const currDist = Number(item.distance_m) || Number(item.repetitions) || 0;
    const currTime = Number(item.time_seconds) || 0;

    const normalizedName = normalizeExerciseName(item.test_type);
    const prevItem = prevEndurance.find((p: any) => normalizeExerciseName(p.test_type) === normalizedName);
    const prevDist = prevItem ? (Number(prevItem.distance_m) || Number(prevItem.repetitions) || 0) : 0;
    const prevTime = prevItem ? (Number(prevItem.time_seconds) || 0) : 0;

    const maxDist = Math.max(currDist, prevDist) * 1.6;
    const maxTime = Math.max(currTime, prevTime) * 1.6;

    const filledCurrDist = calcFilled(currDist, maxDist);
    const filledCurrTime = calcFilled(currTime, maxTime);
    const filledPrevDist = calcFilled(prevDist, maxDist);
    const filledPrevTime = calcFilled(prevTime, maxTime);

    const deltaDist = prevDist > 0 && currDist > 0 ? currDist - prevDist : null;
    const deltaTime = prevTime > 0 && currTime > 0 ? currTime - prevTime : null;

    const pctDist = deltaDist !== null && prevDist > 0 ? Math.round((deltaDist / prevDist) * 100) : null;
    const pctTime = deltaTime !== null && prevTime > 0 ? Math.round((deltaTime / prevTime) * 100) : null;

    let percentText = '1ª aval.';
    if (pctDist !== null || pctTime !== null) {
      const validPcts = [];
      if (pctDist !== null) validPcts.push(pctDist);
      if (pctTime !== null) validPcts.push(-pctTime);
      const avgPct = Math.round(validPcts.reduce((a, b) => a + b, 0) / validPcts.length);
      percentText = (avgPct >= 0 ? '+' : '') + avgPct + '%';
    }

    const style = EX_STYLES[idx % EX_STYLES.length];

    const distanceVal = Number(item.distance_m) || 0;
    const repsVal = Number(item.repetitions) || 0;
    const currDistLabel = distanceVal > 0 ? `${currDist}m` : repsVal > 0 ? `${currDist}rep` : '–';
    const currTimeLabel = currTime > 0 ? `${currTime}s` : '–';

    const prevDistanceVal = prevItem ? (Number(prevItem.distance_m) || 0) : 0;
    const prevRepsVal = prevItem ? (Number(prevItem.repetitions) || 0) : 0;
    const prevDistLabel = prevDist > 0 ? (prevDistanceVal > 0 ? `${prevDist}m` : prevRepsVal > 0 ? `${prevDist}rep` : '–') : '–';
    const prevTimeLabel = prevTime > 0 ? `${prevTime}s` : '–';

    return {
      name: item.test_type,
      style,
      percentText,
      currDist,
      currTime,
      prevDist,
      prevTime,
      filledCurrDist,
      filledCurrTime,
      filledPrevDist,
      filledPrevTime,
      deltaDist,
      deltaTime,
      pctDist,
      pctTime,
      currDistLabel,
      currTimeLabel,
      prevDistLabel,
      prevTimeLabel,
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
          RESISTÊNCIA CÁRDIO — EVOLUÇÃO
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
                  D/R
                </Text>
                <View style={{ flexDirection: 'row' }}>
                  {Array.from({ length: TOTAL_DOTS }).map((_, i) => (
                    <Text key={i} style={{
                      fontSize: 12,
                      color: i < ex.filledCurrDist ? ex.style.colorOn : ex.style.colorOff,
                      textShadowColor: i < ex.filledCurrDist ? ex.style.colorOn : 'transparent',
                      textShadowRadius: i < ex.filledCurrDist ? 6 : 0,
                      textShadowOffset: { width: 0, height: 0 },
                      marginRight: i < TOTAL_DOTS - 1 ? 3 : 0,
                    }}>
                      {ex.style.symA}
                    </Text>
                  ))}
                </View>
                <View style={{ marginLeft: 7, flexDirection: 'column', alignItems: 'flex-start', flexShrink: 0 }}>
                  <Text style={{
                    color: ex.style.colorOn,
                    fontSize: 12,
                    fontWeight: '800',
                  }}>
                    {ex.currDistLabel}
                  </Text>
                  {ex.deltaDist !== null && (
                    <Text style={{
                      color: ex.deltaDist > 0 ? ex.style.colorOn : '#FF5C5C',
                      fontSize: 10,
                      fontWeight: '700',
                    }}>
                      {ex.deltaDist > 0 ? '+' : ''}{ex.deltaDist} ({ex.pctDist! >= 0 ? '+' : ''}{ex.pctDist}%)
                    </Text>
                  )}
                </View>
              </View>

              {ex.currTime > 0 && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
                  <Text style={{
                    fontSize: 10,
                    fontWeight: '700',
                    color: `${ex.style.colorOn}73`,
                    width: 28,
                    textAlign: 'right',
                    marginRight: 6,
                  }}>
                    Tmp
                  </Text>
                  <View style={{ flexDirection: 'row' }}>
                    {Array.from({ length: TOTAL_DOTS }).map((_, i) => (
                      <Text key={i} style={{
                        fontSize: 12,
                        color: i < ex.filledCurrTime ? ex.style.colorOn : ex.style.colorOff,
                        textShadowColor: i < ex.filledCurrTime ? ex.style.colorOn : 'transparent',
                        textShadowRadius: i < ex.filledCurrTime ? 6 : 0,
                        textShadowOffset: { width: 0, height: 0 },
                        marginRight: i < TOTAL_DOTS - 1 ? 3 : 0,
                      }}>
                        {ex.style.symB}
                      </Text>
                    ))}
                  </View>
                  <View style={{ marginLeft: 7, flexDirection: 'column', alignItems: 'flex-start', flexShrink: 0 }}>
                    <Text style={{
                      color: ex.style.colorOn,
                      fontSize: 12,
                      fontWeight: '800',
                    }}>
                      {ex.currTimeLabel}
                    </Text>
                    {ex.deltaTime !== null && (
                      <Text style={{
                        color: ex.deltaTime < 0 ? ex.style.colorOn : '#FF5C5C',
                        fontSize: 10,
                        fontWeight: '700',
                      }}>
                        {ex.deltaTime > 0 ? '+' : ''}{ex.deltaTime}s ({ex.pctTime! >= 0 ? '+' : ''}{ex.pctTime}%)
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
                      D/R
                    </Text>
                    <View style={{ flexDirection: 'row' }}>
                      {Array.from({ length: TOTAL_DOTS }).map((_, i) => (
                        <Text key={i} style={{
                          fontSize: 12,
                          color: i < ex.filledPrevDist ? ex.style.colorOn : ex.style.colorOff,
                          textShadowColor: i < ex.filledPrevDist ? ex.style.colorOn : 'transparent',
                          textShadowRadius: i < ex.filledPrevDist ? 6 : 0,
                          textShadowOffset: { width: 0, height: 0 },
                          marginRight: i < TOTAL_DOTS - 1 ? 3 : 0,
                        }}>
                          {ex.style.symA}
                        </Text>
                      ))}
                    </View>
                    <View style={{ marginLeft: 7, flexDirection: 'column', alignItems: 'flex-start', flexShrink: 0 }}>
                      <Text style={{
                        color: ex.style.colorOn,
                        fontSize: 12,
                        fontWeight: '800',
                      }}>
                        {ex.prevDistLabel}
                      </Text>
                    </View>
                  </View>

                  {ex.prevTime > 0 && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
                      <Text style={{
                        fontSize: 10,
                        fontWeight: '700',
                        color: `${ex.style.colorOn}73`,
                        width: 28,
                        textAlign: 'right',
                        marginRight: 6,
                      }}>
                        Tmp
                      </Text>
                      <View style={{ flexDirection: 'row' }}>
                        {Array.from({ length: TOTAL_DOTS }).map((_, i) => (
                          <Text key={i} style={{
                            fontSize: 12,
                            color: i < ex.filledPrevTime ? ex.style.colorOn : ex.style.colorOff,
                            textShadowColor: i < ex.filledPrevTime ? ex.style.colorOn : 'transparent',
                            textShadowRadius: i < ex.filledPrevTime ? 6 : 0,
                            textShadowOffset: { width: 0, height: 0 },
                            marginRight: i < TOTAL_DOTS - 1 ? 3 : 0,
                          }}>
                            {ex.style.symB}
                          </Text>
                        ))}
                      </View>
                      <View style={{ marginLeft: 7, flexDirection: 'column', alignItems: 'flex-start', flexShrink: 0 }}>
                        <Text style={{
                          color: ex.style.colorOn,
                          fontSize: 12,
                          fontWeight: '800',
                        }}>
                          {ex.prevTimeLabel}
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
