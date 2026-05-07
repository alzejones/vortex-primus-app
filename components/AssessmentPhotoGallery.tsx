import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, Modal, StyleSheet, ScrollView, ActivityIndicator, Platform, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { T } from '../utils/theme';

interface Photo {
  id: string;
  storage_path: string;
  label: string;
}

interface Props {
  photos: Photo[];
  getSignedUrl: (path: string) => Promise<string | null>;
}

export default function AssessmentPhotoGallery({ photos, getSignedUrl }: Props) {
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [fullscreenUri, setFullscreenUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null); // photo.id em download

  useEffect(() => {
    async function loadUrls() {
      setLoading(true);
      const urls: Record<string, string> = {};
      for (const photo of photos) {
        const url = await getSignedUrl(photo.storage_path);
        if (url) urls[photo.id] = url;
      }
      setSignedUrls(urls);
      setLoading(false);
    }
    if (photos.length > 0) loadUrls();
  }, [photos]);

  const labelMap: Record<string, string> = {
    frente: 'Frente', costas: 'Costas',
    lateral_dir: 'Lat. Dir.', lateral_esq: 'Lat. Esq.', outro: 'Foto'
  };

  async function handleDownload(photoId: string, uri: string) {
    setDownloading(photoId);
    try {
      if (Platform.OS === 'web') {
        // Web: abre em nova aba — navegador gerencia o download
        const link = document.createElement('a');
        link.href = uri;
        link.download = `avaliacao_${photoId}.jpg`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      // Native: baixa o arquivo e salva na galeria
      const filename = `vortex_avaliacao_${Date.now()}.jpg`;
      const localUri = `${FileSystem.cacheDirectory}${filename}`;

      const { uri: downloadedUri } = await FileSystem.downloadAsync(uri, localUri);

      // Verificar/solicitar permissão de mídia
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        // Fallback: compartilhar via sistema se não tiver permissão de galeria
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(downloadedUri, {
            mimeType: 'image/jpeg',
            dialogTitle: 'Salvar foto de avaliação',
          });
        }
        return;
      }

      await MediaLibrary.saveToLibraryAsync(downloadedUri);
      Alert.alert('✅ Foto salva', 'A foto foi salva na sua galeria.');

    } catch (err: any) {
      console.error('Erro no download:', err.message);
      Alert.alert('Erro', 'Não foi possível baixar a foto.');
    } finally {
      setDownloading(null);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📷 Fotos da Avaliação</Text>

      {loading ? (
        <ActivityIndicator color={T.blue} style={{ marginVertical: 12 }} />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
          {photos.map(photo => (
            <View key={photo.id} style={styles.thumb}>
              <TouchableOpacity
                onPress={() => signedUrls[photo.id] && setFullscreenUri(signedUrls[photo.id])}
              >
                {signedUrls[photo.id] ? (
                  <Image source={{ uri: signedUrls[photo.id] }} style={styles.thumbImage} />
                ) : (
                  <View style={[styles.thumbImage, { backgroundColor: T.surfaceAlt, alignItems: 'center', justifyContent: 'center' }]}>
                    <Text style={{ color: T.t3, fontSize: 20 }}>📷</Text>
                  </View>
                )}
              </TouchableOpacity>
              <Text style={styles.label}>{labelMap[photo.label] ?? 'Foto'}</Text>
              <TouchableOpacity
                onPress={() => signedUrls[photo.id] && handleDownload(photo.id, signedUrls[photo.id])}
                disabled={!signedUrls[photo.id] || downloading === photo.id}
                style={{
                  marginTop: 4,
                  backgroundColor: '#1e40af',
                  borderRadius: 6,
                  paddingVertical: 3,
                  paddingHorizontal: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 3,
                  opacity: !signedUrls[photo.id] ? 0.4 : 1,
                }}
              >
                {downloading === photo.id
                  ? <ActivityIndicator size="small" color="#fff" style={{ width: 10, height: 10 }} />
                  : <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>⬇ Baixar</Text>
                }
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Visualizador fullscreen */}
      <Modal visible={!!fullscreenUri} transparent animationType="fade" onRequestClose={() => setFullscreenUri(null)}>
        <View style={styles.fullscreenOverlay}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => setFullscreenUri(null)}>
            <Text style={{ color: T.white, fontSize: 18, fontWeight: 'bold' }}>✕</Text>
          </TouchableOpacity>
          {/* Botão de download no fullscreen */}
          {fullscreenUri && (
            <TouchableOpacity
              onPress={() => {
                const photo = photos.find(p => signedUrls[p.id] === fullscreenUri);
                if (photo) handleDownload(photo.id, fullscreenUri);
              }}
              disabled={!!downloading}
              style={{
                position: 'absolute', top: 50, left: 20, zIndex: 10,
                backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20,
                paddingVertical: 8, paddingHorizontal: 14,
                flexDirection: 'row', alignItems: 'center', gap: 4,
              }}
            >
              {downloading
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>⬇ Baixar</Text>
              }
            </TouchableOpacity>
          )}
          {fullscreenUri && (
            <Image source={{ uri: fullscreenUri }} style={styles.fullscreenImage} resizeMode="contain" />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: T.border },
  title: { fontSize: 15, fontWeight: 'bold', color: T.t1, marginBottom: 12 },
  thumb: { alignItems: 'center', gap: 4 },
  thumbImage: { width: 88, height: 88, borderRadius: 10, borderWidth: 1, borderColor: T.border },
  label: { fontSize: 11, color: T.t3 },
  fullscreenOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  closeBtn: { position: 'absolute', top: 50, right: 20, zIndex: 10, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  fullscreenImage: { width: '100%', height: '80%' },
});