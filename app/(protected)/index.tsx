// ============================================================
// index.tsx — Dashboard do treinador
// Toda lógica de dados aqui. Layout delegado ao DashboardLayout.
// Expo usa DashboardLayout.web.tsx na web automaticamente.
// ============================================================
import { useCallback, useEffect, useState, useMemo } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { T } from '../../utils/theme';
import DashboardLayout from '../../components/dashboard/DashboardLayout';

export default function Index() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [planName, setPlanName] = useState('');
  const [maxClients, setMaxClients] = useState(0);
  const [currentClients, setCurrentClients] = useState(0);
  const [planStatus, setPlanStatus] = useState('');
  const [clients, setClients] = useState<any[]>([]);
  const [overdueClients, setOverdueClients] = useState<any[]>([]);
  const [birthdayClients, setBirthdayClients] = useState<any[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);
  const [isScheduleModalVisible, setScheduleModalVisible] = useState(false);
  const [scheduleSearchQuery, setScheduleSearchQuery] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [])
  );

  async function loadDashboardData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: trainer } = await supabase.from('trainers').select('id').eq('user_id', user.id).single();
      if (!trainer) return;

      const { data: subscription } = await supabase
        .from('trainer_subscriptions')
        .select('is_active, plans ( name, max_clients, price_monthly )')
        .eq('trainer_id', trainer.id)
        .eq('is_active', true)
        .maybeSingle();

      if (subscription) {
        const planData = subscription.plans as any;
        setPlanName(planData?.name || 'Sem Plano');
        setMaxClients(planData?.max_clients || 0);
        setPlanStatus(subscription.is_active ? 'Ativo' : 'Inativo');
      } else {
        setPlanName('Sem Plano');
        setMaxClients(0);
        setPlanStatus('Inativo');
      }

      const { data: clientList } = await supabase
        .from('clients')
        .select(`
          *,
          physical_assessments (
            id,
            assessment_date,
            anthropometry:anthropometry!anthropometry_assessment_id_fkey (view_count)
          )
        `)
        .eq('trainer_id', trainer.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      const clientsWithViews = (clientList || []).map((client: any) => {
        let totalViews = 0;
        let lastAssessmentDate: string | null = null;

        if (client.physical_assessments && client.physical_assessments.length > 0) {
          // Pegar a data mais recente
          const sorted = [...client.physical_assessments].sort(
            (a: any, b: any) =>
              new Date(b.assessment_date).getTime() - new Date(a.assessment_date).getTime()
          );
          lastAssessmentDate = sorted[0]?.assessment_date || null;

          sorted.forEach((pa: any) => {
            if (pa.anthropometry?.length > 0) totalViews += (pa.anthropometry[0].view_count || 0);
          });
        }

        return { ...client, totalViews, lastAssessmentDate };
      });

      setClients(clientsWithViews);
      setCurrentClients(clientsWithViews.length);

      // Clientes sem avaliação há 30+ dias (ou nunca avaliados)
      const today = new Date();
      const overdueClients = clientsWithViews.filter((c: any) => {
        if (!c.lastAssessmentDate) return true; // nunca avaliado
        const last = new Date(c.lastAssessmentDate);
        const diffDays = Math.floor((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays >= 30;
      });
      setOverdueClients(overdueClients);

      // Aniversariantes do mês atual
      const currentMonth = today.getMonth() + 1; // 1-12
      const currentDay = today.getDate();
      const birthdayClients = clientsWithViews.filter((c: any) => {
        if (!c.birth_date) return false;
        const [, month, day] = c.birth_date.split('-').map(Number);
        return month === currentMonth;
      }).sort((a: any, b: any) => {
        const [, , dayA] = a.birth_date.split('-').map(Number);
        const [, , dayB] = b.birth_date.split('-').map(Number);
        return dayA - dayB;
      });
      setBirthdayClients(birthdayClients);

      const todayISO = new Date().toISOString().split('T')[0];
      const { data: agendaData } = await supabase
        .from('appointments')
        .select('id, appointment_date, appointment_time, types, clients(name)')
        .eq('trainer_id', trainer.id)
        .gte('appointment_date', todayISO)
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true })
        .limit(3);

      if (agendaData) setUpcomingAppointments(agendaData);
    } catch (error) {
      console.log('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  }

  const getInitials = (name: string) => {
    if (!name) return 'AL';
    const names = name.trim().split(' ');
    if (names.length >= 2) return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const formatDateBR = (isoString: string) => {
    if (!isoString) return '';
    const [, m, d] = isoString.split('-');
    return `${d}/${m}`;
  };

  // Normaliza string: remove diacríticos + lowercase — busca insensível a acento
  const normalize = useCallback(
    (str: string) =>
      str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim(),
    []
  );

  // useMemo: referência estável → FlatList não re-monta → teclado não cai
  const filteredClients = useMemo(() => {
    const q = normalize(searchQuery);
    if (!q) return clients;
    return clients.filter(c => normalize(c.name ?? '').includes(q));
  }, [clients, searchQuery, normalize]);

  const scheduleFilteredClients = useMemo(() => {
    const q = normalize(scheduleSearchQuery);
    if (!q) return clients;
    return clients.filter(c => normalize(c.name ?? '').includes(q));
  }, [clients, scheduleSearchQuery, normalize]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: T.bg }}>
        <ActivityIndicator size="large" color={T.blue} />
      </View>
    );
  }

  return (
    <DashboardLayout
      planName={planName}
      maxClients={maxClients}
      currentClients={currentClients}
      planStatus={planStatus}
      clients={clients}
      filteredClients={filteredClients}
      upcomingAppointments={upcomingAppointments}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      isScheduleModalVisible={isScheduleModalVisible}
      onOpenScheduleModal={() => setScheduleModalVisible(true)}
      onCloseScheduleModal={() => setScheduleModalVisible(false)}
      scheduleSearchQuery={scheduleSearchQuery}
      onScheduleSearchChange={setScheduleSearchQuery}
      scheduleFilteredClients={scheduleFilteredClients}
      refreshing={refreshing}
      onRefresh={onRefresh}
      getInitials={getInitials}
      formatDateBR={formatDateBR}
      overdueClients={overdueClients}
      birthdayClients={birthdayClients}
    />
  );
}
