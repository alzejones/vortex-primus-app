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
  const [howToUseExpanded, setHowToUseExpanded] = useState(false);

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
      const bleName = selectedScale?.supported_scale?.ble_name;
      const requestOptions = bleName
        ? {
            filters: [{ name: bleName }, { namePrefix: bleName }],
            optionalServices: [XIAOMI_SERVICE_UUID]
          }
        : {
            acceptAllDevices: true,
            optionalServices: [XIAOMI_SERVICE_UUID]
          };

      const device = await navigator.bluetooth.requestDevice(requestOptions);

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
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>⚖️ Balança Bluetooth</Text>
        <View style={styles.bleBadge}>
          <Text style={styles.bleBadgeText}>BLE</Text>
        </View>
        <Text style={styles.subtitle}>
          {selectedScale?.supported_scale?.model || "Nenhuma balança selecionada"}
        </Text>
      </View>

      {/* SELEÇÃO DE BALANÇAS */}
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
          {trainerScales.map((scale) => {
            const isSelected = selectedScale?.id === scale.id;
            return (
              <TouchableOpacity
                key={scale.id}
                style={[
                  styles.scaleCard,
                  isSelected && styles.scaleCardSelected
                ]}
                onPress={() => setSelectedScale(scale)}
                activeOpacity={0.7}
              >
                <View style={styles.scaleIconContainer}>
                  <Text style={styles.scaleIcon}>⚖️</Text>
                </View>
                <View style={styles.scaleInfo}>
                  <Text style={styles.scaleName}>
                    {scale.nickname || scale.supported_scale?.model}
                  </Text>
                  <Text style={styles.scaleBrand}>
                    {scale.supported_scale?.brand}
                  </Text>
                  <View style={styles.protocolBadge}>
                    <Text style={styles.protocolBadgeText}>
                      {scale.supported_scale?.protocol || "Protocolo"}
                    </Text>
                  </View>
                </View>
                {isSelected && (
                  <View style={styles.selectedIndicator}>
                    <Text style={styles.selectedIcon}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      ) : null}

      {/* CONEXÃO */}
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
          disabled={connecting || disabled || !selectedScale}
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

      {/* COMO USAR - COLAPSÁVEL */}
      <TouchableOpacity 
        style={styles.howToUseHeader}
        onPress={() => setHowToUseExpanded(!howToUseExpanded)}
        activeOpacity={0.7}
      >
        <Text style={styles.howToUseTitle}>ℹ️ Como usar</Text>
        <Text style={styles.howToUseChevron}>
          {howToUseExpanded ? '▲' : '▼'}
        </Text>
      </TouchableOpacity>

      {howToUseExpanded && (
        <View style={styles.howToUseContent}>
          <Text style={styles.howToUseText}>
            {'1. Ligue sua balança\n' +
            '2. Clique em "Conectar Balança"\n' +
            '3. Selecione sua balança na lista\n' +
            '4. Suba na balança para medir\n' +
            '5. Os dados preencherão automaticamente'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  
  // HEADER
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: T.t1,
    marginBottom: 8,
  },
  bleBadge: {
    backgroundColor: T.blueGlow,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 6,
  },
  bleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: T.blue,
  },
  subtitle: {
    fontSize: 14,
    color: T.t3,
    lineHeight: 20,
  },

  // LOADING
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

  // NO SCALES
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

  // SCALES SELECTION
  scalesSection: {
    marginBottom: 16,
    gap: 10,
  },
  scaleCard: {
    backgroundColor: T.card,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: T.border,
  },
  scaleCardSelected: {
    borderColor: T.blue,
    backgroundColor: `${T.blue}14`, // rgba with 0.08 opacity
  },
  scaleIconContainer: {
    width: 44,
    height: 44,
    backgroundColor: T.surfaceAlt,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scaleIcon: {
    fontSize: 22,
  },
  scaleInfo: {
    flex: 1,
    marginLeft: 12,
  },
  scaleName: {
    fontWeight: '700',
    fontSize: 15,
    color: T.t1,
  },
  scaleBrand: {
    fontSize: 12,
    color: T.t3,
    marginTop: 2,
  },
  protocolBadge: {
    alignSelf: 'flex-start',
    backgroundColor: T.bgAlt,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    marginTop: 6,
  },
  protocolBadgeText: {
    fontSize: 10,
    color: T.t2,
  },
  selectedIndicator: {
    width: 22,
    height: 22,
    backgroundColor: T.blue,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedIcon: {
    fontSize: 12,
    color: T.white,
  },

  // CONNECT BUTTON
  connectButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    marginTop: 4,
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
    fontSize: 17,
    fontWeight: '800',
  },

  // CONNECTED STATE
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

  // HOW TO USE - COLLAPSIBLE
  howToUseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: T.surfaceAlt,
    borderRadius: 10,
    padding: 12,
  },
  howToUseTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: T.t2,
  },
  howToUseChevron: {
    fontSize: 12,
    color: T.t3,
  },
  howToUseContent: {
    backgroundColor: T.surfaceAlt,
    borderRadius: 10,
    padding: 12,
    marginTop: 2,
  },
  howToUseText: {
    fontSize: 13,
    color: T.t3,
    lineHeight: 22,
  },

  // WARNING CARD
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
});