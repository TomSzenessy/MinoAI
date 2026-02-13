import { Ionicons } from '@expo/vector-icons';
import { toRelativeTime } from '@mino-ink/shared';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { LocalNote } from '@/types';

interface NoteCardProps {
  note: LocalNote;
  onPress: (note: LocalNote) => void;
}

const CARD_COLORS = ['#FFF2B3', '#E6F4EA', '#FCE8E6', '#E8F0FE', '#F3E8FD', '#FFEFD8'];

function hashString(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

function excerptFor(note: LocalNote): string {
  const fallback = note.folder ? `Folder: ${note.folder}` : 'Tap to start writing';
  const source = note.content.trim();
  if (!source) return fallback;
  return source.replace(/[#*_`>-]/g, '').replace(/\s+/g, ' ').trim();
}

export function NoteCard({ note, onPress }: NoteCardProps) {
  const color = CARD_COLORS[hashString(note.path) % CARD_COLORS.length] ?? CARD_COLORS[0];
  const excerpt = excerptFor(note);
  const updatedText = toRelativeTime(note.updatedAt);

  return (
    <Pressable
      onPress={() => onPress(note)}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: color, transform: [{ scale: pressed ? 0.985 : 1 }] },
      ]}
    >
      <View style={styles.headerRow}>
        <Text style={styles.title} numberOfLines={3}>
          {note.title || 'Untitled'}
        </Text>
        <View style={styles.badges}>
          {note.isFavorite ? <Ionicons color="#E37400" name="star" size={16} /> : null}
          {note.isDirty ? <Ionicons color="#B42318" name="cloud-offline" size={16} /> : null}
        </View>
      </View>

      <Text style={styles.excerpt} numberOfLines={6}>
        {excerpt}
      </Text>

      <View style={styles.footer}>
        <Text style={styles.meta}>{updatedText}</Text>
        {note.tags.length > 0 ? (
          <Text style={styles.meta} numberOfLines={1}>
            #{note.tags[0]}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    marginBottom: 12,
    minHeight: 132,
    paddingHorizontal: 14,
    paddingVertical: 14,
    shadowColor: '#0F172A',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 7 },
    shadowRadius: 16,
    elevation: 4,
  },
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  badges: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginLeft: 10,
  },
  title: {
    color: '#1F2937',
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  excerpt: {
    color: '#334155',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 'auto',
  },
  meta: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default NoteCard;
