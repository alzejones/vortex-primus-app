import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import TrainerScalesManager from "../../components/TrainerScalesManager";
import { useAuth } from "../../contexts/AuthContext";
import { useTutorial } from "../../contexts/TutorialContext";
import { useLicenseStatus } from "../../hooks/useLicenseStatus";
import { supabase } from "../../lib/supabase";
import { GradientPrimary } from "../../utils/gradients";
import { T } from "../../utils/theme";

export default function TrainerProfile() {
  const router = useRouter();
  const { signOut, signingOut, debugMessages, isAdmin } = useAuth();
  const { tutorialEnabled, toggleTutorialEnabled } = useTutorial();
  const licenseStatus = useLicenseStatus();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [trainerId, setTrainerId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [spaceName, setSpaceName] = useState("");
  const [spaceAddress, setSpaceAddress] = useState("");
  const [pdfDiscountPercent, setPdfDiscountPercent] = useState("15");
  const [pixKey, setPixKey] = useState("");
  const [professionalCouncil, setProfessionalCouncil] = useState("");
  const [professionalCouncilNumber, setProfessionalCouncilNumber] = useState("");
  const [planName, setPlanName] = useState("Carregando...");
  const [maxClients, setMaxClients] = useState(0);
  const [currentClients, setCurrentClients] = useState(0);
  const [planStatus, setPlanStatus] = useState('');

  // Estados Herbalife
  const [isHerbalifeConsultant, setIsHerbalifeConsultant] = useState(false);
  const [herbalifePresidentName, setHerbalifePresidentName] = useState("");
  const [herbalifePresidentPhone, setHerbalifePresidentPhone] = useState("");
  const [downlineCount, setDownlineCount] = useState(0);

  const [statusMsg, setStatusMsg] = useState({ text: "", type: "" });

  useEffect(() => {
    loadProfile();
  }, []);

  function formatPhoneInput(text: string): string {
    const digits = text.replace(/\D/g, "");
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  }

  function removePhoneMask(text: string): string {
    return text.replace(/\D/g, "");
  }

  async function loadProfile() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: trainer, error: trainerError } = await supabase
        .from("trainers")
        .select("id, name, email, phone, space_name, space_address, pdf_discount_percent, pix_key, is_herbalife_consultant, herbalife_president_name, herbalife_president_phone, professional_council, professional_council_number")
        .eq("user_id", user.id)
        .single();

      if (trainerError) throw trainerError;

      setTrainerId(trainer.id);
      setName(trainer.name || "");
      setEmail(trainer.email || "");
      setPhone(trainer.phone || "");
      setSpaceName(trainer.space_name || "");
      setSpaceAddress(trainer.space_address || "");
      setPdfDiscountPercent(
        trainer.pdf_discount_percent != null ? String(trainer.pdf_discount_percent) : "15"
      );
      setPixKey(trainer.pix_key || "");
      setProfessionalCouncil(trainer.professional_council || "");
      setProfessionalCouncilNumber(trainer.professional_council_number || "");
      setIsHerbalifeConsultant(trainer.is_herbalife_consultant || false);
      setHerbalifePresidentName(trainer.herbalife_president_name || "");
      setHerbalifePresidentPhone(trainer.herbalife_president_phone || "");

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

      // Verifica se é Presidente Herbalife (tem downlines)
      try {
        const { data: downlines, error: downlineError } = await supabase.rpc('get_downline_stats');
        if (!downlineError && downlines && Array.isArray(downlines)) {
          setDownlineCount(downlines.length);
        }
      } catch (downlineError) {
        console.log("Não foi possível carregar downlines (ignorado):", downlineError);
      }

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

    if (phone.trim() && removePhoneMask(phone).length !== 11) {
      setStatusMsg({ text: "Informe o celular completo, com DDD e o 9 (11 dígitos).", type: "error" });
      return;
    }

    const discountValue = parseFloat(pdfDiscountPercent.replace(",", "."));
    if (pdfDiscountPercent.trim() && (isNaN(discountValue) || discountValue < 0 || discountValue > 100)) {
      setStatusMsg({ text: "O percentual de desconto deve ser um número entre 0 e 100.", type: "error" });
      return;
    }

    if (isHerbalifeConsultant) {
      if (!herbalifePresidentName.trim()) {
        setStatusMsg({ text: "O nome do Presidente não pode estar vazio quando o vínculo Herbalife está ativo.", type: "error" });
        return;
      }
      if (removePhoneMask(herbalifePresidentPhone).length !== 11) {
        setStatusMsg({ text: "Informe o celular completo do Presidente, com DDD e o 9 (11 dígitos).", type: "error" });
        return;
      }
    }

    try {
      setSaving(true);
      setStatusMsg({ text: "", type: "" });

      const updateData: any = {
        name: name.trim(),
        phone: phone.trim() ? removePhoneMask(phone) : null,
        space_name: spaceName.trim() ? spaceName.trim() : null,
        space_address: spaceAddress.trim() ? spaceAddress.trim() : null,
        pdf_discount_percent: pdfDiscountPercent.trim() ? discountValue : 15,
        pix_key: pixKey.trim() ? pixKey.trim() : null,
        professional_council: professionalCouncil.trim() ? professionalCouncil.trim() : null,
        professional_council_number: professionalCouncilNumber.trim() ? professionalCouncilNumber.trim() : null,
      };

      if (isHerbalifeConsultant) {
        updateData.is_herbalife_consultant = true;
        updateData.herbalife_president_name = herbalifePresidentName.trim();
        updateData.herbalife_president_phone = removePhoneMask(herbalifePresidentPhone);
      } else {
        updateData.is_herbalife_consultant = false;
        updateData.herbalife_president_name = null;
        updateData.herbalife_president_phone = null;
      }

      const { error } = await supabase
        .from("trainers")
        .update(updateData)
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
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={Platform.OS === 'web'}>

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

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Celular</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={(t) => { setPhone(formatPhoneInput(t)); setStatusMsg({ text: "", type: "" }); }}
              placeholder="(00) 00000-0000"
              placeholderTextColor={T.t3}
              keyboardType="phone-pad"
              maxLength={15}
            />
            <Text style={styles.helperText}>Usado para vincular você como Presidente Herbalife à sua equipe de downlines.</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nome do Espaço</Text>
            <TextInput
              style={styles.input}
              value={spaceName}
              onChangeText={(t) => { setSpaceName(t); setStatusMsg({ text: "", type: "" }); }}
              placeholder="Ex: MyBox Irajá"
              placeholderTextColor={T.t3}
            />
            <Text style={styles.helperText}>Aparece no cabeçalho e rodapé dos planos alimentares em PDF gerados por IA.</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Registro em Conselho de Classe (opcional)</Text>
            <Text style={styles.helperText}>Se você é nutricionista, educador físico ou médico, pode informar seu registro aqui. Este campo é opcional e não é verificado pelo Vortex.</Text>
            <TextInput
              style={styles.input}
              value={professionalCouncil}
              onChangeText={(t) => { setProfessionalCouncil(t); setStatusMsg({ text: "", type: "" }); }}
              placeholder="Ex: CREF, CRN, CFM"
              placeholderTextColor={T.t3}
            />
            <TextInput
              style={[styles.input, { marginTop: 8 }]}
              value={professionalCouncilNumber}
              onChangeText={(t) => { setProfessionalCouncilNumber(t); setStatusMsg({ text: "", type: "" }); }}
              placeholder="Ex: 012345-G/SP"
              placeholderTextColor={T.t3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Endereço do Espaço</Text>
            <TextInput
              style={styles.input}
              value={spaceAddress}
              onChangeText={(t) => { setSpaceAddress(t); setStatusMsg({ text: "", type: "" }); }}
              placeholder="Ex: Jardim Irajá, Ribeirão Preto, SP"
              placeholderTextColor={T.t3}
            />
            <Text style={styles.helperText}>Aparece no rodapé dos planos alimentares em PDF gerados por IA.</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Percentual de Desconto (%)</Text>
            <TextInput
              style={styles.input}
              value={pdfDiscountPercent}
              onChangeText={(t) => { setPdfDiscountPercent(t.replace(/[^0-9,.]/g, "")); setStatusMsg({ text: "", type: "" }); }}
              placeholder="15"
              placeholderTextColor={T.t3}
              keyboardType="decimal-pad"
              maxLength={5}
            />
            <Text style={styles.helperText}>Usado nos preços da página "Programas Nutricionais" dos planos em PDF (padrão: 15%).</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Código Pix</Text>
            <TextInput
              style={styles.input}
              value={pixKey}
              onChangeText={(t) => { setPixKey(t); setStatusMsg({ text: "", type: "" }); }}
              placeholder="CPF/CNPJ, e-mail, celular ou chave aleatória"
              placeholderTextColor={T.t3}
              autoCapitalize="none"
            />
            <Text style={styles.helperText}>Aparece na seção "Condições de Pagamento" dos planos alimentares em PDF gerados por IA.</Text>
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
          {licenseStatus.status === 'trial' && licenseStatus.trial_ends_at && (() => {
            const now = new Date();
            const trialEnd = new Date(licenseStatus.trial_ends_at);
            const diff = trialEnd.getTime() - now.getTime();
            const daysLeft = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
            return (
              <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: '500', marginBottom: 8 }}>
                🕐 {daysLeft} dia{daysLeft !== 1 ? 's' : ''} de trial restante{daysLeft !== 1 ? 's' : ''}
              </Text>
            );
          })()}
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
          <TouchableOpacity onPress={() => router.push('/upgrade' as any)}>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '600', marginTop: 10, textAlign: 'right' }}>
              Mudar plano →
            </Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* Card Herbalife */}
        <View style={styles.formCard}>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Sou Consultor Independente Herbalife</Text>
            <Switch
              value={isHerbalifeConsultant}
              onValueChange={(val) => {
                setIsHerbalifeConsultant(val);
                setStatusMsg({ text: "", type: "" });
              }}
              trackColor={{ false: T.border, true: T.green }}
              thumbColor={isHerbalifeConsultant ? T.white : T.t3}
            />
          </View>

          {isHerbalifeConsultant && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nome do Presidente</Text>
                <TextInput
                  style={styles.input}
                  value={herbalifePresidentName}
                  onChangeText={(t) => {
                    setHerbalifePresidentName(t);
                    setStatusMsg({ text: "", type: "" });
                  }}
                  placeholder="Nome completo do Presidente"
                  placeholderTextColor={T.t3}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Celular do Presidente</Text>
                <TextInput
                  style={styles.input}
                  value={herbalifePresidentPhone}
                  onChangeText={(t) => {
                    setHerbalifePresidentPhone(formatPhoneInput(t));
                    setStatusMsg({ text: "", type: "" });
                  }}
                  placeholder="(00) 00000-0000"
                  placeholderTextColor={T.t3}
                  keyboardType="phone-pad"
                  maxLength={15}
                />
              </View>
            </>
          )}
        </View>

        {/* Botão Minha Equipe Herbalife */}
        {downlineCount > 0 && (
          <TouchableOpacity 
            style={styles.teamCard}
            onPress={() => router.push("/(protected)/herbalife-team" as any)}
            activeOpacity={0.85}
          >
            <View style={styles.teamCardContent}>
              <View>
                <Text style={styles.teamCardTitle}>👥 Minha Equipe Herbalife</Text>
                <Text style={styles.teamCardSubtitle}>{downlineCount} {downlineCount === 1 ? 'consultor vinculado' : 'consultores vinculados'}</Text>
              </View>
              <Text style={styles.teamCardArrow}>›</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Gerenciamento de Balanças */}
        <TrainerScalesManager />

        {/* Configurações Adicionais */}
        <View style={styles.configSection}>
          <Text style={styles.configSectionTitle}>Configurações</Text>
          
          <View style={styles.formCard}>
            <View style={styles.switchRow}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={styles.switchLabel}>🤖 Assistente de Ajuda</Text>
                <Text style={styles.helperText}>Mostra um assistente com dicas em cada tela. Você pode desligar quando quiser.</Text>
              </View>
              <Switch
                value={tutorialEnabled}
                onValueChange={() => toggleTutorialEnabled(trainerId || undefined)}
                trackColor={{ false: T.border, true: T.green }}
                thumbColor={tutorialEnabled ? T.white : T.t3}
              />
            </View>
          </View>

          <TouchableOpacity 
            style={styles.configButton}
            onPress={() => router.push('/(protected)/scale-calibration' as any)}
            activeOpacity={0.7}
          >
            <View style={styles.configButtonLeft}>
              <View style={styles.configButtonIcon}>
                <Text style={{ fontSize: 24 }}>🔧</Text>
              </View>
              <View>
                <Text style={styles.configButtonTitle}>Configurar Nova Balança</Text>
                <Text style={styles.configButtonSubtitle}>Capturar dados para homologação</Text>
              </View>
            </View>
            <Text style={styles.configButtonArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.configButton}
            onPress={() => router.push('/(protected)/supplements' as any)}
            activeOpacity={0.7}
          >
            <View style={styles.configButtonLeft}>
              <View style={styles.configButtonIcon}>
                <Text style={{ fontSize: 24 }}>🏃‍♂️</Text>
              </View>
              <View>
                <Text style={styles.configButtonTitle}>Suplementos</Text>
                <Text style={styles.configButtonSubtitle}>Gerenciar base de suplementos</Text>
              </View>
            </View>
            <Text style={styles.configButtonArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.configButton}
            onPress={() => router.push('/(protected)/import-fineshape' as any)}
            activeOpacity={0.7}
          >
            <View style={styles.configButtonLeft}>
              <View style={styles.configButtonIcon}>
                <Text style={{ fontSize: 24 }}>📥</Text>
              </View>
              <View>
                <Text style={styles.configButtonTitle}>Importar Dados do Fineshape</Text>
                <Text style={styles.configButtonSubtitle}>Migrar clientes e avaliações</Text>
              </View>
            </View>
            <Text style={styles.configButtonArrow}>›</Text>
          </TouchableOpacity>

          {/* Botão Admin: Kits Globais (condicional) */}
          {isAdmin && (
            <TouchableOpacity 
              style={[styles.configButton, { borderWidth: 1.5, borderColor: '#ef4444' }]}
              onPress={() => router.push('/kits-globais' as any)}
              activeOpacity={0.7}
            >
              <View style={styles.configButtonLeft}>
                <View style={[styles.configButtonIcon, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                  <Text style={{ fontSize: 24 }}>🔑</Text>
                </View>
                <View>
                  <Text style={[styles.configButtonTitle, { color: '#ef4444' }]}>Administração — Kits Globais</Text>
                  <Text style={styles.configButtonSubtitle}>Gerenciar kits disponíveis para todos os trainers</Text>
                </View>
              </View>
              <Text style={styles.configButtonArrow}>›</Text>
            </TouchableOpacity>
          )}
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

  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: T.border },
  switchLabel: { fontSize: 15, fontWeight: "700", color: T.t1, flex: 1, marginRight: 12 },

  teamCard: { backgroundColor: T.card, borderRadius: 16, borderWidth: 1, borderColor: T.border, marginBottom: 24 },
  teamCardContent: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20 },
  teamCardTitle: { fontSize: 16, fontWeight: "800", color: T.t1, marginBottom: 4 },
  teamCardSubtitle: { fontSize: 13, color: T.t3, fontWeight: "600" },
  teamCardArrow: { fontSize: 24, color: T.t3 },
});
