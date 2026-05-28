import { SafeAreaView, Platform, View, TouchableOpacity, Text } from 'react-native';
import { router } from 'expo-router';
import ScaleCalibrationCapture from '../../components/ScaleCalibrationCapture';
import { T } from '../../utils/theme';

export default function ScaleCalibrationScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg,
      paddingTop: Platform.OS === 'android' ? 48 : 0 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center',
                     backgroundColor: T.bgAlt, padding: 16,
                     borderBottomWidth: 1, borderBottomColor: T.border }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Text style={{ color: T.blue, fontSize: 16 }}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 17, fontWeight: 'bold', color: T.t1 }}>
          Configurar Nova Balança
        </Text>
      </View>
      <ScaleCalibrationCapture />
    </SafeAreaView>
  );
}