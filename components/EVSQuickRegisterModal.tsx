import { LinearGradient } from "expo-linear-gradient";
import { Linking, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator, Alert } from "react-native";
import { useState } from "react";
import { supabase } from "../lib/supabase";
import { GradientPrimary } from "../utils/gradients";
import { T } from "../utils/theme";

interface EVSQuickRegisterModalProps {
  visible: boolean;
  trainerId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function EVSQuickRegisterModal({ visible, trainerId, onClose, onSuccess }: EVSQuickRegisterModalProps) {
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  const formatWhatsApp = (text: string) => {
    const cleaned = text.replace(/\D/g, "");
    let formatted = cleaned;
    if (cleaned.length > 2) formatted = `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
    if (cleaned.length > 7) formatted = `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    return formatted.slice(0, 16);
  };

  const resetForm = () => {
    setName("");
    setWhatsapp("");
    setEmail("");
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Nome obrigatório", "Informe o nome do visitante.");
      return;
    }
    if (!whatsapp.trim()) {
      Alert.alert("WhatsApp obrigatório", "Informe o WhatsApp do visitante.");
      return;
    }
    if (!email.trim()) {
      Alert.alert("E-mail obrigatório", "Informe o e-mail do visitante.");
      return;
    }

    const digits = whatsapp.replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 11) {
      Alert.alert("WhatsApp inválido", "Informe um número válido (10 ou 11 dígitos).");
      return;
    }

    try {
      setSaving(true);

      const { data: insertData, error: insertError } = await supabase
        .from("clients")
        .insert({
          name: name.trim(),
          phone: digits,
          email: email.trim().toLowerCase(),
          trainer_id: trainerId,
          client_status: "Visitante EVS",
          is_active: true,
        })
        .select("id")
        .single();

      if (insertError) throw insertError;

      const clientId = insertData.id;

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData?.session?.access_token) {
        throw new Error("Sessão expirada. Faça login novamente.");
      }

      const { data: inviteData, error: inviteError } = await supabase.functions.invoke("invite-client", {
        body: { client_id: clientId, channel: "whatsapp" },
        headers: { Authorization: `Bearer ${sessionData.session.access_token}` },
      });

      if (inviteError) {
        const ctx = (inviteError as any).context;
        let bodyText = "";
        try {
          bodyText = ctx ? await ctx.text() : "";
        } catch {
          bodyText = "";
        }
        let friendlyMsg = "Erro ao enviar convite.";
        try {
          const parsed = JSON.parse(bodyText);
          if (parsed?.error) friendlyMsg = parsed.error;
        } catch (e) {
          // ignore
        }
        throw new Error(friendlyMsg);
      }

      if (inviteData?.error) throw new Error(inviteData.error);

      const inviteLink: string = inviteData?.invite_link ?? "";
      if (!inviteLink) throw new Error("Link de convite não retornado.");

      const waPhone = "55" + digits;
      const msg = `Olá! Você foi convidado a acessar o Vortex Primus. Clique no link para criar seu acesso: ${inviteLink}`;
      await Linking.openURL(`whatsapp://send?phone=${waPhone}&text=${encodeURIComponent(msg)}`);

      resetForm();
      onSuccess?.();
      onClose();
      Alert.alert("Sucesso", "Visitante EVS cadastrado e convite enviado por WhatsApp.");
    } catch (err: any) {
      Alert.alert("Erro ao cadastrar", err.message || "Erro desconhecido.");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Cadastro Rápido EVS</Text>
          <Text style={styles.subtitle}>Cadastre um visitante e envie o convite automaticamente por WhatsApp.</Text>

          <Text style={styles.label}>Nome *</Text>
          <TextInput
            style={styles.input}
            placeholder="Nome do visitante"
            placeholderTextColor={T.t3}
            value={name}
            onChangeText={setName}
            editable={!saving}
          />

          <Text style={styles.label}>WhatsApp *</Text>
          <TextInput
            style={styles.input}
            placeholder="(00) 00000-0000"
            placeholderTextColor={T.t3}
            value={whatsapp}
            onChangeText={(text) => setWhatsapp(formatWhatsApp(text))}
            keyboardType="phone-pad"
            editable={!saving}
          />

          <Text style={styles.label}>E-mail *</Text>
          <TextInput
            style={styles.input}
            placeholder="email@exemplo.com"
            placeholderTextColor={T.t3}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!saving}
          />

          <View style={styles.buttons}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleClose} disabled={saving} activeOpacity={0.7}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving} activeOpacity={0.85}>
              <LinearGradient {...GradientPrimary} style={styles.saveGradient}>
                {saving ? (
                  <ActivityIndicator color={T.white} />
                ) : (
                  <Text style={styles.saveText}>Cadastrar e Enviar</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: T.card,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: T.border,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: T.t1,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: T.t3,
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: T.t2,
    marginBottom: 6,
  },
  input: {
    backgroundColor: T.surfaceAlt,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: T.t1,
    marginBottom: 14,
  },
  buttons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: T.surfaceAlt,
    borderWidth: 1,
    borderColor: T.border,
    alignItems: "center",
  },
  cancelText: {
    color: T.t2,
    fontWeight: "700",
    fontSize: 14,
  },
  saveButton: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  saveGradient: {
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  saveText: {
    color: T.white,
    fontWeight: "800",
    fontSize: 14,
  },
});
