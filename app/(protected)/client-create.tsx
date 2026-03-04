import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity
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
  });

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
  if (!session?.user) {
    Alert.alert("Erro", "Usuário não autenticado.");
    return;
  }

  // 1️⃣ Buscar o trainer vinculado ao usuário logado
  const { data: trainer, error: trainerError } = await supabase
    .from("trainers")
    .select("id")
    .eq("user_id", session.user.id)
    .single();

  if (trainerError || !trainer) {
    Alert.alert("Erro", "Trainer não encontrado para este usuário.");
    return;
  }

  // 2️⃣ Inserir cliente usando trainer.id correto
  const { error } = await supabase.from("clients").insert([
    {
      trainer_id: trainer.id, // ✅ Agora usando FK correta
      name: form.name.trim(),
      email: form.email || null,
      phone: form.phone || null,
      birth_date: form.birth_date || null,
      gender: form.gender || null,
      height_cm: form.height_cm ? Number(form.height_cm) : null,
    },
  ]);

  if (error) {
    Alert.alert("Erro", error.message);
    return;
  }

  Alert.alert("Sucesso", "Cliente criado com sucesso.", [
    {
      text: "OK",
      onPress: () => router.replace("/(protected)/dashboard"),
    },
  ]);
}
  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 20 }}>
        Novo Cliente
      </Text>

      <TextInput
        placeholder="Nome"
        value={form.name}
        onChangeText={(v) => handleChange("name", v)}
        style={styles.input}
      />

      <TextInput
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        value={form.email}
        onChangeText={(v) => handleChange("email", v)}
        style={styles.input}
      />

      <TextInput
        placeholder="Telefone"
        keyboardType="phone-pad"
        value={form.phone}
        onChangeText={(v) => handleChange("phone", v)}
        style={styles.input}
      />

      <TextInput
        placeholder="Data de Nascimento (YYYY-MM-DD)"
        value={form.birth_date}
        onChangeText={(v) => handleChange("birth_date", v)}
        style={styles.input}
      />

      <TextInput
        placeholder="Sexo"
        value={form.gender}
        onChangeText={(v) => handleChange("gender", v)}
        style={styles.input}
      />

      <TextInput
        placeholder="Altura (cm)"
        keyboardType="numeric"
        value={form.height_cm}
        onChangeText={(v) => handleChange("height_cm", v)}
        style={styles.input}
      />

      <TouchableOpacity onPress={handleSave} style={styles.button}>
        <Text style={{ color: "#fff", textAlign: "center", fontWeight: "600" }}>
          Salvar Cliente
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = {
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  button: {
    backgroundColor: "#000",
    padding: 14,
    borderRadius: 8,
    marginTop: 10,
  },
};