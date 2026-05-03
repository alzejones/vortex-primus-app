import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import { GradientPrimary } from "../../utils/gradients";
import { T } from "../../utils/theme";
import TrainerScalesManager from "../../components/TrainerScalesManager";

export default function TrainerProfile() {
  const router = useRouter();
  const { signOut, signingOut, debugMessages } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [trainerId, setTrainerId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [planName, setPlanName] = useState("Carregando...");
  const [maxClients, setMaxClients] = useState(0);
  const [currentClients, setCurrentClients] = useState(0);
  const [planStatus, setPlanStatus] = useState('');

  const [statusMsg, setStatusMsg] = useState({ text: "", type: "" });

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: trainer, error: trainerError } = await supabase
        .from("trainers")
        .select("id, name, email")
        .eq("user_id", user.id)
        .single();

      if (trainerError) throw trainerError;

      setTrainerId(trainer.id);
      setName(trainer.name || "");
      setEmail(trainer.email || "");

      const { data: sub } = await supabase
        .from("trainer_subscriptions")
        .select("status, plans ( name, max_clients, price_monthly )")
        .eq("trainer_id", trainer.id)
        .eq("status", "active")
        .maybeSingle();

      const planData = sub?.plans as any;
      setPlanName(planData?.name ? `${planData.name}` : "Sem Plano Ativo");
      setMaxClients((planData as any)?.max_clients || 0);
      setPlanStatus(sub?.status === 'active' ? 'Ativo' : 'Inativo');

      const { count } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('trainer_id', trainer.id)
;
      setCurrentClients(count || 0);

    } catch (error) {
      console.error("Erro ao carregar perfil:", error);
      setStatusMsg({ text: "Não foi possível carregar os seus dados.", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateProfile() {
    if (!trainerId) {
      setStatusMsg({ text: "Dados do perfil não foram carregados. Recarregue a tela.", type: "error" });
      return;
    }

    if (!name.trim()) {
      setStatusMsg({ text: "O nome não pode estar vazio.", type: "error" });
      return;
    }

    try {
      setSaving(true);
      setStatusMsg({ text: "", type: "" });

      const { error } = await supabase
        .from("trainers")
        .update({ name: name.trim() })
        .eq("id", trainerId);

      if (error) throw error;

      setStatusMsg({ text: "Perfil atualizado com sucesso!", type: "success" });
      setTimeout(() => setStatusMsg({ text: "", type: "" }), 3000);

    } catch (error: any) {
      setStatusMsg({ text: error.message || "Erro ao salvar alterações.", type: "error" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={T.blue} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <Text style={styles.title}>Meu Perfil</Text>
          <Text style={styles.subtitle}>Gerencie as suas informações pessoais e conta.</Text>
        </View>

        {statusMsg.text !== "" && (
          <View style={[styles.statusBox, statusMsg.type === "error" ? styles.statusError : styles.statusSuccess]}>
            <Text style={[styles.statusText, statusMsg.type === "error" ? styles.statusTextError : styles.statusTextSuccess]}>
              {statusMsg.type === "error" ? "⚠️ " : "✅ "}
              {statusMsg.text}
            </Text>
          </View>
        )}

        <View style={styles.formCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{name ? name.substring(0, 2).toUpperCase() : "TR"}</Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nome Completo</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={(t) => { setName(t); setStatusMsg({ text: "", type: "" }); }}
              placeholder="Seu nome"
              placeholderTextColor={T.t3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>E-mail (Login) 🔒</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={email}
              editable={false}
              selectTextOnFocus={false}
            />
            <Text style={styles.helperText}>O e-mail é a sua chave de acesso e não pode ser alterado por aqui.</Text>
          </View>

        </View>

        {/* Card Plano — compacto */}
        <LinearGradient
          {...GradientPrimary}
          style={{ padding: 16, borderRadius: 20, marginBottom: 24 }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <View>
              <Text style={{ fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Plano Atual</Text>
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#fff', marginTop: 2 }}>{planName}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: planStatus === 'Ativo' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: planStatus === 'Ativo' ? '#22C55E' : '#EF4444', marginRight: 5 }} />
              <Text style={{ fontSize: 12, fontWeight: '700', color: planStatus === 'Ativo' ? '#22C55E' : '#EF4444' }}>{planStatus}</Text>
            </View>
          </View>
          <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: '500', marginBottom: 8 }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#fff' }}>{currentClients}</Text>
            {' de '}
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#fff' }}>{maxClients}</Text>
            {' alunos ativos'}
          </Text>
          <View style={{ height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 99, overflow: 'hidden', marginBottom: 4 }}>
            <LinearGradient
              colors={['#10B981', '#34D399']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ height: '100%', borderRadius: 99, width: `${Math.min(maxClients > 0 ? (currentClients / maxClients) * 100 : 0, 100)}%` as any }}
            />
          </View>
          {maxClients > 0 && (currentClients / maxClients) >= 0.8 && (
            <Text style={{ color: '#FFA500', fontWeight: '600', fontSize: 12, marginTop: 8 }}>⚠️ Você está próximo do limite do plano</Text>
          )}
          <TouchableOpacity onPress={() => router.push('/(protected)/upgrade' as any)}>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '600', marginTop: 10, textAlign: 'right' }}>
              Mudar plano →
            </Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* Gerenciamento de Balanças */}
        <TrainerScalesManager />

        {/* Configurações Adicionais */}
        <View style={styles.configSection}>
          <Text style={styles.configSectionTitle}>Configurações</Text>
          
          <TouchableOpacity 
            style={styles.configButton}
            onPress={() => router.push('/(protected)/supplements' as any)}
            activeOpacity={0.7}
          >
            <View style={styles.configButtonLeft}>
              <View style={styles.configButtonIcon}>
                <Text style={{ fontSize: 24 }}>💊</Text>
              </View>
              <View>
                <Text style={styles.configButtonTitle}>Suplementos</Text>
                <Text style={styles.configButtonSubtitle}>Gerenciar base de suplementos</Text>
              </View>
            </View>
            <Text style={styles.configButtonArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleUpdateProfile}
          disabled={saving || !trainerId}
          activeOpacity={0.85}
        >
          <LinearGradient {...GradientPrimary} style={styles.saveButtonGradient}>
            {saving ? <ActivityIndicator color={T.white} /> : <Text style={styles.saveButtonText}>SALVAR ALTERAÇÕES</Text>}
          </LinearGradient>
        </TouchableOpacity>


        <TouchableOpacity 
          style={[styles.signOutBtn, signingOut && { opacity: 0.5 }]} 
          onPress={() => signOut()} 
          disabled={signingOut}
        >
          <Text style={styles.signOutText}>
            {signingOut ? "Saindo..." : "Sair da conta"}
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: T.bg },
  scrollContent: { padding: 24, paddingBottom: 60, paddingTop: Platform.OS === "ios" ? 60 : 40 },

  header: { marginBottom: 24 },
  title: { fontSize: 32, fontWeight: "900", color: T.t1, marginBottom: 8, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: T.t3, lineHeight: 22 },

  statusBox: { padding: 16, borderRadius: 12, marginBottom: 20, borderWidth: 1 },
  statusError: { backgroundColor: "rgba(239,68,68,0.08)", borderColor: T.red },
  statusSuccess: { backgroundColor: "rgba(16,185,129,0.08)", borderColor: T.green },
  statusText: { fontWeight: "bold", fontSize: 14 },
  statusTextError: { color: T.red },
  statusTextSuccess: { color: T.green },

  formCard: { backgroundColor: T.card, padding: 24, borderRadius: 24, borderWidth: 1, borderColor: T.border, marginBottom: 24 },

  avatarContainer: { alignItems: "center", marginBottom: 24 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: T.surfaceAlt, justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: T.borderActive },
  avatarText: { fontSize: 28, fontWeight: "900", color: T.blue, letterSpacing: 1 },

  inputGroup: { marginBottom: 20 },
  label: { fontSize: 12, fontWeight: "800", color: T.t2, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  input: { backgroundColor: T.surface, borderWidth: 1, borderColor: T.border, borderRadius: 12, padding: 16, fontSize: 16, color: T.t1 },
  inputDisabled: { backgroundColor: T.bg, color: T.t3 },
  helperText: { fontSize: 12, color: T.t3, marginTop: 6 },


  saveButton: { borderRadius: 16, overflow: "hidden", marginBottom: 24 },
  saveButtonGradient: { height: 56, alignItems: "center", justifyContent: "center", borderRadius: 16 },
  saveButtonText: { color: T.white, fontWeight: "800", fontSize: 16, letterSpacing: 0.5 },

  signOutBtn: { alignItems: "center", paddingVertical: 12 },
  signOutText: { color: T.t4, fontSize: 13, fontWeight: "500" },

  debugContainer: { backgroundColor: T.surfaceAlt, padding: 12, borderRadius: 8, marginBottom: 16, maxHeight: 200 },
  debugTitle: { color: T.orange, fontSize: 12, fontWeight: "800", marginBottom: 8 },
  debugScroll: { maxHeight: 160 },
  debugText: { color: T.orange, fontSize: 10, fontWeight: "500", marginBottom: 2, fontFamily: 'monospace' },

  configSection: { marginBottom: 24 },
  configSectionTitle: { fontSize: 20, fontWeight: "800", color: T.t1, marginBottom: 16, letterSpacing: -0.5 },
  configButton: { 
    backgroundColor: T.card, 
    padding: 20, 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: T.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  configButtonLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  configButtonIcon: { 
    width: 48, 
    height: 48, 
    borderRadius: 12, 
    backgroundColor: T.surfaceAlt, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginRight: 16
  },
  configButtonTitle: { fontSize: 16, fontWeight: "700", color: T.t1, marginBottom: 2 },
  configButtonSubtitle: { fontSize: 13, color: T.t3 },
  configButtonArrow: { fontSize: 24, color: T.t3 },
});
