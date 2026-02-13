import { Ionicons } from '@expo/vector-icons';
import { slugify } from '@mino-ink/shared';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Markdown from 'react-native-markdown-display';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as database from '@/services/database';
import { syncEngine } from '@/services/sync';
import { useNotesStore, useSettingsStore } from '@/stores';
import type { LocalNote } from '@/types';

function countWords(content: string): number {
  return content
    .replace(/[#*_`\[\]]/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;
}

function folderFromPath(path: string): string {
  const parts = path.split('/');
  parts.pop();
  return parts.join('/');
}

function buildPath(title: string, defaultFolder: string): string {
  const slug = slugify(title) || 'untitled';
  const suffix = Date.now().toString().slice(-5);
  const fileName = `${slug}-${suffix}.md`;
  const folder = defaultFolder.trim().replace(/^\/+|\/+$/g, '');
  return folder ? `${folder}/${fileName}` : fileName;
}

export default function EditorScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ path?: string }>();

  const decodedPath = useMemo(() => {
    if (typeof params.path !== 'string') return undefined;
    try {
      return decodeURIComponent(params.path);
    } catch {
      return params.path;
    }
  }, [params.path]);

  const noteFromStore = useNotesStore((state) => (decodedPath ? state.notes[decodedPath] : undefined));
  const addNote = useNotesStore((state) => state.addNote);
  const updateNoteInStore = useNotesStore((state) => state.updateNote);

  const defaultFolder = useSettingsStore((state) => state.defaultFolder);
  const showPreviewByDefault = useSettingsStore((state) => state.showPreview);

  const [loading, setLoading] = useState(Boolean(decodedPath));
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [favorite, setFavorite] = useState(false);
  const [preview, setPreview] = useState(showPreviewByDefault);
  const [existingNote, setExistingNote] = useState<LocalNote | null>(null);

  useEffect(() => {
    setPreview(showPreviewByDefault);
  }, [showPreviewByDefault]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!decodedPath) {
        setLoading(false);
        return;
      }

      const local = noteFromStore ?? (await database.getNote(decodedPath));
      if (cancelled) return;

      if (!local) {
        setLoading(false);
        return;
      }

      setExistingNote(local);
      setTitle(local.title);
      setContent(local.content);
      setFavorite(local.isFavorite);
      setLoading(false);
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [decodedPath, noteFromStore]);

  const save = useCallback(async () => {
    if (saving) return;

    setSaving(true);
    try {
      const trimmedTitle = title.trim() || 'Untitled';
      const now = new Date().toISOString();
      const isExisting = Boolean(existingNote);

      const finalPath = existingNote?.path ?? decodedPath ?? buildPath(trimmedTitle, defaultFolder);
      const next: LocalNote = {
        path: finalPath,
        title: trimmedTitle,
        content,
        folder: folderFromPath(finalPath),
        tags: existingNote?.tags ?? [],
        links: existingNote?.links ?? [],
        backlinks: existingNote?.backlinks ?? [],
        checksum: existingNote?.checksum ?? null,
        frontmatter: existingNote?.frontmatter ?? null,
        wordCount: countWords(content),
        isDirty: true,
        isFavorite: favorite,
        syncVersion: (existingNote?.syncVersion ?? 0) + 1,
        createdAt: existingNote?.createdAt ?? now,
        updatedAt: now,
      };

      if (isExisting) {
        await database.updateNote(finalPath, next);
        updateNoteInStore(finalPath, next);
        await syncEngine.queueNote(finalPath, 'update');
      } else {
        await database.createNote(next);
        addNote(next);
        await syncEngine.queueNote(finalPath, 'create');
      }

      router.back();
    } finally {
      setSaving(false);
    }
  }, [
    addNote,
    content,
    decodedPath,
    defaultFolder,
    existingNote,
    favorite,
    router,
    saving,
    title,
    updateNoteInStore,
  ]);

  if (loading) {
    return (
      <SafeAreaView style={styles.loaderSafeArea}>
        <View style={styles.loaderWrap}>
          <ActivityIndicator color="#1D4ED8" size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <LinearGradient colors={['#1D4ED8', '#0EA5E9']} style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.headerIconButton}>
            <Ionicons color="#FFFFFF" name="arrow-back" size={21} />
          </Pressable>

          <Text style={styles.headerTitle}>{decodedPath ? 'Edit Note' : 'New Note'}</Text>

          <Pressable onPress={save} style={styles.saveButton}>
            {saving ? <ActivityIndicator color="#1D4ED8" size="small" /> : <Text style={styles.saveText}>Save</Text>}
          </Pressable>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', android: undefined })}
        keyboardVerticalOffset={Platform.select({ ios: 12, android: 0 })}
        style={styles.editorArea}
      >
        <View style={styles.toolbar}>
          <Pressable onPress={() => setFavorite((value) => !value)} style={styles.toolbarButton}>
            <Ionicons color={favorite ? '#B45309' : '#64748B'} name={favorite ? 'star' : 'star-outline'} size={18} />
            <Text style={styles.toolbarText}>{favorite ? 'Starred' : 'Star'}</Text>
          </Pressable>

          <Pressable onPress={() => setPreview((value) => !value)} style={styles.toolbarButton}>
            <Ionicons color="#475569" name={preview ? 'create-outline' : 'eye-outline'} size={18} />
            <Text style={styles.toolbarText}>{preview ? 'Write' : 'Preview'}</Text>
          </Pressable>

          <View style={styles.wordCountPill}>
            <Text style={styles.wordCountText}>{countWords(content)} words</Text>
          </View>
        </View>

        <TextInput
          onChangeText={setTitle}
          placeholder="Title"
          placeholderTextColor="#94A3B8"
          style={styles.titleInput}
          value={title}
        />

        {preview ? (
          <ScrollView style={styles.previewWrap}>
            <Markdown>{content || '*Start writing to preview markdown*'}</Markdown>
          </ScrollView>
        ) : (
          <TextInput
            multiline
            onChangeText={setContent}
            placeholder="Write your note..."
            placeholderTextColor="#94A3B8"
            style={styles.bodyInput}
            textAlignVertical="top"
            value={content}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#F8FAFC',
    flex: 1,
  },
  loaderSafeArea: {
    backgroundColor: '#F8FAFC',
    flex: 1,
  },
  loaderWrap: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingBottom: 12,
    paddingHorizontal: 16,
    paddingTop: 6,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerIconButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF1F',
    borderColor: '#FFFFFF50',
    borderRadius: 12,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  saveButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    height: 38,
    justifyContent: 'center',
    minWidth: 74,
    paddingHorizontal: 12,
  },
  saveText: {
    color: '#1D4ED8',
    fontSize: 14,
    fontWeight: '700',
  },
  editorArea: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  toolbar: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  toolbarButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  toolbarText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '600',
  },
  wordCountPill: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderRadius: 999,
    borderWidth: 1,
    marginLeft: 'auto',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  wordCountText: {
    color: '#1D4ED8',
    fontSize: 12,
    fontWeight: '600',
  },
  titleInput: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 16,
    borderWidth: 1,
    color: '#0F172A',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  bodyInput: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 16,
    borderWidth: 1,
    color: '#1E293B',
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    paddingHorizontal: 14,
    paddingTop: 14,
  },
  previewWrap: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 10,
  },
});
