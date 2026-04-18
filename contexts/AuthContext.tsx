import { router } from "expo-router";
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export type UserRole = "trainer" | "client" | null;

// 🧠 Tipagem completa
type AuthContextType = {
  session: any;
  loading: boolean;
  role: UserRole;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  loading: true,
  role: null,
  signOut: async () => {},
});

// 🚀 Hook para usar o contexto
export const useAuth = () => useContext(AuthContext);

async function detectRole(userId: string): Promise<UserRole> {
  const timeout = new Promise<null>((resolve) =>
    setTimeout(() => resolve(null), 5000)
  );

  const detect = async (): Promise<UserRole> => {
    const { data: trainer } = await supabase
      .from("trainers")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (trainer) return "trainer";

    const { data: client } = await supabase
      .from("clients")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (client) return "client";

    return null;
  };

  return Promise.race([detect(), timeout]);
}

// 🔐 Provider
export const AuthProvider = ({ children }: any) => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<UserRole>(null);

  // 🧠 PEGAR SESSÃO INICIAL E OUVIR MUDANÇAS
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session?.user?.id) {
        setRole(await detectRole(session.user.id));
      }
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          // TOKEN_REFRESHED e USER_UPDATED: apenas atualiza a sessão, nunca muda role.
          // Re-detectar role nesses eventos causa logout acidental se detectRole demorar >5s.
          if (event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
            setSession(session);
            return;
          }

          // SIGNED_OUT só limpa sessão se realmente não há sessão válida.
          // Guarda contra SIGNED_OUT espúrio disparado por erros de network durante chamadas longas.
          if (event === "SIGNED_OUT") {
            const { data: { session: currentSession } } = await supabase.auth.getSession();
            if (currentSession) {
              setSession(currentSession);
              return;
            }
            setSession(null);
            setRole(null);
            return;
          }

          setSession(session);
          if (session?.user?.id) {
            setRole(await detectRole(session.user.id));
          } else {
            setRole(null);
          }
        } finally {
          setLoading(false);
        }
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
    setRole(null);
    router.replace("/login"); // 3. O PULO DO GATO: Força a ida para o login
  };

  return (
    <AuthContext.Provider value={{ session, loading, role, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
