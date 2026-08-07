import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface TutorialStep {
  id: number;
  targetRef?: string;
  title: string;
  text: string;
  audioFile: string;
}

interface TutorialContextType {
  tutorialEnabled: boolean;
  tutorialProgress: Record<string, boolean>;
  currentTour: string | null;
  currentStep: number;
  startTour: (screenId: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  closeTour: () => void;
  toggleTutorialEnabled: () => Promise<void>;
}

const TutorialContext = createContext<TutorialContextType>({
  tutorialEnabled: true,
  tutorialProgress: {},
  currentTour: null,
  currentStep: 0,
  startTour: () => {},
  nextStep: () => {},
  prevStep: () => {},
  closeTour: () => {},
  toggleTutorialEnabled: async () => {},
});

export const useTutorial = () => useContext(TutorialContext);

export const TutorialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { trainer } = useAuth();
  const [tutorialEnabled, setTutorialEnabled] = useState(true);
  const [tutorialProgress, setTutorialProgress] = useState<Record<string, boolean>>({});
  const [currentTour, setCurrentTour] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (trainer) {
      setTutorialEnabled(trainer.tutorial_enabled ?? true);
      setTutorialProgress((trainer.tutorial_progress as Record<string, boolean>) ?? {});
    }
  }, [trainer]);

  const saveTutorialProgress = async (screenId: string) => {
    if (!trainer?.id) return;

    const updatedProgress = { ...tutorialProgress, [screenId]: true };
    
    const { error } = await supabase
      .from('trainers')
      .update({ tutorial_progress: updatedProgress })
      .eq('id', trainer.id);

    if (!error) {
      setTutorialProgress(updatedProgress);
    }
  };

  const startTour = (screenId: string) => {
    if (tutorialProgress[screenId]) {
      return;
    }
    setCurrentTour(screenId);
    setCurrentStep(0);
  };

  const nextStep = () => {
    setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  const closeTour = async () => {
    if (currentTour) {
      await saveTutorialProgress(currentTour);
    }
    setCurrentTour(null);
    setCurrentStep(0);
  };

  const toggleTutorialEnabled = async () => {
    console.log('[TUTORIAL] toggleTutorialEnabled chamado. trainer?.id:', trainer?.id, 'tutorialEnabled atual:', tutorialEnabled);
    
    if (!trainer?.id) {
      console.error('[TUTORIAL] BLOCKED: trainer?.id é undefined');
      return;
    }

    const newValue = !tutorialEnabled;
    console.log('[TUTORIAL] Tentando atualizar para:', newValue);
    
    const { error } = await supabase
      .from('trainers')
      .update({ tutorial_enabled: newValue })
      .eq('id', trainer.id);

    if (error) {
      console.error('[TUTORIAL] Erro ao atualizar no Supabase:', error);
    } else {
      console.log('[TUTORIAL] Supabase atualizado com sucesso. Setando estado local para:', newValue);
      setTutorialEnabled(newValue);
    }
  };

  return (
    <TutorialContext.Provider
      value={{
        tutorialEnabled,
        tutorialProgress,
        currentTour,
        currentStep,
        startTour,
        nextStep,
        prevStep,
        closeTour,
        toggleTutorialEnabled,
      }}
    >
      {children}
    </TutorialContext.Provider>
  );
};
