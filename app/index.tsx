import { Redirect } from "expo-router";
import { useAuth } from "../contexts/AuthContext";

export default function Index() {
  const { session, loading, role } = useAuth();

  if (loading) return null;

  if (!session) return <Redirect href="/login" />;

  if (role === "trainer") return <Redirect href={"/(protected)/" as any} />;
  if (role === "client")  return <Redirect href={"/(client)/diet" as any} />;

  // Sessão existe mas role ainda não resolvido (detectRole em andamento)
  // ou usuário órfão — aguarda ou redireciona para login
  if (role === null) return null;

  return <Redirect href="/login" />;
}
