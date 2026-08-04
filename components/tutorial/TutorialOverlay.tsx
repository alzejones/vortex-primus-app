import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
} from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTutorial } from '../../contexts/TutorialContext';
import { tutorialScripts } from './tutorialScripts';
import { tutorialAudioMap } from './tutorialAudioMap';
import { T } from '../../utils/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface TutorialOverlayProps {
  targetRefs?: Record<string, React.RefObject<any>>;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ targetRefs = {} }) => {
  const { currentTour, currentStep, nextStep, prevStep, closeTour } = useTutorial();
  const insets = useSafeAreaInsets();
  const [spotlight, setSpotlight] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const soundRef = useRef<Audio.Sound | null>(null);

  const script = currentTour ? tutorialScripts[currentTour] : null;
  const step = script?.[currentStep];
  const isLastStep = script ? currentStep === script.length - 1 : false;

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      (e) => setKeyboardHeight(e.endCoordinates.height)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => setKeyboardHeight(0)
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  useEffect(() => {
    if (step?.targetRef && targetRefs[step.targetRef]?.current) {
      const ref = targetRefs[step.targetRef].current;
      
      if (Platform.OS === 'web') {
        const rect = ref.getBoundingClientRect?.();
        if (rect) {
          setSpotlight({
            x: rect.left,
            y: rect.top,
            width: rect.width,
            height: rect.height,
          });
        }
      } else {
        ref.measureInWindow?.((x: number, y: number, width: number, height: number) => {
          setSpotlight({ x, y, width, height });
        });
      }
    } else {
      setSpotlight(null);
    }
  }, [step?.targetRef, targetRefs]);

  useEffect(() => {
    const playAudio = async () => {
      if (!step || isMuted) return;

      try {
        if (soundRef.current) {
          await soundRef.current.unloadAsync();
        }

        const audioSource = tutorialAudioMap[step.audioFile];
        if (!audioSource) {
          console.error(`Áudio não encontrado: ${step.audioFile}`);
          return;
        }

        const { sound } = await Audio.Sound.createAsync(
          audioSource,
          { shouldPlay: true }
        );
        soundRef.current = sound;
      } catch (error) {
        console.error('Erro ao reproduzir áudio do tutorial:', error);
      }
    };

    playAudio();

    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, [step, isMuted]);

  const handleNext = () => {
    if (isLastStep) {
      closeTour();
    } else {
      nextStep();
    }
  };

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
    if (!isMuted && soundRef.current) {
      soundRef.current.pauseAsync();
    }
  };

  if (!currentTour || !step) return null;

  const balloonBottomPadding = Math.max(insets.bottom + 16, 16);
  const balloonStyle = spotlight 
    ? { top: spotlight.y + spotlight.height + 24 } 
    : { 
        bottom: keyboardHeight > 0 
          ? keyboardHeight + balloonBottomPadding 
          : balloonBottomPadding 
      };

  return (
    <Modal
      visible={!!currentTour}
      transparent
      animationType="fade"
      onRequestClose={closeTour}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        {spotlight && (
          <View
            style={[
              styles.spotlight,
              {
                left: spotlight.x - 8,
                top: spotlight.y - 8,
                width: spotlight.width + 16,
                height: spotlight.height + 16,
              },
            ]}
          />
        )}

        <View style={[styles.balloon, balloonStyle]}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="rocket" size={24} color={T.blue} />
            </View>
          </View>

          <Text style={styles.title}>{step.title}</Text>
          <Text style={styles.text}>{step.text}</Text>

          <View style={[styles.controls, { paddingBottom: balloonBottomPadding }]}>
            <TouchableOpacity onPress={handleMuteToggle} style={styles.muteButton}>
              <Ionicons
                name={isMuted ? 'volume-mute' : 'volume-high'}
                size={20}
                color={T.t1}
              />
            </TouchableOpacity>

            <View style={styles.navigation}>
              {currentStep > 0 && (
                <TouchableOpacity onPress={prevStep} style={styles.navButton}>
                  <Text style={styles.navButtonText}>Anterior</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity onPress={handleNext} style={[styles.navButton, styles.navButtonPrimary]}>
                <Text style={[styles.navButtonText, styles.navButtonTextPrimary]}>
                  {isLastStep ? 'Concluir' : 'Próximo'}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={closeTour} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={T.t1} />
            </TouchableOpacity>
          </View>

          <View style={styles.progressContainer}>
            {script?.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.progressDot,
                  index === currentStep && styles.progressDotActive,
                ]}
              />
            ))}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  spotlight: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: T.blue,
    shadowColor: T.blue,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  balloon: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: T.card,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: T.bg,
    borderWidth: 2,
    borderColor: T.blue,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: T.blue,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: T.t1,
    marginBottom: 8,
    textAlign: 'center',
  },
  text: {
    fontSize: 16,
    color: T.t2,
    lineHeight: 24,
    marginBottom: 20,
    textAlign: 'center',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  muteButton: {
    padding: 8,
  },
  navigation: {
    flexDirection: 'row',
    gap: 12,
  },
  navButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: T.bg,
  },
  navButtonPrimary: {
    backgroundColor: T.blue,
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: T.t1,
  },
  navButtonTextPrimary: {
    color: '#FFF',
  },
  closeButton: {
    padding: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: T.border,
  },
  progressDotActive: {
    backgroundColor: T.blue,
    width: 24,
  },
});
