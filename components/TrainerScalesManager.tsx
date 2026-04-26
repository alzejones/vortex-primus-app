// ============================================================
// TrainerScalesManager.tsx — Gerenciamento de Balanças do Treinador
// Lista, adiciona e remove balanças cadastradas (CRUD apenas - sem BLE)
// ============================================================
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { T } from '../utils/theme';
import { GradientPrimary } from '../utils/gradients';

interface SupportedScale {
  id: string;
  brand: string;
  model: string;
  protocol: string;
  connection_type: string;
}

interface TrainerScale {
  id: string;
  nickname: string;
  supported_scales: SupportedScale;
}

export default function TrainerScalesManager() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [scales, setScales] = useState<TrainerScale[]>([]);
  const [supportedScales, setSupportedScales] = useState<SupportedScale[]>([]);
  
  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedScaleId, setSelectedScaleId] = useState('');
  const [nickname, setNickname] = useState('');
  const [saving, setSaving] = useState(false);
  const [trainerId, setTrainerId] = useState<string | null>(null);
  
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      
      // Get trainer ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: trainer } = await supabase
        .from('trainers')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (!trainer) return;
      setTrainerId(trainer.id);

      // Load trainer scales
      const { data: trainerScales, error: scalesError } = await supabase
        .from('trainer_scales')
        .select(`
          id,
          nickname,
          supported_scales (
            id,
            brand,
            model,
            protocol,
            connection_type
          )
        `)
        .eq('trainer_id', trainer.id)
        .eq('is_active', true);

      if (scalesError) throw scalesError;
      setScales(trainerScales || []);

      // Load supported scales (excluding manual for the picker)
      const { data: supported, error: supportedError } = await supabase
        .from('supported_scales')
        .select('id, brand, model, protocol, connection_type')
        .eq('is_active', true)
        .neq('protocol', 'manual');

      if (supportedError) throw supportedError;
      setSupportedScales(supported || []);

    } catch (error: any) {
      console.error('Erro ao carregar balanças:', error);
      setStatusMsg({ text: 'Erro ao carregar dados.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  async function handleAddScale() {
    if (!trainerId || !selectedScaleId || !nickname.trim()) {
      setStatusMsg({ text: 'Preencha todos os campos.', type: 'error' });
      return;
    }

    try {
      setSaving(true);
      setStatusMsg({ text: '', type: '' });

      const { error } = await supabase
        .from('trainer_scales')
        .insert({
          trainer_id: trainerId,
          supported_scale_id: selectedScaleId,
          nickname: nickname.trim(),
        });

      if (error) throw error;

      setModalVisible(false);
      setSelectedScaleId('');
      setNickname('');
      setStatusMsg({ text: 'Balança adicionada com sucesso!', type: 'success' });
      loadData(); // Reload list

    } catch (error: any) {
      setStatusMsg({ text: error.message || 'Erro ao adicionar balança.', type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveScale(scaleId: string, scaleName: string) {
    Alert.alert(
      'Remover Balança',
      `Tem certeza que deseja remover "${scaleName}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Remover', 
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('trainer_scales')
                .update({ is_active: false })
                .eq('id', scaleId);

              if (error) throw error;
              
              setStatusMsg({ text: 'Balança removida com sucesso!', type: 'success' });
              loadData();
            } catch (error: any) {
              setStatusMsg({ text: 'Erro ao remover balança.', type: 'error' });
            }
          }
        }
      ]
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={T.blue} />
        <Text style={styles.loadingText}>Carregando balanças...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Minhas Balanças</Text>
        <Text style={styles.subtitle}>Gerencie as balanças conectadas ao seu perfil.</Text>
      </View>

      {statusMsg.text !== '' && (
        <View style={[styles.statusBox, statusMsg.type === 'error' ? styles.statusError : styles.statusSuccess]}>
          <Text style={[styles.statusText, statusMsg.type === 'error' ? styles.statusTextError : styles.statusTextSuccess]}>
            {statusMsg.type === 'error' ? '⚠️ ' : '✅ '}
            {statusMsg.text}
          </Text>
        </View>
      )}

      <View style={styles.card}>
        {scales.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>⚖️</Text>
            <Text style={styles.emptyTitle}>Nenhuma balança cadastrada</Text>
            <Text style={styles.emptyText}>Adicione uma balança para começar a registrar medidas corporais.</Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            {scales.map((scale) => (
              <View key={scale.id} style={styles.scaleItem}>
                <View style={styles.scaleInfo}>
                  <Text style={styles.scaleNickname}>{scale.nickname}</Text>
                  <Text style={styles.scaleModel}>
                    {scale.supported_scales.brand} {scale.supported_scales.model}
                  </Text>
                  <Text style={styles.scaleProtocol}>
                    {scale.supported_scales.connection_type === 'ble_web' ? '🔗 Bluetooth' : '📝 Manual'}
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.removeButton}
                  onPress={() => handleRemoveScale(scale.id, scale.nickname)}
                >
                  <Text style={styles.removeButtonText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}

        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <LinearGradient {...GradientPrimary} style={styles.addButtonGradient}>
            <Text style={styles.addButtonText}>+ ADICIONAR BALANÇA</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Modal para adicionar balança */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Adicionar Balança</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Modelo da Balança</Text>
              <ScrollView style={styles.picker} showsVerticalScrollIndicator={false}>
                {supportedScales.map((scale) => (
                  <TouchableOpacity
                    key={scale.id}
                    style={[
                      styles.pickerOption,
                      selectedScaleId === scale.id && styles.pickerOptionSelected
                    ]}
                    onPress={() => setSelectedScaleId(scale.id)}
                  >
                    <Text style={[
                      styles.pickerOptionText,
                      selectedScaleId === scale.id && styles.pickerOptionTextSelected
                    ]}>
                      {scale.brand} {scale.model}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Apelido (ex: "Balança Sala 1")</Text>
              <TextInput
                style={styles.input}
                value={nickname}
                onChangeText={setNickname}
                placeholder="Digite um nome para identificar esta balança"
                placeholderTextColor={T.t3}
                maxLength={50}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setModalVisible(false);
                  setSelectedScaleId('');
                  setNickname('');
                  setStatusMsg({ text: '', type: '' });
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleAddScale}
                disabled={saving || !selectedScaleId || !nickname.trim()}
              >
                <LinearGradient {...GradientPrimary} style={styles.saveButtonGradient}>
                  {saving ? (
                    <ActivityIndicator color={T.white} size="small" />
                  ) : (
                    <Text style={styles.saveButtonText}>Salvar</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 24 },
  loadingContainer: { 
    backgroundColor: T.card, 
    padding: 40, 
    borderRadius: 24, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: T.border,
  },
  loadingText: { 
    marginTop: 12, 
    fontSize: 14, 
    color: T.t2, 
    fontWeight: '500' 
  },

  header: { marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '800', color: T.t1, marginBottom: 4 },
  subtitle: { fontSize: 14, color: T.t3, lineHeight: 20 },

  statusBox: { padding: 12, borderRadius: 12, marginBottom: 16, borderWidth: 1 },
  statusError: { backgroundColor: 'rgba(239,68,68,0.08)', borderColor: T.red },
  statusSuccess: { backgroundColor: 'rgba(16,185,129,0.08)', borderColor: T.green },
  statusText: { fontWeight: 'bold', fontSize: 13 },
  statusTextError: { color: T.red },
  statusTextSuccess: { color: T.green },

  card: { 
    backgroundColor: T.card, 
    padding: 20, 
    borderRadius: 24, 
    borderWidth: 1, 
    borderColor: T.border 
  },

  emptyState: { alignItems: 'center', paddingVertical: 32 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: T.t1, marginBottom: 8 },
  emptyText: { 
    fontSize: 14, 
    color: T.t3, 
    textAlign: 'center', 
    lineHeight: 20,
    paddingHorizontal: 20
  },

  scaleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  scaleInfo: { flex: 1 },
  scaleNickname: { fontSize: 16, fontWeight: '700', color: T.t1, marginBottom: 4 },
  scaleModel: { fontSize: 14, color: T.t2, marginBottom: 2 },
  scaleProtocol: { fontSize: 12, color: T.t3 },
  
  removeButton: { 
    padding: 8, 
    borderRadius: 8, 
    backgroundColor: 'rgba(239,68,68,0.1)' 
  },
  removeButtonText: { fontSize: 18 },

  addButton: { marginTop: 16, borderRadius: 12, overflow: 'hidden' },
  addButtonGradient: { 
    paddingVertical: 14, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  addButtonText: { 
    color: T.white, 
    fontWeight: '800', 
    fontSize: 14, 
    letterSpacing: 0.5 
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: T.card,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: T.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: T.t1,
    marginBottom: 20,
    textAlign: 'center',
  },

  inputGroup: { marginBottom: 20 },
  label: { 
    fontSize: 12, 
    fontWeight: '800', 
    color: T.t2, 
    marginBottom: 8, 
    textTransform: 'uppercase', 
    letterSpacing: 0.5 
  },
  
  picker: { 
    backgroundColor: T.surface,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 12,
    maxHeight: 150,
  },
  pickerOption: { 
    padding: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: T.border 
  },
  pickerOptionSelected: { backgroundColor: T.surfaceAlt },
  pickerOptionText: { fontSize: 14, color: T.t1 },
  pickerOptionTextSelected: { fontWeight: '700', color: T.blue },

  input: { 
    backgroundColor: T.surface,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: T.t1,
  },

  modalButtons: { 
    flexDirection: 'row', 
    gap: 12, 
    marginTop: 8 
  },
  cancelButton: { 
    flex: 1, 
    paddingVertical: 14, 
    alignItems: 'center', 
    backgroundColor: T.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: T.border,
  },
  cancelButtonText: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: T.t2 
  },
  saveButton: { 
    flex: 1, 
    borderRadius: 12, 
    overflow: 'hidden' 
  },
  saveButtonGradient: { 
    paddingVertical: 14, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  saveButtonText: { 
    color: T.white, 
    fontWeight: '700', 
    fontSize: 14 
  },
});