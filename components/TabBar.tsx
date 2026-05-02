// ============================================================
// TabBar.tsx — Navegação fixa inferior para telas do treinador
// ============================================================
import { router, usePathname } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { T } from "../utils/theme";

const TABS = [
  { key: "home",        label: "Home",    icon: "🏠", href: "/(protected)"               },
  { key: "clients",     label: "Alunos",  icon: "👥", href: "/(protected)/clients"        },
  { key: "schedule",    label: "Agenda",  icon: "📅", href: "/(protected)/schedule/"      },
  { key: "config",      label: "Config",  icon: "⚙️", href: "/(protected)/trainer-profile"},
] as const;

function isActive(key: string, pathname: string): boolean {
  switch (key) {
    case "home":        return pathname === "/";
    case "clients":     return pathname.startsWith("/clients") || pathname.startsWith("/client");
    case "schedule":    return pathname.startsWith("/schedule");
    case "config":      return pathname.startsWith("/trainer-profile");
    default:            return false;
  }
}

export default function TabBar() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();

  return (
    <View style={[styles.container, { height: 64 + insets.bottom, paddingBottom: insets.bottom + 8 }]}>
      {TABS.map((tab) => {
        const active = isActive(tab.key, pathname);
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={() => router.push(tab.href as any)}
            activeOpacity={0.7}
          >
            {/* Indicador ativo */}
            <View style={[styles.indicator, active && styles.indicatorActive]} />

            {/* Ícone */}
            <Text style={[styles.icon, active && styles.iconActive]}>
              {tab.icon}
            </Text>

            {/* Label */}
            <Text style={[styles.label, active && styles.labelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: T.surface,
    borderTopWidth: 1,
    borderTopColor: T.border,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 6,
    position: "relative",
  },

  // Indicador — barrinha azul no topo do item ativo
  indicator: {
    position: "absolute",
    top: 0,
    width: 20,
    height: 3,
    borderRadius: 2,
    backgroundColor: "transparent",
  },
  indicatorActive: {
    backgroundColor: T.blue,
  },

  icon:       { fontSize: 22, marginBottom: 3, color: T.t2 },
  iconActive: { fontSize: 24, color: T.blue },

  label: {
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    color: T.t2,
  },
  labelActive: {
    color: T.blue,
    fontWeight: "800",
  },
});
