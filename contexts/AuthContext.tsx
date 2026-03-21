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
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (isMounted) {
        setSession(session);

        if (session?.user) {
          await ensureTrainerExists(session.user);
        }

        setLoading(false);
      }
    }

    initializeSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;

      setSession(session);

      if (session?.user) {
        await ensureTrainerExists(session.user);
      }

      setLoading(false); // 🔥 ESSENCIAL
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function ensureTrainerExists(user: User) {
    try {
      const { data, error } = await supabase
        .from("trainers")
        .select("id")
        .eq("user_id", user.id)
        .single();

      // Se não encontrou ou deu erro de "no rows"
      if (error && error.code !== "PGRST116") {
        console.log("Erro ao buscar trainer:", error);
        return;
      }

      if (!data) {
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
          console.log("Erro ao criar trainer:", insertError);
        } else {
          console.log("🔥 Trainer criado automaticamente");
        }
      }
    } catch (err) {
      console.log("Erro inesperado ao garantir trainer:", err);
    }
  }

  async function signOut() {
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
