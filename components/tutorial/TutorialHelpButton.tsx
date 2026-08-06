import React from 'react';
import { TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTutorial } from '../../contexts/TutorialContext';
import { T } from '../../utils/theme';

interface TutorialHelpButtonProps {
  screenId: string;
}

export const TutorialHelpButton: React.FC<TutorialHelpButtonProps> = ({ screenId }) => {
  const { tutorialEnabled, tutorialProgress, startTour } = useTutorial();
  const insets = useSafeAreaInsets();

  if (!tutorialEnabled || tutorialProgress[screenId]) {
    return null;
  }

  return (
    <TouchableOpacity
      style={[styles.button, { bottom: 72 + insets.bottom }]}
      onPress={() => startTour(screenId)}
      activeOpacity={0.8}
    >
      <Ionicons name="help-circle" size={28} color="#FFF" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    position: Platform.OS === 'web' ? 'fixed' : 'absolute',
    left: 18,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: T.blue,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: T.blue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 1000,
  },
});
