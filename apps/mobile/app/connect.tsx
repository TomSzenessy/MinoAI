import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as api from '@/services/api';
import { syncEngine } from '@/services/sync';
import { useSettingsStore } from '@/stores';

export default function ConnectScreen() {
  const router = useRouter();

  const setServerConnection = useSettingsStore((state) => state.setServerConnection);
  const autoSync = useSettingsStore((state) => state.autoSync);
  const syncInterval = useSettingsStore((state) => state.syncInterval);

  const [relayCode, setRelayCode] = useState('');
  const [relayUrl, setRelayUrl] = useState('https://relay.mino.ink');
  const [serverUrl, setServerUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState<'relay' | 'direct' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const connectWithRelay = async () => {
    if (!relayCode.trim()) {
      setError('Enter your relay pairing code.');
      return;
    }

    setError(null);
    setLoading('relay');
    try {
      const result = await api.connectViaRelay(relayCode, relayUrl);
      if (!result.success || !result.connection) {
        setError(result.error ?? 'Unable to connect via relay');
        return;
      }

      setServerConnection(result.connection);
      if (autoSync) {
        await syncEngine.initialize(result.connection);
        syncEngine.startPeriodicSync(syncInterval);
      }

      router.replace('/');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to connect via relay');
    } finally {
      setLoading(null);
    }
  };

  const connectDirectly = async () => {
    if (!serverUrl.trim() || !apiKey.trim()) {
      setError('Enter both server URL and API key.');
      return;
    }

    setError(null);
    setLoading('direct');
    try {
      const result = await api.connectDirect(serverUrl, apiKey);
      if (!result.success || !result.connection) {
        setError(result.error ?? 'Unable to connect to server');
        return;
      }

      setServerConnection(result.connection);
      if (autoSync) {
        await syncEngine.initialize(result.connection);
        syncEngine.startPeriodicSync(syncInterval);
      }

      router.replace('/');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to connect to server');
    } finally {
      setLoading(null);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={['#0EA5E9', '#14B8A6']} style={styles.hero}>
          <View style={styles.heroTopRow}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <Ionicons color="#FFFFFF" name="arrow-back" size={20} />
            </Pressable>
            <Text style={styles.heroTitle}>Connect Mino</Text>
            <View style={styles.backButtonPlaceholder} />
          </View>

          <Text style={styles.heroSubtitle}>
            Pair through relay or connect directly to your self-hosted server.
          </Text>
        </LinearGradient>

        {error ? (
          <View style={styles.errorCard}>
            <Ionicons color="#B42318" name="alert-circle" size={16} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Quick Pair (Relay)</Text>
          <Text style={styles.cardHint}>Use the pairing code from your server's relay output.</Text>

          <TextInput
            autoCapitalize="characters"
            onChangeText={(value) => setRelayCode(value.toUpperCase())}
            placeholder="PAIRCODE"
            placeholderTextColor="#94A3B8"
            style={styles.input}
            value={relayCode}
          />

          <TextInput
            autoCapitalize="none"
            keyboardType="url"
            onChangeText={setRelayUrl}
            placeholder="https://relay.mino.ink"
            placeholderTextColor="#94A3B8"
            style={styles.input}
            value={relayUrl}
          />

          <Pressable onPress={connectWithRelay} style={styles.primaryButton}>
            {loading === 'relay' ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.primaryButtonText}>Connect via Relay</Text>
            )}
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Direct Connection</Text>
          <Text style={styles.cardHint}>Ideal for local networks, VPN, or Cloudflare tunnel URL.</Text>

          <TextInput
            autoCapitalize="none"
            keyboardType="url"
            onChangeText={setServerUrl}
            placeholder="https://your-server.example.com"
            placeholderTextColor="#94A3B8"
            style={styles.input}
            value={serverUrl}
          />

          <TextInput
            autoCapitalize="none"
            onChangeText={setApiKey}
            placeholder="mino_sk_..."
            placeholderTextColor="#94A3B8"
            style={styles.input}
            value={apiKey}
          />

          <Pressable onPress={connectDirectly} style={styles.secondaryButton}>
            {loading === 'direct' ? (
              <ActivityIndicator color="#1D4ED8" size="small" />
            ) : (
              <Text style={styles.secondaryButtonText}>Connect Directly</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#F8FAFC',
    flex: 1,
  },
  content: {
    paddingBottom: 30,
  },
  hero: {
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    marginBottom: 16,
    paddingBottom: 22,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  heroTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF22',
    borderColor: '#FFFFFF4D',
    borderRadius: 12,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  backButtonPlaceholder: {
    height: 36,
    width: 36,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  heroSubtitle: {
    color: '#E0F2FE',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 14,
  },
  errorCard: {
    alignItems: 'center',
    backgroundColor: '#FEE4E2',
    borderColor: '#FECDCA',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  errorText: {
    color: '#B42318',
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 18,
    borderWidth: 1,
    marginHorizontal: 16,
    marginTop: 10,
    padding: 14,
  },
  cardTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '700',
  },
  cardHint: {
    color: '#64748B',
    fontSize: 13,
    marginBottom: 12,
    marginTop: 2,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderColor: '#DDE5F0',
    borderRadius: 12,
    borderWidth: 1,
    color: '#0F172A',
    fontSize: 14,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#0EA5E9',
    borderRadius: 12,
    marginTop: 4,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  secondaryButtonText: {
    color: '#1D4ED8',
    fontSize: 14,
    fontWeight: '700',
  },
});
