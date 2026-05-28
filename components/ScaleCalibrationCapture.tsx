import { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView,
         ActivityIndicator, Alert, Linking } from 'react-native';
import { T } from '../utils/theme';

const ALL_SERVICE_UUIDS = [
  '0000181b-0000-1000-8000-00805f9b34fb',
  '0000fff0-0000-1000-8000-00805f9b34fb',
  '0000ffb0-0000-1000-8000-00805f9b34fb',
];

export default function ScaleCalibrationCapture() {
  const [brand, setBrand]           = useState('');
  const [model, setModel]           = useState('');
  const [capturing, setCapturing]   = useState(false);
  const [connected, setConnected]   = useState(false);
  const [packets, setPackets]       = useState<string[]>([]);
  const [deviceName, setDeviceName] = useState('');
  const [services, setServices]     = useState<string>('');
  const [status, setStatus]         = useState<
    'idle'|'scanning'|'connecting'|'waiting'|'captured'|'error'
  >('idle');

  const isBluetoothSupported = () =>
    typeof navigator !== 'undefined' && 'bluetooth' in navigator;

  const startCapture = async () => {
    if (!brand.trim() || !model.trim()) {
      Alert.alert('Atenção', 'Informe a marca e o modelo da balança antes de capturar.');
      return;
    }
    if (!isBluetoothSupported()) {
      Alert.alert('Bluetooth indisponível',
        'Use o Chrome no Android ou Chrome/Edge no computador.');
      return;
    }

    try {
      setCapturing(true);
      setPackets([]);
      setServices('');
      setStatus('scanning');

      const device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ALL_SERVICE_UUIDS,
      });

      setDeviceName(device.name || 'N/A');
      setStatus('connecting');

      const server = await device.gatt?.connect();
      if (!server) throw new Error('GATT connect failed');

      // Listar todos os serviços disponíveis
      try {
        const svcs = await server.getPrimaryServices();
        const svcLines: string[] = [];
        for (const svc of svcs) {
          try {
            const chars = await svc.getCharacteristics();
            const charLine = chars.map((c: any) =>
              `  ${c.uuid} [${[
                c.properties.notify ? 'notify' : '',
                c.properties.write  ? 'write'  : '',
                c.properties.read   ? 'read'   : '',
              ].filter(Boolean).join('/')}]`
            ).join('\n');
            svcLines.push(`SERVICE: ${svc.uuid}\n${charLine}`);
          } catch { svcLines.push(`SERVICE: ${svc.uuid} (chars indisponíveis)`); }
        }
        setServices(svcLines.join('\n\n'));
      } catch (e) {
        setServices('Não foi possível listar serviços.');
      }

      setStatus('waiting');

      // Tentar assinar notificações em todas as characteristics conhecidas
      const notifyUUIDs = [
        '0000fff4-0000-1000-8000-00805f9b34fb',
        '0000ffb2-0000-1000-8000-00805f9b34fb',
        '0000ffb3-0000-1000-8000-00805f9b34fb',
        '00002a9d-0000-1000-8000-00805f9b34fb',
      ];

      let subscribed = false;
      for (const svc of await server.getPrimaryServices().catch(() => [])) {
        for (const charUUID of notifyUUIDs) {
          try {
            const char = await svc.getCharacteristic(charUUID);
            await char.startNotifications();
            char.addEventListener('characteristicvaluechanged', (e: any) => {
              const val = (e.target as any).value;
              if (!val) return;
              const bytes = new Uint8Array(val.buffer);
              const hex = Array.from(bytes)
                .map(b => '0x' + b.toString(16).padStart(2,'0').toUpperCase())
                .join(' ');
              setPackets(prev => {
                if (prev[prev.length - 1] === hex) return prev; // deduplicar consecutivos
                const next = [...prev, hex];
                return next.slice(-50); // manter últimos 50
              });
              setStatus('captured');
            });
            subscribed = true;
          } catch { /* characteristic não existe neste serviço */ }
        }
      }

      if (!subscribed) {
        setStatus('error');
        Alert.alert('Atenção',
          'Conectou mas não encontrou characteristics de notificação conhecidas. ' +
          'Os serviços foram listados acima — envie essa informação ao suporte.');
      }

      setConnected(true);
      device.addEventListener('gattserverdisconnected', () => {
        setConnected(false);
        setCapturing(false);
      });

    } catch (err: any) {
      console.error(err);
      if (err.name === 'NotFoundError' || err.name === 'AbortError') {
        setStatus('idle');
      } else {
        setStatus('error');
      }
      setCapturing(false);
    }
  };

  const sendToSupport = () => {
    if (packets.length === 0 && !services) {
      Alert.alert('Nada capturado', 'Suba na balança após conectar para capturar os dados.');
      return;
    }

    const msg =
      `🔧 *SOLICITAÇÃO DE HOMOLOGAÇÃO DE BALANÇA*\n\n` +
      `*Marca:* ${brand}\n` +
      `*Modelo:* ${model}\n` +
      `*Nome BLE:* ${deviceName}\n\n` +
      `*Serviços detectados:*\n${services || '(nenhum)'}\n\n` +
      `*Pacotes capturados (últimos ${packets.length}):*\n` +
      packets.join('\n') +
      `\n\n_Anexe também o print com os resultados da medição no app oficial da balança._`;

    const phone = '5521XXXXXXXXX'; // ← substitua pelo número do suporte Vortex
    Linking.openURL(
      `whatsapp://send?phone=${phone}&text=${encodeURIComponent(msg)}`
    );
  };

  const reset = () => {
    setStatus('idle');
    setCapturing(false);
    setConnected(false);
    setPackets([]);
    setServices('');
    setDeviceName('');
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: T.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>

      <Text style={{ fontSize: 18, fontWeight: 'bold', color: T.t1, marginBottom: 6 }}>
        🔧 Configurar Nova Balança
      </Text>
      <Text style={{ fontSize: 13, color: T.t3, marginBottom: 20, lineHeight: 19 }}>
        Sua balança não está na lista de modelos homologados?{'\n'}
        Capture os dados abaixo e envie para o suporte. Nossa equipe irá
        configurá-la e adicioná-la ao sistema.
      </Text>

      {/* Campos marca/modelo */}
      <View style={{ marginBottom: 12 }}>
        <Text style={{ fontSize: 13, color: T.t2, marginBottom: 4 }}>Marca</Text>
        <TextInput
          style={{ borderWidth: 1, borderColor: T.border, borderRadius: 8,
                   padding: 10, color: T.t1, backgroundColor: T.surface, fontSize: 14 }}
          placeholder="Ex: Relaxmedic, Xiaomi, Omron..."
          placeholderTextColor={T.t3}
          value={brand}
          onChangeText={setBrand}
          editable={!capturing}
        />
      </View>
      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontSize: 13, color: T.t2, marginBottom: 4 }}>Modelo</Text>
        <TextInput
          style={{ borderWidth: 1, borderColor: T.border, borderRadius: 8,
                   padding: 10, color: T.t1, backgroundColor: T.surface, fontSize: 14 }}
          placeholder="Ex: RM-BD1904A, Mi Body Scale 2..."
          placeholderTextColor={T.t3}
          value={model}
          onChangeText={setModel}
          editable={!capturing}
        />
      </View>

      {/* Botão iniciar */}
      {!capturing && status === 'idle' && (
        <TouchableOpacity
          style={{ backgroundColor: T.blue, padding: 14, borderRadius: 10,
                   alignItems: 'center', marginBottom: 16 }}
          onPress={startCapture}>
          <Text style={{ color: T.white, fontWeight: 'bold', fontSize: 15 }}>
            📡 Iniciar Captura
          </Text>
        </TouchableOpacity>
      )}

      {/* Status */}
      {status === 'scanning' && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10,
                       backgroundColor: T.surfaceAlt, padding: 14, borderRadius: 10, marginBottom: 12 }}>
          <ActivityIndicator color={T.blue} />
          <Text style={{ color: T.t2 }}>Procurando balança...</Text>
        </View>
      )}
      {status === 'connecting' && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10,
                       backgroundColor: T.surfaceAlt, padding: 14, borderRadius: 10, marginBottom: 12 }}>
          <ActivityIndicator color={T.blue} />
          <Text style={{ color: T.t2 }}>Conectando em {deviceName}...</Text>
        </View>
      )}
      {status === 'waiting' && (
        <View style={{ backgroundColor: 'rgba(34,197,94,0.1)', borderWidth: 1,
                       borderColor: '#22c55e', padding: 14, borderRadius: 10, marginBottom: 12 }}>
          <Text style={{ color: '#22c55e', fontWeight: 'bold', fontSize: 15, marginBottom: 4 }}>
            ✅ Conectado — {deviceName}
          </Text>
          <Text style={{ color: T.t2, fontSize: 13 }}>
            Suba na balança agora. Os pacotes aparecerão abaixo automaticamente.
          </Text>
        </View>
      )}
      {status === 'error' && (
        <View style={{ backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1,
                       borderColor: '#EF4444', padding: 14, borderRadius: 10, marginBottom: 12 }}>
          <Text style={{ color: '#EF4444', fontWeight: 'bold' }}>Erro de conexão</Text>
          <Text style={{ color: T.t2, fontSize: 13, marginTop: 4 }}>
            Verifique se a balança está ligada e próxima.
          </Text>
          <TouchableOpacity onPress={reset} style={{ marginTop: 10 }}>
            <Text style={{ color: T.blue, fontWeight: 'bold' }}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Serviços detectados */}
      {services !== '' && (
        <View style={{ backgroundColor: 'rgba(99,102,241,0.1)', borderWidth: 1,
                       borderColor: '#6366F1', borderRadius: 10, padding: 14, marginBottom: 12 }}>
          <Text style={{ color: '#6366F1', fontWeight: 'bold', fontSize: 13, marginBottom: 6 }}>
            🔍 Serviços BLE detectados
          </Text>
          <Text style={{ fontFamily: 'monospace', fontSize: 11,
                         color: '#A5B4FC', lineHeight: 18 }} selectable>
            {services}
          </Text>
        </View>
      )}

      {/* Pacotes capturados */}
      {packets.length > 0 && (
        <View style={{ backgroundColor: 'rgba(99,102,241,0.1)', borderWidth: 1,
                       borderColor: '#6366F1', borderRadius: 10, padding: 14, marginBottom: 16 }}>
          <Text style={{ color: '#6366F1', fontWeight: 'bold', fontSize: 13, marginBottom: 6 }}>
            📦 Pacotes capturados ({packets.length})
          </Text>
          <Text style={{ fontFamily: 'monospace', fontSize: 11,
                         color: '#A5B4FC', lineHeight: 18 }} selectable>
            {packets.join('\n')}
          </Text>
        </View>
      )}

      {/* Botões de ação */}
      {(status === 'waiting' || status === 'captured') && (
        <TouchableOpacity
          style={{ backgroundColor: '#25D366', padding: 14, borderRadius: 10,
                   alignItems: 'center', marginBottom: 12 }}
          onPress={sendToSupport}>
          <Text style={{ color: T.white, fontWeight: 'bold', fontSize: 15 }}>
            📲 Enviar para Suporte via WhatsApp
          </Text>
        </TouchableOpacity>
      )}

      {(status === 'captured' || status === 'error') && (
        <TouchableOpacity
          style={{ backgroundColor: T.surfaceAlt, padding: 12, borderRadius: 10,
                   alignItems: 'center', borderWidth: 1, borderColor: T.border }}
          onPress={reset}>
          <Text style={{ color: T.t2, fontWeight: 'bold' }}>🔄 Nova Captura</Text>
        </TouchableOpacity>
      )}

    </ScrollView>
  );
}