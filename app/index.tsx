import { Redirect } from "expo-router";
import { useAuth } from "../contexts/AuthContext";

export default function Index() {
  const { session, loading, role } = useAuth();

  // Aguarda o loading inicial e a resolução do role quando há sessão ativa.
  // Evita tela branca durante a transição de logout (Bug 4).
  if (loading || (session && role === null)) return null;

  if (!session) return <Redirect href="/login" />;

  if (role === "trainer") return <Redirect href={"/(protected)/" as any} />;
  if (role === "client")  return <Redirect href={"/(client)/diet" as any} />;

  // Sessão existe mas sem role reconhecido (usuário órfão) → login
  return <Redirect href="/login" />;
}
