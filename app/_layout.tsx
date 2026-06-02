import { Text, View } from 'react-native';
console.log('[DEBUG 1] _layout.tsx carregado');

export default function RootLayout() {
  console.log('[DEBUG 2] componente renderizando');
  return (
    <View>
      <Text>OK</Text>
    </View>
  );
}