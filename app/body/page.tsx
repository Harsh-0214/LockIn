// /home/user/LockIn/app/body/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { format, parseISO, subDays } from 'date-fns'
import { Plus, Minus, TrendingUp, TrendingDown, Dumbbell, X } from 'lucide-react'
import clsx from 'clsx'

import { useBodyStore } from '@/store/useBodyStore'
import { useUserStore } from '@/store/useUserStore'
import Modal from '@/components/Modal'
import RingProgress from '@/components/RingProgress'

// ---------------------------------------------------------------------------
// Weight SVG Chart
// ---------------------------------------------------------------------------

function WeightChart({ entries }: { entries: { weight: number; loggedAt: string }[] }) {
  const sorted = [...entries]
    .sort((a, b) => new Date(a.loggedAt).getTime() - new Date(b.loggedAt).getTime())
    .slice(-7)

  if (sorted.length < 2) {
    return (
      <div className="h-24 flex items-center justify-center text-textMuted text-sm">
        Log more weights to see chart
      </div>
    )
  }

  const W = 280
  const H = 100
  const PAD = { top: 10, bottom: 24, left: 10, right: 10 }
  const chartW = W - PAD.left - PAD.right
  const chartH = H - PAD.top - PAD.bottom

  const weights = sorted.map((e) => e.weight)
  const minW = Math.min(...weights) - 0.5
  const maxW = Math.max(...weights) + 0.5
  const range = maxW - minW || 1

  const points = sorted.map((e, i) => ({
    x: PAD.left + (i / (sorted.length - 1)) * chartW,
    y: PAD.top + chartH - ((e.weight - minW) / range) * chartH,
    label: format(new Date(e.loggedAt), 'EEE'),
    weight: e.weight,
  }))

  const polyline = points.map((p) => `${p.x},${p.y}`).join(' ')
  const areaPath = `M ${points[0].x},${PAD.top + chartH} ` +
    points.map((p) => `L ${p.x},${p.y}`).join(' ') +
    ` L ${points[points.length - 1].x},${PAD.top + chartH} Z`

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
      <defs>
        <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C8F04A" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#C8F04A" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Area fill */}
      <path d={areaPath} fill="url(#weightGrad)" />
      {/* Line */}
      <polyline points={polyline} fill="none" stroke="#C8F04A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Dots */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#C8F04A" />
      ))}
      {/* X-axis labels */}
      {points.map((p, i) => (
        <text key={i} x={p.x} y={H - 4} textAnchor="middle" fontSize="9" fill="#4A4D62" fontFamily="DM Sans">
          {p.label}
        </text>
      ))}
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Workout type selector
// ---------------------------------------------------------------------------

const WORKOUT_TYPES = ['Lift', 'Cardio', 'Walk', 'Sport', 'Other']

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function BodyPage() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const { unit, dailyCalorieGoal, quickMealChips } = useUserStore()
  const {
    weightEntries,
    mealLogs,
    workoutSessions,
    waterGlasses,
    waterDate,
    addWeightEntry,
    addMeal,
    deleteMeal,
    addWorkout,
    setWaterGlasses,
    getTodayCalories,
    getTodayMeals,
    getTodayWorkout,
    getWeightTrend,
  } = useBodyStore()

  // Weight modal
  const [weightModal, setWeightModal] = useState(false)
  const [weightInput, setWeightInput] = useState('')

  // Meal modal
  const [mealModal, setMealModal] = useState(false)
  const [mealName, setMealName] = useState('')
  const [mealCals, setMealCals] = useState('')
  const [mealProtein, setMealProtein] = useState('')
  const [mealCarbs, setMealCarbs] = useState('')
  const [mealFat, setMealFat] = useState('')

  // Workout modal
  const [workoutModal, setWorkoutModal] = useState(false)
  const [workoutType, setWorkoutType] = useState('Lift')
  const [workoutDuration, setWorkoutDuration] = useState('')
  const [workoutNotes, setWorkoutNotes] = useState('')

  if (!mounted) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const todayCalories = getTodayCalories()
  const todayMeals = getTodayMeals()
  const todayWorkout = getTodayWorkout()
  const trend = getWeightTrend()
  const calorieProgress = Math.min(1, todayCalories / dailyCalorieGoal)

  const sortedWeights = [...weightEntries].sort(
    (a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime()
  )
  const latestWeight = sortedWeights[0]

  // Macro totals for today
  const todayProtein = todayMeals.reduce((s, m) => s + (m.protein ?? 0), 0)
  const todayCarbs = todayMeals.reduce((s, m) => s + (m.carbs ?? 0), 0)
  const todayFatTotal = todayMeals.reduce((s, m) => s + (m.fat ?? 0), 0)

  // Water: reset if different day
  const effectiveWater = waterDate === todayStr ? waterGlasses : 0

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const trendColor = trend === 'up' ? '#FF6B6B' : trend === 'down' ? '#4ADE80' : '#4A4D62'

  const handleSaveWeight = () => {
    const w = parseFloat(weightInput)
    if (!isNaN(w) && w > 0) {
      addWeightEntry(w, unit)
      setWeightInput('')
      setWeightModal(false)
    }
  }

  const handleSaveMeal = () => {
    if (!mealName.trim() || !mealCals) return
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

  const handleSaveWorkout = () => {
    const dur = parseInt(workoutDuration)
    if (!dur || dur <= 0) return
    addWorkout({ type: workoutType, durationMinutes: dur, notes: workoutNotes.trim() || undefined })
    setWorkoutDuration(''); setWorkoutNotes(''); setWorkoutType('Lift')
    setWorkoutModal(false)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 py-6">
      <h1 className="font-syne text-3xl font-bold text-textPrimary mb-6">Body</h1>

      {/* Weight Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-surface rounded-2xl border border-bdr p-5 mb-4"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-syne text-sm font-bold text-textSecondary uppercase tracking-wider">Weight</h2>
          <button
            onClick={() => setWeightModal(true)}
            className="flex items-center gap-1.5 text-xs text-accent font-semibold hover:opacity-80 transition-opacity"
          >
            <Plus size={14} /> Log Weight
          </button>
        </div>
        {latestWeight ? (
          <div className="flex items-center gap-3 mb-4">
            <span className="font-syne text-3xl font-bold text-textPrimary">{latestWeight.weight}</span>
            <span className="text-textSecondary text-sm">{latestWeight.unit}</span>
            <TrendIcon size={18} style={{ color: trendColor }} />
          </div>
        ) : (
          <p className="text-textSecondary text-sm mb-4">No weight logged yet</p>
        )}
        <WeightChart entries={sortedWeights} />
      </motion.div>

      {/* Nutrition Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="bg-surface rounded-2xl border border-bdr p-5 mb-4"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-syne text-sm font-bold text-textSecondary uppercase tracking-wider">Nutrition</h2>
          <button
            onClick={() => setMealModal(true)}
            className="flex items-center gap-1.5 text-xs text-accent font-semibold hover:opacity-80 transition-opacity"
          >
            <Plus size={14} /> Add Meal
          </button>
        </div>
        <div className="flex items-center gap-6">
          <RingProgress
            progress={calorieProgress}
            size={96}
            strokeWidth={8}
            color="#C8F04A"
          >
            <div className="text-center">
              <p className="font-syne text-base font-bold text-textPrimary leading-none">{todayCalories}</p>
              <p className="text-textMuted text-[10px]">kcal</p>
            </div>
          </RingProgress>
          <div className="flex-1 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-textSecondary text-xs">Goal</span>
              <span className="text-textPrimary text-xs font-semibold">{dailyCalorieGoal} kcal</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-textSecondary text-xs">Remaining</span>
              <span className="text-accent text-xs font-semibold">{Math.max(0, dailyCalorieGoal - todayCalories)} kcal</span>
            </div>
            {(todayProtein > 0 || todayCarbs > 0 || todayFatTotal > 0) && (
              <div className="flex gap-3 pt-1">
                <div className="text-center">
                  <p className="text-blue text-xs font-bold">{Math.round(todayProtein)}g</p>
                  <p className="text-textMuted text-[10px]">P</p>
                </div>
                <div className="text-center">
                  <p className="text-warning text-xs font-bold">{Math.round(todayCarbs)}g</p>
                  <p className="text-textMuted text-[10px]">C</p>
                </div>
                <div className="text-center">
                  <p className="text-coral text-xs font-bold">{Math.round(todayFatTotal)}g</p>
                  <p className="text-textMuted text-[10px]">F</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick meal chips */}
        {quickMealChips.length > 0 && (
          <div className="mt-4 pt-4 border-t border-bdr">
            <p className="text-xs text-textMuted mb-2">Quick add</p>
            <div className="flex flex-wrap gap-2">
              {quickMealChips.map((chip) => (
                <button
                  key={chip.name}
                  onClick={() => addMeal({ name: chip.name, calories: chip.calories })}
                  className="px-3 py-1.5 bg-surfaceElevated border border-bdr rounded-full text-xs text-textSecondary hover:border-accent hover:text-accent transition-colors"
                >
                  {chip.name} ({chip.calories})
                </button>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* Today's Meals */}
      {todayMeals.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-surface rounded-2xl border border-bdr p-5 mb-4"
        >
          <h2 className="font-syne text-sm font-bold text-textSecondary uppercase tracking-wider mb-3">
            Today's Meals
          </h2>
          <div className="space-y-2">
            {todayMeals.map((meal) => (
              <div key={meal.id} className="flex items-center gap-3 bg-surfaceElevated rounded-xl p-3">
                <div className="flex-1 min-w-0">
                  <p className="text-textPrimary text-sm font-medium truncate">{meal.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-textMuted text-xs">{meal.calories} kcal</span>
                    {meal.protein && <span className="text-blue text-xs">{meal.protein}g P</span>}
                    {meal.carbs && <span className="text-warning text-xs">{meal.carbs}g C</span>}
                    {meal.fat && <span className="text-coral text-xs">{meal.fat}g F</span>}
                  </div>
                </div>
                <button
                  onClick={() => deleteMeal(meal.id)}
                  className="w-7 h-7 rounded-lg bg-surface flex items-center justify-center text-textMuted hover:text-coral transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Water Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="bg-surface rounded-2xl border border-bdr p-5 mb-4"
      >
        <h2 className="font-syne text-sm font-bold text-textSecondary uppercase tracking-wider mb-4">
          Hydration
        </h2>
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setWaterGlasses(Math.max(0, effectiveWater - 1))}
            className="w-10 h-10 rounded-xl bg-surfaceElevated border border-bdr flex items-center justify-center text-textSecondary hover:text-textPrimary transition-colors"
          >
            <Minus size={18} />
          </button>
          <div className="text-center">
            <p className="font-syne text-3xl font-bold text-water">{effectiveWater}</p>
            <p className="text-textMuted text-xs mt-0.5">glasses / 8</p>
          </div>
          <button
            onClick={() => setWaterGlasses(Math.min(12, effectiveWater + 1))}
            className="w-10 h-10 rounded-xl bg-surfaceElevated border border-bdr flex items-center justify-center text-textSecondary hover:text-textPrimary transition-colors"
          >
            <Plus size={18} />
          </button>
        </div>
        {/* Glass icons */}
        <div className="flex justify-center gap-2 flex-wrap">
          {Array.from({ length: 8 }, (_, i) => (
            <button
              key={i}
              onClick={() => setWaterGlasses(i + 1)}
              className="text-xl transition-all hover:scale-110"
              title={`Set to ${i + 1} glasses`}
            >
              {i < effectiveWater ? '🥤' : '🫙'}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Workout Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="bg-surface rounded-2xl border border-bdr p-5 mb-4"
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-syne text-sm font-bold text-textSecondary uppercase tracking-wider">Workout</h2>
          {!todayWorkout && (
            <button
              onClick={() => setWorkoutModal(true)}
              className="flex items-center gap-1.5 text-xs text-accent font-semibold hover:opacity-80 transition-opacity"
            >
              <Plus size={14} /> Log Workout
            </button>
          )}
        </div>
        {todayWorkout ? (
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center">
              <Dumbbell size={22} className="text-accent" />
            </div>
            <div>
              <p className="text-textPrimary font-semibold">{todayWorkout.type}</p>
              <p className="text-textMuted text-sm">{todayWorkout.durationMinutes} min</p>
              {todayWorkout.notes && (
                <p className="text-textSecondary text-xs mt-1 line-clamp-2">{todayWorkout.notes}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 py-2 text-textMuted">
            <Dumbbell size={18} />
            <span className="text-sm">No workout logged today</span>
          </div>
        )}
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
          <div className="flex gap-3">
            <button onClick={() => setWeightModal(false)} className="flex-1 py-3 rounded-xl bg-surfaceElevated border border-bdr text-textSecondary text-sm font-semibold">Cancel</button>
            <button onClick={handleSaveWeight} className="flex-1 py-3 rounded-xl bg-accent text-black font-syne font-bold text-sm">Save</button>
          </div>
        </div>
      </Modal>

      {/* Meal modal */}
      <Modal visible={mealModal} onClose={() => setMealModal(false)} title="Add Meal" size="sm">
        <div className="space-y-3">
          <div>
            <label className="text-xs text-textMuted uppercase tracking-wider font-medium mb-1.5 block">Name</label>
            <input type="text" placeholder="Meal name" value={mealName} onChange={(e) => setMealName(e.target.value)} autoFocus className="w-full" />
          </div>
          <div>
            <label className="text-xs text-textMuted uppercase tracking-wider font-medium mb-1.5 block">Calories</label>
            <input type="number" placeholder="400" value={mealCals} onChange={(e) => setMealCals(e.target.value)} className="w-full" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-textMuted mb-1 block">Protein (g)</label>
              <input type="number" placeholder="—" value={mealProtein} onChange={(e) => setMealProtein(e.target.value)} className="w-full" />
            </div>
            <div>
              <label className="text-xs text-textMuted mb-1 block">Carbs (g)</label>
              <input type="number" placeholder="—" value={mealCarbs} onChange={(e) => setMealCarbs(e.target.value)} className="w-full" />
            </div>
            <div>
              <label className="text-xs text-textMuted mb-1 block">Fat (g)</label>
              <input type="number" placeholder="—" value={mealFat} onChange={(e) => setMealFat(e.target.value)} className="w-full" />
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={() => setMealModal(false)} className="flex-1 py-3 rounded-xl bg-surfaceElevated border border-bdr text-textSecondary text-sm font-semibold">Cancel</button>
            <button onClick={handleSaveMeal} className="flex-1 py-3 rounded-xl bg-accent text-black font-syne font-bold text-sm">Save</button>
          </div>
        </div>
      </Modal>

      {/* Workout modal */}
      <Modal visible={workoutModal} onClose={() => setWorkoutModal(false)} title="Log Workout" size="sm">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-textMuted uppercase tracking-wider font-medium mb-2 block">Type</label>
            <div className="flex flex-wrap gap-2">
              {WORKOUT_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => setWorkoutType(t)}
                  className={clsx(
                    'px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all',
                    workoutType === t
                      ? 'bg-accent/20 border-accent/50 text-accent'
                      : 'bg-surfaceElevated border-bdr text-textSecondary hover:text-textPrimary'
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-textMuted uppercase tracking-wider font-medium mb-1.5 block">Duration (min)</label>
            <input type="number" placeholder="45" value={workoutDuration} onChange={(e) => setWorkoutDuration(e.target.value)} autoFocus className="w-full" />
          </div>
          <div>
            <label className="text-xs text-textMuted uppercase tracking-wider font-medium mb-1.5 block">Notes (optional)</label>
            <textarea rows={3} placeholder="What did you do?" value={workoutNotes} onChange={(e) => setWorkoutNotes(e.target.value)} className="w-full resize-none" />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setWorkoutModal(false)} className="flex-1 py-3 rounded-xl bg-surfaceElevated border border-bdr text-textSecondary text-sm font-semibold">Cancel</button>
            <button onClick={handleSaveWorkout} className="flex-1 py-3 rounded-xl bg-accent text-black font-syne font-bold text-sm">Save</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
