import { Redirect, Slot } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";

export default function ClientLayout() {
  const { session, loading, role } = useAuth();

  if (loading) return null;
  if (!session || role !== "client") return <Redirect href="/login" />;

  return <Slot />;
}
