// DashboardLayout.tsx — Re-export para compatibilidade com import em index.tsx
// No app nativo, o Expo carrega este arquivo. No browser, carrega DashboardLayout.web.tsx.
export { default } from './DashboardLayoutMobile';
export type { DashboardLayoutProps } from './DashboardLayoutMobile';
