import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FilterChip from '@/components/FilterChip';
import NoteCard from '@/components/NoteCard';
import * as api from '@/services/api';
import * as database from '@/services/database';
import { syncEngine } from '@/services/sync';
import { useNotesStore, useSettingsStore, useUIStore } from '@/stores';
import type { LocalNote } from '@/types';

type FilterKey = 'all' | 'favorites' | 'dirty';

export default function HomeScreen() {
  const router = useRouter();

  const notes = useNotesStore((state) =>
    state.notePaths
      .map((path) => state.notes[path])
      .filter((note): note is LocalNote => Boolean(note))
  );
  const setNotes = useNotesStore((state) => state.setNotes);

  const serverConnection = useSettingsStore((state) => state.serverConnection);
  const setServerConnection = useSettingsStore((state) => state.setServerConnection);
  const autoSync = useSettingsStore((state) => state.autoSync);
  const syncInterval = useSettingsStore((state) => state.syncInterval);
  const hapticFeedback = useSettingsStore((state) => state.hapticFeedback);

  const searchQuery = useUIStore((state) => state.searchQuery);
  const setSearchQuery = useUIStore((state) => state.setSearchQuery);
  const setUiError = useUIStore((state) => state.setError);

  const [booting, setBooting] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [syncState, setSyncState] = useState(syncEngine.getState());

  const isConnected = serverConnection?.status === 'connected';

  const hydrateLocalNotes = useCallback(async () => {
    const fullNotes = await database.getAllNotesWithContent();
    setNotes(fullNotes);
  }, [setNotes]);

  useEffect(() => {
    let canceled = false;

    const bootstrap = async () => {
      setBooting(true);
      try {
        await database.initDatabase();
        await hydrateLocalNotes();

        const restored = await api.restoreConnection();
        if (!canceled) {
          setServerConnection(restored);
        }
      } catch (error) {
        if (!canceled) {
          setUiError(error instanceof Error ? error.message : 'Failed to initialize app');
        }
      } finally {
        if (!canceled) {
          setBooting(false);
        }
      }
    };

    void bootstrap();
    const unsubscribe = syncEngine.subscribe((nextState) => setSyncState(nextState));

    return () => {
      canceled = true;
      unsubscribe();
    };
  }, [hydrateLocalNotes, setServerConnection, setUiError]);

  useEffect(() => {
    let disposed = false;

    const initializeSync = async () => {
      syncEngine.disconnect();
      if (!serverConnection || serverConnection.status !== 'connected' || !autoSync) {
        return;
      }

      await syncEngine.initialize(serverConnection);
      if (!disposed) {
        syncEngine.startPeriodicSync(syncInterval);
      }
    };

    void initializeSync().catch((error) => {
      setUiError(error instanceof Error ? error.message : 'Failed to initialize sync');
    });

    return () => {
      disposed = true;
      syncEngine.disconnect();
    };
  }, [
    autoSync,
    serverConnection,
    setUiError,
    syncInterval,
  ]);

  const visibleNotes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return notes.filter((note) => {
      if (activeFilter === 'favorites' && !note.isFavorite) return false;
      if (activeFilter === 'dirty' && !note.isDirty) return false;

      if (!query) return true;

      const searchable = [note.title, note.content, note.folder, ...note.tags].join(' ').toLowerCase();
      return searchable.includes(query);
    });
  }, [activeFilter, notes, searchQuery]);

  const [leftColumn, rightColumn] = useMemo(() => {
    const left: LocalNote[] = [];
    const right: LocalNote[] = [];
    let leftHeight = 0;
    let rightHeight = 0;

    visibleNotes.forEach((note) => {
      const estimate =
        120 + Math.min(note.content.length, 180) * 0.18 + Math.min(note.title.length, 50) * 0.6;
      if (leftHeight <= rightHeight) {
        left.push(note);
        leftHeight += estimate;
      } else {
        right.push(note);
        rightHeight += estimate;
      }
    });

    return [left, right];
  }, [visibleNotes]);

  const stats = useMemo(
    () => ({
      all: notes.length,
      favorites: notes.filter((note) => note.isFavorite).length,
      dirty: notes.filter((note) => note.isDirty).length,
    }),
    [notes]
  );

  const triggerHaptic = useCallback(async () => {
    if (!hapticFeedback) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [hapticFeedback]);

  const openEditor = useCallback(
    async (note?: LocalNote) => {
      await triggerHaptic();
      if (note) {
        router.push({ pathname: '/editor', params: { path: encodeURIComponent(note.path) } });
        return;
      }
      router.push('/editor');
    },
    [router, triggerHaptic]
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (isConnected) {
        await syncEngine.sync();
        if (serverConnection) {
          setServerConnection({
            ...serverConnection,
            lastSyncAt: new Date().toISOString(),
            status: 'connected',
          });
        }
      }
      await hydrateLocalNotes();
    } catch (error) {
      setUiError(error instanceof Error ? error.message : 'Sync failed');
    } finally {
      setRefreshing(false);
    }
  }, [hydrateLocalNotes, isConnected, serverConnection, setServerConnection, setUiError]);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl onRefresh={refresh} refreshing={refreshing} />}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient colors={['#1D4ED8', '#0EA5E9', '#22C55E']} style={styles.hero}>
          <View style={styles.heroTopRow}>
            <View>
              <Text style={styles.brand}>Mino Notes</Text>
              <Text style={styles.subtitle}>Capture fast. Organize visually. Sync anywhere.</Text>
            </View>

            <View style={styles.topActions}>
              <Pressable onPress={() => router.push('/connect')} style={styles.iconButton}>
                <Ionicons color="#FFFFFF" name={isConnected ? 'cloud-done' : 'cloud-offline'} size={20} />
              </Pressable>
              <Pressable onPress={() => router.push('/settings')} style={styles.iconButton}>
                <Ionicons color="#FFFFFF" name="settings-outline" size={20} />
              </Pressable>
            </View>
          </View>

          <View style={styles.searchWrap}>
            <Ionicons color="#64748B" name="search" size={18} />
            <TextInput
              onChangeText={setSearchQuery}
              placeholder="Search notes, tags, folders"
              placeholderTextColor="#94A3B8"
              style={styles.searchInput}
              value={searchQuery}
            />
          </View>

          <View style={styles.chipsRow}>
            <FilterChip active={activeFilter === 'all'} label={`All ${stats.all}`} onPress={() => setActiveFilter('all')} />
            <FilterChip
              active={activeFilter === 'favorites'}
              label={`Starred ${stats.favorites}`}
              onPress={() => setActiveFilter('favorites')}
            />
            <FilterChip
              active={activeFilter === 'dirty'}
              label={`Unsynced ${stats.dirty}`}
              onPress={() => setActiveFilter('dirty')}
            />
          </View>
        </LinearGradient>

        {!isConnected ? (
          <Pressable onPress={() => router.push('/connect')} style={styles.banner}>
            <Ionicons color="#0F766E" name="link-outline" size={20} />
            <View style={styles.bannerTextWrap}>
              <Text style={styles.bannerTitle}>Connect your relay or server</Text>
              <Text style={styles.bannerText}>Pair with a code, or paste server URL + API key.</Text>
            </View>
            <Ionicons color="#0F766E" name="chevron-forward" size={18} />
          </Pressable>
        ) : (
          <View style={styles.syncPill}>
            {syncState.isSyncing ? <ActivityIndicator color="#1D4ED8" size="small" /> : <Ionicons color="#1D4ED8" name="sync" size={16} />}
            <Text style={styles.syncText}>
              {syncState.lastSyncAt
                ? `Last sync ${new Date(syncState.lastSyncAt).toLocaleTimeString()}`
                : 'Connected to relay'}
            </Text>
          </View>
        )}

        {booting ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator color="#1D4ED8" size="large" />
            <Text style={styles.loaderText}>Loading your workspace</Text>
          </View>
        ) : visibleNotes.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons color="#94A3B8" name="sparkles-outline" size={28} />
            <Text style={styles.emptyTitle}>Start your first note</Text>
            <Text style={styles.emptyText}>Use the + button to create a note card, just like Keep.</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            <View style={styles.column}>{leftColumn.map((note) => <NoteCard key={note.path} note={note} onPress={openEditor} />)}</View>
            <View style={styles.column}>{rightColumn.map((note) => <NoteCard key={note.path} note={note} onPress={openEditor} />)}</View>
          </View>
        )}
      </ScrollView>

      <Pressable onPress={() => openEditor()} style={styles.fab}>
        <Ionicons color="#FFFFFF" name="add" size={26} />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#F8FAFC',
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 112,
  },
  hero: {
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    marginBottom: 16,
    overflow: 'hidden',
    paddingBottom: 18,
    paddingHorizontal: 18,
    paddingTop: 10,
  },
  heroTopRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  brand: {
    color: '#FFFFFF',
    fontSize: 31,
    fontWeight: '800',
    letterSpacing: -0.7,
  },
  subtitle: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  topActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF24',
    borderColor: '#FFFFFF3A',
    borderRadius: 14,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  searchWrap: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  searchInput: {
    color: '#0F172A',
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    paddingVertical: 0,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  banner: {
    alignItems: 'center',
    backgroundColor: '#CCFBF1',
    borderColor: '#5EEAD4',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 2,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  bannerTextWrap: {
    flex: 1,
  },
  bannerTitle: {
    color: '#0F766E',
    fontSize: 14,
    fontWeight: '700',
  },
  bannerText: {
    color: '#0F766E',
    fontSize: 12,
    marginTop: 1,
  },
  syncPill: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#DBEAFE',
    borderColor: '#93C5FD',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  syncText: {
    color: '#1D4ED8',
    fontSize: 12,
    fontWeight: '700',
  },
  loaderWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 72,
  },
  loaderText: {
    color: '#64748B',
    marginTop: 10,
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 20,
    borderWidth: 1,
    marginHorizontal: 16,
    marginTop: 40,
    padding: 20,
  },
  emptyTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 6,
  },
  emptyText: {
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    paddingHorizontal: 16,
  },
  column: {
    flex: 1,
  },
  fab: {
    alignItems: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 999,
    bottom: 26,
    height: 58,
    justifyContent: 'center',
    position: 'absolute',
    right: 20,
    shadowColor: '#1D4ED8',
    shadowOffset: { width: 0, height: 9 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    width: 58,
  },
});
