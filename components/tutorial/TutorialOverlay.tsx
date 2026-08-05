import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
  Platform,
  ScrollView,
} from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTutorial } from '../../contexts/TutorialContext';
import { tutorialScripts } from './tutorialScripts';
import { tutorialAudioMap } from './tutorialAudioMap';
import { T } from '../../utils/theme';

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
  const [windowHeight, setWindowHeight] = useState(
    Platform.OS === 'web' ? window.innerHeight : Dimensions.get('window').height
  );
  const [isMuted, setIsMuted] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  const script = currentTour ? tutorialScripts[currentTour] : null;
  const step = script?.[currentStep];
  const isLastStep = script ? currentStep === script.length - 1 : false;

  useEffect(() => {
    const handleResize = () => {
      if (Platform.OS === 'web') {
        setWindowHeight(window.innerHeight);
      } else {
        const { height } = Dimensions.get('window');
        setWindowHeight(height);
      }
    };

    if (Platform.OS === 'web') {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    } else {
      const subscription = Dimensions.addEventListener('change', handleResize);
      return () => subscription?.remove();
    }
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

  const maxBalloonBottom = windowHeight * 0.6;
  
  let balloonStyle: { top?: number; bottom?: number } = { 
    top: insets.top + 16 
  };

  if (spotlight) {
    const midScreen = windowHeight / 2;
    const spotlightMid = spotlight.y + (spotlight.height / 2);
    
    if (spotlightMid > midScreen) {
      const calculatedBottom = windowHeight - spotlight.y + 16;
      balloonStyle = { 
        bottom: Math.min(calculatedBottom, windowHeight - maxBalloonBottom) 
      };
    } else {
      const calculatedTop = spotlight.y + spotlight.height + 16;
      balloonStyle = { 
        top: Math.max(calculatedTop, insets.top + 16) 
      };
    }
  }

  return (
    <Modal
      visible={!!currentTour}
      transparent
      animationType="fade"
      onRequestClose={closeTour}
    >
      <View style={styles.overlay}>
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
          <View style={styles.header}>
            <View style={styles.avatar}>
              <Ionicons name="rocket" size={20} color={T.blue} />
            </View>
            <Text style={styles.title}>{step.title}</Text>
          </View>

          <ScrollView 
            style={styles.contentScroll}
            contentContainerStyle={styles.contentScrollInner}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.text}>{step.text}</Text>
          </ScrollView>

          <View style={styles.controls}>
            <TouchableOpacity onPress={handleMuteToggle} style={styles.iconButton}>
              <Ionicons
                name={isMuted ? 'volume-mute' : 'volume-high'}
                size={20}
                color={T.t1}
              />
            </TouchableOpacity>

            <View style={styles.navigation}>
              {currentStep > 0 && (
                <TouchableOpacity onPress={prevStep} style={styles.navButton}>
                  <Text style={styles.navButtonText}>Ant.</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity onPress={handleNext} style={[styles.navButton, styles.navButtonPrimary]}>
                <Text style={[styles.navButtonText, styles.navButtonTextPrimary]}>
                  {isLastStep ? 'OK' : 'Próx.'}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={closeTour} style={styles.iconButton}>
              <Ionicons name="close" size={20} color={T.t1} />
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
      </View>
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
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: T.bg,
    borderWidth: 2,
    borderColor: T.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: T.t1,
  },
  contentScroll: {
    maxHeight: 200,
  },
  contentScrollInner: {
    paddingBottom: 4,
  },
  text: {
    fontSize: 14,
    color: T.t2,
    lineHeight: 20,
    marginBottom: 12,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  iconButton: {
    padding: 8,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navigation: {
    flexDirection: 'row',
    gap: 8,
  },
  navButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
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
