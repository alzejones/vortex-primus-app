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

const SCALE = 1.4;

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
  if (!pct || pct <= 0) return '';
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

    const maxPct = Math.max(
      pctLoad !== null && pctLoad > 0 ? pctLoad : 0,
      pctReps !== null && pctReps > 0 ? pctReps : 0
    );
    const hasGain = maxPct > 0;

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
      hasGain,
      maxPct,
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
          const maxReps = Math.max(ex.currReps, ex.prevReps) * SCALE || 1;
          const maxLoad = Math.max(ex.currLoad, ex.prevLoad) * SCALE || 1;

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
                {ex.hasGain && (
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
                      {getEmoji(ex.maxPct)} Evoluiu!
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

                  {ex.currReps === ex.prevReps && ex.prevReps > 0 ? (
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      marginTop: 6,
                      marginBottom: 16,
                    }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={{
                          fontSize: 9,
                          fontWeight: '700',
                          color: '#334155',
                        }}>
                          {ex.prevDate} — {ex.currDate}
                        </Text>
                      </View>
                      <View style={{ flex: 1, marginRight: 12 }}>
                        <View style={{ position: 'relative', height: 60 }}>
                          <View style={{
                            position: 'absolute',
                            top: 13,
                            left: `${Math.min((ex.currReps / maxReps) * 100, 93)}%`,
                            transform: [{ translateX: -((Math.min((ex.currReps / maxReps) * 100, 93)) * 0.01) * 30 }],
                          }}>
                            <Text style={{
                              fontSize: 11,
                              fontWeight: '700',
                              color: ex.style.color,
                            }}>
                              {ex.currReps}×
                            </Text>
                          </View>

                          <View style={{
                            position: 'absolute',
                            bottom: 6,
                            left: 0,
                            right: 0,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: hexAlpha(ex.style.color, 0.06),
                          }} />

                          <View style={{
                            position: 'absolute',
                            bottom: 4,
                            left: `${Math.min((ex.currReps / maxReps) * 100, 93)}%`,
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
                          color: '#334155',
                        }}>
                          0%
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{ flex: 1, marginRight: 12 }}>
                        <View style={{ position: 'relative', height: 60 }}>
                          {ex.prevReps > 0 && (
                            <>
                              <View style={{
                                position: 'absolute',
                                top: 0,
                                left: `${Math.min((ex.prevReps / maxReps) * 100, 93)}%`,
                                transform: [{ translateX: -((Math.min((ex.prevReps / maxReps) * 100, 93)) * 0.01) * 30 }],
                              }}>
                                <Text style={{
                                  fontSize: 9,
                                  fontWeight: '700',
                                  color: '#334155',
                                }}>
                                  {ex.prevDate}
                                </Text>
                              </View>
                              <View style={{
                                position: 'absolute',
                                top: 13,
                                left: `${Math.min((ex.prevReps / maxReps) * 100, 93)}%`,
                                transform: [{ translateX: -((Math.min((ex.prevReps / maxReps) * 100, 93)) * 0.01) * 30 }],
                              }}>
                                <Text style={{
                                  fontSize: 11,
                                  fontWeight: '700',
                                  color: '#475569',
                                }}>
                                  {ex.prevReps}×
                                </Text>
                              </View>
                            </>
                          )}

                          <View style={{
                            position: 'absolute',
                            top: 0,
                            left: `${Math.min((ex.currReps / maxReps) * 100, 93)}%`,
                            transform: [{ translateX: -((Math.min((ex.currReps / maxReps) * 100, 93)) * 0.01) * 30 }],
                          }}>
                            <Text style={{
                              fontSize: 9,
                              fontWeight: '700',
                              color: hexAlpha(ex.style.color, 0.8),
                            }}>
                              {ex.currDate}
                            </Text>
                          </View>
                          <View style={{
                            position: 'absolute',
                            top: 13,
                            left: `${Math.min((ex.currReps / maxReps) * 100, 93)}%`,
                            transform: [{ translateX: -((Math.min((ex.currReps / maxReps) * 100, 93)) * 0.01) * 30 }],
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
                            bottom: 6,
                            left: 0,
                            right: 0,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: hexAlpha(ex.style.color, 0.06),
                          }} />

                          {ex.prevReps > 0 && (
                            <View style={{
                              position: 'absolute',
                              bottom: 6,
                              left: 0,
                              width: `${Math.min((ex.prevReps / maxReps) * 100, 93)}%`,
                              height: 6,
                              backgroundColor: hexAlpha(ex.style.color, 0.35),
                            }} />
                          )}

                          {Math.min((ex.currReps / maxReps) * 100, 93) > Math.min((ex.prevReps / maxReps) * 100, 93) && (
                            <View style={{
                              position: 'absolute',
                              bottom: 6,
                              left: `${Math.min((ex.prevReps / maxReps) * 100, 93)}%`,
                              width: `${Math.min((ex.currReps / maxReps) * 100, 93) - Math.min((ex.prevReps / maxReps) * 100, 93)}%`,
                              height: 6,
                              backgroundColor: ex.style.color,
                            }} />
                          )}

                          {ex.prevReps > 0 && (
                            <View style={{
                              position: 'absolute',
                              bottom: 0,
                              left: `${Math.min((ex.prevReps / maxReps) * 100, 93)}%`,
                              width: 12,
                              height: 12,
                              borderRadius: 6,
                              backgroundColor: hexAlpha(ex.style.color, 0.5),
                              borderWidth: 2,
                              borderColor: T.card,
                              marginLeft: -6,
                              shadowColor: ex.style.color,
                              shadowRadius: 4,
                              shadowOpacity: 0.3,
                              shadowOffset: { width: 0, height: 0 },
                            }} />
                          )}

                          <View style={{
                            position: 'absolute',
                            bottom: -2,
                            left: `${Math.min((ex.currReps / maxReps) * 100, 93)}%`,
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

                      <View style={{ flexShrink: 0, alignItems: 'flex-start', width: 52, paddingTop: 28 }}>
                        <Text style={{
                          fontSize: 12,
                          fontWeight: '800',
                          color: ex.deltaReps !== null
                            ? (ex.deltaReps > 0 ? ex.style.color : '#64748B')
                            : '#334155',
                        }}>
                          {ex.pctReps !== null ? `${ex.pctReps >= 0 ? '+' : ''}${ex.pctReps}%` : '1ª'}
                        </Text>
                        {ex.deltaReps !== null && ex.deltaReps > 0 && (
                          <Text style={{ fontSize: 14, marginTop: 2 }}>
                            {getEmoji(ex.pctReps)}
                          </Text>
                        )}
                      </View>
                    </View>
                  )}
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

                  {ex.currLoad === ex.prevLoad && ex.prevLoad > 0 ? (
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      marginTop: 6,
                    }}>
                      <Text style={{
                        fontSize: 11,
                        fontWeight: '700',
                        color: '#334155',
                      }}>
                        Carga:
                      </Text>
                      <Text style={{
                        fontSize: 11,
                        fontWeight: '700',
                        color: hexAlpha(ex.style.color, 0.7),
                      }}>
                        {ex.currLoad}kg
                      </Text>
                    </View>
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{ flex: 1, marginRight: 12 }}>
                        <View style={{ position: 'relative', height: 60 }}>
                          {ex.prevLoad > 0 && (
                            <>
                              <View style={{
                                position: 'absolute',
                                top: 0,
                                left: `${Math.min((ex.prevLoad / maxLoad) * 100, 93)}%`,
                                transform: [{ translateX: -((Math.min((ex.prevLoad / maxLoad) * 100, 93)) * 0.01) * 30 }],
                              }}>
                                <Text style={{
                                  fontSize: 9,
                                  fontWeight: '700',
                                  color: '#334155',
                                }}>
                                  {ex.prevDate}
                                </Text>
                              </View>
                              <View style={{
                                position: 'absolute',
                                top: 13,
                                left: `${Math.min((ex.prevLoad / maxLoad) * 100, 93)}%`,
                                transform: [{ translateX: -((Math.min((ex.prevLoad / maxLoad) * 100, 93)) * 0.01) * 30 }],
                              }}>
                                <Text style={{
                                  fontSize: 11,
                                  fontWeight: '700',
                                  color: '#475569',
                                }}>
                                  {ex.prevLoad}kg
                                </Text>
                              </View>
                            </>
                          )}

                          {ex.currLoad > 0 && (
                            <>
                              <View style={{
                                position: 'absolute',
                                top: 0,
                                left: `${Math.min((ex.currLoad / maxLoad) * 100, 93)}%`,
                                transform: [{ translateX: -((Math.min((ex.currLoad / maxLoad) * 100, 93)) * 0.01) * 30 }],
                              }}>
                                <Text style={{
                                  fontSize: 9,
                                  fontWeight: '700',
                                  color: hexAlpha(ex.style.color, 0.8),
                                }}>
                                  {ex.currDate}
                                </Text>
                              </View>
                              <View style={{
                                position: 'absolute',
                                top: 13,
                                left: `${Math.min((ex.currLoad / maxLoad) * 100, 93)}%`,
                                transform: [{ translateX: -((Math.min((ex.currLoad / maxLoad) * 100, 93)) * 0.01) * 30 }],
                              }}>
                                <Text style={{
                                  fontSize: 12,
                                  fontWeight: '800',
                                  color: ex.style.color,
                                }}>
                                  {ex.currLoad}kg
                                </Text>
                              </View>
                            </>
                          )}

                          <View style={{
                            position: 'absolute',
                            bottom: 6,
                            left: 0,
                            right: 0,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: hexAlpha(ex.style.color, 0.06),
                          }} />

                          {ex.prevLoad > 0 && (
                            <View style={{
                              position: 'absolute',
                              bottom: 6,
                              left: 0,
                              width: `${Math.min((ex.prevLoad / maxLoad) * 100, 93)}%`,
                              height: 6,
                              backgroundColor: hexAlpha(ex.style.color, 0.35),
                            }} />
                          )}

                          {ex.currLoad > 0 && Math.min((ex.currLoad / maxLoad) * 100, 93) > Math.min((ex.prevLoad / maxLoad) * 100, 93) && (
                            <View style={{
                              position: 'absolute',
                              bottom: 6,
                              left: `${Math.min((ex.prevLoad / maxLoad) * 100, 93)}%`,
                              width: `${Math.min((ex.currLoad / maxLoad) * 100, 93) - Math.min((ex.prevLoad / maxLoad) * 100, 93)}%`,
                              height: 6,
                              backgroundColor: ex.style.color,
                            }} />
                          )}

                          {ex.prevLoad > 0 && (
                            <View style={{
                              position: 'absolute',
                              bottom: 0,
                              left: `${Math.min((ex.prevLoad / maxLoad) * 100, 93)}%`,
                              width: 12,
                              height: 12,
                              borderRadius: 6,
                              backgroundColor: hexAlpha(ex.style.color, 0.5),
                              borderWidth: 2,
                              borderColor: T.card,
                              marginLeft: -6,
                              shadowColor: ex.style.color,
                              shadowRadius: 4,
                              shadowOpacity: 0.3,
                              shadowOffset: { width: 0, height: 0 },
                            }} />
                          )}

                          {ex.currLoad > 0 && (
                            <View style={{
                              position: 'absolute',
                              bottom: -2,
                              left: `${Math.min((ex.currLoad / maxLoad) * 100, 93)}%`,
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

                      <View style={{ flexShrink: 0, alignItems: 'flex-start', width: 52, paddingTop: 28 }}>
                        <Text style={{
                          fontSize: 12,
                          fontWeight: '800',
                          color: ex.deltaLoad !== null
                            ? (ex.deltaLoad > 0 ? ex.style.color : '#64748B')
                            : '#334155',
                        }}>
                          {ex.pctLoad !== null ? `${ex.pctLoad >= 0 ? '+' : ''}${ex.pctLoad}%` : '1ª'}
                        </Text>
                        {ex.deltaLoad !== null && ex.deltaLoad > 0 && (
                          <Text style={{ fontSize: 14, marginTop: 2 }}>
                            {getEmoji(ex.pctLoad)}
                          </Text>
                        )}
                      </View>
                    </View>
                  )}
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
