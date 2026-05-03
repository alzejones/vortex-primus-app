import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

interface Plan {
  id: string;
  name: string;
  price_monthly: number;
  max_clients: number | null;
}

interface Subscription {
  id: string;
  plan_id: string;
  is_active: boolean;
  start_date: string;
}

export function useTrainer() {
  const { session } = useAuth();

  const [trainerId, setTrainerId] = useState<string | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [subscription, setSubscription] =
    useState<Subscription | null>(null);
  const [loadingTrainer, setLoadingTrainer] = useState(true);

  useEffect(() => {
    async function fetchTrainer() {
      if (!session?.user?.id) {
        setLoadingTrainer(false);
        return;
      }

      // 1️⃣ Buscar trainer
      const { data: trainerData, error: trainerError } = await supabase
        .from("trainers")
        .select("id")
        .eq("user_id", session.user.id)
        .single();

      if (trainerError || !trainerData) {
        console.error("Erro ao buscar trainer:", trainerError);
        setLoadingTrainer(false);
        return;
      }

      setTrainerId(trainerData.id);

      // 2️⃣ Buscar subscription ativa + plano (não-bloqueante)
      const { data: subData, error: subError } = await supabase
        .from("trainer_subscriptions")
        .select(`
          id,
          plan_id,
          is_active,
          start_date,
          plans (
            id,
            name,
            price_monthly,
            max_clients
          )
        `)
        .eq("trainer_id", trainerData.id)
        .eq("is_active", true)
        .maybeSingle();

      // Subscription é opcional - não bloqueia o trainerId
      if (subData && !subError) {
        setSubscription({
          id: subData.id,
          plan_id: subData.plan_id,
          is_active: subData.is_active,
          start_date: subData.start_date,
        });

        setPlan(subData.plans);
      } else {
        // Log apenas se não for PGRST116 (zero rows)
        if (subError && subError.code !== "PGRST116") {
          console.error("Erro ao buscar subscription:", subError);
        }
        setSubscription(null);
        setPlan(null);
      }

      setLoadingTrainer(false);
    }

    fetchTrainer();
  }, [session]);

  return {
    trainerId,
    plan,
    subscription,
    loadingTrainer,
  };
}