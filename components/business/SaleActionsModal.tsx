import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { T } from '../../utils/theme';
import { SaleRow } from './SaleFormModal';

interface SaleActionsModalProps {
  sale: SaleRow | null;
  onClose: () => void;
  onEdit: (sale: SaleRow) => void;
  onDelete: (id: string) => void;
}

export default function SaleActionsModal({ sale, onClose, onEdit, onDelete }: SaleActionsModalProps) {
  return (
    <Modal visible={sale !== null} animationType="fade" transparent>
      <View style={s.modalBg}>
        <View style={s.modalBox}>
          <Text style={s.modalTitle}>Ações da venda</Text>
          <Text style={{ color: '#DDD', marginBottom: 16 }}>
            {sale?.clients?.name || sale?.client_name_manual || 'Cliente'}
          </Text>

          <TouchableOpacity style={[s.actionBtn, { backgroundColor: T.blue }]} onPress={() => sale && onEdit(sale)}>
            <Text style={s.actionBtnTxt}>✏️ Alterar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.actionBtn, { backgroundColor: '#EF4444' }]}
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

const s = StyleSheet.create({
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 },
  modalBox: { backgroundColor: '#161616', borderRadius: 16, padding: 18 },
  modalTitle: { color: '#FFF', fontSize: 18, fontWeight: '700', marginBottom: 14 },
  actionBtn: { padding: 14, borderRadius: 10, alignItems: 'center', marginBottom: 10 },
  actionBtnTxt: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  btnGhost: { backgroundColor: '#242424' },
  btnGhostTxt: { color: '#AAA', fontWeight: '600' },
});
