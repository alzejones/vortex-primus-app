import React, { useCallback, useEffect, useState } from 'react';
import {
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { T } from '../../utils/theme';
import { todayBR } from '../../utils/dateBR';
import ResetProtocolDateModal from '../ui/ResetProtocolDateModal';
import { notify } from './SaleFormModal';

interface QueueItem {
  id: string;
  enrollment_id: string;
  client_id: string;
  day_number: number;
  scheduled_date: string;
  send_time: string;
  message_text: string;
  status: 'pendente' | 'enviada' | 'pulada';
  client_name: string;
  client_phone: string;
}

interface EnrollmentItem {
  id: string;
  client_id: string;
  start_date: string | null;
  status: 'aguardando_data' | 'ativo' | 'concluido' | 'cancelado';
  client_name: string;
}

interface Day5Item {
  enrollment_id: string;
  client_id: string;
  client_name: string;
  scheduled_date: string;
}

export default function ResetProtocolWidget() {
  const [trainerId, setTrainerId] = useState<string | null>(null);
  const [todayMessages, setTodayMessages] = useState<QueueItem[]>([]);
  const [waitingDate, setWaitingDate] = useState<EnrollmentItem[]>([]);
  const [day5Items, setDay5Items] = useState<Day5Item[]>([]);
  const [dateModalVisible, setDateModalVisible] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState<EnrollmentItem | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadWidget();
    }, [])
  );

  useEffect(() => {
    loadWidget();
  }, []);

  async function loadWidget() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: trainer } = await supabase
        .from('trainers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!trainer) return;
      setTrainerId(trainer.id);

      const today = todayBR();

      const [queueRes, enrollmentsRes, day5Res] = await Promise.all([
        supabase
          .from('reset_protocol_queue')
          .select('*, clients!reset_protocol_queue_client_id_fkey(name, phone)')
          .eq('trainer_id', trainer.id)
          .eq('status', 'pendente')
          .lte('scheduled_date', today)
          .order('scheduled_date', { ascending: true })
          .order('send_time', { ascending: true }),

        supabase
          .from('reset_protocol_enrollments')
          .select('*, clients!reset_protocol_enrollments_client_id_fkey(name)')
          .eq('status', 'aguardando_data')
          .order('created_at', { ascending: true }),

        supabase
          .from('reset_protocol_queue')
          .select(`
            enrollment_id,
            client_id,
            scheduled_date,
            status,
            clients!reset_protocol_queue_client_id_fkey(name),
            reset_protocol_enrollments!reset_protocol_queue_enrollment_id_fkey(status)
          `)
          .eq('trainer_id', trainer.id)
          .eq('day_number', 5)
          .lte('scheduled_date', today)
          .in('status', ['pendente', 'enviada']),
      ]);

      if (queueRes.data) {
        const mapped = queueRes.data.map((q: any) => ({
          id: q.id,
          enrollment_id: q.enrollment_id,
          client_id: q.client_id,
          day_number: q.day_number,
          scheduled_date: q.scheduled_date,
          send_time: q.send_time,
          message_text: q.message_text,
          status: q.status,
          client_name: q.clients?.name || 'Cliente',
          client_phone: q.clients?.phone || '',
        }));
        setTodayMessages(mapped);
      }

      if (enrollmentsRes.data) {
        const mapped = enrollmentsRes.data
          .filter((e: any) => e.clients?.name)
          .map((e: any) => ({
            id: e.id,
            client_id: e.client_id,
            start_date: e.start_date,
            status: e.status,
            client_name: e.clients.name,
          }));
        setWaitingDate(mapped);
      }

      if (day5Res.data) {
        const filtered = day5Res.data.filter((d: any) => {
          const enrollmentStatus = d.reset_protocol_enrollments?.status;
          return enrollmentStatus === 'ativo';
        });

        const mapped = filtered.map((d: any) => ({
          enrollment_id: d.enrollment_id,
          client_id: d.client_id,
          client_name: d.clients?.name || 'Cliente',
          scheduled_date: d.scheduled_date,
        }));
        setDay5Items(mapped);
      }
    } catch (error) {
      console.log('Erro ao carregar widget Protocolo Reset:', error);
    }
  }

  async function handleSendMessage(item: QueueItem) {
    const digits = (item.client_phone || '').replace(/\D/g, '');
    if (!digits) {
      notify('Sem celular cadastrado', `${item.client_name} não tem celular cadastrado.`);
      return;
    }

    const fullPhone = (digits.length > 11 && digits.startsWith('55')) ? digits : '55' + digits;
    const url = `https://wa.me/${fullPhone}?text=${encodeURIComponent(item.message_text)}`;

    try {
      await Linking.openURL(url);

      const { error } = await supabase
        .from('reset_protocol_queue')
        .update({ status: 'enviada', sent_at: new Date().toISOString() })
        .eq('id', item.id);

      if (error) {
        console.log('Erro ao atualizar status:', error);
      } else {
        setTodayMessages((prev) => prev.filter((m) => m.id !== item.id));
      }
    } catch (error) {
      console.log('Erro ao abrir WhatsApp:', error);
      notify('Erro', 'Não foi possível abrir o WhatsApp.');
    }
  }

  async function handleSkipMessage(item: QueueItem) {
    const { error } = await supabase
      .from('reset_protocol_queue')
      .update({ status: 'pulada' })
      .eq('id', item.id);

    if (error) {
      console.log('Erro ao pular mensagem:', error);
    } else {
      setTodayMessages((prev) => prev.filter((m) => m.id !== item.id));
    }
  }

  function handleDefineDate(enrollment: EnrollmentItem) {
    setSelectedEnrollment(enrollment);
    setDateModalVisible(true);
  }

  async function handleConfirmDate(date: string) {
    if (!selectedEnrollment) return;

    const { error } = await supabase
      .from('reset_protocol_enrollments')
      .update({ start_date: date, status: 'ativo' })
      .eq('id', selectedEnrollment.id);

    if (error) {
      console.log('Erro ao definir data:', error);
      notify('Erro', 'Não foi possível definir a data.');
    } else {
      setWaitingDate((prev) => prev.filter((e) => e.id !== selectedEnrollment.id));
      setDateModalVisible(false);
      setSelectedEnrollment(null);
    }
  }

  async function handleCompleteDay5(item: Day5Item) {
    const { error } = await supabase
      .from('reset_protocol_enrollments')
      .update({ status: 'concluido' })
      .eq('id', item.enrollment_id);

    if (error) {
      console.log('Erro ao concluir protocolo:', error);
    } else {
      setDay5Items((prev) => prev.filter((d) => d.enrollment_id !== item.enrollment_id));
    }
  }

  const hasAnyData = todayMessages.length > 0 || waitingDate.length > 0 || day5Items.length > 0;

  if (!hasAnyData) return null;

  const formatTime = (time: string) => time.substring(0, 5);

  const isOverdue = (date: string) => {
    const today = todayBR();
    return date < today;
  };

  return (
    <View style={s.widget}>
      <View style={s.header}>
        <Text style={s.title}>🔄 Protocolo Reset</Text>
      </View>

      {todayMessages.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Mensagens de hoje</Text>
          {todayMessages.map((item) => (
            <View key={item.id} style={s.messageRow}>
              <View style={s.messageInfo}>
                <Text style={s.clientName}>{item.client_name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={s.dayLabel}>Dia {item.day_number}/5</Text>
                  <Text style={s.timeText}>{formatTime(item.send_time)}</Text>
                  {isOverdue(item.scheduled_date) && (
                    <View style={s.overdueTag}>
                      <Text style={s.overdueText}>atrasada</Text>
                    </View>
                  )}
                </View>
              </View>
              <View style={s.messageActions}>
                <TouchableOpacity
                  onPress={() => handleSendMessage(item)}
                  style={s.sendBtn}
                  activeOpacity={0.7}
                >
                  <Text style={s.sendBtnText}>Enviar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleSkipMessage(item)}
                  style={s.skipBtn}
                  activeOpacity={0.7}
                >
                  <Text style={s.skipBtnText}>Pular</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {waitingDate.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Aguardando data de início</Text>
          {waitingDate.map((item) => (
            <View key={item.id} style={s.waitingRow}>
              <Text style={s.clientName}>{item.client_name}</Text>
              <TouchableOpacity
                onPress={() => handleDefineDate(item)}
                style={s.defineBtn}
                activeOpacity={0.7}
              >
                <Text style={s.defineBtnText}>Definir data</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {day5Items.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Dia 5 — agendar retorno</Text>
          {day5Items.map((item) => (
            <View key={item.enrollment_id} style={s.day5Row}>
              <View style={s.day5Info}>
                <View style={s.alertDot} />
                <Text style={s.day5Text}>Agendar avaliação de retorno de {item.client_name}</Text>
              </View>
              <TouchableOpacity
                onPress={() => handleCompleteDay5(item)}
                style={s.completeBtn}
                activeOpacity={0.7}
              >
                <Text style={s.completeBtnText}>Concluir</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <ResetProtocolDateModal
        visible={dateModalVisible}
        clientName={selectedEnrollment?.client_name || ''}
        onConfirmDate={handleConfirmDate}
        onDefineLater={() => {
          setDateModalVisible(false);
          setSelectedEnrollment(null);
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  widget: {
    backgroundColor: '#161616',
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: T.t2,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
  },
  messageRow: {
    backgroundColor: '#242424',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  messageInfo: {
    marginBottom: 10,
  },
  clientName: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  dayLabel: {
    color: T.t2,
    fontSize: 13,
  },
  timeText: {
    color: T.t2,
    fontSize: 13,
    fontWeight: '600',
  },
  overdueTag: {
    backgroundColor: T.orange,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  overdueText: {
    color: '#000',
    fontSize: 11,
    fontWeight: '700',
  },
  messageActions: {
    flexDirection: 'row',
    gap: 8,
  },
  sendBtn: {
    flex: 1,
    backgroundColor: T.blue,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  sendBtnText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '700',
  },
  skipBtn: {
    flex: 1,
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  skipBtnText: {
    color: T.t2,
    fontSize: 14,
    fontWeight: '600',
  },
  waitingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#242424',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  defineBtn: {
    backgroundColor: T.blue,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  defineBtnText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '700',
  },
  day5Row: {
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderWidth: 1,
    borderColor: T.orange,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  day5Info: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  alertDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: T.orange,
  },
  day5Text: {
    color: '#FFF',
    fontSize: 14,
    flex: 1,
  },
  completeBtn: {
    backgroundColor: T.green,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  completeBtnText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '700',
  },
});
