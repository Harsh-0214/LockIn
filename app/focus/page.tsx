// /home/user/LockIn/app/focus/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { Plus, ChevronDown, ChevronUp, Archive, Trash2, Trophy } from 'lucide-react'
import clsx from 'clsx'

import { useHabitsStore } from '@/store/useHabitsStore'
import type { Habit } from '@/store/useHabitsStore'
import Modal from '@/components/Modal'
import StreakGrid from '@/components/StreakGrid'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const HABIT_COLORS = [
  '#C8F04A', '#FF6B6B', '#60A5FA', '#A78BFA',
  '#4ADE80', '#FACC15', '#38BDF8', '#F97316',
]

const DAY_CHIPS = [
  { label: 'Mo', value: 'mon' },
  { label: 'Tu', value: 'tue' },
  { label: 'We', value: 'wed' },
  { label: 'Th', value: 'thu' },
  { label: 'Fr', value: 'fri' },
  { label: 'Sa', value: 'sat' },
  { label: 'Su', value: 'sun' },
]

function getMilestoneMessage(streak: number): string | null {
  if (streak >= 30) return "30 day milestone! You're unstoppable!"
  if (streak >= 21) return '21 days — habit officially formed!'
  if (streak >= 7) return '7 day streak! Keep the momentum!'
  if (streak >= 3) return '3 days in — great start!'
  return null
}

// ---------------------------------------------------------------------------
// Add Habit Modal content
// ---------------------------------------------------------------------------

interface AddHabitFormProps {
  onSave: (habit: Omit<Habit, 'id' | 'createdAt'>) => void
  onClose: () => void
}

function AddHabitForm({ onSave, onClose }: AddHabitFormProps) {
  const [name, setName] = useState('')
  const [color, setColor] = useState(HABIT_COLORS[0])
  const [isDaily, setIsDaily] = useState(true)
  const [selectedDays, setSelectedDays] = useState<string[]>(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'])

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

  const handleSave = () => {
    if (!name.trim()) return
    const frequency = isDaily ? 'daily' : selectedDays.join(',')
    onSave({
      name: name.trim(),
      icon: 'flame',
      color,
      frequency,
      graceDay: false,
      archived: false,
    })
    onClose()
  }

  return (
    <div className="space-y-4">
      {/* Name */}
      <div>
        <label className="text-xs text-textMuted uppercase tracking-wider font-medium mb-1.5 block">
          Habit Name
        </label>
        <input
          type="text"
          placeholder="e.g. Morning workout"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          autoFocus
          className="w-full"
        />
      </div>

      {/* Color picker */}
      <div>
        <label className="text-xs text-textMuted uppercase tracking-wider font-medium mb-2 block">
          Color
        </label>
        <div className="flex gap-2 flex-wrap">
          {HABIT_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={clsx(
                'w-8 h-8 rounded-full transition-all',
                color === c
                  ? 'ring-2 ring-offset-2 ring-offset-surfaceElevated ring-white scale-110'
                  : 'opacity-60 hover:opacity-100'
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      {/* Frequency */}
      <div>
        <label className="text-xs text-textMuted uppercase tracking-wider font-medium mb-2 block">
          Frequency
        </label>
        <div className="flex gap-2 bg-surface rounded-xl p-1 border border-bdr mb-3">
          {[
            { label: 'Every day', value: true },
            { label: 'Custom', value: false },
          ].map((opt) => (
            <button
              key={String(opt.value)}
              onClick={() => setIsDaily(opt.value)}
              className={clsx(
                'flex-1 py-2 rounded-lg text-sm font-semibold transition-all',
                isDaily === opt.value
                  ? 'bg-accent/20 text-accent border border-accent/40'
                  : 'text-textSecondary hover:text-textPrimary'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {!isDaily && (
          <div className="flex gap-1.5 flex-wrap">
            {DAY_CHIPS.map((d) => {
              const selected = selectedDays.includes(d.value)
              return (
                <button
                  key={d.value}
                  onClick={() => toggleDay(d.value)}
                  className={clsx(
                    'w-10 h-10 rounded-full text-xs font-bold border transition-all',
                    selected
                      ? 'border-accent/60 text-accent'
                      : 'border-bdr text-textMuted hover:text-textPrimary'
                  )}
                  style={selected ? { backgroundColor: `${color}22` } : undefined}
                >
                  {d.label}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={onClose}
          className="flex-1 py-3 rounded-xl bg-surfaceElevated border border-bdr text-textSecondary font-semibold text-sm hover:text-textPrimary transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!name.trim()}
          className={clsx(
            'flex-1 py-3 rounded-xl font-syne font-bold text-sm transition-opacity',
            name.trim()
              ? 'bg-accent text-black hover:opacity-90'
              : 'bg-surfaceElevated text-textMuted cursor-not-allowed'
          )}
        >
          Save Habit
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Habit Detail Modal
// ---------------------------------------------------------------------------

interface HabitDetailProps {
  habit: Habit
  onClose: () => void
  onArchive: () => void
  onDelete: () => void
}

function HabitDetail({ habit, onClose, onArchive, onDelete }: HabitDetailProps) {
  const { getCurrentStreak, getLongestStreak, getCompletionRate, habitLogs } = useHabitsStore()

  const currentStreak = getCurrentStreak(habit.id)
  const longestStreak = getLongestStreak(habit.id)
  const completionRate = getCompletionRate(habit.id, 30)
  const milestone = getMilestoneMessage(currentStreak)

  const completedDates = habitLogs
    .filter((l) => l.habitId === habit.id)
    .map((l) => l.completedAt)

  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <div>
      {/* Header */}
      <div className="text-center mb-5">
        <div
          className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center text-2xl"
          style={{ backgroundColor: `${habit.color}22` }}
        >
          🔥
        </div>
        <h3 className="font-syne text-xl font-bold text-textPrimary">{habit.name}</h3>
        <p className="text-textSecondary text-sm mt-1">
          {habit.frequency === 'daily' ? 'Every day' : habit.frequency}
        </p>
      </div>

      {/* Milestone */}
      {milestone && (
        <div
          className="rounded-xl border p-3 mb-4 text-center"
          style={{ backgroundColor: `${habit.color}11`, borderColor: `${habit.color}33` }}
        >
          <p className="text-sm font-semibold" style={{ color: habit.color }}>
            🏆 {milestone}
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 bg-surface rounded-xl border border-bdr mb-5 overflow-hidden">
        {[
          { label: 'Current', value: currentStreak, color: '#FF6B6B', suffix: '🔥' },
          { label: 'Longest', value: longestStreak, color: '#C8F04A', suffix: '' },
          { label: '30-day', value: `${Math.round(completionRate * 100)}%`, color: '#4ADE80', suffix: '' },
        ].map((stat, i) => (
          <div key={stat.label} className={clsx('text-center py-4', i > 0 && 'border-l border-bdr')}>
            <p className="font-syne text-xl font-bold" style={{ color: stat.color }}>
              {stat.value}{stat.suffix}
            </p>
            <p className="text-textMuted text-xs mt-1">{stat.label}<br />streak</p>
          </div>
        ))}
      </div>

      {/* Streak grid */}
      <div className="mb-5">
        <p className="text-xs text-textSecondary uppercase tracking-wider font-medium mb-3">
          Last 30 Days
        </p>
        <StreakGrid completedDates={completedDates} color={habit.color} />
      </div>

      {/* Action buttons */}
      {!confirmDelete ? (
        <div className="flex gap-2">
          <button
            onClick={onArchive}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-warning text-sm font-semibold transition-colors hover:bg-warning/5"
            style={{ borderColor: '#FACC1544', backgroundColor: '#FACC1511' }}
          >
            <Archive size={16} /> Archive
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-coral text-sm font-semibold transition-colors hover:bg-coral/5"
            style={{ borderColor: '#FF6B6B44', backgroundColor: '#FF6B6B11' }}
          >
            <Trash2 size={16} /> Delete
          </button>
        </div>
      ) : (
        <div className="bg-coral/10 border border-coral/30 rounded-xl p-4">
          <p className="text-textPrimary text-sm font-semibold mb-3 text-center">
            Delete &ldquo;{habit.name}&rdquo; permanently?
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmDelete(false)}
              className="flex-1 py-2.5 rounded-lg bg-surfaceElevated border border-bdr text-textSecondary text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={onDelete}
              className="flex-1 py-2.5 rounded-lg bg-coral text-black text-sm font-bold"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function FocusPage() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const {
    habits,
    getTodayHabits,
    toggleHabitLog,
    isHabitCompleted,
    getCurrentStreak,
    getCompletionRate,
    areAllTodayHabitsDone,
    addHabit,
    archiveHabit,
    updateHabit,
    deleteHabit,
  } = useHabitsStore()

  const [addModalOpen, setAddModalOpen] = useState(false)
  const [detailHabit, setDetailHabit] = useState<Habit | null>(null)
  const [archivedExpanded, setArchivedExpanded] = useState(false)

  if (!mounted) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const today = format(new Date(), 'yyyy-MM-dd')
  const todayHabits = getTodayHabits()
  const archivedHabits = habits.filter((h) => h.archived)
  const activeHabits = habits.filter((h) => !h.archived)
  const allDone = areAllTodayHabitsDone()

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-syne text-3xl font-bold text-textPrimary">Habits</h1>
        <button
          onClick={() => setAddModalOpen(true)}
          className="w-10 h-10 rounded-xl bg-accent text-black flex items-center justify-center hover:opacity-90 transition-opacity"
        >
          <Plus size={20} strokeWidth={2.5} />
        </button>
      </div>

      {/* All done banner */}
      <AnimatePresence>
        {allDone && todayHabits.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex items-center gap-3 bg-success/10 border border-success/30 rounded-2xl p-4 mb-5"
          >
            <Trophy size={20} className="text-success flex-shrink-0" />
            <p className="text-success font-bold text-sm">All done! You crushed today! 🎉</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Today section */}
      <div className="mb-6">
        <h2 className="font-syne text-xs font-bold text-textSecondary uppercase tracking-wider mb-3">
          Today — {format(new Date(), 'EEEE, MMM d')}
        </h2>
        {todayHabits.length === 0 ? (
          <div className="bg-surface rounded-2xl border border-bdr p-8 text-center">
            <div className="text-4xl mb-3">🎯</div>
            <p className="font-syne text-lg font-bold text-textPrimary mb-1">No habits yet</p>
            <p className="text-textSecondary text-sm">Tap + to create your first habit.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {todayHabits.map((habit) => {
              const completed = isHabitCompleted(habit.id, today)
              const streak = getCurrentStreak(habit.id)
              return (
                <motion.div
                  key={habit.id}
                  layout
                  className={clsx(
                    'flex items-center gap-3 bg-surface rounded-2xl border border-bdr p-4 cursor-pointer hover:border-bdr/70 transition-colors',
                    completed && 'opacity-60'
                  )}
                  onClick={() => setDetailHabit(habit)}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${habit.color}22` }}
                  >
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: habit.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={clsx('text-sm font-semibold truncate', completed ? 'text-textMuted line-through' : 'text-textPrimary')}>
                      {habit.name}
                    </p>
                    <p className="text-textMuted text-xs mt-0.5">
                      {habit.frequency === 'daily' ? 'Daily' : habit.frequency}
                    </p>
                  </div>
                  {streak > 0 && (
                    <div
                      className="px-2.5 py-1 rounded-full text-xs font-bold flex-shrink-0"
                      style={{ backgroundColor: '#FF6B6B22', color: '#FF6B6B' }}
                    >
                      🔥 {streak}
                    </div>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleHabitLog(habit.id, today)
                    }}
                    className="w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                    style={completed
                      ? { backgroundColor: habit.color, borderColor: habit.color }
                      : { borderColor: '#4A4D62' }
                    }
                  >
                    {completed && (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M2 7L5.5 10.5L12 3.5" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* All habits section */}
      {activeHabits.length > 0 && (
        <div className="mb-6">
          <h2 className="font-syne text-xs font-bold text-textSecondary uppercase tracking-wider mb-3">
            All Habits
          </h2>
          <div className="space-y-2">
            {activeHabits.map((habit) => {
              const rate = getCompletionRate(habit.id, 30)
              const streak = getCurrentStreak(habit.id)
              return (
                <div
                  key={habit.id}
                  className="flex items-center gap-3 bg-surface rounded-xl border border-bdr p-3.5 cursor-pointer hover:border-bdr/70 transition-colors"
                  onClick={() => setDetailHabit(habit)}
                >
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: habit.color }} />
                  <p className="flex-1 text-sm font-medium text-textPrimary truncate">{habit.name}</p>
                  <span className="text-textMuted text-xs">{Math.round(rate * 100)}%</span>
                  <span className="text-xs" style={{ color: '#FF6B6B' }}>🔥 {streak}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Archived section */}
      {archivedHabits.length > 0 && (
        <div>
          <button
            className="flex items-center justify-between w-full py-3 border-t border-bdr text-textMuted hover:text-textPrimary transition-colors"
            onClick={() => setArchivedExpanded((v) => !v)}
          >
            <span className="text-sm font-semibold">Archived ({archivedHabits.length})</span>
            {archivedExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <AnimatePresence>
            {archivedExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="space-y-2 pb-4 pt-2">
                  {archivedHabits.map((habit) => (
                    <div
                      key={habit.id}
                      className="flex items-center gap-3 bg-surface rounded-xl border border-bdr p-3 opacity-60"
                    >
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: habit.color }} />
                      <p className="flex-1 text-sm text-textMuted truncate">{habit.name}</p>
                      <button
                        onClick={() => updateHabit(habit.id, { archived: false })}
                        className="text-xs text-accent hover:underline font-semibold"
                      >
                        Unarchive
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Add Habit Modal */}
      <Modal visible={addModalOpen} onClose={() => setAddModalOpen(false)} title="New Habit" size="md">
        <AddHabitForm
          onSave={(data) => {
            addHabit(data)
            setAddModalOpen(false)
          }}
          onClose={() => setAddModalOpen(false)}
        />
      </Modal>

      {/* Detail Modal */}
      <Modal
        visible={!!detailHabit}
        onClose={() => setDetailHabit(null)}
        title={detailHabit?.name}
        size="md"
      >
        {detailHabit && (
          <HabitDetail
            habit={detailHabit}
            onClose={() => setDetailHabit(null)}
            onArchive={() => {
              archiveHabit(detailHabit.id)
              setDetailHabit(null)
            }}
            onDelete={() => {
              deleteHabit(detailHabit.id)
              setDetailHabit(null)
            }}
          />
        )}
      </Modal>
    </div>
  )
}
