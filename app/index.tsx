import { Redirect } from "expo-router";
import { useAuth } from "../contexts/AuthContext";

export default function Index() {
  const { session, loading, role, addDebug } = useAuth();

  // Aguarda o loading inicial e a resolução do role quando há sessão ativa.
  // Evita tela branca durante a transição de logout (Bug 4).
  if (loading || (session && role === null)) {
    addDebug(`LAYOUT: loading=${loading} session=${!!session} role=${role} - return null`);
    return null;
  }

  if (!session) {
    addDebug("LAYOUT: sessão=false user=null redirecionando para /login");
    return <Redirect href="/login" />;
  }

  if (role === "trainer") {
    addDebug(`LAYOUT: sessão=true user=${session?.user?.email} redirecionando para /(protected)/`);
    return <Redirect href={"/(protected)/" as any} />;
  }
  if (role === "client") {
    addDebug(`LAYOUT: sessão=true user=${session?.user?.email} redirecionando para /(client)/diet`);
    return <Redirect href={"/(client)/diet" as any} />;
  }

  // Sessão existe mas sem role reconhecido (usuário órfão) → login
  addDebug(`🚨 BUG AQUI: sessão=true user=${session?.user?.email} role=${role} - usuário órfão redirecionando para /login`);
  return <Redirect href="/login" />;
}
