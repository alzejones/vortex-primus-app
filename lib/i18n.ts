import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import commonPt from '../locales/pt-BR/common.json';
import authPt from '../locales/pt-BR/auth.json';
import dashboardPt from '../locales/pt-BR/dashboard.json';
import assessmentsPt from '../locales/pt-BR/assessments.json';
import herbalifePt from '../locales/pt-BR/herbalife.json';
import schedulePt from '../locales/pt-BR/schedule.json';
import clientsPt from '../locales/pt-BR/clients.json';
import settingsPt from '../locales/pt-BR/settings.json';

import commonEn from '../locales/en/common.json';
import authEn from '../locales/en/auth.json';
import dashboardEn from '../locales/en/dashboard.json';
import assessmentsEn from '../locales/en/assessments.json';
import herbalifEn from '../locales/en/herbalife.json';
import scheduleEn from '../locales/en/schedule.json';
import clientsEn from '../locales/en/clients.json';
import settingsEn from '../locales/en/settings.json';

const STORAGE_KEY = 'vortex_language';
const SUPPORTED_LANGUAGES = ['pt-BR', 'en'];
const DEFAULT_LANGUAGE = 'pt-BR';

const resources = {
  'pt-BR': {
    common: commonPt,
    auth: authPt,
    dashboard: dashboardPt,
    assessments: assessmentsPt,
    herbalife: herbalifePt,
    schedule: schedulePt,
    clients: clientsPt,
    settings: settingsPt,
  },
  en: {
    common: commonEn,
    auth: authEn,
    dashboard: dashboardEn,
    assessments: assessmentsEn,
    herbalife: herbalifEn,
    schedule: scheduleEn,
    clients: clientsEn,
    settings: settingsEn,
  },
};

async function getInitialLanguage(): Promise<string> {
  try {
    const savedLanguage = await AsyncStorage.getItem(STORAGE_KEY);
    if (savedLanguage && SUPPORTED_LANGUAGES.includes(savedLanguage)) {
      return savedLanguage;
    }

    const deviceLocale = Localization.getLocales()[0]?.languageTag;
    const normalizedDeviceLocale = deviceLocale?.startsWith('pt') ? 'pt-BR' : 'en';
    
    if (SUPPORTED_LANGUAGES.includes(normalizedDeviceLocale)) {
      return normalizedDeviceLocale;
    }

    return DEFAULT_LANGUAGE;
  } catch (error) {
    console.error('[i18n] Error getting initial language:', error);
    return DEFAULT_LANGUAGE;
  }
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: DEFAULT_LANGUAGE,
    defaultNS: 'common',
    ns: ['common', 'auth', 'dashboard', 'assessments', 'herbalife', 'schedule', 'clients', 'settings'],
    interpolation: {
      escapeValue: false,
    },
  });

getInitialLanguage().then((lang) => {
  i18n.changeLanguage(lang);
});

export async function changeLanguage(lang: string): Promise<void> {
  if (!SUPPORTED_LANGUAGES.includes(lang)) {
    console.warn(`[i18n] Language ${lang} not supported`);
    return;
  }

  try {
    await i18n.changeLanguage(lang);
    await AsyncStorage.setItem(STORAGE_KEY, lang);
  } catch (error) {
    console.error('[i18n] Error changing language:', error);
  }
}

export default i18n;
