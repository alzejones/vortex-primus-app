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
  onManualEntry?: () => void;
  clientAge?: number;
  clientHeightCm?: number;
  clientIsMale?: boolean;
}

// Xiaomi Mi Body Composition Scale 2 BLE Configuration
const XIAOMI_SERVICE_UUID = '0000181b-0000-1000-8000-00805f9b34fb';
const XIAOMI_CHAR_UUID = '00002a9c-0000-1000-8000-00805f9b34fb';
const XIAOMI_BLE_NAME = 'MIBCS';

// Chipsea / OKOK Protocol
const CHIPSEA_SERVICE_UUID     = '0000fff0-0000-1000-8000-00805f9b34fb';
const CHIPSEA_CHAR_NOTIFY_UUID = '0000fff4-0000-1000-8000-00805f9b34fb';
const CHIPSEA_CHAR_WRITE_UUID  = '0000fff2-0000-1000-8000-00805f9b34fb';

// Fitdays Protocol
const FITDAYS_SERVICE_UUID     = '0000ffb0-0000-1000-8000-00805f9b34fb';
const FITDAYS_CHAR_NOTIFY_UUID = '0000ffb2-0000-1000-8000-00805f9b34fb';
const FITDAYS_CHAR_WRITE_UUID  = '0000ffb1-0000-1000-8000-00805f9b34fb';


export default function BluetoothScaleConnector({ onDataReceived, disabled = false, trainerId, onManualEntry, clientAge = 35, clientHeightCm = 170, clientIsMale = true }: Props) {
  const [trainerScales, setTrainerScales] = useState<any[]>([]);
  const [selectedScale, setSelectedScale] = useState<any | null>(null);
  const [loadingScales, setLoadingScales] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [device, setDevice] = useState<BluetoothDevice | null>(null);
  const [howToUseExpanded, setHowToUseExpanded] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    'idle' | 'scanning' | 'connecting' | 'waiting_data' | 'error_cancelled' |
    'error_incompatible' | 'error_no_data' | 'error_generic'
  >('idle');
  const impedanceRef = React.useRef<number>(0);

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

  const parseChipseaData = (buffer: ArrayBuffer): ScaleData | null => {
    try {
      const bytes = new Uint8Array(buffer);
      // Chipsea packet: byte[0]=header, byte[1]=cmd
      // Weight packet cmd=0x10: bytes[3..4] = weight * 10 (little-endian, unit: 0.1kg)
      // Body composition packet cmd=0x15: bytes contain impedance etc.
      if (bytes.length < 6) return null;
      const cmd = bytes[1];
      if (cmd !== 0x10 && cmd !== 0x15 && cmd !== 0x1F) return null;
      
      // Só processar peso quando estabilizado
      if (cmd === 0x10 && bytes[5] !== 0x01) return null;
      
      const rawWeight = (bytes[3] << 8 | bytes[4]);
      const weight = rawWeight / 10;
      if (weight <= 0 || weight > 300) return null;
      // Simplified body composition (same pattern as Xiaomi parser — sufficient for MVP)
      const impedance = bytes.length >= 8 ? (bytes[6] << 8 | bytes[7]) : 500;
      const bmi = weight / (1.75 * 1.75);
      const body_fat = Math.min(Math.max((impedance - 300) / 10, 5), 50);
      const muscle_mass = 100 - body_fat - 15;
      const water_percent = 50 + (impedance % 100) / 10;
      const bone_mass = weight * 0.05;
      const bmr = Math.round(weight * 22);
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
    } catch { return null; }
  };

  const parseFitdaysData = (
    buffer: ArrayBuffer,
    imp: number,
    // Dados do perfil do usuário — usar valores do selectedScale ou defaults
    age: number = 35,
    heightCm: number = 170,
    isMale: boolean = true
  ): ScaleData | null => {
    try {
      const bytes = new Uint8Array(buffer);
      if (bytes[0] !== 0xAC || bytes[1] !== 0x03) return null;
      if (bytes[2] >= 0xF0) return null;

      const rawWeight = (bytes[2] << 8) | bytes[3];
      const weight = rawWeight / 10;
      if (weight <= 10 || weight > 300) return null;

      const heightM = heightCm / 100;
      const bmi = Math.round((weight / (heightM * heightM)) * 10) / 10;

      // BIA com impedância real (quando disponível)
      let body_fat: number;
      let water_percent: number;

      if (imp > 0) {
        // Fórmula BIA padrão (Tanita/RJL)
        const lbm = isMale
          ? (0.407 * weight) + (0.267 * heightCm) - (0.101 * imp) - 3.747
          : (0.252 * weight) + (0.473 * heightCm) - (0.076 * imp) - 4.097;
        body_fat = Math.round(((weight - lbm) / weight) * 1000) / 10;
        body_fat = Math.min(Math.max(body_fat, 3), 60);
        water_percent = Math.round((lbm * 0.73 / weight) * 1000) / 10;
        water_percent = Math.min(Math.max(water_percent, 30), 80);
      } else {
        // Fallback sem impedância
        body_fat = Math.round((bmi * 1.2 - 5) * 10) / 10;
        water_percent = Math.round((60 - body_fat * 0.3) * 10) / 10;
      }

      const muscle_mass_percentage = Math.round((100 - body_fat - 5) * 10) / 10;
      const bone_mass = Math.round(weight * 0.044 * 10) / 10;
      const bmr = isMale
        ? Math.round(88.362 + (13.397 * weight) + (4.799 * heightCm) - (5.677 * age))
        : Math.round(447.593 + (9.247 * weight) + (3.098 * heightCm) - (4.330 * age));
      const metabolic_age = Math.min(Math.max(Math.round(age + (body_fat - 20) * 0.8), 18), 80);
      const visceral_fat = Math.min(Math.max(Math.round((body_fat * 0.5 - 3) * 10) / 10, 1), 25);

      return {
        weight,
        bmi,
        body_fat,
        muscle_mass_percentage,
        water_percent,
        bone_mass,
        basal_metabolic_rate: bmr,
        metabolic_age,
        body_fat_index: visceral_fat,
      };
    } catch { return null; }
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
      setConnectionStatus('scanning');
      setConnecting(true);
      impedanceRef.current = 0;

      // Determine protocol and configuration
      const protocol = selectedScale?.supported_scale?.protocol || 'xiaomi_v2';
      
      const protocolConfig: Record<string, { serviceUUID: string; charUUID: string; parser: (b: ArrayBuffer) => ScaleData | null }> = {
        xiaomi_v2:    { serviceUUID: XIAOMI_SERVICE_UUID,   charUUID: XIAOMI_CHAR_UUID,         parser: parseXiaomiData },
        chipsea_okok: { serviceUUID: CHIPSEA_SERVICE_UUID,  charUUID: CHIPSEA_CHAR_NOTIFY_UUID, parser: parseChipseaData },
        fitdays:      { serviceUUID: FITDAYS_SERVICE_UUID,  charUUID: FITDAYS_CHAR_NOTIFY_UUID, parser: parseXiaomiData }, // temp placeholder
      };

      const config = protocolConfig[protocol];
      if (!config) {
        throw new Error(`Protocolo não suportado: ${protocol}`);
      }

      // Request device with selected scale filters
      const bleName = selectedScale?.supported_scale?.ble_name;
      const manufacturerId: number | null =
        selectedScale?.supported_scale?.manufacturer_id ?? null;

      let requestOptions: RequestDeviceOptions;

      if (bleName) {
        // Balança anuncia nome BLE (ex: Xiaomi MIBCS)
        requestOptions = {
          filters: [{ name: bleName }, { namePrefix: bleName }],
          optionalServices: [XIAOMI_SERVICE_UUID, CHIPSEA_SERVICE_UUID, FITDAYS_SERVICE_UUID]
        };
      } else if (manufacturerId !== null) {
        // Balança não anuncia nome — filtra por manufacturer data
        // Funciona para qualquer balança com manufacturer_id cadastrado no banco
        requestOptions = {
          filters: [{
            manufacturerData: [{ companyIdentifier: manufacturerId }]
          }],
          optionalServices: [XIAOMI_SERVICE_UUID, CHIPSEA_SERVICE_UUID, FITDAYS_SERVICE_UUID]
        };
      } else {
        // Fallback: filtra por service UUID do protocolo
        requestOptions = {
          filters: [{ services: [config.serviceUUID] }],
          optionalServices: [XIAOMI_SERVICE_UUID, CHIPSEA_SERVICE_UUID, FITDAYS_SERVICE_UUID]
        };
      }

      const device = await navigator.bluetooth.requestDevice(requestOptions);

      setConnectionStatus('connecting');
      console.log('Device found:', device.name);

      const server = await device.gatt?.connect();
      if (!server) throw new Error('Failed to connect to GATT server');

      let service;
      try {
        service = await server.getPrimaryService(config.serviceUUID);
      } catch {
        // Serviço não encontrado — balança incompatível com o protocolo
        setConnectionStatus('error_incompatible');
        setConnecting(false);
        return;
      }

      const characteristic = await service.getCharacteristic(config.charUUID);
      await characteristic.startNotifications();

      // Chipsea/OKOK protocol requires handshake command after notifications
      if (protocol === 'chipsea_okok') {
        try {
          const writeChar = await service.getCharacteristic(CHIPSEA_CHAR_WRITE_UUID);
          // Comando de inicialização Chipsea: solicita medição completa
          const initCommand = new Uint8Array([0xFD, 0x27, 0x01]);
          await writeChar.writeValue(initCommand);
          console.log('Chipsea init command sent');
        } catch (e) {
          console.warn('Chipsea write characteristic failed:', e);
          // Não abortar — algumas versões de firmware não exigem o comando
        }
      }

      // Fitdays protocol requires handshake command after notifications
      if (protocol === 'fitdays') {
        try {
          const writeChar = await service.getCharacteristic(FITDAYS_CHAR_WRITE_UUID);
          // Comando de inicialização Fitdays
          const initCmd = new Uint8Array([0xFE, 0xFF, 0x00, 0x00, 0x00,
                                          0x00, 0x00, 0x00, 0x00, 0x00,
                                          0x00, 0x00, 0x00, 0x00, 0x00,
                                          0x00, 0x00, 0x00, 0x00, 0xFF]);
          await writeChar.writeValueWithoutResponse(initCmd);
          console.log('Fitdays init command sent');
        } catch(e) {
          console.warn('Fitdays write failed:', e);
        }
      }

      setConnectionStatus('waiting_data');

      // Timeout de 30s esperando dados
      const dataTimeout = setTimeout(() => {
        if (!connected) {
          setConnectionStatus('error_no_data');
          setConnecting(false);
          if (device?.gatt?.connected) device.gatt.disconnect();
        }
      }, 30000);

      characteristic.addEventListener('characteristicvaluechanged', (event) => {
        const value = (event.target as BluetoothRemoteGATTCharacteristic).value;
        if (!value) return;
        clearTimeout(dataTimeout);
        const bytes = new Uint8Array(value.buffer);
        
        // Detectar pacote de impedância Fitdays
        if (bytes[0] === 0xAC && bytes[1] === 0x03 && bytes[2] === 0xFD && bytes[3] === 0x01) {
          const imp = (bytes[4] << 8) | bytes[5];
          if (imp > 0) impedanceRef.current = imp;
          return; // não passar para o parser ainda
        }
        
        const scaleData = protocol === 'fitdays'
          ? parseFitdaysData(value.buffer, impedanceRef.current, clientAge, clientHeightCm, clientIsMale)
          : config.parser(value.buffer);
        if (scaleData) {
          onDataReceived(scaleData);
          setConnected(true);
          setConnectionStatus('idle');
          Alert.alert(
            'Dados recebidos!',
            `Peso: ${scaleData.weight}kg\nIMC: ${scaleData.bmi}\n% Gordura: ${scaleData.body_fat}%`,
            [{ text: 'OK', onPress: () => disconnectFromScale() }]
          );
        }
      });

      device.addEventListener('gattserverdisconnected', () => {
        setConnected(false);
        setDevice(null);
        setConnectionStatus('idle');
      });

      setDevice(device);
      setConnected(true);

    } catch (error: any) {
      console.error('Bluetooth connection error:', error);
      if (
        error.name === 'NotFoundError' ||
        error.name === 'AbortError' ||
        error.message?.includes('cancelled') ||
        error.message?.includes('chosen')
      ) {
        setConnectionStatus('error_cancelled');
      } else if (error.name === 'SecurityError') {
        Alert.alert('Erro', 'Acesso Bluetooth negado. Use HTTPS.');
        setConnectionStatus('idle');
      } else {
        setConnectionStatus('error_generic');
      }
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

      {/* STATUS DE CONEXÃO */}
      {connectionStatus === 'scanning' && (
        <View style={styles.statusCard}>
          <ActivityIndicator size="small" color={T.blue} />
          <Text style={styles.statusText}>Procurando sua balança...</Text>
        </View>
      )}

      {connectionStatus === 'connecting' && (
        <View style={styles.statusCard}>
          <ActivityIndicator size="small" color={T.blue} />
          <Text style={styles.statusText}>Conectando...</Text>
        </View>
      )}

      {connectionStatus === 'waiting_data' && (
        <View style={styles.statusCard}>
          <ActivityIndicator size="small" color={T.green} />
          <Text style={styles.statusText}>Conectado! Suba na balança agora.</Text>
        </View>
      )}


      {connectionStatus === 'error_cancelled' && (
        <View style={styles.statusCardWarning}>
          <Text style={styles.statusTitle}>Nenhuma balança selecionada</Text>
          <Text style={styles.statusText}>
            Sua balança não apareceu na lista? Ela pode não ser compatível com
            a conexão automática.
          </Text>
          {onManualEntry && (
            <TouchableOpacity
              style={styles.manualButton}
              onPress={() => { setConnectionStatus('idle'); onManualEntry(); }}
            >
              <Text style={styles.manualButtonText}>Inserir dados manualmente</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {connectionStatus === 'error_incompatible' && (
        <View style={styles.statusCardError}>
          <Text style={styles.statusTitle}>⚠️ Balança não compatível</Text>
          <Text style={styles.statusText}>
            Infelizmente sua balança não é compatível com a conexão automática
            do Vortex. Você pode inserir manualmente os dados fornecidos pelo
            aplicativo de fábrica da sua balança.
          </Text>
          {onManualEntry && (
            <TouchableOpacity
              style={styles.manualButton}
              onPress={() => { setConnectionStatus('idle'); onManualEntry(); }}
            >
              <Text style={styles.manualButtonText}>Inserir dados manualmente</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {connectionStatus === 'error_no_data' && (
        <View style={styles.statusCardError}>
          <Text style={styles.statusTitle}>⚠️ Sem resposta da balança</Text>
          <Text style={styles.statusText}>
            A balança conectou mas não enviou dados. Certifique-se de subir
            na balança logo após conectar. Tente novamente ou insira manualmente.
          </Text>
          {onManualEntry && (
            <TouchableOpacity
              style={styles.manualButton}
              onPress={() => { setConnectionStatus('idle'); onManualEntry(); }}
            >
              <Text style={styles.manualButtonText}>Inserir dados manualmente</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {connectionStatus === 'error_generic' && (
        <View style={styles.statusCardError}>
          <Text style={styles.statusTitle}>Erro de conexão</Text>
          <Text style={styles.statusText}>
            Não foi possível conectar. Verifique se a balança está ligada
            e próxima, e tente novamente.
          </Text>
          <TouchableOpacity
            style={styles.manualButton}
            onPress={() => setConnectionStatus('idle')}
          >
            <Text style={styles.manualButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
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

  // STATUS CARDS
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.surfaceAlt,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    gap: 10,
  },
  statusCardWarning: {
    backgroundColor: 'rgba(245,158,11,0.1)',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  statusCardError: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: T.t1,
    marginBottom: 6,
  },
  statusText: {
    fontSize: 13,
    color: T.t2,
    lineHeight: 19,
  },
  manualButton: {
    marginTop: 12,
    backgroundColor: T.blue,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  manualButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: T.white,
  },
});