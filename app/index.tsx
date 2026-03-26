import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../lib/supabase"; // Confirme se este caminho está correto para o seu projeto

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Estado para alternar entre "Entrar" e "Criar Conta"
  const [isLoginMode, setIsLoginMode] = useState(true);

  async function handleAuthenticate() {
    if (!email || !password) {
      Alert.alert("Atenção", "Por favor, preencha e-mail e senha.");
      return;
    }

    setLoading(true);

    try {
      if (isLoginMode) {
        // LÓGICA DE LOGIN
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;
        // Se der sucesso, o AuthContext do seu app automaticamente vai redirecionar para o Dashboard!

      } else {
        // LÓGICA DE CRIAR CONTA
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;
        
        Alert.alert("Sucesso!", "Sua conta foi criada. Você já pode fazer login.");
        setIsLoginMode(true); // Volta para a tela de login
      }
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Ocorreu um erro na autenticação.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.content}>
          <View style={styles.headerArea}>
            <Text style={styles.logoText}>VORTEX</Text>
            <Text style={styles.title}>
              {isLoginMode ? "Bem-vindo de volta" : "Crie sua conta"}
            </Text>
            <Text style={styles.subtitle}>
              {isLoginMode
                ? "Faça login para gerenciar seus alunos e treinos."
                : "Preencha os dados abaixo para começar."}
            </Text>
          </View>

          <View style={styles.formArea}>
            <Text style={styles.label}>E-mail</Text>
            <TextInput
              style={styles.input}
              placeholder="seu@email.com"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />

            <Text style={styles.label}>Senha</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <TouchableOpacity
              style={styles.mainButton}
              onPress={handleAuthenticate}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.mainButtonText}>
                  {isLoginMode ? "Entrar no Sistema" : "Criar Minha Conta"}
                </Text>
              )}
            </TouchableOpacity>

            <View style={styles.toggleArea}>
              <Text style={styles.toggleText}>
                {isLoginMode ? "Não tem uma conta?" : "Já possui uma conta?"}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setIsLoginMode(!isLoginMode);
                  setEmail("");
                  setPassword("");
                }}
              >
                <Text style={styles.toggleLink}>
                  {isLoginMode ? " Crie agora." : " Faça Login."}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  content: { flex: 1, paddingHorizontal: 24, justifyContent: "center" },
  
  headerArea: { marginBottom: 40, alignItems: "center" },
  logoText: { fontSize: 24, fontWeight: "900", color: "#4f46e5", letterSpacing: 2, marginBottom: 16 },
  title: { fontSize: 28, fontWeight: "800", color: "#0f172a", marginBottom: 8 },
  subtitle: { fontSize: 15, color: "#64748b", textAlign: "center", paddingHorizontal: 20 },
  
  formArea: { backgroundColor: "#ffffff", padding: 24, borderRadius: 20, shadowColor: "#64748b", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 15, elevation: 3 },
  label: { fontSize: 13, fontWeight: "700", color: "#475569", marginBottom: 8, textTransform: "uppercase" },
  input: { backgroundColor: "#f1f5f9", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 12, paddingHorizontal: 16, height: 50, fontSize: 16, color: "#0f172a", marginBottom: 20 },
  
  mainButton: { backgroundColor: "#0f172a", padding: 16, borderRadius: 12, alignItems: "center", marginTop: 10 },
  mainButtonText: { color: "#ffffff", fontWeight: "bold", fontSize: 16, letterSpacing: 0.5 },
  
  toggleArea: { flexDirection: "row", justifyContent: "center", marginTop: 24 },
  toggleText: { color: "#64748b", fontSize: 14 },
  toggleLink: { color: "#4f46e5", fontSize: 14, fontWeight: "bold" },
});

