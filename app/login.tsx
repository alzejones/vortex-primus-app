import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { supabase } from "../lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleSignup() {
    setMessage("");

    const cleanEmail = email.trim().toLowerCase();

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    if (!data.user) {
      setMessage("Erro ao criar usuário.");
      return;
    }

    const { error: trainerError } = await supabase
      .from("trainers")
      .insert([
        {
          user_id: data.user.id,
          email: data.user.email,
          status: "active",
        },
      ]);

    if (trainerError) {
      setMessage(trainerError.message);
      return;
    }

    router.replace("/(protected)/dashboard");
  }

  async function handleLogin() {
    setMessage("");

    const cleanEmail = email.trim().toLowerCase();

    const { error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    router.replace("/(protected)/dashboard");
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Vortex Primus</Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        placeholder="Senha"
        value={password}
        onChangeText={setPassword}
        style={styles.input}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Entrar</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.buttonSecondary} onPress={handleSignup}>
        <Text style={styles.buttonText}>Criar Conta</Text>
      </TouchableOpacity>

      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 28,
    textAlign: "center",
    marginBottom: 30,
    fontWeight: "bold",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    marginBottom: 15,
    borderRadius: 8,
  },
  button: {
    backgroundColor: "#000",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  buttonSecondary: {
    backgroundColor: "#555",
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },
  message: {
    textAlign: "center",
    marginTop: 10,
  },
});
