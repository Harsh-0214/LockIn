// /home/user/LockIn/app/notes/page.tsx
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { Plus, Search, Pin, Trash2, Bold, List, Square } from 'lucide-react'
import clsx from 'clsx'

import { useNotesStore } from '@/store/useNotesStore'
import type { Note } from '@/store/useNotesStore'
import Modal from '@/components/Modal'

// ---------------------------------------------------------------------------
// Note Editor Modal
// ---------------------------------------------------------------------------

interface NoteEditorProps {
  note: Note | null
  onClose: () => void
}

function NoteEditor({ note, onClose }: NoteEditorProps) {
  const { updateNote, addNote, notebooks } = useNotesStore()
  const [title, setTitle] = useState(note?.title ?? '')
  const [content, setContent] = useState(note?.content ?? '')
  const [notebookId, setNotebookId] = useState(note?.notebookId ?? '')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isNew = !note

  // Auto-save with debounce
  const scheduleSave = useCallback(
    (t: string, c: string, nb: string) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(() => {
        if (!isNew && note) {
          updateNote(note.id, {
            title: t,
            content: c,
            notebookId: nb || undefined,
          })
        }
      }, 500)
    },
    [isNew, note, updateNote]
  )

  const handleTitleChange = (v: string) => {
    setTitle(v)
    scheduleSave(v, content, notebookId)
  }

  const handleContentChange = (v: string) => {
    setContent(v)
    scheduleSave(title, v, notebookId)
  }

  const handleNotebookChange = (v: string) => {
    setNotebookId(v)
    scheduleSave(title, content, v)
  }

  const handleSaveNew = () => {
    if (!title.trim() && !content.trim()) {
      onClose()
      return
    }
    addNote({
      title: title.trim(),
      content,
      notebookId: notebookId || undefined,
      pinned: false,
    })
    onClose()
  }

  const insertFormatting = (type: 'bold' | 'bullet' | 'checkbox') => {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const selected = content.slice(start, end)
    let insert = ''
    if (type === 'bold') insert = `**${selected || 'text'}**`
    if (type === 'bullet') insert = `\n• ${selected}`
    if (type === 'checkbox') insert = `\n☐ ${selected}`
    const newContent = content.slice(0, start) + insert + content.slice(end)
    setContent(newContent)
    scheduleSave(title, newContent, notebookId)
    requestAnimationFrame(() => {
      ta.setSelectionRange(start + insert.length, start + insert.length)
      ta.focus()
    })
  }

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [])

  return (
    <div className="flex flex-col gap-4">
      {/* Title */}
      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => handleTitleChange(e.target.value)}
        className="w-full text-lg font-syne font-bold bg-transparent border-none outline-none p-0 text-textPrimary placeholder-textMuted focus:outline-none"
        style={{ border: 'none', backgroundColor: 'transparent', padding: 0 }}
      />

      {/* Notebook selector */}
      <select
        value={notebookId}
        onChange={(e) => handleNotebookChange(e.target.value)}
        className="w-full text-sm"
      >
        <option value="">No notebook</option>
        {notebooks.map((nb) => (
          <option key={nb.id} value={nb.id}>
            {nb.name}
          </option>
        ))}
      </select>

      {/* Formatting toolbar */}
      <div className="flex items-center gap-1 border-b border-bdr pb-3">
        <button
          onClick={() => insertFormatting('bold')}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-textSecondary hover:text-textPrimary hover:bg-surfaceElevated transition-colors"
          title="Bold"
        >
          <Bold size={15} />
        </button>
        <button
          onClick={() => insertFormatting('bullet')}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-textSecondary hover:text-textPrimary hover:bg-surfaceElevated transition-colors"
          title="Bullet list"
        >
          <List size={15} />
        </button>
        <button
          onClick={() => insertFormatting('checkbox')}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-textSecondary hover:text-textPrimary hover:bg-surfaceElevated transition-colors"
          title="Checkbox"
        >
          <Square size={15} />
        </button>
        {!isNew && (
          <span className="ml-auto text-xs text-textMuted">Auto-saved</span>
        )}
      </div>

      {/* Content */}
      <textarea
        ref={textareaRef}
        placeholder="Start writing..."
        value={content}
        onChange={(e) => handleContentChange(e.target.value)}
        rows={12}
        className="w-full resize-none text-sm text-textPrimary bg-transparent border-none outline-none leading-relaxed"
        style={{ border: 'none', backgroundColor: 'transparent', padding: 0 }}
      />

      {isNew && (
        <div className="flex gap-3 pt-2 border-t border-bdr">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-surfaceElevated border border-bdr text-textSecondary text-sm font-semibold">
            Discard
          </button>
          <button onClick={handleSaveNew} className="flex-1 py-3 rounded-xl bg-accent text-black font-syne font-bold text-sm">
            Save Note
          </button>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function NotesPage() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const { notes, notebooks, togglePin, deleteNote } = useNotesStore()
  const [search, setSearch] = useState('')
  const [activeNotebook, setActiveNotebook] = useState<string | null>(null)
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [newNoteModal, setNewNoteModal] = useState(false)
  const [contextMenu, setContextMenu] = useState<{ note: Note; x: number; y: number } | null>(null)

  // Close context menu on click
  useEffect(() => {
    const close = () => setContextMenu(null)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [])

  if (!mounted) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Filter notes
  let filtered = notes
  if (search.trim()) {
    const q = search.toLowerCase()
    filtered = filtered.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q)
    )
  }
  if (activeNotebook) {
    filtered = filtered.filter((n) => n.notebookId === activeNotebook)
  }

  // Pinned first
  const sorted = [
    ...filtered.filter((n) => n.pinned),
    ...filtered.filter((n) => !n.pinned),
  ]

  const getNotebookColor = (id?: string) => {
    if (!id) return '#4A4D62'
    return notebooks.find((nb) => nb.id === id)?.color ?? '#4A4D62'
  }

  const handleContextMenu = (e: React.MouseEvent, note: Note) => {
    e.preventDefault()
    setContextMenu({ note, x: e.clientX, y: e.clientY })
  }

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-syne text-3xl font-bold text-textPrimary">Notes</h1>
        <button
          onClick={() => setNewNoteModal(true)}
          className="w-10 h-10 rounded-xl bg-accent text-black flex items-center justify-center hover:opacity-90 transition-opacity"
        >
          <Plus size={20} strokeWidth={2.5} />
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
        <input
          type="text"
          placeholder="Search notes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4"
        />
      </div>

      {/* Notebook filters */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveNotebook(null)}
          className={clsx(
            'px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all',
            !activeNotebook
              ? 'bg-accent/20 border-accent/50 text-accent'
              : 'bg-surfaceElevated border-bdr text-textSecondary hover:text-textPrimary'
          )}
        >
          All
        </button>
        {notebooks.map((nb) => (
          <button
            key={nb.id}
            onClick={() => setActiveNotebook(nb.id === activeNotebook ? null : nb.id)}
            className={clsx(
              'px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all'
            )}
            style={
              activeNotebook === nb.id
                ? { backgroundColor: `${nb.color}22`, borderColor: `${nb.color}55`, color: nb.color }
                : { backgroundColor: '#1E2030', borderColor: '#2A2D40', color: '#8B8FA8' }
            }
          >
            {nb.name}
          </button>
        ))}
      </div>

      {/* Notes grid */}
      {sorted.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">📝</div>
          <p className="font-syne text-lg font-bold text-textPrimary mb-1">No notes yet</p>
          <p className="text-textSecondary text-sm">Tap + to create your first note.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {sorted.map((note) => {
            const nbColor = getNotebookColor(note.notebookId)
            const nb = notebooks.find((n) => n.id === note.notebookId)
            return (
              <motion.div
                key={note.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-surface rounded-2xl border border-bdr p-4 cursor-pointer hover:border-bdr/60 transition-colors relative group"
                onClick={() => setSelectedNote(note)}
                onContextMenu={(e) => handleContextMenu(e, note)}
              >
                {/* Notebook color bar */}
                <div
                  className="absolute top-0 left-0 w-1 h-full rounded-l-2xl"
                  style={{ backgroundColor: nbColor }}
                />
                <div className="pl-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-textPrimary text-sm leading-tight line-clamp-1 flex-1">
                      {note.title || 'Untitled'}
                    </h3>
                    {note.pinned && <Pin size={12} className="text-accent flex-shrink-0 mt-0.5" />}
                  </div>
                  {note.content && (
                    <p className="text-textSecondary text-xs leading-relaxed line-clamp-2 mb-2">
                      {note.content}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    {nb && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: `${nb.color}22`, color: nb.color }}>
                        {nb.name}
                      </span>
                    )}
                    <span className="text-textMuted text-[10px] ml-auto">
                      {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Context menu */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed z-50 bg-surfaceElevated border border-bdr rounded-xl shadow-2xl py-1 min-w-[150px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-textPrimary hover:bg-surface transition-colors"
              onClick={() => {
                togglePin(contextMenu.note.id)
                setContextMenu(null)
              }}
            >
              <Pin size={14} />
              {contextMenu.note.pinned ? 'Unpin' : 'Pin'}
            </button>
            <button
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-coral hover:bg-surface transition-colors"
              onClick={() => {
                deleteNote(contextMenu.note.id)
                setContextMenu(null)
              }}
            >
              <Trash2 size={14} />
              Delete
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Note editor modal (existing) */}
      <Modal
        visible={!!selectedNote}
        onClose={() => setSelectedNote(null)}
        size="lg"
      >
        {selectedNote && (
          <NoteEditor note={selectedNote} onClose={() => setSelectedNote(null)} />
        )}
      </Modal>

      {/* New note modal */}
      <Modal
        visible={newNoteModal}
        onClose={() => setNewNoteModal(false)}
        title="New Note"
        size="lg"
      >
        <NoteEditor note={null} onClose={() => setNewNoteModal(false)} />
      </Modal>
    </div>
  )
}
