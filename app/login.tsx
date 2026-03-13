import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { supabase } from "../lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  // Novos estados para a recuperação de senha
  const [isResetting, setIsResetting] = useState(false);
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

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

  // --- NOVA FUNÇÃO: Pede o envio do código ---
  // 1. Função que pede o código
  async function handleForgotPassword() {
    setMessage("");
    if (!email) {
      setMessage("Por favor, digite seu e-mail no campo acima.");
      return;
    }
    const cleanEmail = email.trim().toLowerCase();
    
    // ATUALIZADO: Força o envio do código pelo sistema de Login (que está funcionando no seu Supabase)
    const { error } = await supabase.auth.signInWithOtp({
      email: cleanEmail,
      options: {
        shouldCreateUser: false, // Não cria conta se o e-mail não existir
      }
    });

    if (error) {
      setMessage("Erro: " + error.message);
    } else {
      setMessage("Código de 6 dígitos enviado! Verifique seu e-mail.");
      setIsResetting(true);
    }
  }

  // --- NOVA FUNÇÃO: Valida o código e salva a nova senha ---
  
  
  async function handleVerifyAndResetPassword() {
    setMessage("");
    if (!resetCode || !newPassword) {
      setMessage("Preencha o código e a nova senha.");
      return;
    }

    const cleanToken = resetCode.trim();
    const cleanEmail = email.trim().toLowerCase();

    // 1. Valida o código usando o tipo 'email' (que é o que seu Supabase está enviando)
    const { error: otpError } = await supabase.auth.verifyOtp({
      email: cleanEmail,
      token: cleanToken,
      type: 'recovery', // MUDANÇA AQUI: de 'recovery' para 'email'
    });

    if (otpError) {
      console.log("Erro detalhado OTP:", otpError);
      setMessage("Código inválido ou expirado. Tente gerar um novo.");
      return;
    }

    // 2. Se o código passou, agora sim atualizamos a senha do usuário
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (updateError) {
      setMessage("Erro ao salvar senha: " + updateError.message);
    } else {
      setMessage("Senha atualizada com sucesso!");
      setIsResetting(false);
      setResetCode("");
      setPassword(newPassword);
    }
  }


  return (
    <View style={styles.container}>
      <Text style={styles.title}>Vortex Primus</Text>

      {!isResetting ? (
        // --- TELA NORMAL DE LOGIN ---
        <>
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

          <TouchableOpacity onPress={handleForgotPassword} style={{ marginTop: 20, alignItems: "center", padding: 10 }}>
            <Text style={{ color: "#555", fontSize: 14, textDecorationLine: "underline" }}>
              Esqueci minha senha
            </Text>
          </TouchableOpacity>
        </>
      ) : (
        // --- TELA DE RECUPERAÇÃO DE SENHA ---
        <>
          <Text style={{ textAlign: "center", marginBottom: 15, color: "#333", fontSize: 14 }}>
            Um código foi enviado para {email}.
          </Text>

          <TextInput
            placeholder="Código de 6 dígitos"
            value={resetCode}
            onChangeText={setResetCode}
            style={styles.input}
            keyboardType="numeric"
          />
          <TextInput
            placeholder="Sua Nova Senha"
            value={newPassword}
            onChangeText={setNewPassword}
            style={styles.input}
            secureTextEntry
          />

          <TouchableOpacity style={styles.button} onPress={handleVerifyAndResetPassword}>
            <Text style={styles.buttonText}>Salvar Nova Senha</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setIsResetting(false)} style={{ marginTop: 20, alignItems: "center", padding: 10 }}>
            <Text style={{ color: "#555", fontSize: 14, textDecorationLine: "underline" }}>
              Voltar para o Login
            </Text>
          </TouchableOpacity>
        </>
      )}

      {message ? (
        <Text style={{ marginTop: 15, textAlign: "center", fontWeight: "bold", color: message.includes("sucesso") || message.includes("enviado") ? "#16a34a" : "#dc2626" }}>
          {message}
        </Text>
      ) : null}
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
    marginBottom: 10,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 16,
  },
});
