// ============================================================
// reposicoes.tsx — Tela de Reposições de Produtos Herbalife
// Lista os avisos de reposição pendentes gerados automaticamente
// por trigger ao vender produtos com dose_diaria configurada.
// ============================================================
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { T } from '../../utils/theme';

interface ReminderRow {
  id: string;
  client_id: string;
  product_name: string;
  scheduled_date: string;
  message_text: string;
  client_name: string;
  client_phone: string | null;
}

function notify(title: string, msg: string) {
  if (Platform.OS === 'web') window.alert(`${title}\n\n${msg}`);
  else Alert.alert(title, msg);
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function ReposicoesScreen() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reminders, setReminders] = useState<ReminderRow[]>([]);
  const [trainerId, setTrainerId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData?.user?.id;
      if (!uid) return;

      const { data: trainer } = await supabase
        .from('trainers')
        .select('id')
        .eq('user_id', uid)
        .single();
      if (!trainer) return;

      setTrainerId(trainer.id);

      const { data: remindersData, error } = await supabase
        .from('product_reminder_queue')
        .select(`
          id,
          client_id,
          product_name,
          scheduled_date,
          message_text,
          clients!product_reminder_queue_client_id_fkey(name, phone)
        `)
        .eq('trainer_id', trainer.id)
        .eq('status', 'pending')
        .order('scheduled_date', { ascending: true });

      if (error) throw error;

      const mapped = (remindersData || []).map((r: any) => ({
        id: r.id,
        client_id: r.client_id,
        product_name: r.product_name,
        scheduled_date: r.scheduled_date,
        message_text: r.message_text,
        client_name: r.clients?.name || 'Cliente',
        client_phone: r.clients?.phone || null,
      }));

      setReminders(mapped);
    } catch (e) {
      console.error('Erro ao carregar reposições:', e);
      notify('Erro', 'Não foi possível carregar os avisos de reposição');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleSendReminder(reminder: ReminderRow) {
    if (!reminder.client_phone) {
      notify('Atenção', 'Cliente sem telefone cadastrado.');
      return;
    }

    const digits = reminder.client_phone.replace(/\D/g, '');
    if (digits.length < 10) {
      notify('Atenção', 'Telefone inválido.');
      return;
    }

    const waNumber = digits.length === 11 ? `55${digits}` : `55${digits}`;
    const encodedMessage = encodeURIComponent(reminder.message_text);
    const waLink = `https://wa.me/${waNumber}?text=${encodedMessage}`;

    const canOpen = await Linking.canOpenURL(waLink);
    if (!canOpen) {
      notify('Erro', 'Não foi possível abrir o WhatsApp.');
      return;
    }

    await Linking.openURL(waLink);

    const { error } = await supabase
      .from('product_reminder_queue')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', reminder.id);

    if (error) {
      console.error('Erro ao marcar reminder como enviado:', error);
      notify('Erro', 'Não foi possível atualizar o status do aviso.');
    } else {
      load();
    }
  }

  const renderItem = ({ item }: { item: ReminderRow }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.clientName}>{item.client_name}</Text>
        <Text style={styles.scheduledDate}>{formatDate(item.scheduled_date)}</Text>
      </View>
      <Text style={styles.productName}>{item.product_name}</Text>
      <Text style={styles.messagePreview} numberOfLines={2}>
        {item.message_text}
      </Text>
      <TouchableOpacity
        style={styles.sendButton}
        onPress={() => handleSendReminder(item)}
      >
        <Text style={styles.sendButtonText}>📱 Enviar via WhatsApp</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Reposições</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={T.blue} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Reposições</Text>
          <Text style={styles.counter}>({reminders.length})</Text>
        </View>
      </View>

      {reminders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            Nenhuma reposição pendente
          </Text>
          <Text style={styles.emptyHint}>
            Avisos de reposição são criados automaticamente ao vender produtos com dose diária configurada.
          </Text>
        </View>
      ) : (
        <FlatList
          data={reminders}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
              tintColor={T.blue}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: T.surface,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: T.t1,
  },
  counter: {
    fontSize: 16,
    color: T.t3,
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: T.t2,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyHint: {
    fontSize: 14,
    color: T.t3,
    textAlign: 'center',
    lineHeight: 20,
  },
  listContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: T.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: T.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: T.t1,
  },
  scheduledDate: {
    fontSize: 14,
    fontWeight: '600',
    color: T.blue,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: T.t2,
    marginBottom: 8,
  },
  messagePreview: {
    fontSize: 13,
    color: T.t3,
    lineHeight: 18,
    marginBottom: 12,
  },
  sendButton: {
    backgroundColor: '#25D366',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  sendButtonText: {
    color: T.white,
    fontSize: 14,
    fontWeight: '600',
  },
});
