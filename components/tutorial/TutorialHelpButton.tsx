import React from 'react';
import { TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTutorial } from '../../contexts/TutorialContext';
import * as T from '../../utils/theme';

interface TutorialHelpButtonProps {
  screenId: string;
}

export const TutorialHelpButton: React.FC<TutorialHelpButtonProps> = ({ screenId }) => {
  const { tutorialEnabled, tutorialProgress, startTour } = useTutorial();

  if (!tutorialEnabled || tutorialProgress[screenId]) {
    return null;
  }

  return (
    <TouchableOpacity
      style={styles.button}
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
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: T.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: T.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 1000,
  },
});
