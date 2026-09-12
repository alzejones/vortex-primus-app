import { SafeAreaView, Platform, View, TouchableOpacity, Text } from 'react-native';
import { router } from 'expo-router';
import ScaleCalibrationCapture from '../../components/ScaleCalibrationCapture';
import { T } from '../../utils/theme';
import { useTheme } from '../../contexts/ThemeContext';

export default function ScaleCalibrationScreen() {
  const { theme } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background,
      paddingTop: Platform.OS === 'android' ? 48 : 0 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center',
                     backgroundColor: theme.colors.card, padding: 16,
                     borderBottomWidth: 1, borderBottomColor: theme.colors.border }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Text style={{ color: T.blue, fontSize: 16 }}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 17, fontWeight: 'bold', color: theme.colors.textPrimary }}>
          Configurar Nova Balança
        </Text>
      </View>
      <ScaleCalibrationCapture />
    </SafeAreaView>
  );
}