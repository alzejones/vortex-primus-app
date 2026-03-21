import { Session, User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

interface AuthContextProps {
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps>({
  session: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function initializeSession() {
      console.log("🚀 INIT SESSION");

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      console.log("📦 getSession result:", session);
      if (error) console.log("❌ getSession error:", error);

      if (isMounted) {
        setSession(session);

        if (session?.user) {
          console.log("👤 User encontrado na sessão inicial");
          await ensureTrainerExists(session.user);
        } else {
          console.log("⚠️ Nenhuma sessão encontrada");
        }

        setLoading(false);
      }
    }

    initializeSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔁 Auth state change:", event);
      console.log("📦 Nova sessão:", session);

      if (!isMounted) return;

      setSession(session);

      if (session?.user) {
        console.log("👤 User vindo do evento");
        await ensureTrainerExists(session.user);
      } else {
        console.log("⚠️ Sessão nula no evento");
      }

      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function ensureTrainerExists(user: User) {
    console.log("🔍 Verificando trainer para user:", user.id);

    try {
      const { data, error } = await supabase
        .from("trainers")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.log("❌ Erro ao buscar trainer:", error);
        return;
      }

      if (!data) {
        console.log("⚠️ Trainer não existe, criando...");

        const { error: insertError } = await supabase
          .from("trainers")
          .insert([
            {
              user_id: user.id,
              email: user.email,
              status: "active",
            },
          ]);

        if (insertError) {
          console.log("❌ Erro ao criar trainer:", insertError);
        } else {
          console.log("🔥 Trainer criado com sucesso");
        }
      } else {
        console.log("✅ Trainer já existe");
      }
    } catch (err) {
      console.log("❌ Erro inesperado:", err);
    }
  }

  async function signOut() {
    console.log("🚪 Fazendo logout...");
    await supabase.auth.signOut();
    setSession(null);
  }

  return (
    <AuthContext.Provider value={{ session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
