import { useState, useEffect, useRef } from 'react';
import { TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { T } from '../utils/theme';

interface VoiceSearchButtonProps {
  onResult: (text: string) => void;
}

type SpeechRecognitionType = typeof SpeechRecognition | typeof webkitSpeechRecognition;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionType;
    webkitSpeechRecognition?: SpeechRecognitionType;
  }
}

export default function VoiceSearchButton({ onResult }: VoiceSearchButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognitionAPI = 
      window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognitionAPI) {
      setIsSupported(false);
      return;
    }

    setIsSupported(true);

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = 'pt-BR';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error('Erro na busca por voz:', event.error);
      
      if (event.error === 'not-allowed') {
        console.warn('Permissão de microfone negada pelo usuário');
      }
      
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [onResult]);

  const handlePress = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Erro ao iniciar reconhecimento:', error);
      }
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isListening && styles.buttonActive
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {isListening ? (
        <ActivityIndicator size="small" color={T.white} />
      ) : (
        <span style={styles.icon}>🎤</span>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: T.blue,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  buttonActive: {
    backgroundColor: T.red,
  },
  icon: {
    fontSize: 20,
  } as any,
});
