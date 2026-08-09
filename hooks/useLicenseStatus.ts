import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export type LicenseStatus = 'trial' | 'active' | 'expired' | 'limit_reached' | 'blocked_error';

type LicenseStatusResult = {
  status: LicenseStatus;
  trial_ends_at: string | null;
  plan_name: string | null;
  max_clients: number | null;
  current_clients: number | null;
  loading: boolean;
};

export function useLicenseStatus(): LicenseStatusResult {
  const [result, setResult] = useState<LicenseStatusResult>({
    status: 'trial',
    trial_ends_at: null,
    plan_name: null,
    max_clients: null,
    current_clients: null,
    loading: true,
  });

  useEffect(() => {
    let isMounted = true;

    const fetchStatus = async (retryCount = 0): Promise<void> => {
      try {
        const { data, error } = await supabase.rpc('get_license_status');

        if (error) throw error;

        if (!isMounted) return;

        if (data) {
          setResult({
            status: data.status as LicenseStatus,
            trial_ends_at: data.trial_ends_at,
            plan_name: data.plan_name,
            max_clients: data.max_clients,
            current_clients: data.current_clients,
            loading: false,
          });
        } else {
          throw new Error('No data returned from get_license_status');
        }
      } catch (err) {
        console.error('useLicenseStatus error (attempt ' + (retryCount + 1) + '):', err);

        if (retryCount === 0) {
          await fetchStatus(1);
        } else {
          if (!isMounted) return;
          setResult({
            status: 'blocked_error',
            trial_ends_at: null,
            plan_name: null,
            max_clients: null,
            current_clients: null,
            loading: false,
          });
        }
      }
    };

    fetchStatus();

    return () => {
      isMounted = false;
    };
  }, []);

  return result;
}
