import { router } from "expo-router";
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

// 🧠 Tipagem completa
type AuthContextType = {
  session: any;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  loading: true,
  signOut: async () => {},
});

// 🚀 Hook para usar o contexto
export const useAuth = () => useContext(AuthContext);

// 🔐 Provider
export const AuthProvider = ({ children }: any) => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 🧠 PEGAR SESSÃO INICIAL E OUVIR MUDANÇAS
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setLoading(false);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // 🚪 FUNÇÃO OFICIAL PARA SAIR DO SISTEMA
  const signOut = async () => {
    await supabase.auth.signOut(); // 1. Apaga no Supabase
    setSession(null); // 2. Limpa a memória do app
    router.replace("/login"); // 3. O PULO DO GATO: Força a ida para o login
  };

  return (
    <AuthContext.Provider value={{ session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
