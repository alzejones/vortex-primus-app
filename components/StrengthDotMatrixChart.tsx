import React from "react";
import { View, Text } from "react-native";
import { T } from "../utils/theme";

interface Props {
  assessments: any[];
  periodDays: number;
}

const EX_STYLES = [
  { color: '#06B6D4' },
  { color: '#10B981' },
  { color: '#8B5CF6' },
  { color: '#F59E0B' },
];

function hexAlpha(color: string, alpha: number): string {
  const map: Record<string, string> = {
    '#06B6D4': `0,182,212`,
    '#10B981': `16,185,129`,
    '#8B5CF6': `139,92,246`,
    '#F59E0B': `245,158,11`,
  };
  const rgb = map[color] || '255,255,255';
  return `rgba(${rgb},${alpha})`;
}

function getEmoji(pct: number | null): string {
  if (pct === null || pct <= 0) return '';
  if (pct < 10)  return '👊';
  if (pct < 30)  return '💪';
  if (pct < 60)  return '🔥';
  if (pct < 100) return '⚡';
  return '🏆';
}

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

  const exerciseData = currStrength.map((ex: any, idx: number) => {
    const currLoad = Number(ex.load_kg) || 0;
    const currReps = Number(ex.repetitions) || 0;

    const normalizedName = normalizeExerciseName(ex.exercise_name);
    const prevEx = prevStrength.find((p: any) => normalizeExerciseName(p.exercise_name) === normalizedName);
    const prevLoad = prevEx ? (Number(prevEx.load_kg) || 0) : 0;
    const prevReps = prevEx ? (Number(prevEx.repetitions) || 0) : 0;

    const deltaLoad = prevLoad > 0 && currLoad > 0 ? currLoad - prevLoad : null;
    const deltaReps = prevReps > 0 && currReps > 0 ? currReps - prevReps : null;

    const pctLoad = deltaLoad !== null && prevLoad > 0 ? Math.round((deltaLoad / prevLoad) * 100) : null;
    const pctReps = deltaReps !== null && prevReps > 0 ? Math.round((deltaReps / prevReps) * 100) : null;

    const style = EX_STYLES[idx % EX_STYLES.length];
    const anyLoad = currLoad > 0 || prevLoad > 0;

    return {
      name: ex.exercise_name,
      style,
      currLoad,
      currReps,
      prevLoad,
      prevReps,
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
        {exerciseData.map((ex, idx) => {
          const SCALE = 1.4;
          const maxReps = Math.max(ex.currReps, ex.prevReps) * SCALE || 1;
          const maxLoad = Math.max(ex.currLoad, ex.prevLoad) * SCALE || 1;
          const posBeforeReps = Math.min((ex.prevReps / maxReps) * 100, 93);
          const posAfterReps = Math.min((ex.currReps / maxReps) * 100, 93);
          const posBeforeLoad = Math.min((ex.prevLoad / maxLoad) * 100, 93);
          const posAfterLoad = Math.min((ex.currLoad / maxLoad) * 100, 93);

          const deltaPctReps = ex.pctReps;
          const deltaPctLoad = ex.pctLoad;
          const maxPct = Math.max(
            deltaPctReps !== null && deltaPctReps > 0 ? deltaPctReps : 0,
            deltaPctLoad !== null && deltaPctLoad > 0 ? deltaPctLoad : 0
          );
          const hasEvolution = maxPct > 0;

          return (
            <View key={idx}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <Text style={{
                    color: ex.style.color,
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
                {hasEvolution && (
                  <View style={{
                    backgroundColor: hexAlpha(ex.style.color, 0.12),
                    borderWidth: 1,
                    borderColor: hexAlpha(ex.style.color, 0.25),
                    borderRadius: 20,
                    paddingVertical: 3,
                    paddingHorizontal: 10,
                  }}>
                    <Text style={{
                      color: ex.style.color,
                      fontSize: 11,
                      fontWeight: '800',
                    }}>
                      {getEmoji(maxPct)} Evoluiu!
                    </Text>
                  </View>
                )}
              </View>

              {ex.currReps > 0 && (
                <View style={{ marginBottom: 16 }}>
                  <Text style={{
                    fontSize: 9,
                    fontWeight: '800',
                    textTransform: 'uppercase',
                    letterSpacing: 1.2,
                    opacity: 0.4,
                    color: ex.style.color,
                    marginBottom: 14,
                  }}>
                    REPETIÇÕES
                  </Text>

                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ flex: 1, marginRight: 12 }}>
                      <View style={{ position: 'relative', height: 38 }}>
                        {ex.prevReps > 0 && (
                          <View style={{
                            position: 'absolute',
                            top: 0,
                            left: `${posBeforeReps}%`,
                            transform: [{ translateX: -(posBeforeReps * 0.01) * 30 }],
                          }}>
                            <Text style={{
                              fontSize: 11,
                              fontWeight: '700',
                              color: '#475569',
                            }}>
                              {ex.prevReps}×
                            </Text>
                          </View>
                        )}

                        <View style={{
                          position: 'absolute',
                          top: 0,
                          left: `${posAfterReps}%`,
                          transform: [{ translateX: -(posAfterReps * 0.01) * 30 }],
                        }}>
                          <Text style={{
                            fontSize: 12,
                            fontWeight: '800',
                            color: ex.style.color,
                          }}>
                            {ex.currReps}×
                          </Text>
                        </View>

                        <View style={{
                          position: 'absolute',
                          bottom: 4,
                          left: 0,
                          right: 0,
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: hexAlpha(ex.style.color, 0.06),
                        }} />

                        {ex.prevReps > 0 && (
                          <View style={{
                            position: 'absolute',
                            bottom: 4,
                            left: 0,
                            width: `${posBeforeReps}%`,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: hexAlpha(ex.style.color, 0.35),
                          }} />
                        )}

                        {posAfterReps > posBeforeReps && (
                          <View style={{
                            position: 'absolute',
                            bottom: 4,
                            left: `${posBeforeReps}%`,
                            width: `${posAfterReps - posBeforeReps}%`,
                            height: 6,
                            borderTopRightRadius: 3,
                            borderBottomRightRadius: 3,
                            backgroundColor: ex.style.color,
                          }} />
                        )}

                        {ex.prevReps > 0 && (
                          <View style={{
                            position: 'absolute',
                            bottom: 0,
                            left: `${posBeforeReps}%`,
                            width: 12,
                            height: 12,
                            borderRadius: 6,
                            backgroundColor: hexAlpha(ex.style.color, 0.5),
                            borderWidth: 2,
                            borderColor: T.card,
                            marginLeft: -6,
                          }} />
                        )}

                        <View style={{
                          position: 'absolute',
                          bottom: -2,
                          left: `${posAfterReps}%`,
                          width: 18,
                          height: 18,
                          borderRadius: 9,
                          backgroundColor: ex.style.color,
                          borderWidth: 3,
                          borderColor: T.card,
                          marginLeft: -9,
                          shadowColor: ex.style.color,
                          shadowRadius: 8,
                          shadowOpacity: 0.7,
                          shadowOffset: { width: 0, height: 0 },
                          elevation: 6,
                        }} />
                      </View>
                    </View>

                    <View style={{ flexShrink: 0, alignItems: 'flex-start', width: 52 }}>
                      <Text style={{
                        fontSize: 12,
                        fontWeight: '800',
                        color: ex.deltaReps !== null
                          ? (ex.deltaReps > 0 ? ex.style.color : '#64748B')
                          : '#334155',
                      }}>
                        {deltaPctReps !== null ? `${deltaPctReps >= 0 ? '+' : ''}${deltaPctReps}%` : '1ª'}
                      </Text>
                      {ex.deltaReps !== null && ex.deltaReps > 0 && (
                        <Text style={{ fontSize: 14, marginTop: 2 }}>
                          {getEmoji(ex.pctReps)}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              )}

              {ex.anyLoad && (ex.currLoad > 0 || ex.prevLoad > 0) && (
                <View style={{ marginBottom: 16 }}>
                  <Text style={{
                    fontSize: 9,
                    fontWeight: '800',
                    textTransform: 'uppercase',
                    letterSpacing: 1.2,
                    opacity: 0.4,
                    color: ex.style.color,
                    marginBottom: 14,
                  }}>
                    CARGA
                  </Text>

                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ flex: 1, marginRight: 12 }}>
                      <View style={{ position: 'relative', height: 38 }}>
                        {ex.prevLoad > 0 && (
                          <View style={{
                            position: 'absolute',
                            top: 0,
                            left: `${posBeforeLoad}%`,
                            transform: [{ translateX: -(posBeforeLoad * 0.01) * 30 }],
                          }}>
                            <Text style={{
                              fontSize: 11,
                              fontWeight: '700',
                              color: '#475569',
                            }}>
                              {ex.prevLoad}kg
                            </Text>
                          </View>
                        )}

                        {ex.currLoad > 0 && (
                          <View style={{
                            position: 'absolute',
                            top: 0,
                            left: `${posAfterLoad}%`,
                            transform: [{ translateX: -(posAfterLoad * 0.01) * 30 }],
                          }}>
                            <Text style={{
                              fontSize: 12,
                              fontWeight: '800',
                              color: ex.style.color,
                            }}>
                              {ex.currLoad}kg
                            </Text>
                          </View>
                        )}

                        <View style={{
                          position: 'absolute',
                          bottom: 4,
                          left: 0,
                          right: 0,
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: hexAlpha(ex.style.color, 0.06),
                        }} />

                        {ex.prevLoad > 0 && (
                          <View style={{
                            position: 'absolute',
                            bottom: 4,
                            left: 0,
                            width: `${posBeforeLoad}%`,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: hexAlpha(ex.style.color, 0.35),
                          }} />
                        )}

                        {posAfterLoad > posBeforeLoad && (
                          <View style={{
                            position: 'absolute',
                            bottom: 4,
                            left: `${posBeforeLoad}%`,
                            width: `${posAfterLoad - posBeforeLoad}%`,
                            height: 6,
                            borderTopRightRadius: 3,
                            borderBottomRightRadius: 3,
                            backgroundColor: ex.style.color,
                          }} />
                        )}

                        {ex.prevLoad > 0 && (
                          <View style={{
                            position: 'absolute',
                            bottom: 0,
                            left: `${posBeforeLoad}%`,
                            width: 12,
                            height: 12,
                            borderRadius: 6,
                            backgroundColor: hexAlpha(ex.style.color, 0.5),
                            borderWidth: 2,
                            borderColor: T.card,
                            marginLeft: -6,
                          }} />
                        )}

                        {ex.currLoad > 0 && (
                          <View style={{
                            position: 'absolute',
                            bottom: -2,
                            left: `${posAfterLoad}%`,
                            width: 18,
                            height: 18,
                            borderRadius: 9,
                            backgroundColor: ex.style.color,
                            borderWidth: 3,
                            borderColor: T.card,
                            marginLeft: -9,
                            shadowColor: ex.style.color,
                            shadowRadius: 8,
                            shadowOpacity: 0.7,
                            shadowOffset: { width: 0, height: 0 },
                            elevation: 6,
                          }} />
                        )}
                      </View>
                    </View>

                    <View style={{ flexShrink: 0, alignItems: 'flex-start', width: 52 }}>
                      <Text style={{
                        fontSize: 12,
                        fontWeight: '800',
                        color: ex.deltaLoad !== null
                          ? (ex.deltaLoad > 0 ? ex.style.color : '#64748B')
                          : '#334155',
                      }}>
                        {deltaPctLoad !== null ? `${deltaPctLoad >= 0 ? '+' : ''}${deltaPctLoad}%` : '1ª'}
                      </Text>
                      {ex.deltaLoad !== null && ex.deltaLoad > 0 && (
                        <Text style={{ fontSize: 14, marginTop: 2 }}>
                          {getEmoji(ex.pctLoad)}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              )}

              {idx < exerciseData.length - 1 && (
                <View style={{ height: 1, backgroundColor: T.border, marginVertical: 12 }} />
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}
