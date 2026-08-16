import 'i18next';
import commonPt from '../locales/pt-BR/common.json';
import authPt from '../locales/pt-BR/auth.json';
import dashboardPt from '../locales/pt-BR/dashboard.json';
import assessmentsPt from '../locales/pt-BR/assessments.json';
import herbalifePt from '../locales/pt-BR/herbalife.json';
import schedulePt from '../locales/pt-BR/schedule.json';
import clientsPt from '../locales/pt-BR/clients.json';
import settingsPt from '../locales/pt-BR/settings.json';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: {
      common: typeof commonPt;
      auth: typeof authPt;
      dashboard: typeof dashboardPt;
      assessments: typeof assessmentsPt;
      herbalife: typeof herbalifePt;
      schedule: typeof schedulePt;
      clients: typeof clientsPt;
      settings: typeof settingsPt;
    };
  }
}
