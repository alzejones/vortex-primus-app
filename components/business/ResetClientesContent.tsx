// ============================================================
// ResetClientesContent.tsx — Lista de clientes Kit Reset
// ============================================================
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState, useMemo } from 'react';
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { T } from '../../utils/theme';
import { normalizeSearch } from '../../utils/textSearch';

interface ResetClient {
  enrollment_id: string;
  client_id: string;
  client_name: string;
  client_phone: string | null;
  sale_date: string | null;
  created_at: string;
}

export default function ResetClientesContent() {
  const [loading, setLoading] = useState(true);
  const [trainerId, setTrainerId] = useState<string | null>(null);
  const [clients, setClients] = useState<ResetClient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMonth, setFilterMonth] = useState<string>('');
  const [filterDay, setFilterDay] = useState<string>('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
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

      const { data: enrollments } = await supabase
        .from('reset_protocol_enrollments')
        .select(`
          id,
          client_id,
          sale_id,
          created_at,
          clients!reset_protocol_enrollments_client_id_fkey(name, phone),
          herbalife_sales!reset_protocol_enrollments_sale_id_fkey(sale_date)
        `)
        .eq('trainer_id', trainer.id)
        .order('created_at', { ascending: true });

      if (enrollments) {
        const mapped = enrollments
          .filter((e: any) => e.clients?.name)
          .map((e: any) => ({
            enrollment_id: e.id,
            client_id: e.client_id,
            client_name: e.clients.name,
            client_phone: e.clients.phone || null,
            sale_date: e.herbalife_sales?.sale_date || null,
            created_at: e.created_at,
          }));

        mapped.sort((a, b) => {
          const dateA = a.sale_date || a.created_at.split('T')[0];
          const dateB = b.sale_date || b.created_at.split('T')[0];
          return dateA.localeCompare(dateB);
        });

        setClients(mapped);
      }
    } catch (error) {
      console.log('Erro ao carregar clientes Kit Reset:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const filteredClients = useMemo(() => {
    let result = clients;

    if (searchQuery.trim()) {
      const normalized = normalizeSearch(searchQuery);
      result = result.filter((c) =>
        normalizeSearch(c.client_name).includes(normalized)
      );
    }

    if (filterMonth || filterDay) {
      result = result.filter((c) => {
        const refDate = c.sale_date || c.created_at.split('T')[0];
        const [y, m, d] = refDate.split('-');

        if (filterMonth && m !== filterMonth) return false;
        if (filterDay && d !== filterDay.padStart(2, '0')) return false;

        return true;
      });
    }

    return result;
  }, [clients, searchQuery, filterMonth, filterDay]);

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    clients.forEach((c) => {
      const refDate = c.sale_date || c.created_at.split('T')[0];
      const [y, m] = refDate.split('-');
      months.add(m);
    });
    return Array.from(months).sort();
  }, [clients]);

  const formatDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  const formatPhoneBR = (phone: string) => {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 11) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    }
    if (digits.length === 10) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    }
    return phone;
  };

  const handleOpenWhatsApp = (client: ResetClient) => {
    if (!client.client_phone) return;

    const digits = client.client_phone.replace(/\D/g, '');
    if (!digits) return;

    const fullPhone =
      digits.length > 11 && digits.startsWith('55') ? digits : '55' + digits;
    const url = `https://wa.me/${fullPhone}`;

    Linking.openURL(url).catch((err) => {
      console.log('Erro ao abrir WhatsApp:', err);
    });
  };

  const monthNames: Record<string, string> = {
    '01': 'Janeiro',
    '02': 'Fevereiro',
    '03': 'Março',
    '04': 'Abril',
    '05': 'Maio',
    '06': 'Junho',
    '07': 'Julho',
    '08': 'Agosto',
    '09': 'Setembro',
    '10': 'Outubro',
    '11': 'Novembro',
    '12': 'Dezembro',
  };

  if (loading) {
    return (
      <View style={s.container}>
        <ActivityIndicator size="large" color={T.blue} style={{ marginTop: 40 }} />
      </View>
    );
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 32 }}>
      <View style={s.header}>
        <Text style={s.title}>Clientes Kit Reset</Text>
        <Text style={s.subtitle}>{clients.length} inscrições</Text>
      </View>

      <View style={s.filtersContainer}>
        <TextInput
          style={s.searchInput}
          placeholder="Buscar por nome..."
          placeholderTextColor={T.t3}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        <View style={s.dateFilters}>
          <View style={s.dateFilterGroup}>
            <Text style={s.filterLabel}>Mês</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TouchableOpacity
                style={[s.monthChip, !filterMonth && s.monthChipActive]}
                onPress={() => setFilterMonth('')}
              >
                <Text style={[s.monthChipText, !filterMonth && s.monthChipTextActive]}>
                  Todos
                </Text>
              </TouchableOpacity>
              {availableMonths.map((month) => (
                <TouchableOpacity
                  key={month}
                  style={[s.monthChip, filterMonth === month && s.monthChipActive]}
                  onPress={() => setFilterMonth(month)}
                >
                  <Text
                    style={[
                      s.monthChipText,
                      filterMonth === month && s.monthChipTextActive,
                    ]}
                  >
                    {monthNames[month]}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={s.dateFilterGroup}>
            <Text style={s.filterLabel}>Dia (opcional)</Text>
            <TextInput
              style={s.dayInput}
              placeholder="1-31"
              placeholderTextColor={T.t3}
              keyboardType="number-pad"
              value={filterDay}
              onChangeText={(text) => {
                const num = parseInt(text, 10);
                if (text === '' || (num >= 1 && num <= 31)) {
                  setFilterDay(text);
                }
              }}
            />
          </View>
        </View>
      </View>

      <View style={s.table}>
        <View style={s.tableHeader}>
          <Text style={[s.headerCell, s.cellNum]}>N°</Text>
          <Text style={[s.headerCell, s.cellName]}>Nome</Text>
          <Text style={[s.headerCell, s.cellDate]}>Data</Text>
          <Text style={[s.headerCell, s.cellPhone]}>Celular</Text>
        </View>

        {filteredClients.map((client, index) => {
          const refDate = client.sale_date || client.created_at.split('T')[0];
          return (
            <View key={client.enrollment_id} style={s.tableRow}>
              <Text style={[s.cell, s.cellNum]}>{index + 1}</Text>
              <Text style={[s.cell, s.cellName]}>{client.client_name}</Text>
              <Text style={[s.cell, s.cellDate]}>{formatDate(refDate)}</Text>
              <TouchableOpacity
                style={[s.cell, s.cellPhone]}
                onPress={() => handleOpenWhatsApp(client)}
                disabled={!client.client_phone}
              >
                <Text style={[s.phoneText, !client.client_phone && s.phoneDisabled]}>
                  {client.client_phone ? formatPhoneBR(client.client_phone) : '—'}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}

        {filteredClients.length === 0 && (
          <View style={s.emptyState}>
            <Text style={s.emptyText}>Nenhum cliente encontrado</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.bg,
  },
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  title: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    color: T.t2,
    fontSize: 14,
  },
  filtersContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchInput: {
    backgroundColor: '#242424',
    borderRadius: 10,
    padding: 12,
    color: '#FFF',
    fontSize: 15,
    marginBottom: 16,
  },
  dateFilters: {
    gap: 12,
  },
  dateFilterGroup: {
    gap: 8,
  },
  filterLabel: {
    color: T.t2,
    fontSize: 13,
    fontWeight: '600',
  },
  monthChip: {
    backgroundColor: '#242424',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  monthChipActive: {
    backgroundColor: T.blue,
  },
  monthChipText: {
    color: T.t2,
    fontSize: 13,
    fontWeight: '600',
  },
  monthChipTextActive: {
    color: '#000',
    fontWeight: '700',
  },
  dayInput: {
    backgroundColor: '#242424',
    borderRadius: 10,
    padding: 12,
    color: '#FFF',
    fontSize: 15,
    width: 100,
  },
  table: {
    paddingHorizontal: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#242424',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  headerCell: {
    color: T.t2,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    backgroundColor: '#161616',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  cell: {
    color: '#FFF',
    fontSize: 14,
  },
  cellNum: {
    width: 40,
  },
  cellName: {
    flex: 1,
    fontWeight: '600',
  },
  cellDate: {
    width: 90,
  },
  cellPhone: {
    width: 110,
  },
  phoneText: {
    color: T.blue,
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  phoneDisabled: {
    color: T.t3,
    textDecorationLine: 'none',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: T.t2,
    fontSize: 14,
  },
});
