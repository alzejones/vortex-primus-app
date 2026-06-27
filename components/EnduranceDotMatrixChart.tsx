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

    const distanceVal = Number(item.distance_m) || 0;

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
      distance_m: distanceVal,
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
          const SCALE = 1.4;
          const maxDist = Math.max(ex.currDist, ex.prevDist) * SCALE || 1;
          const maxTime = Math.max(ex.currTime, ex.prevTime) * SCALE || 1;
          const posBeforeDist = Math.min((ex.prevDist / maxDist) * 100, 93);
          const posAfterDist = Math.min((ex.currDist / maxDist) * 100, 93);
          const posBeforeTime = Math.min((ex.prevTime / maxTime) * 100, 93);
          const posAfterTime = Math.min((ex.currTime / maxTime) * 100, 93);

          const deltaPctDist = ex.pctDist;
          const deltaPctTime = ex.pctTime;

          const hasEvolution = (ex.deltaDist !== null && ex.deltaDist > 0) || (ex.deltaTime !== null && ex.deltaTime < 0);
          const maxPct = Math.max(
            deltaPctDist !== null && deltaPctDist > 0 ? deltaPctDist : 0,
            deltaPctTime !== null && deltaPctTime < 0 ? -deltaPctTime : 0
          );

          const suffix = ex.distance_m > 0 ? 'm' : 'rep';

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

                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ flex: 1, marginRight: 12 }}>
                    <View style={{ position: 'relative', height: 38 }}>
                      {ex.prevDist > 0 && (
                        <View style={{
                          position: 'absolute',
                          top: 0,
                          left: `${posBeforeDist}%`,
                          transform: [{ translateX: -(posBeforeDist * 0.01) * 30 }],
                        }}>
                          <Text style={{
                            fontSize: 11,
                            fontWeight: '700',
                            color: '#475569',
                          }}>
                            {ex.prevDist}{suffix}
                          </Text>
                        </View>
                      )}

                      <View style={{
                        position: 'absolute',
                        top: 0,
                        left: `${posAfterDist}%`,
                        transform: [{ translateX: -(posAfterDist * 0.01) * 30 }],
                      }}>
                        <Text style={{
                          fontSize: 12,
                          fontWeight: '800',
                          color: ex.style.color,
                        }}>
                          {ex.currDist}{suffix}
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

                      {ex.prevDist > 0 && (
                        <View style={{
                          position: 'absolute',
                          bottom: 4,
                          left: 0,
                          width: `${posBeforeDist}%`,
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: hexAlpha(ex.style.color, 0.35),
                        }} />
                      )}

                      {posAfterDist > posBeforeDist && (
                        <View style={{
                          position: 'absolute',
                          bottom: 4,
                          left: `${posBeforeDist}%`,
                          width: `${posAfterDist - posBeforeDist}%`,
                          height: 6,
                          borderTopRightRadius: 3,
                          borderBottomRightRadius: 3,
                          backgroundColor: ex.style.color,
                        }} />
                      )}

                      {ex.prevDist > 0 && (
                        <View style={{
                          position: 'absolute',
                          bottom: 0,
                          left: `${posBeforeDist}%`,
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
                        left: `${posAfterDist}%`,
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
                      color: ex.deltaDist !== null
                        ? (ex.deltaDist > 0 ? ex.style.color : '#64748B')
                        : '#334155',
                    }}>
                      {deltaPctDist !== null ? `${deltaPctDist >= 0 ? '+' : ''}${deltaPctDist}%` : '1ª'}
                    </Text>
                    {ex.deltaDist !== null && ex.deltaDist > 0 && (
                      <Text style={{ fontSize: 14, marginTop: 2 }}>
                        {getEmoji(ex.pctDist)}
                      </Text>
                    )}
                  </View>
                </View>
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

                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ flex: 1, marginRight: 12 }}>
                      <View style={{ position: 'relative', height: 38 }}>
                        {ex.prevTime > 0 && (
                          <View style={{
                            position: 'absolute',
                            top: 0,
                            left: `${posBeforeTime}%`,
                            transform: [{ translateX: -(posBeforeTime * 0.01) * 30 }],
                          }}>
                            <Text style={{
                              fontSize: 11,
                              fontWeight: '700',
                              color: '#475569',
                            }}>
                              {ex.prevTime}s
                            </Text>
                          </View>
                        )}

                        {ex.currTime > 0 && (
                          <View style={{
                            position: 'absolute',
                            top: 0,
                            left: `${posAfterTime}%`,
                            transform: [{ translateX: -(posAfterTime * 0.01) * 30 }],
                          }}>
                            <Text style={{
                              fontSize: 12,
                              fontWeight: '800',
                              color: ex.style.color,
                            }}>
                              {ex.currTime}s
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

                        {ex.prevTime > 0 && (
                          <View style={{
                            position: 'absolute',
                            bottom: 4,
                            left: 0,
                            width: `${posBeforeTime}%`,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: hexAlpha(ex.style.color, 0.35),
                          }} />
                        )}

                        {posAfterTime > posBeforeTime && (
                          <View style={{
                            position: 'absolute',
                            bottom: 4,
                            left: `${posBeforeTime}%`,
                            width: `${posAfterTime - posBeforeTime}%`,
                            height: 6,
                            borderTopRightRadius: 3,
                            borderBottomRightRadius: 3,
                            backgroundColor: ex.style.color,
                          }} />
                        )}

                        {ex.prevTime > 0 && (
                          <View style={{
                            position: 'absolute',
                            bottom: 0,
                            left: `${posBeforeTime}%`,
                            width: 12,
                            height: 12,
                            borderRadius: 6,
                            backgroundColor: hexAlpha(ex.style.color, 0.5),
                            borderWidth: 2,
                            borderColor: T.card,
                            marginLeft: -6,
                          }} />
                        )}

                        {ex.currTime > 0 && (
                          <View style={{
                            position: 'absolute',
                            bottom: -2,
                            left: `${posAfterTime}%`,
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
                        color: ex.deltaTime !== null
                          ? (ex.deltaTime < 0 ? ex.style.color : '#64748B')
                          : '#334155',
                      }}>
                        {deltaPctTime !== null ? `${deltaPctTime >= 0 ? '+' : ''}${deltaPctTime}%` : '1ª'}
                      </Text>
                      {ex.deltaTime !== null && ex.deltaTime < 0 && (
                        <Text style={{ fontSize: 14, marginTop: 2 }}>
                          {getEmoji(-ex.pctTime!)}
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
