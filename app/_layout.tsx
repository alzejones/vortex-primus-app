import { Slot } from 'expo-router';
import { View, Text } from 'react-native';
console.log('[DEBUG 1] _layout.tsx carregado');

export default function RootLayout() {
  console.log('[DEBUG 2] componente renderizando');
  return <Slot />;
}