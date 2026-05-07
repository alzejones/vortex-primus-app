import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, Modal, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📷 Fotos da Avaliação</Text>

      {loading ? (
        <ActivityIndicator color={T.blue} style={{ marginVertical: 12 }} />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
          {photos.map(photo => (
            <TouchableOpacity
              key={photo.id}
              onPress={() => signedUrls[photo.id] && setFullscreenUri(signedUrls[photo.id])}
              style={styles.thumb}
            >
              {signedUrls[photo.id] ? (
                <Image source={{ uri: signedUrls[photo.id] }} style={styles.thumbImage} />
              ) : (
                <View style={[styles.thumbImage, { backgroundColor: T.surfaceAlt, alignItems: 'center', justifyContent: 'center' }]}>
                  <Text style={{ color: T.t3, fontSize: 20 }}>📷</Text>
                </View>
              )}
              <Text style={styles.label}>{labelMap[photo.label] ?? 'Foto'}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Visualizador fullscreen */}
      <Modal visible={!!fullscreenUri} transparent animationType="fade" onRequestClose={() => setFullscreenUri(null)}>
        <View style={styles.fullscreenOverlay}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => setFullscreenUri(null)}>
            <Text style={{ color: T.white, fontSize: 18, fontWeight: 'bold' }}>✕</Text>
          </TouchableOpacity>
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