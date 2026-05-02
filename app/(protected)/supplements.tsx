// ============================================================
// supplements.tsx — Tela CRUD de Suplementos do Vortex Primus
// ============================================================
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { T } from '../../utils/theme';

interface Supplement {
  id: string;
  brand: string;
  sku: string | null;
  name: string;
  serving_size_g: number;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  fiber_g: number | null;
  notes: string | null;
  created_at: string;
}

interface FormData {
  brand: string;
  sku: string;
  name: string;
  serving_size_g: string;
  calories: string;
  protein_g: string;
  carbs_g: string;
  fat_g: string;
  fiber_g: string;
  notes: string;
}

const initialFormData: FormData = {
  brand: 'Herbalife',
  sku: '',
  name: '',
  serving_size_g: '',
  calories: '',
  protein_g: '',
  carbs_g: '',
  fat_g: '',
  fiber_g: '',
  notes: '',
};

export default function SupplementsScreen() {
  const insets = useSafeAreaInsets();
  const [supplements, setSupplements] = useState<Supplement[]>([]);
  const [filteredSupplements, setFilteredSupplements] = useState<Supplement[]>([]);
  const [searchText, setSearchText] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [loading, setLoading] = useState(false);

  // Carrega suplementos
  const loadSupplements = async () => {
    try {
      const { data, error } = await supabase
        .from('supplements')
        .select('*')
        .order('brand', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      
      setSupplements(data || []);
      setFilteredSupplements(data || []);
    } catch (error) {
      console.error('Erro ao carregar suplementos:', error);
      Alert.alert('Erro', 'Não foi possível carregar os suplementos');
    }
  };

  useEffect(() => {
    loadSupplements();
  }, []);

  // Filtra suplementos por busca
  useEffect(() => {
    if (!searchText.trim()) {
      setFilteredSupplements(supplements);
      return;
    }

    const filtered = supplements.filter(item =>
      item.name.toLowerCase().includes(searchText.toLowerCase()) ||
      item.brand.toLowerCase().includes(searchText.toLowerCase()) ||
      (item.sku && item.sku.toLowerCase().includes(searchText.toLowerCase()))
    );
    setFilteredSupplements(filtered);
  }, [searchText, supplements]);

  // Abre modal para adicionar
  const handleAdd = () => {
    setEditingId(null);
    setFormData(initialFormData);
    setModalVisible(true);
  };

  // Abre modal para editar
  const handleEdit = (supplement: Supplement) => {
    setEditingId(supplement.id);
    setFormData({
      brand: supplement.brand || 'Herbalife',
      sku: supplement.sku || '',
      name: supplement.name || '',
      serving_size_g: supplement.serving_size_g?.toString() || '',
      calories: supplement.calories?.toString() || '',
      protein_g: supplement.protein_g?.toString() || '',
      carbs_g: supplement.carbs_g?.toString() || '',
      fat_g: supplement.fat_g?.toString() || '',
      fiber_g: supplement.fiber_g?.toString() || '',
      notes: supplement.notes || '',
    });
    setModalVisible(true);
  };

  // Salva suplemento
  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Erro', 'Nome é obrigatório');
      return;
    }

    if (!formData.serving_size_g.trim()) {
      Alert.alert('Erro', 'Porção é obrigatória');
      return;
    }

    setLoading(true);

    try {
      const supplementData = {
        brand: formData.brand.trim(),
        sku: formData.sku.trim() || null,
        name: formData.name.trim(),
        serving_size_g: parseFloat(formData.serving_size_g) || 0,
        calories: formData.calories ? parseFloat(formData.calories) : null,
        protein_g: formData.protein_g ? parseFloat(formData.protein_g) : null,
        carbs_g: formData.carbs_g ? parseFloat(formData.carbs_g) : null,
        fat_g: formData.fat_g ? parseFloat(formData.fat_g) : null,
        fiber_g: formData.fiber_g ? parseFloat(formData.fiber_g) : null,
        notes: formData.notes.trim() || null,
      };

      let error;
      
      if (editingId) {
        // Atualizar
        ({ error } = await supabase
          .from('supplements')
          .update(supplementData)
          .eq('id', editingId));
      } else {
        // Criar
        ({ error } = await supabase
          .from('supplements')
          .insert([supplementData]));
      }

      if (error) throw error;

      setModalVisible(false);
      setFormData(initialFormData);
      setEditingId(null);
      loadSupplements();
      
    } catch (error) {
      console.error('Erro ao salvar suplemento:', error);
      Alert.alert('Erro', 'Não foi possível salvar o suplemento');
    } finally {
      setLoading(false);
    }
  };

  // Confirma exclusão
  const handleDeleteConfirm = (supplement: Supplement) => {
    Alert.alert(
      'Confirmar exclusão',
      `Deseja excluir "${supplement.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: () => handleDelete(supplement.id) },
      ]
    );
  };

  // Exclui suplemento
  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('supplements')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      loadSupplements();
    } catch (error) {
      console.error('Erro ao excluir suplemento:', error);
      Alert.alert('Erro', 'Não foi possível excluir o suplemento');
    }
  };

  // Renderiza pill de macro
  const renderMacroPill = (label: string, value: number | null, unit: string = 'g') => {
    if (value === null || value === undefined) return null;
    
    return (
      <View style={styles.pill}>
        <Text style={styles.pillText}>{label} {value.toFixed(1)}{unit}</Text>
      </View>
    );
  };

  // Renderiza item da lista
  const renderSupplementItem = ({ item }: { item: Supplement }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.brandText}>{item.brand}</Text>
        {item.sku && (
          <View style={styles.skuBadge}>
            <Text style={styles.skuText}>{item.sku}</Text>
          </View>
        )}
      </View>

      <Text style={styles.nameText}>{item.name}</Text>

      <View style={styles.macrosContainer}>
        {renderMacroPill('Kcal', item.calories, '')}
        {renderMacroPill('Prot', item.protein_g)}
        {renderMacroPill('Carb', item.carbs_g)}
        {renderMacroPill('Gord', item.fat_g)}
        {renderMacroPill('Fibra', item.fiber_g)}
        {renderMacroPill('Porção', item.serving_size_g)}
      </View>

      {item.notes && (
        <Text style={styles.notesText}>{item.notes}</Text>
      )}

      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleEdit(item)}
        >
          <Text style={styles.actionIcon}>✏️</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleDeleteConfirm(item)}
        >
          <Text style={styles.actionIcon}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Suplementos</Text>
          <Text style={styles.counter}>({filteredSupplements.length})</Text>
        </View>
        
        <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
          <Text style={styles.addButtonText}>+ Novo</Text>
        </TouchableOpacity>
      </View>

      {/* Busca */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nome, marca ou SKU..."
          value={searchText}
          onChangeText={setSearchText}
          placeholderTextColor={T.t3}
        />
      </View>

      {/* Lista */}
      <FlatList
        data={filteredSupplements}
        renderItem={renderSupplementItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      {/* Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
            
            <Text style={styles.modalTitle}>
              {editingId ? 'Editar Suplemento' : 'Novo Suplemento'}
            </Text>
            
            <TouchableOpacity onPress={handleSave} disabled={loading}>
              <Text style={[styles.saveText, loading && styles.saveTextDisabled]}>
                {loading ? 'Salvando...' : 'Salvar'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Marca e SKU */}
            <View style={styles.formRow}>
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Marca</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={formData.brand}
                  onChangeText={(text) => setFormData({...formData, brand: text})}
                  placeholder="Ex: Herbalife"
                />
              </View>
              
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>SKU</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={formData.sku}
                  onChangeText={(text) => setFormData({...formData, sku: text})}
                  placeholder="Ex: H024"
                />
              </View>
            </View>

            {/* Nome */}
            <View style={styles.formFieldFull}>
              <Text style={styles.fieldLabel}>Nome *</Text>
              <TextInput
                style={styles.fieldInput}
                value={formData.name}
                onChangeText={(text) => setFormData({...formData, name: text})}
                placeholder="Nome do suplemento"
              />
            </View>

            {/* Porção e Calorias */}
            <View style={styles.formRow}>
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Porção (g) *</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={formData.serving_size_g}
                  onChangeText={(text) => setFormData({...formData, serving_size_g: text})}
                  placeholder="25"
                  keyboardType="numeric"
                />
              </View>
              
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Calorias</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={formData.calories}
                  onChangeText={(text) => setFormData({...formData, calories: text})}
                  placeholder="90"
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Proteína e Carboidratos */}
            <View style={styles.formRow}>
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Proteína (g)</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={formData.protein_g}
                  onChangeText={(text) => setFormData({...formData, protein_g: text})}
                  placeholder="9"
                  keyboardType="numeric"
                />
              </View>
              
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Carboidratos (g)</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={formData.carbs_g}
                  onChangeText={(text) => setFormData({...formData, carbs_g: text})}
                  placeholder="3"
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Gordura e Fibra */}
            <View style={styles.formRow}>
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Gordura (g)</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={formData.fat_g}
                  onChangeText={(text) => setFormData({...formData, fat_g: text})}
                  placeholder="1"
                  keyboardType="numeric"
                />
              </View>
              
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Fibra (g)</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={formData.fiber_g}
                  onChangeText={(text) => setFormData({...formData, fiber_g: text})}
                  placeholder="0"
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Notas */}
            <View style={styles.formFieldFull}>
              <Text style={styles.fieldLabel}>Observações</Text>
              <TextInput
                style={[styles.fieldInput, styles.notesInput]}
                value={formData.notes}
                onChangeText={(text) => setFormData({...formData, notes: text})}
                placeholder="Observações adicionais..."
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.bg,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: T.surface,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: T.t1,
  },
  counter: {
    fontSize: 16,
    color: T.t3,
    marginLeft: 8,
  },
  addButton: {
    backgroundColor: T.blue,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addButtonText: {
    color: T.white,
    fontWeight: '600',
    fontSize: 14,
  },

  // Busca
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: T.surface,
  },
  searchInput: {
    backgroundColor: T.bg,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: T.t1,
    borderWidth: 1,
    borderColor: T.border,
  },

  // Lista
  listContainer: {
    padding: 16,
  },

  // Card
  card: {
    backgroundColor: T.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: T.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  brandText: {
    fontSize: 14,
    fontWeight: '600',
    color: T.blue,
  },
  skuBadge: {
    backgroundColor: T.bgAlt,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  skuText: {
    fontSize: 12,
    fontWeight: '600',
    color: T.t2,
  },
  nameText: {
    fontSize: 16,
    fontWeight: '600',
    color: T.t1,
    marginBottom: 12,
  },
  macrosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  pill: {
    backgroundColor: T.bgAlt,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: T.t2,
  },
  notesText: {
    fontSize: 14,
    color: T.t3,
    fontStyle: 'italic',
    marginTop: 8,
    marginBottom: 8,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  actionButton: {
    marginLeft: 12,
  },
  actionIcon: {
    fontSize: 18,
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: T.bg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: T.surface,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  cancelText: {
    color: T.red,
    fontSize: 16,
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: T.t1,
  },
  saveText: {
    color: T.blue,
    fontSize: 16,
    fontWeight: '600',
  },
  saveTextDisabled: {
    color: T.t3,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },

  // Formulário
  formRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  formField: {
    flex: 1,
    marginRight: 8,
  },
  formFieldFull: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: T.t2,
    marginBottom: 6,
  },
  fieldInput: {
    backgroundColor: T.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: T.t1,
    borderWidth: 1,
    borderColor: T.border,
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
});