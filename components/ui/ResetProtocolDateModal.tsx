import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { brasiliaDate, todayBR } from '../../utils/dateBR';

interface ResetProtocolDateModalProps {
  visible: boolean;
  clientName: string;
  onConfirmDate: (date: string) => void;
  onDefineLater: () => void;
}

const fmtBR = (iso: string) => iso.split('-').reverse().join('/');

export default function ResetProtocolDateModal({
  visible,
  clientName,
  onConfirmDate,
  onDefineLater,
}: ResetProtocolDateModalProps) {
  const [selectedDate, setSelectedDate] = useState<string>(todayBR());
  const { theme } = useTheme();

  const generateDates = () => {
    const dates: string[] = [];
    const today = brasiliaDate();
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      dates.push(`${y}-${m}-${day}`);
    }
    return dates;
  };

  const dates = generateDates();

  const s = {
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.8)',
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      padding: 20,
    },
    card: {
      backgroundColor: theme.colors.card,
      borderRadius: 16,
      padding: 20,
      maxWidth: 400,
      width: '100%' as const,
      maxHeight: '80%' as const,
    },
    title: {
      color: theme.colors.textPrimary,
      fontSize: 20,
      fontWeight: '700' as const,
      marginBottom: 8,
      textAlign: 'center' as const,
    },
    subtitle: {
      color: theme.colors.textSecondary,
      fontSize: 14,
      marginBottom: 16,
      textAlign: 'center' as const,
    },
    highlight: {
      color: theme.colors.primary,
      fontWeight: '700' as const,
    },
    dateList: {
      maxHeight: 300,
      marginBottom: 16,
    },
    dateRow: {
      padding: 14,
      borderRadius: 8,
      backgroundColor: theme.colors.background,
      marginBottom: 8,
    },
    dateRowSelected: {
      backgroundColor: theme.colors.primary,
    },
    dateText: {
      color: theme.colors.textSecondary,
      fontSize: 14,
      textAlign: 'center' as const,
    },
    dateTextSelected: {
      color: theme.mode === 'dark' ? '#000' : '#FFF',
      fontWeight: '700' as const,
    },
    buttons: {
      flexDirection: 'row' as const,
      gap: 8,
    },
    btn: {
      flex: 1,
      padding: 14,
      borderRadius: 10,
      alignItems: 'center' as const,
    },
    btnGhost: {
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    btnGhostTxt: {
      color: theme.colors.textMuted,
      fontWeight: '600' as const,
    },
    btnPrimary: {
      backgroundColor: theme.colors.primary,
    },
    btnPrimaryTxt: {
      color: theme.mode === 'dark' ? '#000' : '#FFF',
      fontWeight: '700' as const,
    },
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={s.overlay}>
        <View style={s.card}>
          <Text style={s.title}>Protocolo Reset</Text>
          <Text style={s.subtitle}>
            Quando <Text style={s.highlight}>{clientName}</Text> vai começar o Protocolo Reset?
          </Text>

          <ScrollView style={s.dateList}>
            {dates.map((date) => {
              const isSelected = date === selectedDate;
              return (
                <TouchableOpacity
                  key={date}
                  style={[s.dateRow, isSelected && s.dateRowSelected]}
                  onPress={() => setSelectedDate(date)}
                >
                  <Text style={[s.dateText, isSelected && s.dateTextSelected]}>
                    {fmtBR(date)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={s.buttons}>
            <TouchableOpacity
              style={[s.btn, s.btnGhost]}
              onPress={onDefineLater}
            >
              <Text style={s.btnGhostTxt}>Definir depois</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.btn, s.btnPrimary]}
              onPress={() => onConfirmDate(selectedDate)}
            >
              <Text style={s.btnPrimaryTxt}>Confirmar data</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
