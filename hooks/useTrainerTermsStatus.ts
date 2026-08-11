import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { CURRENT_TRAINER_TERMS_VERSION } from '../utils/trainerTermsVersion';

type TrainerTermsStatusResult = {
  needsConsent: boolean;
  loading: boolean;
  error: boolean;
};

export function useTrainerTermsStatus(): TrainerTermsStatusResult {
  const [result, setResult] = useState<TrainerTermsStatusResult>({
    needsConsent: true,
    loading: true,
    error: false,
  });

  useEffect(() => {
    let isMounted = true;

    const fetchStatus = async (): Promise<void> => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError) throw userError;
        if (!user) {
          if (!isMounted) return;
          setResult({ needsConsent: false, loading: false, error: true });
          return;
        }

        const { data: trainers, error: trainerError } = await supabase
          .from('trainers')
          .select('id')
          .eq('user_id', user.id)
          .limit(1)
          .single();

        if (trainerError) throw trainerError;
        if (!trainers) {
          if (!isMounted) return;
          setResult({ needsConsent: false, loading: false, error: true });
          return;
        }

        const { data: consents, error: consentError } = await supabase
          .from('trainer_consents')
          .select('terms_version')
          .eq('trainer_id', trainers.id)
          .order('accepted_at', { ascending: false })
          .limit(1);

        if (consentError) throw consentError;

        if (!isMounted) return;

        const latestConsent = consents && consents.length > 0 ? consents[0] : null;
        const needsConsent = !latestConsent || latestConsent.terms_version !== CURRENT_TRAINER_TERMS_VERSION;

        setResult({
          needsConsent,
          loading: false,
          error: false,
        });
      } catch (err) {
        console.error('useTrainerTermsStatus error:', err);

        if (!isMounted) return;
        setResult({
          needsConsent: false,
          loading: false,
          error: true,
        });
      }
    };

    fetchStatus();

    return () => {
      isMounted = false;
    };
  }, []);

  return result;
}
