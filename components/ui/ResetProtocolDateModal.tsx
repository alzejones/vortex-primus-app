import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { T } from '../../utils/theme';
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

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#161616',
    borderRadius: 16,
    padding: 20,
    maxWidth: 400,
    width: '100%',
    maxHeight: '80%',
  },
  title: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: '#CCC',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  highlight: {
    color: T.blue,
    fontWeight: '700',
  },
  dateList: {
    maxHeight: 300,
    marginBottom: 16,
  },
  dateRow: {
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#242424',
    marginBottom: 8,
  },
  dateRowSelected: {
    backgroundColor: T.blue,
  },
  dateText: {
    color: '#DDD',
    fontSize: 14,
    textAlign: 'center',
  },
  dateTextSelected: {
    color: '#000',
    fontWeight: '700',
  },
  buttons: {
    flexDirection: 'row',
    gap: 8,
  },
  btn: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnGhost: {
    backgroundColor: '#242424',
    borderWidth: 1,
    borderColor: '#444',
  },
  btnGhostTxt: {
    color: '#AAA',
    fontWeight: '600',
  },
  btnPrimary: {
    backgroundColor: T.blue,
  },
  btnPrimaryTxt: {
    color: '#000',
    fontWeight: '700',
  },
});
