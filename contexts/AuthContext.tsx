import { router } from "expo-router";
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export type UserRole = "trainer" | "client" | null;

// 🧠 Tipagem completa
type AuthContextType = {
  session: any;
  loading: boolean;
  role: UserRole;
  signingOut: boolean;
  debugMessages: string[];
  addDebug: (msg: string) => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  loading: true,
  role: null,
  signingOut: false,
  debugMessages: [],
  addDebug: () => {},
  signOut: async () => {},
});

// 🚀 Hook para usar o contexto
export const useAuth = () => useContext(AuthContext);

async function detectRole(userId: string): Promise<UserRole> {
  const timeout = new Promise<null>((resolve) =>
    setTimeout(() => resolve(null), 15000)
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

  const firstAttempt = await Promise.race([detect(), timeout]);
  
  // Retry once if first attempt timed out
  if (firstAttempt === null) {
    const retryTimeout = new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), 10000)
    );
    return Promise.race([detect(), retryTimeout]);
  }
  
  return firstAttempt;
}

// 🔐 Provider
export const AuthProvider = ({ children }: any) => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<UserRole>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [debugMessages, setDebugMessages] = useState<string[]>([]);

  const addDebug = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugMessages(prev => [...prev, `${timestamp}: ${msg}`]);
  };

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
            const currentRole = role; // Capture existing role
            const detectedRole = await detectRole(session.user.id);
            // Only update role if detection succeeded OR session is gone
            if (detectedRole !== null || !session) {
              setRole(detectedRole);
            }
            // If detectRole returned null but session is valid, keep existing role
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
    addDebug("1. signOut() chamado");
    if (signingOut) {
      addDebug("🚨 BUG AQUI: signOut já em execução - return");
      return;
    }
    
    setSigningOut(true);
    let error = null;
    try {
      addDebug("2. Chamando supabase.auth.signOut()");
      
      // Promise.race com timeout de 3 segundos
      await Promise.race([
        supabase.auth.signOut(),
        new Promise(resolve => setTimeout(resolve, 3000))
      ]);
      
      addDebug("3. Supabase signOut retornou - sucesso ou timeout");
    } catch (err) {
      error = err;
      addDebug(`3. Supabase signOut retornou - erro: ${err}`);
      addDebug(`ERRO: ${err}`);
      console.error("Erro ao fazer logout:", err);
      // Mesmo com erro no servidor, force logout local para segurança
    } finally {
      addDebug("4. Limpando estado local");
      // Sempre limpe o estado local e redirecione, independente do erro
      setSession(null); // 2. Limpa a memória do app
      setRole(null);
      setSigningOut(false);
      addDebug(`5. Estado limpo - user: ${session?.user?.email || 'null'}`);
      
      // Delay para garantir que o estado seja propagado antes do redirect
      setTimeout(() => {
        addDebug("6. Chamando router.replace(/login)");
        router.replace("/login");
        addDebug("7. router.replace executado");
      }, 200);
    }
  };

  return (
    <AuthContext.Provider value={{ session, loading, role, signingOut, debugMessages, addDebug, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
