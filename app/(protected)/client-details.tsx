import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";

export default function ClientDetails() {
  const router = useRouter();
  const { session } = useAuth();
  const { id } = useLocalSearchParams();
  const clientId = Array.isArray(id) ? id[0] : id;

  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [client, setClient] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [assessments, setAssessments] = useState<any[]>([]);

  useEffect(() => {
    if (!clientId) return;

    async function load() {
      setLoading(true);

      const { data } = await supabase
        .from("clients")
        .select("*")
        .eq("id", clientId)
        .single();

      setClient(data);
      setForm(data);

      const { data: assessmentsData } = await supabase
        .from("physical_assessments")
        .select(`
          id,
          created_at,
          anthropometry (
            weight,
            body_fat,
            muscle_mass_percentage
          )
        `)
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });

      setAssessments(assessmentsData ?? []);

      setLoading(false);
    }

    load();
  }, [clientId]);

  function handleChange(field: string, value: string) {
    setForm((prev: any) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    const { error } = await supabase
      .from("clients")
      .update({
        name: form.name,
        email: form.email,
        phone: form.phone,
        birth_date: form.birth_date,
        gender: form.gender,
        height_cm: form.height_cm
          ? Number(form.height_cm)
          : null,
      })
      .eq("id", clientId);

    if (error) {
      Alert.alert("Erro", error.message);
      return;
    }

    setClient(form);
    setEditing(false);
    Alert.alert("Sucesso", "Dados atualizados.");
  }

  async function handleDelete() {
    Alert.alert("Excluir Cliente", "Tem certeza?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          await supabase.from("clients").delete().eq("id", clientId);
          router.replace("/(protected)/dashboard");
        },
      },
    ]);
  }

  async function handleNewAssessment() {
    if (!session?.user) return;

    const { data: trainer } = await supabase
      .from("trainers")
      .select("id")
      .eq("user_id", session.user.id)
      .single();

    if (!trainer) return;

    const { data } = await supabase
      .from("physical_assessments")
      .insert([
        {
          client_id: clientId,
          trainer_id: trainer.id,
        },
      ])
      .select()
      .single();

    if (!data) return;

    router.push({
      pathname: "/(protected)/anthropometry-form",
      params: { assessmentId: data.id },
    });
  }

  if (loading) {
    return (
      <View style={{ marginTop: 50 }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 20 }}>
        Detalhes do Cliente
      </Text>

      {["name", "email", "phone", "birth_date", "gender", "height_cm"].map(
        (field) => (
          <View key={field} style={{ marginBottom: 12 }}>
            <Text style={{ marginBottom: 4 }}>{field}</Text>
            <TextInput
              value={form?.[field]?.toString() ?? ""}
              editable={editing}
              onChangeText={(v) => handleChange(field, v)}
              style={{
                borderWidth: 1,
                borderColor: "#ddd",
                borderRadius: 8,
                padding: 10,
                backgroundColor: editing ? "#fff" : "#eee",
              }}
            />
          </View>
        )
      )}

      <View style={{ flexDirection: "row", marginTop: 10 }}>
        {!editing ? (
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: "#000",
              padding: 12,
              borderRadius: 8,
              marginRight: 10,
            }}
            onPress={() => setEditing(true)}
          >
            <Text style={{ color: "#fff", textAlign: "center" }}>
              Alterar
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: "green",
              padding: 12,
              borderRadius: 8,
              marginRight: 10,
            }}
            onPress={handleSave}
          >
            <Text style={{ color: "#fff", textAlign: "center" }}>
              Salvar
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: "red",
            padding: 12,
            borderRadius: 8,
          }}
          onPress={handleDelete}
        >
          <Text style={{ color: "#fff", textAlign: "center" }}>
            Excluir
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={handleNewAssessment}
        style={{
          backgroundColor: "#000",
          padding: 14,
          borderRadius: 8,
          marginTop: 30,
        }}
      >
        <Text style={{ color: "#fff", textAlign: "center" }}>
          Nova Avaliação
        </Text>
      </TouchableOpacity>

      <Text style={{ marginTop: 30, fontWeight: "bold" }}>
        Histórico de Avaliações
      </Text>

      {assessments.map((item) => {
        const data = item.anthropometry?.[0];
        return (
          <View key={item.id} style={{ marginTop: 10 }}>
            <Text>
              {new Date(item.created_at).toLocaleDateString("pt-BR")}
            </Text>
            {data?.weight && <Text>Peso: {data.weight} kg</Text>}
            {data?.body_fat && <Text>Gordura: {data.body_fat}%</Text>}
          </View>
        );
      })}
    </ScrollView>
  );
}
