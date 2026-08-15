import { Alert, Platform } from 'react-native';
import { supabase } from '../lib/supabase';

export async function deleteSaleWithConfirm(id: string, onDeleted: () => void) {
  const doDelete = async () => {
    await supabase.from('herbalife_sales').delete().eq('id', id);
    onDeleted();
  };

  if (Platform.OS === 'web') {
    if (window.confirm('Excluir esta venda?')) doDelete();
  } else {
    Alert.alert('Excluir venda', 'Confirma a exclusão?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: doDelete },
    ]);
  }
}

export async function confirmScheduleReassessment(clientName: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (Platform.OS === 'web') {
      const result = window.confirm(`Venda registrada!\n\nDeseja agendar a reavaliação de ${clientName} agora?`);
      resolve(result);
    } else {
      Alert.alert(
        'Venda registrada!',
        `Deseja agendar a reavaliação de ${clientName} agora?`,
        [
          { text: 'Agora não', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Agendar agora', onPress: () => resolve(true) },
        ]
      );
    }
  });
}
