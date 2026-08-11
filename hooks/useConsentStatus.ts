import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { CURRENT_CONSENT_VERSION } from '../utils/consentVersion';

type ConsentStatusResult = {
  needsConsent: boolean;
  loading: boolean;
  error: boolean;
};

export function useConsentStatus(): ConsentStatusResult {
  const [result, setResult] = useState<ConsentStatusResult>({
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

        const { data: clients, error: clientError } = await supabase
          .from('clients')
          .select('id')
          .eq('user_id', user.id)
          .limit(1)
          .single();

        if (clientError) throw clientError;
        if (!clients) {
          if (!isMounted) return;
          setResult({ needsConsent: false, loading: false, error: true });
          return;
        }

        const { data: consents, error: consentError } = await supabase
          .from('client_consents')
          .select('consent_version')
          .eq('client_id', clients.id)
          .order('accepted_at', { ascending: false })
          .limit(1);

        if (consentError) throw consentError;

        if (!isMounted) return;

        const latestConsent = consents && consents.length > 0 ? consents[0] : null;
        const needsConsent = !latestConsent || latestConsent.consent_version !== CURRENT_CONSENT_VERSION;

        setResult({
          needsConsent,
          loading: false,
          error: false,
        });
      } catch (err) {
        console.error('useConsentStatus error:', err);

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
