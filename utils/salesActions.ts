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
