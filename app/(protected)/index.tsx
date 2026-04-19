// ============================================================
// index.tsx — Dashboard do treinador
// Toda lógica de dados aqui. Layout delegado ao DashboardLayout.
// Expo usa DashboardLayout.web.tsx na web automaticamente.
// ============================================================
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
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
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);
  const [isScheduleModalVisible, setScheduleModalVisible] = useState(false);
  const [scheduleSearchQuery, setScheduleSearchQuery] = useState('');

  useEffect(() => { loadDashboardData(); }, []);

  async function loadDashboardData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: trainer } = await supabase.from('trainers').select('id').eq('user_id', user.id).single();
      if (!trainer) return;

      const { data: subscription } = await supabase
        .from('trainer_subscriptions')
        .select('is_active, plans ( name, max_clients )')
        .eq('trainer_id', trainer.id)
        .eq('is_active', true)
        .single();

      if (subscription) {
        const planData = subscription.plans as any;
        setPlanName(planData?.name || 'Sem Plano');
        setMaxClients(planData?.max_clients || 0);
        setPlanStatus(subscription.is_active ? 'Ativo' : 'Inativo');
      }

      const { data: clientList } = await supabase
        .from('clients')
        .select(`*, physical_assessments ( id, anthropometry:anthropometry!anthropometry_assessment_id_fkey (view_count) )`)
        .eq('trainer_id', trainer.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      const clientsWithViews = (clientList || []).map((client: any) => {
        let totalViews = 0;
        if (client.physical_assessments) {
          client.physical_assessments.forEach((pa: any) => {
            if (pa.anthropometry?.length > 0) totalViews += (pa.anthropometry[0].view_count || 0);
          });
        }
        return { ...client, totalViews };
      });

      setClients(clientsWithViews);
      setCurrentClients(clientsWithViews.length);

      const today = new Date().toISOString().split('T')[0];
      const { data: agendaData } = await supabase
        .from('appointments')
        .select('id, appointment_date, appointment_time, types, clients(name)')
        .eq('trainer_id', trainer.id)
        .gte('appointment_date', today)
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

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: T.bg }}>
        <ActivityIndicator size="large" color={T.blue} />
      </View>
    );
  }

  const filteredClients = clients.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const scheduleFilteredClients = clients.filter(c => c.name.toLowerCase().includes(scheduleSearchQuery.toLowerCase()));

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
    />
  );
}
