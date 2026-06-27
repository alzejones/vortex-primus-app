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

    const deltaDist = prevDist > 0 && currDist > 0 ? currDist - prevDist : null;
    const deltaTime = prevTime > 0 && currTime > 0 ? currTime - prevTime : null;

    const pctDist = deltaDist !== null && prevDist > 0 ? Math.round((deltaDist / prevDist) * 100) : null;
    const pctTime = deltaTime !== null && prevTime > 0 ? Math.round((deltaTime / prevTime) * 100) : null;

    const style = EX_STYLES[idx % EX_STYLES.length];
    const suffix = item.distance_m > 0 ? 'm' : 'rep';

    const hasGain = (deltaDist !== null && deltaDist > 0) || (deltaTime !== null && deltaTime < 0);
    const maxPct = Math.max(
      pctDist !== null && pctDist > 0 ? pctDist : 0,
      pctTime !== null && pctTime < 0 ? -pctTime : 0
    );

    return {
      name: item.test_type,
      style,
      currDist,
      currTime,
      prevDist,
      prevTime,
      deltaDist,
      deltaTime,
      pctDist,
      pctTime,
      currDate: formatShortDate(curr.date),
      prevDate: prev ? formatShortDate(prev.date) : '',
      sequenceNum: String(idx + 1).padStart(2, '0'),
      suffix,
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
        {exerciseData.map((ex, idx) => {
          const maxDist = Math.max(ex.currDist, ex.prevDist) * SCALE || 1;
          const maxTime = Math.max(ex.currTime, ex.prevTime) * SCALE || 1;

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
                  DIST / REP
                </Text>

                {ex.prevDist > 0 && ex.currDist === ex.prevDist ? (
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    marginBottom: 8,
                  }}>
                    <Text style={{
                      fontSize: 11,
                      fontWeight: '700',
                      color: '#334155',
                    }}>
                      Dist:
                    </Text>
                    <Text style={{
                      fontSize: 11,
                      fontWeight: '700',
                      color: hexAlpha(ex.style.color, 0.7),
                    }}>
                      {ex.currDist}{ex.suffix}
                    </Text>
                  </View>
                ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ flex: 1, marginRight: 12 }}>
                    <View style={{ position: 'relative', height: 60 }}>
                      {ex.prevDist > 0 && (
                        <>
                          <View style={{
                            position: 'absolute',
                            top: 0,
                            left: `${Math.min((ex.prevDist / maxDist) * 100, 93)}%`,
                            transform: [{ translateX: -((Math.min((ex.prevDist / maxDist) * 100, 93)) * 0.01) * 30 }],
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
                            left: `${Math.min((ex.prevDist / maxDist) * 100, 93)}%`,
                            transform: [{ translateX: -((Math.min((ex.prevDist / maxDist) * 100, 93)) * 0.01) * 30 }],
                          }}>
                            <Text style={{
                              fontSize: 11,
                              fontWeight: '700',
                              color: '#475569',
                            }}>
                              {ex.prevDist}{ex.suffix}
                            </Text>
                          </View>
                        </>
                      )}

                      <View style={{
                        position: 'absolute',
                        top: 0,
                        left: `${Math.min((ex.currDist / maxDist) * 100, 93)}%`,
                        transform: [{ translateX: -((Math.min((ex.currDist / maxDist) * 100, 93)) * 0.01) * 30 }],
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
                        left: `${Math.min((ex.currDist / maxDist) * 100, 93)}%`,
                        transform: [{ translateX: -((Math.min((ex.currDist / maxDist) * 100, 93)) * 0.01) * 30 }],
                      }}>
                        <Text style={{
                          fontSize: 12,
                          fontWeight: '800',
                          color: ex.style.color,
                        }}>
                          {ex.currDist}{ex.suffix}
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

                      {ex.prevDist > 0 && (
                        <View style={{
                          position: 'absolute',
                          bottom: 6,
                          left: 0,
                          width: `${Math.min((ex.prevDist / maxDist) * 100, 93)}%`,
                          height: 6,
                          backgroundColor: hexAlpha(ex.style.color, 0.35),
                        }} />
                      )}

                      {Math.min((ex.currDist / maxDist) * 100, 93) > Math.min((ex.prevDist / maxDist) * 100, 93) && (
                        <View style={{
                          position: 'absolute',
                          bottom: 6,
                          left: `${Math.min((ex.prevDist / maxDist) * 100, 93)}%`,
                          width: `${Math.min((ex.currDist / maxDist) * 100, 93) - Math.min((ex.prevDist / maxDist) * 100, 93)}%`,
                          height: 6,
                          backgroundColor: ex.style.color,
                        }} />
                      )}

                      {ex.prevDist > 0 && (
                        <View style={{
                          position: 'absolute',
                          bottom: 0,
                          left: `${Math.min((ex.prevDist / maxDist) * 100, 93)}%`,
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
                        left: `${Math.min((ex.currDist / maxDist) * 100, 93)}%`,
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
                      color: ex.deltaDist !== null
                        ? (ex.deltaDist > 0 ? ex.style.color : '#64748B')
                        : '#334155',
                    }}>
                      {ex.pctDist !== null ? `${ex.pctDist >= 0 ? '+' : ''}${ex.pctDist}%` : '1ª'}
                    </Text>
                    {ex.deltaDist !== null && ex.deltaDist > 0 && (
                      <Text style={{ fontSize: 14, marginTop: 2 }}>
                        {getEmoji(ex.pctDist)}
                      </Text>
                    )}
                  </View>
                </View>
                )}
              </View>

              {(ex.currTime > 0 || ex.prevTime > 0) && (
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
                    TEMPO
                  </Text>

                  {ex.currTime === ex.prevTime && ex.prevTime > 0 ? (
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
                            left: `${Math.min((ex.currTime / maxTime) * 100, 93)}%`,
                            transform: [{ translateX: -((Math.min((ex.currTime / maxTime) * 100, 93)) * 0.01) * 30 }],
                          }}>
                            <Text style={{
                              fontSize: 11,
                              fontWeight: '700',
                              color: ex.style.color,
                            }}>
                              {ex.currTime}s
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
                            left: `${Math.min((ex.currTime / maxTime) * 100, 93)}%`,
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
                          {(() => {
                            const posBefore = Math.min((ex.prevTime / maxTime) * 100, 93);
                            const posAfter  = Math.min((ex.currTime / maxTime) * 100, 93);
                            const gap = Math.abs(posAfter - posBefore);
                            const overlap = ex.prevTime > 0 && ex.currTime > 0 && gap < 18;

                            const topPrevDate  = overlap ? 0  : 0;
                            const topCurrDate  = overlap ? 11 : 0;
                            const topPrevVal   = overlap ? 13 : 13;
                            const topCurrVal   = overlap ? 24 : 13;

                            return (
                              <>
                                {ex.prevTime > 0 && (
                                  <>
                                    <View style={{
                                      position: 'absolute',
                                      top: topPrevDate,
                                      left: `${posBefore}%`,
                                      transform: [{ translateX: -(posBefore * 0.01) * 30 }],
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
                                      top: topPrevVal,
                                      left: `${posBefore}%`,
                                      transform: [{ translateX: -(posBefore * 0.01) * 30 }],
                                    }}>
                                      <Text style={{
                                        fontSize: 11,
                                        fontWeight: '700',
                                        color: '#475569',
                                      }}>
                                        {ex.prevTime}s
                                      </Text>
                                    </View>
                                  </>
                                )}

                                {ex.currTime > 0 && (
                                  <>
                                    <View style={{
                                      position: 'absolute',
                                      top: topCurrDate,
                                      left: `${posAfter}%`,
                                      transform: [{ translateX: -(posAfter * 0.01) * 30 }],
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
                                      top: topCurrVal,
                                      left: `${posAfter}%`,
                                      transform: [{ translateX: -(posAfter * 0.01) * 30 }],
                                    }}>
                                      <Text style={{
                                        fontSize: 12,
                                        fontWeight: '800',
                                        color: ex.deltaTime !== null && ex.deltaTime < 0 ? ex.style.color : '#64748B',
                                      }}>
                                        {ex.currTime}s
                                      </Text>
                                    </View>
                                  </>
                                )}
                              </>
                            );
                          })()}

                          <View style={{
                            position: 'absolute',
                            bottom: 6,
                            left: 0,
                            right: 0,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: hexAlpha(ex.style.color, 0.06),
                          }} />

                          {ex.prevTime > 0 && (
                            <View style={{
                              position: 'absolute',
                              bottom: 6,
                              left: 0,
                              width: `${Math.min((ex.prevTime / maxTime) * 100, 93)}%`,
                              height: 6,
                              backgroundColor: hexAlpha(ex.style.color, 0.35),
                            }} />
                          )}

                          {ex.currTime > 0 && ex.deltaTime !== null && ex.deltaTime < 0 && (
                            <View style={{
                              position: 'absolute',
                              bottom: 6,
                              left: `${Math.min((ex.currTime / maxTime) * 100, 93)}%`,
                              width: `${Math.min((ex.prevTime / maxTime) * 100, 93) - Math.min((ex.currTime / maxTime) * 100, 93)}%`,
                              height: 6,
                              backgroundColor: ex.style.color,
                            }} />
                          )}

                          {ex.prevTime > 0 && (
                            <View style={{
                              position: 'absolute',
                              bottom: 0,
                              left: `${Math.min((ex.prevTime / maxTime) * 100, 93)}%`,
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

                          {ex.currTime > 0 && (
                            <View style={{
                              position: 'absolute',
                              bottom: -2,
                              left: `${Math.min((ex.currTime / maxTime) * 100, 93)}%`,
                              width: 18,
                              height: 18,
                              borderRadius: 9,
                              backgroundColor: ex.deltaTime !== null && ex.deltaTime < 0 ? ex.style.color : '#64748B',
                              borderWidth: 3,
                              borderColor: T.card,
                              marginLeft: -9,
                              shadowColor: ex.deltaTime !== null && ex.deltaTime < 0 ? ex.style.color : '#64748B',
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
                          color: ex.deltaTime !== null
                            ? (ex.deltaTime < 0 ? ex.style.color : '#64748B')
                            : '#334155',
                        }}>
                          {ex.pctTime !== null ? `${ex.pctTime >= 0 ? '+' : ''}${ex.pctTime}%` : '1ª'}
                        </Text>
                        {ex.deltaTime !== null && ex.deltaTime < 0 && (
                          <Text style={{ fontSize: 14, marginTop: 2 }}>
                            {getEmoji(-ex.pctTime!)}
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
