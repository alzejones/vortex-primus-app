import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';

type Gender = 'male' | 'female' | 'm' | 'f' | 'M' | 'F' | 'Masculino' | 'Feminino';
interface Props { bodyFatPercentage: number; gender: Gender; }

const ASSETS = {
  female: [
    require('../assets/avatars/female/tier1.png'),
    require('../assets/avatars/female/tier2.png'),
    require('../assets/avatars/female/tier3.png'),
    require('../assets/avatars/female/tier4.png'),
    require('../assets/avatars/female/tier5.png'),
    require('../assets/avatars/female/tier6.png'),
    require('../assets/avatars/female/tier7.png'),
  ],
  male: [
    require('../assets/avatars/male/tier1.png'),
    require('../assets/avatars/male/tier2.png'),
    require('../assets/avatars/male/tier3.png'),
    require('../assets/avatars/male/tier4.png'),
    require('../assets/avatars/male/tier5.png'),
    require('../assets/avatars/male/tier6.png'),
    require('../assets/avatars/male/tier7.png'),
  ],
};

const TIERS_FEMALE = [
  { label: 'Atlética',     range: '< 15%',  min: 0,  max: 14.9 },
  { label: 'Excelente',    range: '15–19%', min: 15, max: 19.9 },
  { label: 'Boa',          range: '20–24%', min: 20, max: 24.9 },
  { label: 'Aceitável',    range: '25–29%', min: 25, max: 29.9 },
  { label: 'Acima',        range: '30–34%', min: 30, max: 34.9 },
  { label: 'Obesidade I',  range: '35–39%', min: 35, max: 39.9 },
  { label: 'Obesidade II', range: '≥ 40%',  min: 40, max: 999  },
];
const TIERS_MALE = [
  { label: 'Atlético',     range: '< 8%',   min: 0,  max: 7.9  },
  { label: 'Excelente',    range: '8–12%',  min: 8,  max: 12.9 },
  { label: 'Bom',          range: '13–17%', min: 13, max: 17.9 },
  { label: 'Aceitável',    range: '18–22%', min: 18, max: 22.9 },
  { label: 'Acima',        range: '23–27%', min: 23, max: 27.9 },
  { label: 'Obesidade I',  range: '28–32%', min: 28, max: 32.9 },
  { label: 'Obesidade II', range: '≥ 33%',  min: 33, max: 999  },
];
const TIER_COLORS = ['#22C55E','#84CC16','#EAB308','#F97316','#EF4444','#DC2626','#991B1B'];

function normalizeGender(g: Gender): 'male' | 'female' {
  return g === 'M' || g === 'm' || g === 'male' || g === 'Masculino' ? 'male' : 'female';
}
function getActiveTier(pct: number, gender: 'male' | 'female'): number {
  const tiers = gender === 'female' ? TIERS_FEMALE : TIERS_MALE;
  const idx = tiers.findIndex(t => pct >= t.min && pct <= t.max);
  return idx === -1 ? 6 : idx;
}

export default function BodyAvatarRow({ bodyFatPercentage, gender }: Props) {
  const g      = normalizeGender(gender);
  const tiers  = g === 'female' ? TIERS_FEMALE : TIERS_MALE;
  const assets = ASSETS[g];
  const active = getActiveTier(bodyFatPercentage, g);
  const color  = TIER_COLORS[active];

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <Text style={styles.title}>Seu Avatar</Text>
        <View style={[styles.badge, { backgroundColor: color + '22', borderColor: color }]}>
          <Text style={[styles.badgeText, { color }]}>
            {tiers[active].label}{'  '}{bodyFatPercentage.toFixed(1)}% GC
          </Text>
        </View>
      </View>

      <View style={styles.row}>
        {tiers.map((tier, i) => {
          const isActive = i === active;
          return (
            <View key={i} style={styles.cardWrapper}>
              <View style={[
                styles.card,
                isActive ? { borderColor: color, borderWidth: 2.5 } : styles.cardInactive,
              ]}>
                <View style={styles.imgBox}>
                  <Image
                    source={assets[i]}
                    style={[styles.img, !isActive && styles.imgDim]}
                    resizeMode="contain"
                  />
                </View>
                {isActive && (
                  <View style={[styles.youBadge, { backgroundColor: color }]}>
                    <Text style={styles.youText}>▼ Você</Text>
                  </View>
                )}
                <View style={[styles.labelBox, isActive && { backgroundColor: color + '18' }]}>
                  <Text style={[styles.labelTier, { color: isActive ? color : '#667' }]}>
                    {tier.label}
                  </Text>
                  <Text style={[styles.labelPct, { color: isActive ? color : '#556' }]}>
                    {tier.range}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>

      <Text style={styles.footer}>
        {g === 'female' ? '♀ Feminino' : '♂ Masculino'} · Baseado no % de gordura corporal
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper:     { marginVertical: 12, marginHorizontal: 0 },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  title:       { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  badge:       { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  badgeText:   { fontSize: 12, fontWeight: '700' },
  row:         { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  cardWrapper: { flex: 1, minWidth: 0 },
  card:        { width: '100%', borderRadius: 8, overflow: 'hidden', backgroundColor: '#141e2e', borderWidth: 1.5, borderColor: '#1e2d45' },
  cardInactive:{ borderColor: '#1e2d45' },
  imgBox:      { width: '100%', aspectRatio: 0.48, alignItems: 'center', justifyContent: 'flex-end' },
  img:         { width: '100%', height: '100%' },
  imgDim:      { opacity: 0.35 },
  youBadge:    { alignItems: 'center', paddingVertical: 2 },
  youText:     { color: '#fff', fontSize: 8, fontWeight: '800' },
  labelBox:    { alignItems: 'center', paddingVertical: 3, paddingHorizontal: 1, borderTopWidth: 1, borderTopColor: '#1e2d45', minHeight: 30, justifyContent: 'center' },
  labelTier:   { fontSize: 7, fontWeight: '600', textAlign: 'center' },
  labelPct:    { fontSize: 8, fontWeight: '700', textAlign: 'center', marginTop: 1 },
  footer:      { fontSize: 10, color: '#445', textAlign: 'center', marginTop: 6 },
});