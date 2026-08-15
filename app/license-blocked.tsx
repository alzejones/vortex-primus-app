import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useLicenseStatus, LicenseStatus } from '../hooks/useLicenseStatus';
import { GradientPrimary } from '../utils/gradients';
import { T } from '../utils/theme';

export default function LicenseBlockedScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const [retryKey, setRetryKey] = useState(0);
  const licenseStatus = useLicenseStatus();
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    if (!licenseStatus.loading && (licenseStatus.status === 'trial' || licenseStatus.status === 'active')) {
      router.replace('/(protected)/' as any);
    }
  }, [licenseStatus.loading, licenseStatus.status]);

  const handleRetry = () => {
    setIsRetrying(true);
    setTimeout(() => {
      setRetryKey(prev => prev + 1);
      setIsRetrying(false);
      if (typeof window !== 'undefined' && window.location) {
        window.location.reload();
      } else {
        router.replace('/');
      }
    }, 500);
  };

  const handleUpgrade = () => {
    router.push('/upgrade');
  };

  if (licenseStatus.loading || isRetrying) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={T.blue} />
      </View>
    );
  }

  const getContent = (status: LicenseStatus) => {
    switch (status) {
      case 'expired':
        return {
          title: 'Período de teste encerrado',
          message: 'Seu período de teste de 7 dias acabou. Para continuar usando o Vortex Primus, faça upgrade para um plano pago.',
          buttonText: 'Fazer upgrade',
          onPress: handleUpgrade,
        };
      case 'limit_reached':
        return {
          title: 'Limite de clientes atingido',
          message: `Você atingiu o limite de ${licenseStatus.max_clients || 0} clientes do seu plano atual. Para adicionar mais clientes, faça upgrade para um plano maior.`,
          buttonText: 'Fazer upgrade',
          onPress: handleUpgrade,
        };
      case 'blocked_error':
        return {
          title: 'Erro ao verificar licença',
          message: 'Não foi possível verificar sua licença. Verifique sua conexão com a internet e tente novamente.',
          buttonText: 'Tentar novamente',
          onPress: handleRetry,
        };
      default:
        return {
          title: 'Acesso bloqueado',
          message: 'Houve um problema ao verificar sua licença.',
          buttonText: 'Tentar novamente',
          onPress: handleRetry,
        };
    }
  };

  const content = getContent(licenseStatus.status);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>{content.title}</Text>
        <Text style={styles.message}>{content.message}</Text>
        
        <TouchableOpacity onPress={content.onPress} style={styles.button}>
          <LinearGradient {...GradientPrimary} style={styles.gradient}>
            <Text style={styles.buttonText}>{content.buttonText}</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity onPress={signOut} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Sair e entrar com outra conta</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.bg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: T.card,
    borderRadius: 16,
    padding: 32,
    maxWidth: 480,
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: T.t1,
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: T.t2,
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 24,
  },
  button: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  gradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  logoutButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  logoutText: {
    color: T.t3,
    fontSize: 14,
  },
});
