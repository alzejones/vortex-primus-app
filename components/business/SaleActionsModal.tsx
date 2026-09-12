import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { SaleRow } from './SaleFormModal';

interface SaleActionsModalProps {
  sale: SaleRow | null;
  onClose: () => void;
  onEdit: (sale: SaleRow) => void;
  onDelete: (id: string) => void;
  onConvertToClient?: (sale: SaleRow) => void;
}

export default function SaleActionsModal({ sale, onClose, onEdit, onDelete, onConvertToClient }: SaleActionsModalProps) {
  const { theme } = useTheme();
  const s = createStyles(theme);
  
  return (
    <Modal visible={sale !== null} animationType="fade" transparent>
      <View style={s.modalBg}>
        <View style={s.modalBox}>
          <Text style={s.modalTitle}>Ações da venda</Text>
          <Text style={{ color: theme.colors.textSecondary, marginBottom: 16 }}>
            {sale?.clients?.name || sale?.client_name_manual || 'Cliente'}
          </Text>

          {sale && !sale.client_id && (
            <TouchableOpacity style={[s.actionBtn, s.actionBtnConvert]} onPress={() => sale && onConvertToClient && onConvertToClient(sale)}>
              <Text style={s.actionBtnTxt}>👤 Transformar em Cliente</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={[s.actionBtn, s.actionBtnEdit]} onPress={() => sale && onEdit(sale)}>
            <Text style={s.actionBtnTxt}>✏️ Alterar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.actionBtn, s.actionBtnDelete]}
            onPress={() => {
              if (sale) onDelete(sale.id);
            }}
          >
            <Text style={s.actionBtnTxt}>🗑️ Excluir</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[s.actionBtn, s.btnGhost]} onPress={onClose}>
            <Text style={s.btnGhostTxt}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function createStyles(theme: any) {
  return StyleSheet.create({
    modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 },
    modalBox: { backgroundColor: theme.colors.card, borderRadius: 16, padding: 18 },
    modalTitle: { color: theme.colors.textPrimary, fontSize: 18, fontWeight: '700', marginBottom: 14 },
    actionBtn: { padding: 14, borderRadius: 10, alignItems: 'center', marginBottom: 10 },
    actionBtnConvert: { backgroundColor: '#10B981' },
    actionBtnEdit: { backgroundColor: theme.colors.primary },
    actionBtnDelete: { backgroundColor: '#EF4444' },
    actionBtnTxt: { color: '#FFF', fontWeight: '700', fontSize: 15 },
    btnGhost: { backgroundColor: theme.colors.card },
    btnGhostTxt: { color: theme.colors.textMuted, fontWeight: '600' },
  });
}
