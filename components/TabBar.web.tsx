// ============================================================
// TabBar.web.tsx — Sidebar de navegação fixa para desktop
// Expo resolve automaticamente este arquivo na web,
// mantendo TabBar.tsx intacto para mobile/nativo.
// ============================================================
import { router, usePathname } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { T } from '../utils/theme';

const TABS = [
  { key: 'home', label: 'Home', icon: '🏠', href: '/(protected)' },
  { key: 'clients', label: 'Alunos', icon: '👥', href: '/(protected)/clients' },
  { key: 'schedule', label: 'Agenda', icon: '📅', href: '/(protected)/schedule/' },
  { key: 'config', label: 'Config', icon: '⚙️', href: '/(protected)/trainer-profile'},
] as const;

function isActive(key: string, pathname: string): boolean {
  switch (key) {
    case 'home': return pathname === '/';
    case 'clients': return pathname.startsWith('/clients') || pathname.startsWith('/client');
    case 'schedule': return pathname.startsWith('/schedule');
    case 'config': return pathname.startsWith('/trainer-profile');
    default: return false;
  }
}

export default function TabBar() {
  const pathname = usePathname();

  return (
    <View style={styles.sidebar}>
      {/* Logo / marca */}
      <View style={styles.brand}>
        <Text style={styles.brandText}>Vortex</Text>
        <Text style={styles.brandAccent}>Primus</Text>
      </View>

      {/* Divisor */}
      <View style={styles.divider} />

      {/* Itens de navegação */}
      <View style={styles.nav}>
        {TABS.map((tab) => {
          const active = isActive(tab.key, pathname);
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.item, active && styles.itemActive]}
              onPress={() => router.push(tab.href as any)}
              activeOpacity={0.85}
            >
              {/* Indicador lateral ativo */}
              <View style={[styles.indicator, active && styles.indicatorActive]} />

              <Text style={[styles.icon, active && styles.iconActive]}>
                {tab.icon}
              </Text>

              <Text style={[styles.label, active && styles.labelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Espaço flexível empurra rodapé para baixo */}
      <View style={{ flex: 1 }} />

      {/* Rodapé da sidebar */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>v1.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 240,
    height: '100%' as any,
    backgroundColor: T.surface,
    borderRightWidth: 1,
    borderRightColor: T.border,
    paddingTop: 32,
    paddingBottom: 24,
    flexDirection: 'column',
  },

  // Marca no topo
  brand: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingHorizontal: 24,
    marginBottom: 24,
    gap: 4,
  },
  brandText: {
    fontSize: 20,
    fontWeight: '800',
    color: T.t1,
    letterSpacing: -0.5,
  },
  brandAccent: {
    fontSize: 20,
    fontWeight: '800',
    color: T.blue,
    letterSpacing: -0.5,
  },

  divider: {
    height: 1,
    backgroundColor: T.border,
    marginHorizontal: 16,
    marginBottom: 16,
  },

  nav: {
    flexDirection: 'column',
    gap: 4,
    paddingHorizontal: 12,
  },

  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    position: 'relative',
    gap: 12,
  },
  itemActive: {
    backgroundColor: T.blue + '18', // azul com 9% opacidade
  },

  // Indicador — barra vertical esquerda no item ativo
  indicator: {
    position: 'absolute',
    left: 0,
    top: 8,
    bottom: 8,
    width: 3,
    borderRadius: 2,
    backgroundColor: 'transparent',
  },
  indicatorActive: {
    backgroundColor: T.blue,
  },

  icon: {
    fontSize: 20,
    color: T.t2,
  },
  iconActive: {
    color: T.blue,
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: T.t2,
    letterSpacing: 0.1,
  },
  labelActive: {
    color: T.blue,
    fontWeight: '700',
  },

  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: T.border,
  },
  footerText: {
    fontSize: 11,
    color: T.t2,
    fontWeight: '500',
  },
});