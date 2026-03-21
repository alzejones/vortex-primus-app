import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

// 🧠 Tipagem básica
type AuthContextType = {
  session: any;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  loading: true,
});

// 🚀 Hook para usar o contexto
export const useAuth = () => useContext(AuthContext);

// 🔐 Provider
export const AuthProvider = ({ children }: any) => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 🌍 DEBUG URL AO CARREGAR
  useEffect(() => {
    if (typeof window !== "undefined") {
      console.log("🌍 CURRENT URL (Auth):", window.location.href);
    }
  }, []);

  // 🧠 PEGAR SESSÃO INICIAL
  useEffect(() => {
    const getInitialSession = async () => {
      console.log("🚀 GET INITIAL SESSION");

      const { data, error } = await supabase.auth.getSession();

      console.log("📦 INITIAL SESSION DATA:", data);
      console.log("❌ INITIAL SESSION ERROR:", error);

      if (data?.session) {
        console.log("✅ SESSION FOUND");
        setSession(data.session);
      } else {
        console.log("⚠️ NO SESSION");
      }

      setLoading(false);
    };

    getInitialSession();
  }, []);

  // 🔁 LISTENER DE AUTH (LOGIN / LOGOUT / CALLBACK)
  useEffect(() => {
    console.log("🧠 INIT AUTH LISTENER");

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("🔁 AUTH EVENT:", event);
        console.log("📦 SESSION EVENT:", session);

        setSession(session);
        setLoading(false);
      }
    );

    return () => {
      console.log("🧹 REMOVE AUTH LISTENER");
      listener.subscription.unsubscribe();
    };
  }, []);

  // 🧠 DEBUG GLOBAL
  useEffect(() => {
    console.log("🧠 SESSION STATE:", session);
    console.log("⏳ LOADING STATE:", loading);
  }, [session, loading]);

  return (
    <AuthContext.Provider value={{ session, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
