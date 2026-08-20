import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export type LicenseStatus = 'trial' | 'active' | 'expired' | 'limit_reached' | 'blocked_error';

type LicenseStatusResult = {
  status: LicenseStatus;
  trial_ends_at: string | null;
  plan_name: string | null;
  max_clients: number | null;
  current_clients: number | null;
  features: string[];
  loading: boolean;
  hasFeature: (key: string) => boolean;
};

export function useLicenseStatus(): LicenseStatusResult {
  const [features, setFeatures] = useState<string[]>([]);
  const [result, setResult] = useState<Omit<LicenseStatusResult, 'hasFeature'>>({
    status: 'trial',
    trial_ends_at: null,
    plan_name: null,
    max_clients: null,
    current_clients: null,
    features: [],
    loading: true,
  });

  useEffect(() => {
    let isMounted = true;

    const fetchStatus = async (retryCount = 0): Promise<void> => {
      try {
        const { data, error } = await supabase.rpc('get_license_status');

        if (error) throw error;

        const row = Array.isArray(data) ? data[0] : data;

        if (!isMounted) return;

        if (row) {
          const rowFeatures = row.features || [];
          setFeatures(rowFeatures);
          setResult({
            status: row.status as LicenseStatus,
            trial_ends_at: row.trial_ends_at,
            plan_name: row.plan_name,
            max_clients: row.max_clients,
            current_clients: row.current_clients,
            features: rowFeatures,
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
          setFeatures([]);
          setResult({
            status: 'blocked_error',
            trial_ends_at: null,
            plan_name: null,
            max_clients: null,
            current_clients: null,
            features: [],
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

  const hasFeature = (key: string): boolean => {
    if (result.loading) return true;
    return features.includes(key);
  };

  return {
    ...result,
    features,
    hasFeature,
  };
}
