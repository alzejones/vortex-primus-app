import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { T } from '../../utils/theme';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = 'Sim',
  cancelLabel = 'Não',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={s.overlay}>
        <View style={s.card}>
          <Text style={s.title}>{title}</Text>
          <Text style={s.message}>{message}</Text>
          <View style={s.buttonsRow}>
            <TouchableOpacity style={s.btnCancel} onPress={onCancel}>
              <Text style={s.btnCancelTxt}>{cancelLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.btnConfirm} onPress={onConfirm}>
              <Text style={s.btnConfirmTxt}>{confirmLabel}</Text>
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
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    maxWidth: 320,
    width: '100%',
    backgroundColor: T.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: T.border,
    padding: 20,
  },
  title: {
    color: T.white,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 12,
  },
  message: {
    color: T.t2,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  btnCancel: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  btnCancelTxt: {
    color: T.t2,
    fontSize: 14,
    fontWeight: '600',
  },
  btnConfirm: {
    flex: 1,
    backgroundColor: T.blue,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  btnConfirmTxt: {
    color: T.white,
    fontSize: 14,
    fontWeight: '700',
  },
});
