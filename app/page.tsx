// /home/user/LockIn/app/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { format, getDayOfYear } from 'date-fns'
import { Plus, TrendingUp, TrendingDown, Minus, CalendarDays } from 'lucide-react'
import clsx from 'clsx'

import { useUserStore } from '@/store/useUserStore'
import { useBodyStore } from '@/store/useBodyStore'
import { useCalendarStore } from '@/store/useCalendarStore'
import { useHabitsStore } from '@/store/useHabitsStore'
import { useNotesStore } from '@/store/useNotesStore'
import { quotes } from '@/constants/quotes'
import Modal from '@/components/Modal'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function getTodayQuote() {
  const day = getDayOfYear(new Date())
  return quotes[day % quotes.length]
}

const CATEGORY_COLORS: Record<string, string> = {
  Work: '#60A5FA',
  Health: '#4ADE80',
  Personal: '#A78BFA',
  Other: '#8B8FA8',
}

const HABIT_COLORS = ['#C8F04A', '#FF6B6B', '#60A5FA', '#A78BFA', '#4ADE80', '#FACC15', '#38BDF8', '#F97316']

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function HomePage() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // Quick add modal states
  const [weightModal, setWeightModal] = useState(false)
  const [mealModal, setMealModal] = useState(false)
  const [noteModal, setNoteModal] = useState(false)
  const [habitModal, setHabitModal] = useState(false)

  // Weight form
  const [weightInput, setWeightInput] = useState('')

  // Meal form
  const [mealName, setMealName] = useState('')
  const [mealCals, setMealCals] = useState('')
  const [mealProtein, setMealProtein] = useState('')
  const [mealCarbs, setMealCarbs] = useState('')
  const [mealFat, setMealFat] = useState('')

  // Note form
  const [noteTitle, setNoteTitle] = useState('')
  const [noteContent, setNoteContent] = useState('')

  // Habit form
  const [habitName, setHabitName] = useState('')
  const [habitColor, setHabitColor] = useState('#C8F04A')

  const { name, unit, dailyCalorieGoal } = useUserStore()
  const { getTodayCalories, getWeightTrend, weightEntries, addWeightEntry, addMeal } = useBodyStore()
  const { getEventsForDate } = useCalendarStore()
  const { getTodayHabits, getCurrentStreak, getLongestStreak, addHabit } = useHabitsStore()
  const { addNote } = useNotesStore()

  if (!mounted) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const todayEvents = getEventsForDate(todayStr).slice(0, 3)
  const todayCalories = getTodayCalories()
  const caloriesRemaining = Math.max(0, dailyCalorieGoal - todayCalories)
  const trend = getWeightTrend()
  const sortedWeights = [...weightEntries].sort(
    (a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime()
  )
  const latestWeight = sortedWeights[0] ?? null

  const todayHabits = getTodayHabits()
  const firstHabit = todayHabits[0]
  const currentStreak = firstHabit ? getCurrentStreak(firstHabit.id) : 0
  const longestStreak = firstHabit ? getLongestStreak(firstHabit.id) : 0

  const quote = getTodayQuote()

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const trendColor = trend === 'up' ? '#FF6B6B' : trend === 'down' ? '#4ADE80' : '#4A4D62'

  // Handlers
  const handleSaveWeight = () => {
    const w = parseFloat(weightInput)
    if (!isNaN(w) && w > 0) {
      addWeightEntry(w, unit)
      setWeightInput('')
      setWeightModal(false)
    }
  }

  const handleSaveMeal = () => {
    if (!mealName.trim() || !mealCals.trim()) return
    addMeal({
      name: mealName.trim(),
      calories: parseInt(mealCals) || 0,
      protein: mealProtein ? parseFloat(mealProtein) : undefined,
      carbs: mealCarbs ? parseFloat(mealCarbs) : undefined,
      fat: mealFat ? parseFloat(mealFat) : undefined,
    })
    setMealName(''); setMealCals(''); setMealProtein(''); setMealCarbs(''); setMealFat('')
    setMealModal(false)
  }

  const handleSaveNote = () => {
    if (!noteTitle.trim() && !noteContent.trim()) return
    addNote({ title: noteTitle.trim(), content: noteContent.trim(), pinned: false })
    setNoteTitle(''); setNoteContent('')
    setNoteModal(false)
  }

  const handleSaveHabit = () => {
    if (!habitName.trim()) return
    addHabit({ name: habitName.trim(), icon: 'flame', color: habitColor, frequency: 'daily', graceDay: false, archived: false })
    setHabitName('')
    setHabitModal(false)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 py-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6"
      >
        <h1 className="font-syne text-2xl font-bold text-textPrimary">
          {getGreeting()}{name ? `, ${name}` : ''} 👋
        </h1>
        <p className="text-textSecondary text-sm mt-1">
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </p>
      </motion.div>

      {/* Quote card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="bg-surface rounded-2xl border border-bdr p-5 mb-5 border-l-4"
        style={{ borderLeftColor: '#C8F04A' }}
      >
        <p className="text-textPrimary text-sm italic leading-relaxed mb-2">
          &ldquo;{quote.quote}&rdquo;
        </p>
        <p className="text-textMuted text-xs font-medium">— {quote.author}</p>
      </motion.div>

      {/* Today's Events */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="mb-5"
      >
        <h2 className="font-syne text-xs font-bold text-textSecondary uppercase tracking-wider mb-3">
          Today's Schedule
        </h2>
        <div className="bg-surface rounded-2xl border border-bdr p-4">
          {todayEvents.length === 0 ? (
            <div className="flex items-center gap-3 py-2">
              <CalendarDays size={18} className="text-textMuted" />
              <span className="text-textSecondary text-sm">All clear today 🎉</span>
            </div>
          ) : (
            <div className="space-y-3">
              {todayEvents.map((event) => {
                const catColor = CATEGORY_COLORS[event.category] ?? '#8B8FA8'
                return (
                  <div key={event.id} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: catColor }} />
                    <div>
                      <p className="text-textPrimary text-sm font-semibold leading-tight">{event.title}</p>
                      <p className="text-textMuted text-xs mt-0.5">
                        {format(new Date(event.startTime), 'h:mm a')} · {event.category}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </motion.div>

      {/* Body + Habits row */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="grid grid-cols-2 gap-3 mb-5"
      >
        {/* Body widget */}
        <div className="bg-surface rounded-2xl border border-bdr p-4">
          <p className="text-xs text-textMuted uppercase tracking-wider font-medium mb-3">Body</p>
          <p className="font-syne text-2xl font-bold text-textPrimary">{caloriesRemaining}</p>
          <p className="text-textMuted text-xs mt-0.5">kcal remaining</p>
          {latestWeight && (
            <div className="flex items-center gap-1 mt-3">
              <span className="font-semibold text-textPrimary text-sm">{latestWeight.weight}</span>
              <span className="text-textMuted text-xs">{latestWeight.unit}</span>
              <TrendIcon size={14} style={{ color: trendColor }} className="ml-0.5" />
            </div>
          )}
        </div>

        {/* Habits widget */}
        <div className="bg-surface rounded-2xl border border-bdr p-4">
          <p className="text-xs text-textMuted uppercase tracking-wider font-medium mb-3">Habits</p>
          {firstHabit ? (
            <>
              <p className="font-syne text-2xl font-bold text-coral">{currentStreak} 🔥</p>
              <p className="text-textMuted text-xs mt-0.5">day streak</p>
              <p className="text-textSecondary text-xs mt-2 truncate">{firstHabit.name}</p>
              <p className="text-textMuted text-xs mt-0.5">Best: {longestStreak} days</p>
            </>
          ) : (
            <p className="text-textSecondary text-sm">No habits yet</p>
          )}
        </div>
      </motion.div>

      {/* Quick Add */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="mb-5"
      >
        <h2 className="font-syne text-xs font-bold text-textSecondary uppercase tracking-wider mb-3">
          Quick Add
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: '+ Weight', color: '#C8F04A', onClick: () => setWeightModal(true) },
            { label: '+ Meal', color: '#4ADE80', onClick: () => setMealModal(true) },
            { label: '+ Note', color: '#60A5FA', onClick: () => setNoteModal(true) },
            { label: '+ Habit', color: '#FF6B6B', onClick: () => setHabitModal(true) },
          ].map((btn) => (
            <button
              key={btn.label}
              onClick={btn.onClick}
              className="flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl bg-surfaceElevated border border-bdr text-sm font-semibold transition-all hover:border-accent hover:text-accent"
              style={{ color: btn.color }}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ── Modals ── */}

      {/* Weight modal */}
      <Modal visible={weightModal} onClose={() => setWeightModal(false)} title="Log Weight" size="sm">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-textMuted uppercase tracking-wider font-medium mb-1.5 block">
              Weight ({unit})
            </label>
            <input
              type="number"
              placeholder={unit === 'kg' ? '75.0' : '165'}
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveWeight()}
              autoFocus
              className="w-full"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setWeightModal(false)}
              className="flex-1 py-3 rounded-xl bg-surfaceElevated border border-bdr text-textSecondary font-semibold text-sm hover:text-textPrimary transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveWeight}
              className="flex-1 py-3 rounded-xl bg-accent text-black font-syne font-bold text-sm hover:opacity-90 transition-opacity"
            >
              Save
            </button>
          </div>
        </div>
      </Modal>

      {/* Meal modal */}
      <Modal visible={mealModal} onClose={() => setMealModal(false)} title="Add Meal" size="sm">
        <div className="space-y-3">
          <div>
            <label className="text-xs text-textMuted uppercase tracking-wider font-medium mb-1.5 block">Meal Name</label>
            <input
              type="text"
              placeholder="e.g. Chicken & rice"
              value={mealName}
              onChange={(e) => setMealName(e.target.value)}
              autoFocus
              className="w-full"
            />
          </div>
          <div>
            <label className="text-xs text-textMuted uppercase tracking-wider font-medium mb-1.5 block">Calories</label>
            <input
              type="number"
              placeholder="400"
              value={mealCals}
              onChange={(e) => setMealCals(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-textMuted mb-1 block">Protein (g)</label>
              <input type="number" placeholder="30" value={mealProtein} onChange={(e) => setMealProtein(e.target.value)} className="w-full" />
            </div>
            <div>
              <label className="text-xs text-textMuted mb-1 block">Carbs (g)</label>
              <input type="number" placeholder="40" value={mealCarbs} onChange={(e) => setMealCarbs(e.target.value)} className="w-full" />
            </div>
            <div>
              <label className="text-xs text-textMuted mb-1 block">Fat (g)</label>
              <input type="number" placeholder="10" value={mealFat} onChange={(e) => setMealFat(e.target.value)} className="w-full" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setMealModal(false)} className="flex-1 py-3 rounded-xl bg-surfaceElevated border border-bdr text-textSecondary font-semibold text-sm hover:text-textPrimary transition-colors">
              Cancel
            </button>
            <button onClick={handleSaveMeal} className="flex-1 py-3 rounded-xl bg-accent text-black font-syne font-bold text-sm hover:opacity-90 transition-opacity">
              Save
            </button>
          </div>
        </div>
      </Modal>

      {/* Note modal */}
      <Modal visible={noteModal} onClose={() => setNoteModal(false)} title="Add Note" size="sm">
        <div className="space-y-3">
          <div>
            <label className="text-xs text-textMuted uppercase tracking-wider font-medium mb-1.5 block">Title</label>
            <input type="text" placeholder="Note title" value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} autoFocus className="w-full" />
          </div>
          <div>
            <label className="text-xs text-textMuted uppercase tracking-wider font-medium mb-1.5 block">Content</label>
            <textarea
              placeholder="Write something..."
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              rows={4}
              className="w-full resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setNoteModal(false)} className="flex-1 py-3 rounded-xl bg-surfaceElevated border border-bdr text-textSecondary font-semibold text-sm hover:text-textPrimary transition-colors">
              Cancel
            </button>
            <button onClick={handleSaveNote} className="flex-1 py-3 rounded-xl bg-accent text-black font-syne font-bold text-sm hover:opacity-90 transition-opacity">
              Save
            </button>
          </div>
        </div>
      </Modal>

      {/* Habit modal */}
      <Modal visible={habitModal} onClose={() => setHabitModal(false)} title="Add Habit" size="sm">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-textMuted uppercase tracking-wider font-medium mb-1.5 block">Habit Name</label>
            <input type="text" placeholder="e.g. Morning workout" value={habitName} onChange={(e) => setHabitName(e.target.value)} autoFocus className="w-full" />
          </div>
          <div>
            <label className="text-xs text-textMuted uppercase tracking-wider font-medium mb-2 block">Color</label>
            <div className="flex gap-2 flex-wrap">
              {HABIT_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setHabitColor(c)}
                  className={clsx(
                    'w-8 h-8 rounded-full transition-all',
                    habitColor === c ? 'ring-2 ring-offset-2 ring-offset-surfaceElevated ring-white scale-110' : 'opacity-70 hover:opacity-100'
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setHabitModal(false)} className="flex-1 py-3 rounded-xl bg-surfaceElevated border border-bdr text-textSecondary font-semibold text-sm hover:text-textPrimary transition-colors">
              Cancel
            </button>
            <button onClick={handleSaveHabit} className="flex-1 py-3 rounded-xl bg-accent text-black font-syne font-bold text-sm hover:opacity-90 transition-opacity">
              Save
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
