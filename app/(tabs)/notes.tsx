import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Alert,
  FlatList,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { format } from 'date-fns';

import { colors, notebookColors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { formatRelativeTime } from '@/utils/dateHelpers';

import { useNotesStore } from '@/store/useNotesStore';
import type { Note, Notebook } from '@/store/useNotesStore';

// ─── Note Editor Modal ────────────────────────────────────────────────────────

interface NoteEditorProps {
  visible: boolean;
  note: Note | null;
  notebooks: Notebook[];
  onClose: () => void;
  onSave: (title: string, content: string, notebookId?: string) => void;
}

function NoteEditor({ visible, note, notebooks, onClose, onSave }: NoteEditorProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [notebookId, setNotebookId] = useState<string | undefined>(undefined);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      setTitle(note?.title ?? '');
      setContent(note?.content ?? '');
      setNotebookId(note?.notebookId ?? undefined);
    }
  }, [visible, note]);

  const triggerAutoSave = useCallback(
    (newTitle: string, newContent: string, nbId?: string) => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = setTimeout(() => {
        onSave(newTitle, newContent, nbId);
      }, 500);
    },
    [onSave]
  );

  const handleTitleChange = (t: string) => {
    setTitle(t);
    triggerAutoSave(t, content, notebookId);
  };

  const handleContentChange = (c: string) => {
    setContent(c);
    triggerAutoSave(title, c, notebookId);
  };

  const handleNotebookSelect = (id: string | undefined) => {
    setNotebookId(id);
    triggerAutoSave(title, content, id);
  };

  const handleSaveAndClose = () => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    onSave(title, content, notebookId);
    onClose();
  };

  const insertBold = () => {
    setContent((prev) => prev + '**bold**');
    triggerAutoSave(title, content + '**bold**', notebookId);
  };

  const insertBullet = () => {
    setContent((prev) => (prev.endsWith('\n') || prev === '' ? prev + '- ' : prev + '\n- '));
    triggerAutoSave(title, content + '\n- ', notebookId);
  };

  const insertCheckbox = () => {
    setContent((prev) => (prev.endsWith('\n') || prev === '' ? prev + '[ ] ' : prev + '\n[ ] '));
    triggerAutoSave(title, content + '\n[ ] ', notebookId);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={editorStyles.safeArea} edges={['top', 'bottom']}>
        {/* Top bar */}
        <View style={editorStyles.topBar}>
          <TouchableOpacity onPress={handleSaveAndClose} style={editorStyles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
            <Text style={editorStyles.backBtnText}>Done</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={editorStyles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Title */}
          <TextInput
            style={editorStyles.titleInput}
            placeholder="Title"
            placeholderTextColor={colors.textMuted}
            value={title}
            onChangeText={handleTitleChange}
            autoFocus={!note}
            multiline={false}
            returnKeyType="next"
            onSubmitEditing={() => contentRef.current?.focus()}
          />

          {/* Content */}
          <TextInput
            ref={contentRef}
            style={editorStyles.contentInput}
            placeholder="Start writing..."
            placeholderTextColor={colors.textMuted}
            value={content}
            onChangeText={handleContentChange}
            multiline
            textAlignVertical="top"
          />

          {/* Notebook picker */}
          <Text style={editorStyles.notebookLabel}>Notebook</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
            <TouchableOpacity
              style={[
                editorStyles.nbChip,
                !notebookId && editorStyles.nbChipActive,
              ]}
              onPress={() => handleNotebookSelect(undefined)}
            >
              <Text style={[editorStyles.nbChipText, !notebookId && editorStyles.nbChipTextActive]}>
                None
              </Text>
            </TouchableOpacity>
            {notebooks.map((nb) => (
              <TouchableOpacity
                key={nb.id}
                style={[
                  editorStyles.nbChip,
                  notebookId === nb.id && { backgroundColor: `${nb.color}33`, borderColor: nb.color },
                ]}
                onPress={() => handleNotebookSelect(nb.id)}
              >
                <Text style={[editorStyles.nbChipText, notebookId === nb.id && { color: nb.color }]}>
                  {nb.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </ScrollView>

        {/* Toolbar */}
        <View style={editorStyles.toolbar}>
          <TouchableOpacity style={editorStyles.toolBtn} onPress={insertBold}>
            <Text style={editorStyles.toolBtnText}>B</Text>
          </TouchableOpacity>
          <TouchableOpacity style={editorStyles.toolBtn} onPress={insertBullet}>
            <Ionicons name="list" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={editorStyles.toolBtn} onPress={insertCheckbox}>
            <Ionicons name="checkbox-outline" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
          <TouchableOpacity onPress={handleSaveAndClose} style={editorStyles.saveBtn}>
            <Text style={editorStyles.saveBtnText}>Save</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const editorStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtnText: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
    marginLeft: 4,
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 20,
  },
  titleInput: {
    fontFamily: typography.fontHeading,
    fontSize: typography.sizes['2xl'],
    color: colors.textPrimary,
    paddingTop: 20,
    paddingBottom: 12,
  },
  contentInput: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
    lineHeight: 24,
    minHeight: 300,
    paddingBottom: 20,
  },
  notebookLabel: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  nbChip: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginRight: 8,
  },
  nbChipActive: {
    backgroundColor: `${colors.accent}22`,
    borderColor: colors.accent,
  },
  nbChipText: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  nbChipTextActive: {
    color: colors.accent,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    gap: 8,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
  },
  toolBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolBtnText: {
    fontFamily: typography.fontHeading,
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
  },
  saveBtn: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveBtnText: {
    fontFamily: typography.fontHeading,
    fontSize: typography.sizes.sm,
    color: '#000',
  },
});

// ─── Note Card ────────────────────────────────────────────────────────────────

function NoteCard({
  note,
  notebooks,
  onPress,
  onLongPress,
  onDelete,
}: {
  note: Note;
  notebooks: Notebook[];
  onPress: () => void;
  onLongPress: () => void;
  onDelete: () => void;
}) {
  const notebook = notebooks.find((nb) => nb.id === note.notebookId);
  const borderColor = notebook?.color ?? colors.border;
  const previewLines = note.content.split('\n').filter(Boolean).slice(0, 3).join('\n');

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [cardStyles.card, pressed && { opacity: 0.8 }]}
    >
      <View style={[cardStyles.topBorder, { backgroundColor: borderColor }]} />
      <View style={cardStyles.cardBody}>
        {note.pinned && (
          <Ionicons name="pin" size={12} color={colors.accent} style={cardStyles.pinIcon} />
        )}
        <Text style={cardStyles.title} numberOfLines={1}>{note.title || 'Untitled'}</Text>
        {previewLines.length > 0 && (
          <Text style={cardStyles.preview} numberOfLines={3}>{previewLines}</Text>
        )}
        <View style={cardStyles.footer}>
          <Text style={cardStyles.timestamp}>{formatRelativeTime(note.updatedAt)}</Text>
          <TouchableOpacity onPress={onDelete} hitSlop={8}>
            <Ionicons name="trash-outline" size={15} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>
    </Pressable>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    margin: 5,
    overflow: 'hidden',
  },
  topBorder: {
    height: 3,
    width: '100%',
  },
  cardBody: {
    padding: 12,
  },
  pinIcon: {
    marginBottom: 4,
  },
  title: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
    fontWeight: '700',
    marginBottom: 6,
  },
  preview: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    lineHeight: 17,
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timestamp: {
    fontFamily: typography.fontBody,
    fontSize: 10,
    color: colors.textMuted,
  },
});

// ─── Main Component ──────────────────────────────────────────────────────────

export default function NotesScreen() {
  const { notes, notebooks, addNote, updateNote, deleteNote, togglePin, searchNotes, getNotesByNotebook } = useNotesStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNotebook, setSelectedNotebook] = useState<string | 'all'>('all');
  const [editorVisible, setEditorVisible] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  // Filtered notes
  const filteredNotes = (() => {
    let result = searchQuery.trim() ? searchNotes(searchQuery) : notes;
    if (selectedNotebook !== 'all') {
      result = result.filter((n) => n.notebookId === selectedNotebook);
    }
    return result;
  })();

  const pinnedNotes = filteredNotes.filter((n) => n.pinned);
  const unpinnedNotes = filteredNotes.filter((n) => !n.pinned);

  const openNewNote = useCallback(() => {
    setEditingNote(null);
    setEditorVisible(true);
  }, []);

  const openNote = useCallback((note: Note) => {
    setEditingNote(note);
    setEditorVisible(true);
  }, []);

  const handleLongPress = useCallback((note: Note) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      note.title || 'Untitled',
      undefined,
      [
        {
          text: note.pinned ? 'Unpin' : 'Pin',
          onPress: () => {
            togglePin(note.id);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          },
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteNote(note.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  }, [togglePin, deleteNote]);

  const handleDelete = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Delete Note', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteNote(id);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  }, [deleteNote]);

  const handleSave = useCallback(
    (title: string, content: string, nbId?: string) => {
      if (editingNote) {
        updateNote(editingNote.id, { title, content, notebookId: nbId });
      } else {
        if (title.trim() || content.trim()) {
          const newNote = addNote({ title, content, notebookId: nbId, pinned: false });
          setEditingNote(newNote);
        }
      }
    },
    [editingNote, addNote, updateNote]
  );

  const handleEditorClose = useCallback(() => {
    setEditorVisible(false);
    setEditingNote(null);
  }, []);

  const renderNoteCard = useCallback(
    ({ item }: { item: Note }) => (
      <NoteCard
        note={item}
        notebooks={notebooks}
        onPress={() => openNote(item)}
        onLongPress={() => handleLongPress(item)}
        onDelete={() => handleDelete(item.id)}
      />
    ),
    [notebooks, openNote, handleLongPress, handleDelete]
  );

  const totalCount = filteredNotes.length;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Notes</Text>
        <TouchableOpacity style={styles.newNoteBtn} onPress={openNewNote}>
          <Ionicons name="add" size={20} color="#000" />
          <Text style={styles.newNoteBtnText}>New</Text>
        </TouchableOpacity>
      </View>

      {/* ── Search bar ── */}
      <View style={styles.searchRow}>
        <Ionicons name="search" size={17} color={colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search notes..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
      </View>

      {/* ── Notebook filter chips ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.notebookScroll}
        contentContainerStyle={styles.notebookChips}
      >
        <TouchableOpacity
          style={[styles.nbFilterChip, selectedNotebook === 'all' && styles.nbFilterChipActive]}
          onPress={() => setSelectedNotebook('all')}
        >
          <Text style={[styles.nbFilterChipText, selectedNotebook === 'all' && styles.nbFilterChipTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        {notebooks.map((nb) => (
          <TouchableOpacity
            key={nb.id}
            style={[
              styles.nbFilterChip,
              selectedNotebook === nb.id && { backgroundColor: `${nb.color}22`, borderColor: nb.color },
            ]}
            onPress={() => setSelectedNotebook(nb.id)}
          >
            <View style={[styles.nbColorDot, { backgroundColor: nb.color }]} />
            <Text
              style={[
                styles.nbFilterChipText,
                selectedNotebook === nb.id && { color: nb.color },
              ]}
            >
              {nb.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── Notes List ── */}
      {totalCount === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📝</Text>
          <Text style={styles.emptyTitle}>No notes yet</Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery ? 'No results for your search.' : 'Tap "New" to capture your first thought.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={[
            ...(pinnedNotes.length > 0 ? [{ type: 'header', id: 'pinned-header', label: 'Pinned' }] : []),
            ...pinnedNotes.map((n) => ({ type: 'note', id: n.id, note: n })),
            ...(unpinnedNotes.length > 0 ? [{ type: 'header', id: 'all-header', label: 'Notes' }] : []),
            ...unpinnedNotes.map((n) => ({ type: 'note', id: n.id, note: n })),
          ] as any[]}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            if (item.type === 'header') {
              return (
                <View style={styles.listSectionHeader}>
                  <Text style={styles.listSectionHeaderText}>{item.label}</Text>
                </View>
              );
            }
            return (
              <NoteCard
                note={item.note}
                notebooks={notebooks}
                onPress={() => openNote(item.note)}
                onLongPress={() => handleLongPress(item.note)}
                onDelete={() => handleDelete(item.note.id)}
              />
            );
          }}
        />
      )}

      {/* ── Note Editor ── */}
      <NoteEditor
        visible={editorVisible}
        note={editingNote}
        notebooks={notebooks}
        onClose={handleEditorClose}
        onSave={handleSave}
      />
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
  },
  screenTitle: {
    fontFamily: typography.fontHeading,
    fontSize: typography.sizes['3xl'],
    color: colors.textPrimary,
  },
  newNoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 4,
  },
  newNoteBtnText: {
    fontFamily: typography.fontHeading,
    fontSize: typography.sizes.sm,
    color: '#000',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
    paddingVertical: 11,
  },
  notebookScroll: {
    marginBottom: 8,
  },
  notebookChips: {
    paddingHorizontal: 20,
    paddingBottom: 6,
    gap: 8,
  },
  nbFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginRight: 8,
  },
  nbFilterChipActive: {
    backgroundColor: `${colors.accent}22`,
    borderColor: colors.accent,
  },
  nbFilterChipText: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  nbFilterChipTextActive: {
    color: colors.accent,
  },
  nbColorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  listContent: {
    paddingHorizontal: 15,
    paddingBottom: 100,
  },
  columnWrapper: {
    justifyContent: 'flex-start',
  },
  listSectionHeader: {
    width: '100%',
    paddingHorizontal: 5,
    paddingVertical: 8,
  },
  listSectionHeaderText: {
    fontFamily: typography.fontHeading,
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 52,
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: typography.fontHeading,
    fontSize: typography.sizes.xl,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
