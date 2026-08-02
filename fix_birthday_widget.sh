#!/bin/bash
set -e
cd /home/p/vortex-primus-app

python3 << 'PYEOF'
import re

# ============================================================
# 1) app/(protected)/index.tsx
# ============================================================
path = "app/(protected)/index.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

old_block = """      // Aniversariantes do mês atual
      const currentMonth = today.getMonth() + 1; // 1-12
      const currentDay = today.getDate();
      const birthdayClients = clientsWithViews.filter((c: any) => {
        if (!c.birth_date) return false;
        const [, month, day] = c.birth_date.split('-').map(Number);
        return month === currentMonth;
      }).sort((a: any, b: any) => {
        const [, , dayA] = a.birth_date.split('-').map(Number);
        const [, , dayB] = b.birth_date.split('-').map(Number);
        return dayA - dayB;
      });
      setBirthdayClients(birthdayClients);"""

new_block = """      // Aniversariantes do mês atual (exclui quem já foi parabenizado este ano)
      const currentMonth = today.getMonth() + 1; // 1-12
      const currentYear = today.getFullYear();
      const birthdayClients = clientsWithViews.filter((c: any) => {
        if (!c.birth_date) return false;
        if (c.last_congratulated_year === currentYear) return false;
        const [, month, day] = c.birth_date.split('-').map(Number);
        return month === currentMonth;
      }).sort((a: any, b: any) => {
        const [, , dayA] = a.birth_date.split('-').map(Number);
        const [, , dayB] = b.birth_date.split('-').map(Number);
        return dayA - dayB;
      });
      setBirthdayClients(birthdayClients);"""

if old_block not in content:
    raise SystemExit(f"❌ Bloco de aniversariantes não encontrado em {path} — abortando sem alterar nada.")
content = content.replace(old_block, new_block)

# Adiciona a função handleCongratulate logo antes de "async function onRefresh()"
old_refresh = """  async function onRefresh() {"""
new_refresh = """  async function handleCongratulate(clientId: string) {
    const currentYear = new Date().getFullYear();
    // Otimista: some da tela na hora
    setBirthdayClients(prev => prev.filter((c: any) => c.id !== clientId));
    const { error } = await supabase
      .from('clients')
      .update({ last_congratulated_year: currentYear })
      .eq('id', clientId);
    if (error) {
      console.log('Erro ao marcar parabéns:', error);
    }
  }

  async function onRefresh() {"""

if old_refresh not in content:
    raise SystemExit(f"❌ 'async function onRefresh()' não encontrado em {path} — abortando.")
content = content.replace(old_refresh, new_refresh, 1)

# Passa a prop onCongratulate pro DashboardLayout
old_prop_pass = """      overdueClients={overdueClients}
      birthdayClients={birthdayClients}"""
new_prop_pass = """      overdueClients={overdueClients}
      birthdayClients={birthdayClients}
      onCongratulate={handleCongratulate}"""

if old_prop_pass not in content:
    raise SystemExit(f"❌ Passagem de props overdueClients/birthdayClients não encontrada em {path} — abortando.")
content = content.replace(old_prop_pass, new_prop_pass)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)
print(f"✅ {path} atualizado.")

# ============================================================
# 2) components/dashboard/DashboardLayoutMobile.tsx
# ============================================================
path2 = "components/dashboard/DashboardLayoutMobile.tsx"
with open(path2, "r", encoding="utf-8") as f:
    c2 = f.read()

# --- Prop no tipo ---
old_type = """  overdueClients: Client[];
  birthdayClients: Client[];
  goalsWidget?: {"""
new_type = """  overdueClients: Client[];
  birthdayClients: Client[];
  onCongratulate: (clientId: string) => void;
  goalsWidget?: {"""
if old_type not in c2:
    raise SystemExit(f"❌ Tipo DashboardLayoutProps não encontrado em {path2} — abortando.")
c2 = c2.replace(old_type, new_type)

# --- Destructuring ---
old_destruct = """  overdueClients, birthdayClients, goalsWidget,
}: DashboardLayoutProps) {
  const [overdueModalVisible, setOverdueModalVisible] = useState(false);"""
new_destruct = """  overdueClients, birthdayClients, onCongratulate, goalsWidget,
}: DashboardLayoutProps) {
  const [overdueModalVisible, setOverdueModalVisible] = useState(false);
  const [birthdayModalVisible, setBirthdayModalVisible] = useState(false);"""
if old_destruct not in c2:
    raise SystemExit(f"❌ Destructuring de props não encontrado em {path2} — abortando.")
c2 = c2.replace(old_destruct, new_destruct)

# --- Widget compacto (slice 3 + ver todos + botão Parabéns) ---
old_widget = """      {/* ─── Widget: Aniversariantes ─────────────────────────── */}
      {birthdayClients.length > 0 && (
        <View style={styles.birthdayWidget}>
          <View style={styles.widgetHeader}>
            <Text style={styles.birthdayWidgetTitle}>🎂 Aniversariantes</Text>
            <Text style={styles.birthdayMonth}>
              {new Date().toLocaleDateString('pt-BR', { month: 'long' })}
            </Text>
          </View>
          {birthdayClients.map((client) => {
            const isToday = isBirthdayToday(client.birth_date);
            const day = getDayOfMonth(client.birth_date);
            return (
              <TouchableOpacity
                key={client.id}
                style={[styles.birthdayRow, isToday && styles.birthdayRowToday]}
                onPress={() => router.push(`/(protected)/client-details?id=${client.id}` as any)}
                activeOpacity={0.75}
              >
                <View style={[styles.birthdayDayBox, isToday && styles.birthdayDayBoxToday]}>
                  <Text style={[styles.birthdayDayText, isToday && styles.birthdayDayTextToday]}>
                    {String(day).padStart(2, '0')}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.birthdayName, isToday && styles.birthdayNameToday]}>
                    {client.name}
                  </Text>
                  {isToday && (
                    <Text style={styles.birthdayTodayBadge}>🎉 Hoje!</Text>
                  )}
                </View>
                {isToday && <Text style={{ fontSize: 20 }}>🎂</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
      )}"""

new_widget = """      {/* ─── Widget: Aniversariantes ─────────────────────────── */}
      {birthdayClients.length > 0 && (
        <View style={styles.birthdayWidget}>
          <View style={styles.widgetHeader}>
            <Text style={styles.birthdayWidgetTitle}>🎂 Aniversariantes</Text>
            <Text style={styles.birthdayMonth}>
              {new Date().toLocaleDateString('pt-BR', { month: 'long' })}
            </Text>
          </View>
          {birthdayClients.slice(0, 3).map((client) => {
            const isToday = isBirthdayToday(client.birth_date);
            const day = getDayOfMonth(client.birth_date);
            return (
              <View
                key={client.id}
                style={[styles.birthdayRow, isToday && styles.birthdayRowToday]}
              >
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
                  onPress={() => router.push(`/(protected)/client-details?id=${client.id}` as any)}
                  activeOpacity={0.75}
                >
                  <View style={[styles.birthdayDayBox, isToday && styles.birthdayDayBoxToday]}>
                    <Text style={[styles.birthdayDayText, isToday && styles.birthdayDayTextToday]}>
                      {String(day).padStart(2, '0')}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.birthdayName, isToday && styles.birthdayNameToday]}>
                      {client.name}
                    </Text>
                    {isToday && (
                      <Text style={styles.birthdayTodayBadge}>🎉 Hoje!</Text>
                    )}
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => onCongratulate(client.id)}
                  activeOpacity={0.75}
                  style={styles.alertScheduleBtn}
                >
                  <Text style={{ fontSize: 18 }}>🎉</Text>
                </TouchableOpacity>
              </View>
            );
          })}
          {birthdayClients.length > 3 && (
            <TouchableOpacity onPress={() => setBirthdayModalVisible(true)}>
              <Text style={[styles.alertMore, { color: T.blue, textDecorationLine: 'underline' }]}>
                +{birthdayClients.length - 3} mais — ver todos
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}"""

if old_widget not in c2:
    raise SystemExit(f"❌ Bloco JSX do widget Aniversariantes não encontrado em {path2} — abortando sem alterar nada.")
c2 = c2.replace(old_widget, new_widget)

# --- Modal "ver todos" de aniversariantes, inserido logo após o Modal de overdue ---
old_modal_close = """            />
          </View>
        </View>
      </Modal>
    </View>
  );
}"""

new_modal_close = """            />
          </View>
        </View>
      </Modal>

      <Modal
        visible={birthdayModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setBirthdayModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: T.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%' }}>
            <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: T.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 17, fontWeight: '800', color: T.t1 }}>
                🎂 Aniversariantes ({birthdayClients.length})
              </Text>
              <TouchableOpacity onPress={() => setBirthdayModalVisible(false)}>
                <Text style={{ fontSize: 22, color: T.t3 }}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={birthdayClients}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ padding: 16 }}
              renderItem={({ item }) => {
                const isToday = isBirthdayToday(item.birth_date);
                const day = getDayOfMonth(item.birth_date);
                return (
                  <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: T.border }}>
                    <TouchableOpacity
                      style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
                      onPress={() => {
                        setBirthdayModalVisible(false);
                        router.push(`/(protected)/client-details?id=${item.id}` as any);
                      }}
                      activeOpacity={0.75}
                    >
                      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(59,130,246,0.15)', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                        <Text style={{ color: T.blue, fontWeight: '800', fontSize: 13 }}>{String(day).padStart(2, '0')}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: T.t1 }}>{item.name}</Text>
                        {isToday && <Text style={{ fontSize: 12, color: T.blue, marginTop: 2 }}>🎉 Hoje!</Text>}
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => onCongratulate(item.id)}
                      style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: 'rgba(59,130,246,0.15)', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Text style={{ fontSize: 18 }}>🎉</Text>
                    </TouchableOpacity>
                  </View>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}"""

if old_modal_close not in c2:
    raise SystemExit(f"❌ Fechamento do Modal de overdue não encontrado em {path2} — abortando sem alterar nada.")
c2 = c2.replace(old_modal_close, new_modal_close)

with open(path2, "w", encoding="utf-8") as f:
    f.write(c2)
print(f"✅ {path2} atualizado.")
PYEOF

git add -A
git commit -m "fix(dashboard): limita card Aniversariantes a 3 + modal ver todos + botao Parabens (remove do card)"
git push
