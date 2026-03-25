import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  NativeSyntheticEvent,
  TextInputSelectionChangeEventData,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNotesStore, Note, Notebook } from '@/store/useNotesStore';

// ---------------------------------------------------------------------------
// Design tokens
// ---------------------------------------------------------------------------

const COLORS = {
  bg: '#0D0F1A',
  surface: '#161824',
  surfaceElevated: '#1E2030',
  border: '#2A2D40',
  accent: '#C8F04A',
  coral: '#FF6B6B',
  success: '#4ADE80',
  textPrimary: '#FFFFFF',
  textSecondary: '#8B8FA8',
  textMuted: '#4A4D62',
};

// ---------------------------------------------------------------------------
// Toolbar button definitions
// ---------------------------------------------------------------------------

interface ToolbarAction {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}

const TOOLBAR_ACTIONS: ToolbarAction[] = [
  { id: 'bold', icon: 'text', label: 'Bold' },
  { id: 'bullet', icon: 'list', label: 'Bullet' },
  { id: 'checkbox', icon: 'checkbox-outline', label: 'Checkbox' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Wraps the selected text (or inserts at cursor) with markdown bold syntax. */
function applyBold(text: string, selection: { start: number; end: number }): string {
  const { start, end } = selection;
  if (start === end) {
    // No selection — insert placeholder bold text at cursor
    return text.slice(0, start) + '**bold**' + text.slice(end);
  }
  const selected = text.slice(start, end);
  return text.slice(0, start) + `**${selected}**` + text.slice(end);
}

/** Prepends "- " to the current line (determined by cursor position). */
function applyBullet(text: string, selection: { start: number; end: number }): string {
  const { start } = selection;
  // Find start of the current line
  const lineStart = text.lastIndexOf('\n', start - 1) + 1;
  return text.slice(0, lineStart) + '- ' + text.slice(lineStart);
}

/** Prepends "[ ] " to the current line. */
function applyCheckbox(text: string, selection: { start: number; end: number }): string {
  const { start } = selection;
  const lineStart = text.lastIndexOf('\n', start - 1) + 1;
  return text.slice(0, lineStart) + '[ ] ' + text.slice(lineStart);
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function NoteEditorScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ noteId?: string }>();
  const noteId = params.noteId ?? 'new';

  const { notes, notebooks, addNote, updateNote } = useNotesStore();

  // Resolve existing note (if editing)
  const existingNote: Note | undefined =
    noteId !== 'new' ? notes.find((n) => n.id === noteId) : undefined;

  // Editor state
  const [title, setTitle] = useState(existingNote?.title ?? '');
  const [content, setContent] = useState(existingNote?.content ?? '');
  const [selectedNotebookId, setSelectedNotebookId] = useState<string | undefined>(
    existingNote?.notebookId
  );

  // Track content input selection for toolbar actions
  const selectionRef = useRef<{ start: number; end: number }>({ start: 0, end: 0 });

  // Ref to the content TextInput for programmatic text manipulation
  const contentInputRef = useRef<TextInput>(null);

  // Auto-save debounce
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedNoteIdRef = useRef<string | null>(noteId !== 'new' ? noteId : null);

  // -------------------------------------------------------------------------
  // Auto-save logic (debounced, 500 ms)
  // -------------------------------------------------------------------------

  const persistNote = useCallback(
    (nextTitle: string, nextContent: string, nextNotebookId: string | undefined) => {
      if (savedNoteIdRef.current) {
        // Update existing
        updateNote(savedNoteIdRef.current, {
          title: nextTitle,
          content: nextContent,
          notebookId: nextNotebookId,
        });
      } else {
        // Create new note and capture the generated id for future updates
        const newNote = addNote({
          title: nextTitle,
          content: nextContent,
          notebookId: nextNotebookId,
          pinned: false,
        });
        savedNoteIdRef.current = newNote.id;
      }
    },
    [addNote, updateNote]
  );

  const scheduleSave = useCallback(
    (nextTitle: string, nextContent: string, nextNotebookId: string | undefined) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        persistNote(nextTitle, nextContent, nextNotebookId);
      }, 500);
    },
    [persistNote]
  );

  // Trigger auto-save whenever title / content / notebook changes
  useEffect(() => {
    scheduleSave(title, content, selectedNotebookId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, content, selectedNotebookId]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  // -------------------------------------------------------------------------
  // Toolbar actions
  // -------------------------------------------------------------------------

  const handleToolbarAction = useCallback(
    (actionId: string) => {
      const sel = selectionRef.current;
      let nextContent = content;

      if (actionId === 'bold') {
        nextContent = applyBold(content, sel);
      } else if (actionId === 'bullet') {
        nextContent = applyBullet(content, sel);
      } else if (actionId === 'checkbox') {
        nextContent = applyCheckbox(content, sel);
      }

      setContent(nextContent);
    },
    [content]
  );

  const handleSelectionChange = useCallback(
    (e: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => {
      selectionRef.current = e.nativeEvent.selection;
    },
    []
  );

  // -------------------------------------------------------------------------
  // Done / back — flush pending save and go back
  // -------------------------------------------------------------------------

  const handleDone = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    // Flush immediately
    if (title.trim() || content.trim()) {
      persistNote(title, content, selectedNotebookId);
    }
    router.back();
  }, [title, content, selectedNotebookId, persistNote]);

  // -------------------------------------------------------------------------
  // Notebook selector
  // -------------------------------------------------------------------------

  const handleSelectNotebook = useCallback(
    (nbId: string | undefined) => {
      setSelectedNotebookId(nbId);
    },
    []
  );

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleDone}
          style={styles.headerBackButton}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          {savedNoteIdRef.current ? (
            <Text style={styles.headerSavedBadge}>Saved</Text>
          ) : (
            <Text style={styles.headerNewBadge}>New Note</Text>
          )}
        </View>

        <TouchableOpacity
          onPress={handleDone}
          style={styles.headerDoneButton}
          activeOpacity={0.8}
        >
          <Text style={styles.headerDoneText}>Done</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.editorScrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Title input */}
          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={setTitle}
            placeholder="Title"
            placeholderTextColor={COLORS.textMuted}
            selectionColor={COLORS.accent}
            returnKeyType="next"
            multiline={false}
          />

          {/* Notebook selector */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.notebookChipsRow}
          >
            {/* "None" chip */}
            <TouchableOpacity
              key="none"
              onPress={() => handleSelectNotebook(undefined)}
              style={[
                styles.notebookChip,
                selectedNotebookId === undefined && styles.notebookChipSelected,
              ]}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.notebookChipText,
                  selectedNotebookId === undefined && styles.notebookChipTextSelected,
                ]}
              >
                No Notebook
              </Text>
            </TouchableOpacity>

            {notebooks.map((nb: Notebook) => (
              <TouchableOpacity
                key={nb.id}
                onPress={() => handleSelectNotebook(nb.id)}
                style={[
                  styles.notebookChip,
                  selectedNotebookId === nb.id && styles.notebookChipSelected,
                  selectedNotebookId === nb.id && { borderColor: nb.color },
                ]}
                activeOpacity={0.8}
              >
                <View
                  style={[styles.notebookDot, { backgroundColor: nb.color }]}
                />
                <Text
                  style={[
                    styles.notebookChipText,
                    selectedNotebookId === nb.id && styles.notebookChipTextSelected,
                  ]}
                >
                  {nb.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Content textarea */}
          <TextInput
            ref={contentInputRef}
            style={styles.contentInput}
            value={content}
            onChangeText={setContent}
            onSelectionChange={handleSelectionChange}
            placeholder="Start writing..."
            placeholderTextColor={COLORS.textMuted}
            selectionColor={COLORS.accent}
            multiline
            textAlignVertical="top"
            scrollEnabled={false}
          />
        </ScrollView>

        {/* Toolbar */}
        <View
          style={[
            styles.toolbar,
            { paddingBottom: Math.max(insets.bottom, 8) },
          ]}
        >
          {TOOLBAR_ACTIONS.map((action) => (
            <TouchableOpacity
              key={action.id}
              onPress={() => handleToolbarAction(action.id)}
              style={styles.toolbarButton}
              activeOpacity={0.7}
            >
              <Ionicons
                name={action.icon}
                size={20}
                color={COLORS.textSecondary}
              />
              <Text style={styles.toolbarButtonLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}

          {/* Keyboard dismiss shortcut */}
          <TouchableOpacity
            onPress={() => contentInputRef.current?.blur()}
            style={styles.toolbarButton}
            activeOpacity={0.7}
          >
            <Ionicons
              name="chevron-down"
              size={20}
              color={COLORS.textSecondary}
            />
            <Text style={styles.toolbarButtonLabel}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerBackButton: {
    padding: 4,
    width: 40,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerSavedBadge: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: COLORS.success,
  },
  headerNewBadge: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: COLORS.textMuted,
  },
  headerDoneButton: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: COLORS.accent,
    borderRadius: 10,
  },
  headerDoneText: {
    fontFamily: 'Syne_700Bold',
    fontSize: 14,
    color: COLORS.bg,
  },
  // Editor
  editorScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
    flexGrow: 1,
  },
  titleInput: {
    fontFamily: 'Syne_700Bold',
    fontSize: 26,
    color: COLORS.textPrimary,
    paddingVertical: 0,
    marginBottom: 16,
    lineHeight: 34,
  },
  // Notebook chips
  notebookChipsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 20,
    paddingRight: 20,
  },
  notebookChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  notebookChipSelected: {
    borderColor: COLORS.accent,
    backgroundColor: 'rgba(200,240,74,0.1)',
  },
  notebookDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  notebookChipText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  notebookChipTextSelected: {
    color: COLORS.accent,
  },
  // Content
  contentInput: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 16,
    color: COLORS.textPrimary,
    lineHeight: 26,
    paddingVertical: 0,
    minHeight: 300,
  },
  // Toolbar
  toolbar: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: 8,
    paddingTop: 8,
    gap: 4,
  },
  toolbarButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    gap: 3,
  },
  toolbarButtonLabel: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 10,
    color: COLORS.textMuted,
  },
});
