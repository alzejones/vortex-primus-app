// utils/useBreakpoint.ts
// Hook leve para detectar breakpoint mobile/desktop
// Breakpoint: 768px (padrão da indústria)

import { useWindowDimensions } from 'react-native';

export function useBreakpoint() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  return { isDesktop, isMobile: !isDesktop, width };
}