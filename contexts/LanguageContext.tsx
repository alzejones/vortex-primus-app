import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n, { changeLanguage as changeI18nLanguage } from '../lib/i18n';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

interface LanguageContextData {
  language: string;
  changeLanguage: (lang: string) => Promise<void>;
}

const LanguageContext = createContext<LanguageContextData | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState(i18n.language || 'pt-BR');
  const { session, role } = useAuth();

  useEffect(() => {
    const handleLanguageChange = (lang: string) => {
      setLanguage(lang);
    };

    i18n.on('languageChanged', handleLanguageChange);

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, []);

  useEffect(() => {
    async function syncLanguageFromDatabase() {
      if (!session?.user?.id || !role) return;

      try {
        const table = role === 'trainer' ? 'trainers' : 'clients';
        
        const { data, error } = await supabase
          .from(table)
          .select('preferred_language')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (error) {
          console.error('[LanguageContext] Error fetching preferred_language:', error);
          return;
        }

        if (data?.preferred_language && data.preferred_language !== language) {
          await changeI18nLanguage(data.preferred_language);
        }
      } catch (error) {
        console.error('[LanguageContext] Error syncing language from database:', error);
      }
    }

    syncLanguageFromDatabase();
  }, [session?.user?.id, role]);

  async function handleChangeLanguage(lang: string) {
    try {
      await changeI18nLanguage(lang);

      if (session?.user?.id && role) {
        const table = role === 'trainer' ? 'trainers' : 'clients';
        
        const { error } = await supabase
          .from(table)
          .update({ preferred_language: lang })
          .eq('user_id', session.user.id);

        if (error) {
          console.error('[LanguageContext] Error updating preferred_language:', error);
        }
      }
    } catch (error) {
      console.error('[LanguageContext] Error changing language:', error);
    }
  }

  return (
    <I18nextProvider i18n={i18n}>
      <LanguageContext.Provider value={{ language, changeLanguage: handleChangeLanguage }}>
        {children}
      </LanguageContext.Provider>
    </I18nextProvider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
