import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, ScrollView, Text, TextInput, TouchableOpacity } from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";

export default function ClientCreate() {
  const router = useRouter();
  const { user } = useAuth();

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
    if (!form.name) {
      Alert.alert("Erro", "Nome é obrigatório.");
      return;
    }

    const { error } = await supabase.from("clients").insert([
      {
        trainer_id: user?.id,
        name: form.name,
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

      {["name", "email", "phone", "birth_date", "gender", "height_cm"].map((field) => (
        <TextInput
          key={field}
          placeholder={field}
          value={(form as any)[field]}
          onChangeText={(value) => handleChange(field, value)}
          style={{
            borderWidth: 1,
            borderColor: "#ddd",
            borderRadius: 8,
            padding: 12,
            marginBottom: 12,
          }}
        />
      ))}

      <TouchableOpacity
        onPress={handleSave}
        style={{
          backgroundColor: "#000",
          padding: 14,
          borderRadius: 8,
        }}
      >
        <Text style={{ color: "#fff", textAlign: "center" }}>
          Salvar Cliente
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
