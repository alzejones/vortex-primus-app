// ============================================================
// BluetoothScaleConnector.tsx — Integração Web Bluetooth API
// Conecta e lê dados da Xiaomi Mi Body Composition Scale 2
// ============================================================
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { T } from '../utils/theme';
import { GradientPrimary } from '../utils/gradients';
import { supabase } from '../lib/supabase';

interface ScaleData {
  weight: number;
  bmi: number;
  body_fat: number;
  muscle_mass_percentage: number;
  water_percent: number;
  bone_mass: number;
  basal_metabolic_rate: number;
  metabolic_age: number;
  body_fat_index: number; // visceral fat
}

interface Props {
  onDataReceived: (data: ScaleData) => void;
  disabled?: boolean;
  trainerId?: string | null;
}

// Xiaomi Mi Body Composition Scale 2 BLE Configuration
const XIAOMI_SERVICE_UUID = '0000181b-0000-1000-8000-00805f9b34fb';
const XIAOMI_CHAR_UUID = '00002a9c-0000-1000-8000-00805f9b34fb';
const XIAOMI_BLE_NAME = 'MIBCS';

export default function BluetoothScaleConnector({ onDataReceived, disabled = false, trainerId }: Props) {
  const [trainerScales, setTrainerScales] = useState<any[]>([]);
  const [selectedScale, setSelectedScale] = useState<any | null>(null);
  const [loadingScales, setLoadingScales] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [device, setDevice] = useState<BluetoothDevice | null>(null);

  useEffect(() => {
    if (!trainerId) return;
    async function fetchScales() {
      setLoadingScales(true);
      const { data } = await supabase
        .from('trainer_scales')
        .select('*, supported_scale:supported_scales(*)')
        .eq('trainer_id', trainerId)
        .eq('is_active', true);
      if (data && data.length > 0) {
        setTrainerScales(data);
        setSelectedScale(data[0]);
      }
      setLoadingScales(false);
    }
    fetchScales();
  }, [trainerId]);

  // Check if Web Bluetooth is supported
  const isBluetoothSupported = () => {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  };

  // Parse Xiaomi scale data from BLE characteristics
  const parseXiaomiData = (buffer: ArrayBuffer): ScaleData | null => {
    try {
      const view = new DataView(buffer);
      
      // Xiaomi Mi Body Composition Scale 2 data format
      // This is a simplified parser - real implementation would need reverse engineering
      const weight = view.getUint16(1, true) / 100; // Weight in kg
      const impedance = view.getUint16(9, true); // Body impedance
      
      // Basic calculations based on weight and impedance
      // Note: Real Xiaomi algorithm is proprietary and complex
      const bmi = weight / (1.75 * 1.75); // Assuming 1.75m height for demo
      const body_fat = Math.min(Math.max((impedance - 300) / 10, 5), 50);
      const muscle_mass = 100 - body_fat - 15; // Simplified
      const water_percent = 50 + (impedance % 100) / 10;
      const bone_mass = weight * 0.05; // ~5% of body weight
      const bmr = Math.round(weight * 22); // Basic BMR calculation
      const metabolic_age = Math.min(Math.max(25 + (body_fat - 15) * 2, 18), 80);
      const visceral_fat = Math.min(Math.max((body_fat - 10) / 2, 1), 20);

      return {
        weight,
        bmi: Math.round(bmi * 10) / 10,
        body_fat: Math.round(body_fat * 10) / 10,
        muscle_mass_percentage: Math.round(muscle_mass * 10) / 10,
        water_percent: Math.round(water_percent * 10) / 10,
        bone_mass: Math.round(bone_mass * 10) / 10,
        basal_metabolic_rate: bmr,
        metabolic_age: Math.round(metabolic_age),
        body_fat_index: Math.round(visceral_fat * 10) / 10,
      };
    } catch (error) {
      console.error('Error parsing Xiaomi data:', error);
      return null;
    }
  };

  const connectToScale = async () => {
    if (!isBluetoothSupported()) {
      Alert.alert(
        'Bluetooth não suportado',
        'Para conectar balanças Bluetooth, use o Chrome no Android ou Chrome/Edge no computador.'
      );
      return;
    }

    try {
      setConnecting(true);

      // Request device with selected scale filters
      const bleName = selectedScale?.supported_scale?.ble_name || 'MIBCS';
      const filters: BluetoothRequestDeviceFilter[] = bleName
        ? [{ name: bleName }, { namePrefix: bleName }]
        : [{ services: [XIAOMI_SERVICE_UUID] }];

      const device = await navigator.bluetooth.requestDevice({
        filters,
        optionalServices: [XIAOMI_SERVICE_UUID]
      });

      console.log('Device found:', device.name);
      
      // Connect to GATT server
      const server = await device.gatt?.connect();
      if (!server) {
        throw new Error('Failed to connect to GATT server');
      }

      console.log('Connected to GATT server');

      // Get service
      const service = await server.getPrimaryService(XIAOMI_SERVICE_UUID);
      console.log('Service found');

      // Get characteristic
      const characteristic = await service.getCharacteristic(XIAOMI_CHAR_UUID);
      console.log('Characteristic found');

      // Start notifications
      await characteristic.startNotifications();
      console.log('Notifications started');

      // Listen for data
      characteristic.addEventListener('characteristicvaluechanged', (event) => {
        const value = (event.target as BluetoothRemoteGATTCharacteristic).value;
        if (!value) return;

        console.log('Received data:', new Uint8Array(value.buffer));
        
        const scaleData = parseXiaomiData(value.buffer);
        if (scaleData) {
          console.log('Parsed scale data:', scaleData);
          onDataReceived(scaleData);
          setConnected(true);
          
          Alert.alert(
            'Dados recebidos!',
            `Peso: ${scaleData.weight}kg\nIMC: ${scaleData.bmi}\n% Gordura: ${scaleData.body_fat}%`,
            [{ text: 'OK', onPress: () => disconnectFromScale() }]
          );
        }
      });

      // Handle disconnection
      device.addEventListener('gattserverdisconnected', () => {
        console.log('Device disconnected');
        setConnected(false);
        setDevice(null);
      });

      setDevice(device);
      setConnected(true);
      
      Alert.alert(
        'Conectado!', 
        'Suba na balança para obter as medidas automaticamente.'
      );

    } catch (error: any) {
      console.error('Bluetooth connection error:', error);
      let errorMessage = 'Erro ao conectar com a balança.';
      
      if (error.name === 'NotFoundError') {
        errorMessage = 'Balança não encontrada. Verifique se está ligada e próxima.';
      } else if (error.name === 'SecurityError') {
        errorMessage = 'Acesso Bluetooth negado. Use HTTPS para acessar.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'Bluetooth não suportado neste dispositivo.';
      }
      
      Alert.alert('Erro de Conexão', errorMessage);
    } finally {
      setConnecting(false);
    }
  };

  const disconnectFromScale = () => {
    if (device?.gatt?.connected) {
      device.gatt.disconnect();
    }
    setConnected(false);
    setDevice(null);
  };

  if (!isBluetoothSupported()) {
    return (
      <View style={styles.container}>
        <View style={styles.warningCard}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <Text style={styles.warningTitle}>Bluetooth indisponível</Text>
          <Text style={styles.warningText}>
            Para conectar balanças Bluetooth, use o Chrome no Android ou Chrome/Edge no computador. No Safari e Firefox esta função não está disponível.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>⚖️ Balança Bluetooth</Text>
        <Text style={styles.subtitle}>
          {selectedScale?.supported_scale?.model || "Nenhuma balança selecionada"}
        </Text>
      </View>

      {/* Seleção de Balanças */}
      {loadingScales ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={T.blue} />
          <Text style={styles.loadingText}>Carregando balanças...</Text>
        </View>
      ) : trainerScales.length === 0 && trainerId ? (
        <View style={styles.noScalesContainer}>
          <Text style={styles.noScalesText}>
            Nenhuma balança cadastrada. Adicione uma em Config → Minhas Balanças.
          </Text>
        </View>
      ) : trainerScales.length > 0 ? (
        <View style={styles.scalesSection}>
          <Text style={styles.scalesSectionTitle}>Suas balanças:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scalesScroll}>
            {trainerScales.map((scale) => (
              <TouchableOpacity
                key={scale.id}
                style={[
                  styles.scaleItem,
                  selectedScale?.id === scale.id && styles.scaleItemSelected
                ]}
                onPress={() => setSelectedScale(scale)}
              >
                <Text style={[
                  styles.scaleItemName,
                  selectedScale?.id === scale.id && styles.scaleItemNameSelected
                ]}>
                  {scale.nickname || scale.supported_scale?.model}
                </Text>
                <Text style={[
                  styles.scaleItemBrand,
                  selectedScale?.id === scale.id && styles.scaleItemBrandSelected
                ]}>
                  {scale.supported_scale?.brand}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {connected ? (
        <View style={styles.connectedCard}>
          <Text style={styles.connectedIcon}>✅</Text>
          <Text style={styles.connectedTitle}>Balança conectada</Text>
          <Text style={styles.connectedText}>Suba na balança para obter as medidas</Text>
          
          <TouchableOpacity 
            style={styles.disconnectButton}
            onPress={disconnectFromScale}
          >
            <Text style={styles.disconnectButtonText}>Desconectar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity 
          style={styles.connectButton}
          onPress={connectToScale}
          disabled={connecting || disabled}
          activeOpacity={0.8}
        >
          <LinearGradient {...GradientPrimary} style={styles.connectButtonGradient}>
            {connecting ? (
              <>
                <ActivityIndicator color={T.white} size="small" />
                <Text style={styles.connectButtonText}>Conectando...</Text>
              </>
            ) : (
              <>
                <Text style={styles.connectButtonIcon}>🔗</Text>
                <Text style={styles.connectButtonText}>Conectar Balança</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      )}

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>💡 Como usar:</Text>
        <Text style={styles.infoText}>
          1. Ligue sua balança Xiaomi{'\n'}
          2. Clique em "Conectar Balança"{'\n'}
          3. Selecione "MIBCS" na lista{'\n'}
          4. Suba na balança para medir{'\n'}
          5. Os dados preencherão automaticamente
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: T.t1,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: T.t3,
    lineHeight: 20,
  },

  connectButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  connectButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  connectButtonIcon: {
    fontSize: 20,
  },
  connectButtonText: {
    color: T.white,
    fontSize: 16,
    fontWeight: '700',
  },

  connectedCard: {
    backgroundColor: 'rgba(16,185,129,0.1)',
    borderWidth: 1,
    borderColor: T.green,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  connectedIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  connectedTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: T.green,
    marginBottom: 4,
  },
  connectedText: {
    fontSize: 14,
    color: T.t2,
    textAlign: 'center',
    marginBottom: 12,
  },

  disconnectButton: {
    backgroundColor: T.surface,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  disconnectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: T.t2,
  },

  warningCard: {
    backgroundColor: 'rgba(245,158,11,0.1)',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  warningIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F59E0B',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 14,
    color: T.t2,
    textAlign: 'center',
    lineHeight: 20,
  },

  infoCard: {
    backgroundColor: T.surfaceAlt,
    borderRadius: 12,
    padding: 16,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: T.t2,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: T.t3,
    lineHeight: 18,
  },

  // Loading section
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 14,
    color: T.t3,
    marginLeft: 8,
  },

  // No scales section
  noScalesContainer: {
    backgroundColor: T.surfaceAlt,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  noScalesText: {
    fontSize: 13,
    color: T.t3,
    textAlign: 'center',
    lineHeight: 18,
  },

  // Scales selection
  scalesSection: {
    marginBottom: 16,
  },
  scalesSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: T.t2,
    marginBottom: 8,
  },
  scalesScroll: {
    marginHorizontal: -4,
  },
  scaleItem: {
    backgroundColor: T.surface,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 4,
    minWidth: 120,
  },
  scaleItemSelected: {
    borderColor: T.blue,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  scaleItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: T.t1,
    marginBottom: 2,
  },
  scaleItemNameSelected: {
    color: T.blue,
  },
  scaleItemBrand: {
    fontSize: 12,
    color: T.t3,
  },
  scaleItemBrandSelected: {
    color: T.blue,
  },
});