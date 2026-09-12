import React, { ReactNode } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useLicenseStatus } from '../hooks/useLicenseStatus';
import { useTheme } from '@/contexts/ThemeContext';
import { T } from '../utils/theme';

interface FeatureGateProps {
  featureKey: string;
  featureName: string;
  requiredPlan: 'Avançado' | 'Escalando';
  children: ReactNode;
  fallback?: ReactNode;
}

export function FeatureGate({
  featureKey,
  featureName,
  requiredPlan,
  children,
  fallback,
}: FeatureGateProps) {
  const { hasFeature } = useLicenseStatus();
  const router = useRouter();
  const { theme } = useTheme();
  const s = createStyles(theme);
  const [showUpgradeModal, setShowUpgradeModal] = React.useState(false);

  const isAllowed = hasFeature(featureKey);

  const handleNavigateToUpgrade = () => {
    setShowUpgradeModal(false);
    router.push('/upgrade');
  };

  if (isAllowed) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <>
      <TouchableOpacity
        style={s.blockedCard}
        onPress={() => setShowUpgradeModal(true)}
      >
        <View style={s.iconLock}>
          <Text style={s.iconLockTxt}>🔒</Text>
        </View>
        <View style={s.blockedContent}>
          <Text style={s.blockedTitle}>{featureName}</Text>
          <Text style={s.blockedSubtitle}>
            Disponível no plano {requiredPlan}
          </Text>
        </View>
      </TouchableOpacity>

      <Modal
        visible={showUpgradeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowUpgradeModal(false)}
      >
        <View style={s.overlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Recurso Bloqueado</Text>
            <Text style={s.modalMessage}>
              <Text style={s.modalFeature}>{featureName}</Text> está disponível apenas no plano{' '}
              <Text style={s.modalPlan}>{requiredPlan}</Text>.
            </Text>
            <View style={s.buttonsRow}>
              <TouchableOpacity
                style={s.btnCancel}
                onPress={() => setShowUpgradeModal(false)}
              >
                <Text style={s.btnCancelTxt}>Voltar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.btnUpgrade}
                onPress={handleNavigateToUpgrade}
              >
                <Text style={s.btnUpgradeTxt}>Ver Planos</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const createStyles = (theme: import('@/contexts/ThemeContext').AppTheme) => StyleSheet.create({
  blockedCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconLock: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLockTxt: {
    fontSize: 24,
  },
  blockedContent: {
    flex: 1,
  },
  blockedTitle: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  blockedSubtitle: {
    color: theme.colors.textMuted,
    fontSize: 13,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    maxWidth: 360,
    width: '100%',
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 20,
  },
  modalTitle: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  modalMessage: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 20,
  },
  modalFeature: {
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },
  modalPlan: {
    color: T.blue,
    fontWeight: '700',
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  btnCancel: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  btnCancelTxt: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  btnUpgrade: {
    flex: 1,
    backgroundColor: T.blue,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  btnUpgradeTxt: {
    color: T.white,
    fontSize: 14,
    fontWeight: '700',
  },
});

interface LockedButtonProps {
  featureKey: string;
  featureName: string;
  requiredPlan: 'Avançado' | 'Escalando';
  buttonStyle?: any;
  textStyle?: any;
  label: string;
  icon?: string;
}

export function LockedButton({
  featureKey,
  featureName,
  requiredPlan,
  buttonStyle,
  textStyle,
  label,
  icon = '🔒',
}: LockedButtonProps) {
  const router = useRouter();
  const { theme } = useTheme();
  const s = createStyles(theme);
  const [showUpgradeModal, setShowUpgradeModal] = React.useState(false);

  const handleNavigateToUpgrade = () => {
    setShowUpgradeModal(false);
    router.push('/upgrade');
  };

  return (
    <>
      <TouchableOpacity
        style={[buttonStyle, { opacity: 0.6 }]}
        onPress={() => setShowUpgradeModal(true)}
      >
        <Text style={textStyle}>
          {icon} {label}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={showUpgradeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowUpgradeModal(false)}
      >
        <View style={s.overlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Recurso Bloqueado</Text>
            <Text style={s.modalMessage}>
              <Text style={s.modalFeature}>{featureName}</Text> está disponível apenas no plano{' '}
              <Text style={s.modalPlan}>{requiredPlan}</Text>.
            </Text>
            <View style={s.buttonsRow}>
              <TouchableOpacity
                style={s.btnCancel}
                onPress={() => setShowUpgradeModal(false)}
              >
                <Text style={s.btnCancelTxt}>Voltar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.btnUpgrade}
                onPress={handleNavigateToUpgrade}
              >
                <Text style={s.btnUpgradeTxt}>Ver Planos</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
