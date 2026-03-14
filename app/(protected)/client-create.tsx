import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
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

export default function ClientCreate() {
  const router = useRouter();
  const { session } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    birth_date: "",
    gender: "",
    height_cm: "",
    notes: "", 
  });

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  // Máscara inteligente para Celular: converte números digitados para (99) 99999-9999
  function handlePhoneChange(text: string) {
    let v = text.replace(/\D/g, ""); // Remove tudo que não é número
    v = v.substring(0, 11); // Limita a 11 dígitos (2 do DDD + 9 do número)
    
    if (v.length > 2) v = v.replace(/^(\d{2})(\d)/g, "($1) $2");
    if (v.length > 7) v = v.replace(/(\d{5})(\d)/, "$1-$2");
    
    handleChange("phone", v);
  }

  // Máscara inteligente para Data: converte números digitados para DD/MM/AAAA
  function handleDateChange(text: string) {
    let v = text.replace(/\D/g, ""); // Remove tudo que não é número
    if (v.length > 2) v = v.replace(/^(\d{2})(\d)/, "$1/$2");
    if (v.length > 5) v = v.replace(/^(\d{2})\/(\d{2})(\d)/, "$1/$2/$3");
    handleChange("birth_date", v.substring(0, 10)); // Limita a 10 caracteres
  }

  // Calcula a idade automaticamente baseada no texto digitado
  const calculatedAge = useMemo(() => {
    if (form.birth_date.length === 10) {
      const [d, m, y] = form.birth_date.split("/");
      const birth = new Date(Number(y), Number(m) - 1, Number(d));
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const mDiff = today.getMonth() - birth.getMonth();
      
      if (mDiff < 0 || (mDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      
      return age >= 0 && age < 150 ? `${age} anos` : "";
    }
    return "";
  }, [form.birth_date]);

  // Converte DD/MM/AAAA para YYYY-MM-DD (para o banco de dados)
  function parseDateToDB(dateStr: string) {
    if (!dateStr || dateStr.length !== 10) return null;
    const [d, m, y] = dateStr.split('/');
    return `${y}-${m}-${d}`;
  }

  async function handleSave() {
    if (!session?.user) {
      Alert.alert("Erro", "Usuário não autenticado.");
      return;
    }

    if (!form.name.trim()) {
      Alert.alert("Atenção", "O nome do cliente é obrigatório.");
      return;
    }

    const { data: trainer, error: trainerError } = await supabase
      .from("trainers")
      .select("id")
      .eq("user_id", session.user.id)
      .single();

    if (trainerError || !trainer) {
      Alert.alert("Erro", "Trainer não encontrado para este usuário.");
      return;
    }

    const formattedDate = parseDateToDB(form.birth_date);

    const { error } = await supabase.from("clients").insert([
      {
        trainer_id: trainer.id,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        birth_date: formattedDate,
        gender: form.gender.trim(),
        height_cm: form.height_cm ? parseInt(form.height_cm, 10) : null,
        observation: form.notes.trim(),
      },
    ]);

    if (error) {
      Alert.alert("Erro ao salvar", error.message);
    } else {
      Alert.alert("Sucesso", "Cliente cadastrado com sucesso!");
      router.back(); 
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#f9fafb" }}
      // Forçamos o Android a redimensionar a altura (height) quando o teclado abre
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 20} 
    >
      <ScrollView 
        style={styles.container} 
        // flexGrow garante que a rolagem funcione bem, e paddingBottom extra grande libera o espaço do teclado
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 120 }} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled" 
      >
        <Text style={styles.pageTitle}>Novo Cliente</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nome Completo *</Text>
          <TextInput
            placeholder="Ex: João da Silva"
            value={form.name}
            onChangeText={(v) => handleChange("name", v)}
            style={styles.input}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>E-mail</Text>
          <TextInput
            placeholder="Ex: joao@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={form.email}
            onChangeText={(v) => handleChange("email", v)}
            style={styles.input}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Telefone</Text>
          <TextInput
            placeholder="(00) 00000-0000"
            keyboardType="phone-pad"
            value={form.phone}
            onChangeText={handlePhoneChange}
            maxLength={15}
            style={styles.input}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
            <Text style={styles.label}>
              Data Nasc. {calculatedAge ? <Text style={styles.ageText}>({calculatedAge})</Text> : null}
            </Text>
            <TextInput
              placeholder="DD/MM/AAAA"
              keyboardType="numeric"
              value={form.birth_date}
              onChangeText={handleDateChange}
              style={styles.input}
              maxLength={10}
            />
          </View>

          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Sexo</Text>
            <TextInput
              placeholder="Ex: M ou F"
              value={form.gender}
              onChangeText={(v) => handleChange("gender", v)}
              style={styles.input}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Altura (cm)</Text>
          <TextInput
            placeholder="Ex: 175"
            keyboardType="numeric"
            value={form.height_cm}
            onChangeText={(v) => handleChange("height_cm", v)}
            style={styles.input}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Observações</Text>
          <TextInput
            placeholder="Condições médicas, objetivos, etc..."
            value={form.notes}
            onChangeText={(v) => handleChange("notes", v)}
            style={[styles.input, styles.textArea]}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity onPress={handleSave} style={styles.button}>
          <Text style={styles.buttonText}>
            Salvar Cliente
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 20,
    marginTop: 10,
  },
  inputGroup: {
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
  },
  ageText: {
    color: "#2563eb",
    fontWeight: "bold",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    padding: 12,
    backgroundColor: "#fff",
    fontSize: 15,
    color: "#111827",
  },
  textArea: {
    minHeight: 100,
  },
  button: {
    backgroundColor: "#000",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
