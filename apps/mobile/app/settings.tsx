import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as api from '@/services/api';
import { syncEngine } from '@/services/sync';
import { useSettingsStore } from '@/stores';

export default function SettingsScreen() {
  const router = useRouter();

  const theme = useSettingsStore((state) => state.theme);
  const autoSync = useSettingsStore((state) => state.autoSync);
  const syncInterval = useSettingsStore((state) => state.syncInterval);
  const hapticFeedback = useSettingsStore((state) => state.hapticFeedback);
  const showPreview = useSettingsStore((state) => state.showPreview);
  const serverConnection = useSettingsStore((state) => state.serverConnection);

  const setTheme = useSettingsStore((state) => state.setTheme);
  const setAutoSync = useSettingsStore((state) => state.setAutoSync);
  const setSyncInterval = useSettingsStore((state) => state.setSyncInterval);
  const setHapticFeedback = useSettingsStore((state) => state.setHapticFeedback);
  const setShowPreview = useSettingsStore((state) => state.setShowPreview);
  const clearServerConnection = useSettingsStore((state) => state.clearServerConnection);

  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const syncNow = async () => {
    setSyncing(true);
    try {
      await syncEngine.sync();
    } finally {
      setSyncing(false);
    }
  };

  const disconnect = async () => {
    setDisconnecting(true);
    try {
      syncEngine.disconnect();
      await api.disconnect();
      clearServerConnection();
      router.replace('/connect');
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={['#7C3AED', '#2563EB']} style={styles.hero}>
          <View style={styles.heroRow}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <Ionicons color="#FFFFFF" name="arrow-back" size={20} />
            </Pressable>
            <Text style={styles.heroTitle}>Settings</Text>
            <View style={styles.backButtonPlaceholder} />
          </View>

          <Text style={styles.heroSubtitle}>Tune sync behavior and editor defaults.</Text>
        </LinearGradient>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Connection</Text>
          <Text style={styles.rowLabel}>Status</Text>
          <Text style={styles.rowValue}>{serverConnection?.status ?? 'disconnected'}</Text>
          <Text style={styles.rowLabel}>Server</Text>
          <Text numberOfLines={1} style={styles.rowValue}>
            {serverConnection?.url ?? 'Not connected'}
          </Text>

          <View style={styles.rowButtons}>
            <Pressable onPress={syncNow} style={styles.syncButton}>
              {syncing ? <ActivityIndicator color="#1D4ED8" size="small" /> : <Text style={styles.syncButtonText}>Sync now</Text>}
            </Pressable>
            <Pressable onPress={disconnect} style={styles.disconnectButton}>
              {disconnecting ? (
                <ActivityIndicator color="#B42318" size="small" />
              ) : (
                <Text style={styles.disconnectButtonText}>Disconnect</Text>
              )}
            </Pressable>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Appearance</Text>

          <View style={styles.segmentRow}>
            {(['light', 'dark', 'system'] as const).map((mode) => (
              <Pressable
                key={mode}
                onPress={() => setTheme(mode)}
                style={[styles.segment, theme === mode ? styles.segmentActive : null]}
              >
                <Text style={[styles.segmentLabel, theme === mode ? styles.segmentLabelActive : null]}>{mode}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Preview in editor</Text>
            <Switch onValueChange={setShowPreview} value={showPreview} />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Sync</Text>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Auto sync</Text>
            <Switch onValueChange={setAutoSync} value={autoSync} />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Haptic feedback</Text>
            <Switch onValueChange={setHapticFeedback} value={hapticFeedback} />
          </View>

          <Text style={styles.rowLabel}>Sync interval (minutes)</Text>
          <View style={styles.intervalRow}>
            <Pressable
              onPress={() => setSyncInterval(Math.max(1, syncInterval - 1))}
              style={styles.intervalButton}
            >
              <Ionicons color="#1D4ED8" name="remove" size={18} />
            </Pressable>
            <Text style={styles.intervalValue}>{syncInterval}</Text>
            <Pressable
              onPress={() => setSyncInterval(Math.min(60, syncInterval + 1))}
              style={styles.intervalButton}
            >
              <Ionicons color="#1D4ED8" name="add" size={18} />
            </Pressable>
          </View>
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
    paddingBottom: 32,
  },
  hero: {
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    marginBottom: 16,
    paddingBottom: 18,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  heroRow: {
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
    color: '#EDE9FE',
    fontSize: 14,
    marginTop: 12,
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
  sectionTitle: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 10,
  },
  rowLabel: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 4,
  },
  rowValue: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  rowButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  syncButton: {
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    minHeight: 42,
    justifyContent: 'center',
  },
  syncButtonText: {
    color: '#1D4ED8',
    fontSize: 13,
    fontWeight: '700',
  },
  disconnectButton: {
    alignItems: 'center',
    backgroundColor: '#FFF1F2',
    borderColor: '#FECDD3',
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    minHeight: 42,
    justifyContent: 'center',
  },
  disconnectButtonText: {
    color: '#B42318',
    fontSize: 13,
    fontWeight: '700',
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  segment: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  segmentActive: {
    backgroundColor: '#DBEAFE',
    borderColor: '#93C5FD',
  },
  segmentLabel: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  segmentLabelActive: {
    color: '#1D4ED8',
  },
  switchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  switchLabel: {
    color: '#1E293B',
    fontSize: 14,
    fontWeight: '600',
  },
  intervalRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  intervalButton: {
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderRadius: 10,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  intervalValue: {
    color: '#1D4ED8',
    fontSize: 17,
    fontWeight: '700',
    minWidth: 40,
    textAlign: 'center',
  },
});
