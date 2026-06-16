import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View, Image } from 'react-native';
import { getHistoryColor, getSmartWeightColor } from '../utils/assessmentCalculations';

interface AssessmentHistoryCardProps {
  assessment: any;
  previousAnthro: any;
  index: number;
  totalAssessments: number;
  onViewDetails: (assessment: any) => void;
  onEdit: (assessment: any) => void;
  onDelete: (id: string) => void;
  onWhatsApp: (assessment: any) => void;
  onPhysicalTests: (assessment: any) => void;
  onExportAI?: (assessment: any) => void;
  isLatest?: boolean;
  getSignedUrl?: (path: string) => Promise<string | null>;
}

export default function AssessmentHistoryCard({
  assessment,
  previousAnthro,
  index,
  totalAssessments,
  onViewDetails,
  onEdit,
  onDelete,
  onWhatsApp,
  onPhysicalTests,
  onExportAI,
  isLatest,
  getSignedUrl
}: AssessmentHistoryCardProps) {
  
  function renderTrendIndicator(currentValue: any, previousValue: any, type: "weight" | "fat" | "muscle") {
    if (!currentValue || !previousValue) return null;
    const diff = Number(currentValue) - Number(previousValue);
    if (diff === 0) return <Text style={{ color: '#9ca3af', fontSize: 12 }}> ➖</Text>; 

    if (type === "muscle") {
      return diff > 0 
        ? <Text style={{ color: '#16a34a', fontSize: 12, fontWeight: 'bold' }}> ⏫</Text> 
        : <Text style={{ color: '#dc2626', fontSize: 12, fontWeight: 'bold' }}> ⏬</Text>;
    } else {
      return diff < 0 
        ? <Text style={{ color: '#16a34a', fontSize: 12, fontWeight: 'bold' }}> ⏬</Text> 
        : <Text style={{ color: '#dc2626', fontSize: 12, fontWeight: 'bold' }}> ⏫</Text>;
    }
  }

  const anthro = assessment.anthropometry?.[0];
  const [y, m, d] = (assessment.date as string).split('-');
  const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
  const formattedDate = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const formattedTime = assessment.created_at
    ? new Date(assessment.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })
    : '';

  // Função auxiliar segura para 1 casa decimal
  const formatNum = (val: any) => val != null && val !== "" ? Number(val).toFixed(1) : '--';

  const [thumbUrls, setThumbUrls] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function loadThumbs() {
      if (!getSignedUrl || !assessment.assessment_photos?.length) return;
      // Carrega no máximo 3 thumbnails para não sobrecarregar a lista
      const photos = assessment.assessment_photos.slice(0, 3);
      const urls: string[] = [];
      for (const photo of photos) {
        const url = await getSignedUrl(photo.storage_path);
        if (url) urls.push(url);
      }
      if (!cancelled) setThumbUrls(urls);
    }
    loadThumbs();
    return () => { cancelled = true; };
  }, [assessment.id, assessment.assessment_photos?.length]);

  return (
    <View style={{
      backgroundColor: '#fff',
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: '#f1f5f9',
      elevation: 2,
    }}>
      {/* Cabeçalho */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <View>
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#1e293b' }}>{formattedDate}</Text>
          <Text style={{ fontSize: 11, color: '#64748b' }}>{formattedTime}</Text>
        </View>
        <TouchableOpacity onPress={() => onViewDetails(assessment)} style={{ backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, minWidth: 82 }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#475569', textAlign: 'center' }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>Consultar</Text>
        </TouchableOpacity>
      </View>

      {/* Dados (se houver) */}
      {anthro ? (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>Peso</Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
              <Text style={{ 
                fontSize: 18, 
                fontWeight: '800', 
                color: getSmartWeightColor(
                  anthro?.weight, previousAnthro?.weight,
                  anthro?.body_fat, previousAnthro?.body_fat,
                  anthro?.muscle_mass_percentage, previousAnthro?.muscle_mass_percentage
                ) 
              }}>
                {formatNum(anthro?.weight)}
              </Text>
              <Text style={{ fontSize: 11, color: '#64748b', marginLeft: 2 }}>kg</Text>
            </View>
            <View style={{ marginTop: 4 }}>{renderTrendIndicator(anthro?.weight, previousAnthro?.weight, "weight")}</View>
          </View>

          <View style={{ flex: 1, alignItems: 'center', borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#f1f5f9' }}>
            <Text style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>Gordura</Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: getHistoryColor(anthro?.body_fat, previousAnthro?.body_fat, 'fat') }}>
                {formatNum(anthro?.body_fat)}
              </Text>
              <Text style={{ fontSize: 11, color: '#64748b', marginLeft: 2 }}>%</Text>
            </View>
            <View style={{ marginTop: 4 }}>{renderTrendIndicator(anthro?.body_fat, previousAnthro?.body_fat, "fat")}</View>
          </View>

          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>Músculo</Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: getHistoryColor(anthro?.muscle_mass_percentage, previousAnthro?.muscle_mass_percentage, 'muscle') }}>
                {formatNum(anthro?.muscle_mass_percentage)}
              </Text>
              <Text style={{ fontSize: 11, color: '#64748b', marginLeft: 2 }}>%</Text>
            </View>
            <View style={{ marginTop: 4 }}>{renderTrendIndicator(anthro?.muscle_mass_percentage, previousAnthro?.muscle_mass_percentage, "muscle")}</View>
          </View>
        </View>
      ) : (
        <View style={{ backgroundColor: '#f8fafc', padding: 12, borderRadius: 8, marginBottom: 16, alignItems: 'center' }}>
          <Text style={{ color: '#94a3b8', fontSize: 12, fontStyle: 'italic' }}>Dados de antropometria não registrados</Text>
        </View>
      )}

      {/* RODAPÉ DE AÇÕES */}
      <View style={{ borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 12 }}>

        {/* Linha 1 — ações sempre visíveis */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', gap: 15 }}>
            <TouchableOpacity onPress={() => onEdit(assessment)}>
              <Text style={{ color: "#475569", fontSize: 13, fontWeight: "700" }}>✏️ Editar</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => onPhysicalTests(assessment)}>
              <Text style={{ color: "#2563eb", fontSize: 13, fontWeight: "700" }}>💪 Testes</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => onDelete(assessment.id)}>
              <Text style={{ color: "#ef4444", fontSize: 13, fontWeight: "700" }}>🗑️ Excluir</Text>
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            {isLatest && onExportAI && (
              <TouchableOpacity onPress={() => onExportAI(assessment)}>
                <Text style={{ color: "#7c3aed", fontSize: 13, fontWeight: "800" }}>🤖 IA</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => onWhatsApp(assessment)}>
              <Text style={{ color: "#22c55e", fontSize: 13, fontWeight: "800" }}>📲 WhatsApp</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Linha 2 — miniaturas (só aparece quando há fotos) */}
        {thumbUrls.length > 0 && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 }}>
            <Text style={{ color: '#94a3b8', fontSize: 10, fontWeight: '700', marginRight: 2 }}>📷</Text>
            {thumbUrls.map((uri, i) => (
              <Image
                key={i}
                source={{ uri }}
                style={{ width: 44, height: 44, borderRadius: 7, borderWidth: 1, borderColor: '#e2e8f0' }}
              />
            ))}
            {assessment.assessment_photos.length > 3 && (
              <View style={{ width: 44, height: 44, borderRadius: 7, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e2e8f0' }}>
                <Text style={{ fontSize: 11, color: '#475569', fontWeight: '800' }}>
                  +{assessment.assessment_photos.length - 3}
                </Text>
              </View>
            )}
          </View>
        )}
        {/* Fallback enquanto as URLs carregam */}
        {thumbUrls.length === 0 && assessment.assessment_photos?.length > 0 && (
          <Text style={{ color: "#94a3b8", fontSize: 11, fontWeight: "600", marginTop: 8 }}>
            📷 {assessment.assessment_photos.length} foto(s)
          </Text>
        )}

      </View>
    </View>
  );
}

