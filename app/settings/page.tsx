// /home/user/LockIn/app/settings/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Download, Trash2, Plus, X } from 'lucide-react'
import clsx from 'clsx'

import { useUserStore } from '@/store/useUserStore'
import Modal from '@/components/Modal'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const AVATAR_EMOJIS = [
  '🧑', '👦', '👧', '👨', '👩', '🧔', '👱', '🧕',
  '🦸', '🦹', '🧙', '🧝', '🧜', '🧚', '👼', '🎅',
  '🦊', '🐺', '🦁', '🐯', '🐻', '🐼', '🦋', '🐉',
  '🤖', '👾', '💀', '🌟', '🔥', '💪',
]

// ---------------------------------------------------------------------------
// Section wrapper
// ---------------------------------------------------------------------------

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <p className="text-xs text-textMuted uppercase tracking-wider font-semibold mb-3 px-1">{title}</p>
      <div className="bg-surface rounded-2xl border border-bdr p-5">{children}</div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function SettingsPage() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const router = useRouter()
  const {
    name,
    avatarEmoji,
    unit,
    startWeight,
    goalWeight,
    dailyCalorieGoal,
    theme,
    quickMealChips,
    setName,
    setAvatarEmoji,
    setUnit,
    setStartWeight,
    setGoalWeight,
    setDailyCalorieGoal,
    setTheme,
    setQuickMealChips,
    resetAll,
  } = useUserStore()

  // Profile
  const [nameInput, setNameInput] = useState(name)
  const [avatarModal, setAvatarModal] = useState(false)

  // Body goals
  const [unitInput, setUnitInput] = useState<'kg' | 'lbs'>(unit)
  const [startWeightInput, setStartWeightInput] = useState(String(startWeight))
  const [goalWeightInput, setGoalWeightInput] = useState(String(goalWeight))
  const [dailyCalsInput, setDailyCalsInput] = useState(String(dailyCalorieGoal))

  // Quick meals
  const [chipName, setChipName] = useState('')
  const [chipCals, setChipCals] = useState('')

  // Danger
  const [clearConfirm, setClearConfirm] = useState(false)

  // Sync inputs when store changes
  useEffect(() => {
    setNameInput(name)
    setUnitInput(unit)
    setStartWeightInput(String(startWeight))
    setGoalWeightInput(String(goalWeight))
    setDailyCalsInput(String(dailyCalorieGoal))
  }, [name, unit, startWeight, goalWeight, dailyCalorieGoal])

  if (!mounted) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const handleSaveProfile = () => {
    if (nameInput.trim()) setName(nameInput.trim())
  }

  const handleSaveGoals = () => {
    setUnit(unitInput)
    const sw = parseFloat(startWeightInput)
    const gw = parseFloat(goalWeightInput)
    const cal = parseInt(dailyCalsInput)
    if (!isNaN(sw)) setStartWeight(sw)
    if (!isNaN(gw)) setGoalWeight(gw)
    if (!isNaN(cal) && cal > 0) setDailyCalorieGoal(cal)
  }

  const handleAddChip = () => {
    if (!chipName.trim() || !chipCals) return
    const cal = parseInt(chipCals)
    if (isNaN(cal)) return
    if (quickMealChips.length >= 8) return
    setQuickMealChips([...quickMealChips, { name: chipName.trim(), calories: cal }])
    setChipName('')
    setChipCals('')
  }

  const handleRemoveChip = (idx: number) => {
    setQuickMealChips(quickMealChips.filter((_, i) => i !== idx))
  }

  const handleExport = () => {
    try {
      const data = {
        exportedAt: new Date().toISOString(),
        user: JSON.parse(localStorage.getItem('clutch-user-store') ?? '{}'),
        habits: JSON.parse(localStorage.getItem('clutch-habits-store') ?? '{}'),
        body: JSON.parse(localStorage.getItem('clutch-body-store') ?? '{}'),
        notes: JSON.parse(localStorage.getItem('clutch-notes-store') ?? '{}'),
        calendar: JSON.parse(localStorage.getItem('clutch-calendar-store') ?? '{}'),
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `clutch-export-${format(new Date())}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      alert('Export failed')
    }
  }

  const handleClearAll = () => {
    localStorage.clear()
    window.location.reload()
  }

  function format(d: Date) {
    return d.toISOString().split('T')[0]
  }

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 py-6">
      <h1 className="font-syne text-3xl font-bold text-textPrimary mb-6">Settings</h1>

      {/* PROFILE */}
      <Section title="Profile">
        <div className="flex items-center gap-4 mb-5">
          <button
            onClick={() => setAvatarModal(true)}
            className="w-16 h-16 rounded-2xl bg-surfaceElevated border border-bdr text-3xl flex items-center justify-center hover:border-accent transition-colors"
          >
            {avatarEmoji}
          </button>
          <div className="flex-1">
            <p className="text-textSecondary text-xs mb-1">Tap emoji to change</p>
            <p className="text-textMuted text-xs">Your avatar</p>
          </div>
        </div>
        <div className="mb-4">
          <label className="text-xs text-textMuted uppercase tracking-wider font-medium mb-1.5 block">Name</label>
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Your name"
            className="w-full"
          />
        </div>
        <button
          onClick={handleSaveProfile}
          className="w-full py-3 rounded-xl bg-accent text-black font-syne font-bold text-sm hover:opacity-90 transition-opacity"
        >
          Save Profile
        </button>
      </Section>

      {/* BODY GOALS */}
      <Section title="Body Goals">
        <div className="mb-4">
          <label className="text-xs text-textMuted uppercase tracking-wider font-medium mb-2 block">Unit</label>
          <div className="flex gap-2 bg-surfaceElevated rounded-xl p-1 border border-bdr">
            {(['kg', 'lbs'] as const).map((u) => (
              <button
                key={u}
                onClick={() => setUnitInput(u)}
                className={clsx(
                  'flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all',
                  unitInput === u ? 'bg-accent text-black' : 'text-textSecondary hover:text-textPrimary'
                )}
              >
                {u}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-xs text-textMuted uppercase tracking-wider font-medium mb-1.5 block">Start Weight ({unitInput})</label>
            <input type="number" value={startWeightInput} onChange={(e) => setStartWeightInput(e.target.value)} className="w-full" />
          </div>
          <div>
            <label className="text-xs text-textMuted uppercase tracking-wider font-medium mb-1.5 block">Goal Weight ({unitInput})</label>
            <input type="number" value={goalWeightInput} onChange={(e) => setGoalWeightInput(e.target.value)} className="w-full" />
          </div>
        </div>
        <div className="mb-4">
          <label className="text-xs text-textMuted uppercase tracking-wider font-medium mb-1.5 block">Daily Calorie Goal</label>
          <input type="number" value={dailyCalsInput} onChange={(e) => setDailyCalsInput(e.target.value)} className="w-full" />
        </div>
        <button
          onClick={handleSaveGoals}
          className="w-full py-3 rounded-xl bg-accent text-black font-syne font-bold text-sm hover:opacity-90 transition-opacity"
        >
          Save Goals
        </button>
      </Section>

      {/* QUICK MEALS */}
      <Section title="Quick Meal Chips">
        <div className="space-y-2 mb-4">
          {quickMealChips.map((chip, i) => (
            <div key={i} className="flex items-center gap-3 bg-surfaceElevated rounded-xl px-3 py-2.5">
              <div className="flex-1">
                <span className="text-textPrimary text-sm font-medium">{chip.name}</span>
                <span className="text-textMuted text-xs ml-2">{chip.calories} kcal</span>
              </div>
              <button
                onClick={() => handleRemoveChip(i)}
                className="w-6 h-6 rounded-lg flex items-center justify-center text-textMuted hover:text-coral transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          ))}
          {quickMealChips.length === 0 && (
            <p className="text-textMuted text-sm text-center py-2">No quick meals yet</p>
          )}
        </div>
        {quickMealChips.length < 8 && (
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Meal name"
              value={chipName}
              onChange={(e) => setChipName(e.target.value)}
              className="flex-1"
            />
            <input
              type="number"
              placeholder="kcal"
              value={chipCals}
              onChange={(e) => setChipCals(e.target.value)}
              className="w-20"
            />
            <button
              onClick={handleAddChip}
              disabled={!chipName.trim() || !chipCals}
              className={clsx(
                'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all',
                chipName.trim() && chipCals
                  ? 'bg-accent text-black hover:opacity-90'
                  : 'bg-surfaceElevated border border-bdr text-textMuted cursor-not-allowed'
              )}
            >
              <Plus size={18} />
            </button>
          </div>
        )}
        {quickMealChips.length >= 8 && (
          <p className="text-textMuted text-xs text-center">Maximum 8 chips reached</p>
        )}
      </Section>

      {/* APPEARANCE */}
      <Section title="Appearance">
        <div>
          <label className="text-xs text-textMuted uppercase tracking-wider font-medium mb-2 block">Theme</label>
          <div className="flex gap-2 bg-surfaceElevated rounded-xl p-1 border border-bdr">
            {(['dark', 'light', 'system'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={clsx(
                  'flex-1 py-2.5 rounded-lg text-xs font-semibold capitalize transition-all',
                  theme === t ? 'bg-accent/20 text-accent border border-accent/30' : 'text-textSecondary hover:text-textPrimary'
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </Section>

      {/* DATA */}
      <Section title="Data">
        <div className="space-y-3">
          <button
            onClick={handleExport}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-surfaceElevated border border-bdr text-textPrimary text-sm font-semibold hover:border-accent hover:text-accent transition-colors"
          >
            <Download size={16} /> Export Data
          </button>
          <button
            onClick={() => setClearConfirm(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-coral/10 border border-coral/30 text-coral text-sm font-semibold hover:bg-coral/20 transition-colors"
          >
            <Trash2 size={16} /> Clear All Data
          </button>
        </div>
      </Section>

      {/* ABOUT */}
      <Section title="About">
        <div className="text-center py-2">
          <p className="font-syne text-xl font-bold text-textPrimary mb-1">Clutch</p>
          <p className="text-textMuted text-sm mb-3">v1.0.0</p>
          <p className="text-textSecondary text-sm">
            Made with ❤️ for people who want to get their life together.
          </p>
        </div>
      </Section>

      {/* Avatar picker modal */}
      <Modal visible={avatarModal} onClose={() => setAvatarModal(false)} title="Choose Avatar" size="sm">
        <div className="grid grid-cols-6 gap-2">
          {AVATAR_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                setAvatarEmoji(emoji)
                setAvatarModal(false)
              }}
              className={clsx(
                'w-full aspect-square rounded-xl text-2xl flex items-center justify-center transition-all hover:bg-surfaceElevated',
                avatarEmoji === emoji && 'bg-accent/20 ring-2 ring-accent/50'
              )}
            >
              {emoji}
            </button>
          ))}
        </div>
      </Modal>

      {/* Clear confirm modal */}
      <Modal visible={clearConfirm} onClose={() => setClearConfirm(false)} title="Clear All Data" size="sm">
        <div>
          <p className="text-textSecondary text-sm mb-5">
            This will permanently delete all your data — habits, logs, notes, calendar events, and body data. This cannot be undone.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setClearConfirm(false)}
              className="flex-1 py-3 rounded-xl bg-surfaceElevated border border-bdr text-textSecondary text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleClearAll}
              className="flex-1 py-3 rounded-xl bg-coral text-white font-syne font-bold text-sm hover:opacity-90"
            >
              Delete Everything
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
