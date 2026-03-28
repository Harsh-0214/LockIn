// /home/user/LockIn/app/onboarding/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, Flame, Dumbbell, FileText, CalendarDays, Target } from 'lucide-react'
import { useUserStore } from '@/store/useUserStore'
import clsx from 'clsx'

const FEATURES = [
  {
    icon: Flame,
    title: 'Habits',
    desc: 'Build streaks and track daily habits with visual progress grids.',
    color: '#FF6B6B',
  },
  {
    icon: Dumbbell,
    title: 'Body',
    desc: 'Log weight, meals, workouts, and hydration in one place.',
    color: '#C8F04A',
  },
  {
    icon: FileText,
    title: 'Notes',
    desc: 'Capture ideas, plans, and checklists in organized notebooks.',
    color: '#60A5FA',
  },
  {
    icon: CalendarDays,
    title: 'Calendar',
    desc: 'Schedule events with repeat rules and category organization.',
    color: '#A78BFA',
  },
  {
    icon: Target,
    title: 'Goals',
    desc: 'Set weight and calorie targets to stay on track every day.',
    color: '#4ADE80',
  },
]

export default function OnboardingPage() {
  const router = useRouter()
  const completeOnboarding = useUserStore((s) => s.completeOnboarding)

  const [step, setStep] = useState(0)

  // Step 1 state
  const [name, setName] = useState('')

  // Step 2 state
  const [unit, setUnit] = useState<'kg' | 'lbs'>('kg')
  const [startWeight, setStartWeight] = useState('')
  const [goalWeight, setGoalWeight] = useState('')
  const [dailyCals, setDailyCals] = useState('2000')

  const handleStep1Next = () => {
    if (!name.trim()) return
    setStep(1)
  }

  const handleStep2Next = () => {
    setStep(2)
  }

  const handleFinish = () => {
    completeOnboarding({
      name: name.trim(),
      startWeight: parseFloat(startWeight) || 75,
      goalWeight: parseFloat(goalWeight) || 70,
      unit,
      dailyCalorieGoal: parseInt(dailyCals) || 2000,
    })
    router.push('/')
  }

  const variants = {
    enter: { opacity: 0, x: 60 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -60 },
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="step0"
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="flex flex-col items-center text-center"
            >
              <div className="text-7xl mb-6">🔥</div>
              <h1 className="font-syne text-4xl font-bold text-textPrimary mb-3">
                What should we<br />call you?
              </h1>
              <p className="text-textSecondary text-base mb-10">
                Personalize your experience with your name.
              </p>
              <div className="w-full mb-6">
                <input
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleStep1Next()}
                  className="w-full text-center text-lg py-4 px-6 bg-surfaceElevated border border-bdr rounded-2xl text-textPrimary placeholder-textMuted focus:border-accent focus:outline-none transition-colors"
                  autoFocus
                />
              </div>
              <button
                onClick={handleStep1Next}
                disabled={!name.trim()}
                className={clsx(
                  'w-full py-4 rounded-2xl font-syne font-bold text-base flex items-center justify-center gap-2 transition-all',
                  name.trim()
                    ? 'bg-accent text-black hover:opacity-90'
                    : 'bg-surfaceElevated text-textMuted cursor-not-allowed'
                )}
              >
                Continue <ChevronRight size={18} />
              </button>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="step1"
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <div className="text-center mb-8">
                <div className="text-5xl mb-4">🎯</div>
                <h1 className="font-syne text-3xl font-bold text-textPrimary mb-2">
                  Set your goals
                </h1>
                <p className="text-textSecondary text-sm">
                  You can always update these later in Settings.
                </p>
              </div>

              {/* Unit toggle */}
              <div className="mb-5">
                <label className="text-xs text-textMuted uppercase tracking-wider font-medium mb-2 block">
                  Weight Unit
                </label>
                <div className="flex gap-2 bg-surfaceElevated rounded-xl p-1 border border-bdr">
                  {(['kg', 'lbs'] as const).map((u) => (
                    <button
                      key={u}
                      onClick={() => setUnit(u)}
                      className={clsx(
                        'flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all',
                        unit === u
                          ? 'bg-accent text-black'
                          : 'text-textSecondary hover:text-textPrimary'
                      )}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>

              {/* Start weight */}
              <div className="mb-4">
                <label className="text-xs text-textMuted uppercase tracking-wider font-medium mb-2 block">
                  Current Weight ({unit})
                </label>
                <input
                  type="number"
                  placeholder={unit === 'kg' ? '75' : '165'}
                  value={startWeight}
                  onChange={(e) => setStartWeight(e.target.value)}
                  className="w-full py-3 px-4 bg-surfaceElevated border border-bdr rounded-xl text-textPrimary placeholder-textMuted focus:border-accent focus:outline-none"
                />
              </div>

              {/* Goal weight */}
              <div className="mb-4">
                <label className="text-xs text-textMuted uppercase tracking-wider font-medium mb-2 block">
                  Goal Weight ({unit})
                </label>
                <input
                  type="number"
                  placeholder={unit === 'kg' ? '70' : '154'}
                  value={goalWeight}
                  onChange={(e) => setGoalWeight(e.target.value)}
                  className="w-full py-3 px-4 bg-surfaceElevated border border-bdr rounded-xl text-textPrimary placeholder-textMuted focus:border-accent focus:outline-none"
                />
              </div>

              {/* Daily calories */}
              <div className="mb-8">
                <label className="text-xs text-textMuted uppercase tracking-wider font-medium mb-2 block">
                  Daily Calorie Goal
                </label>
                <input
                  type="number"
                  placeholder="2000"
                  value={dailyCals}
                  onChange={(e) => setDailyCals(e.target.value)}
                  className="w-full py-3 px-4 bg-surfaceElevated border border-bdr rounded-xl text-textPrimary placeholder-textMuted focus:border-accent focus:outline-none"
                />
              </div>

              <button
                onClick={handleStep2Next}
                className="w-full py-4 rounded-2xl font-syne font-bold text-base bg-accent text-black hover:opacity-90 flex items-center justify-center gap-2 transition-all"
              >
                Continue <ChevronRight size={18} />
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <div className="text-center mb-8">
                <h1 className="font-syne text-3xl font-bold text-textPrimary mb-2">
                  Everything you need
                </h1>
                <p className="text-textSecondary text-sm">
                  Here's what Clutch has in store for you.
                </p>
              </div>

              <div className="space-y-3 mb-8">
                {FEATURES.map((feat) => {
                  const Icon = feat.icon
                  return (
                    <div
                      key={feat.title}
                      className="flex items-center gap-4 bg-surface rounded-2xl border border-bdr p-4"
                    >
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${feat.color}22` }}
                      >
                        <Icon size={22} style={{ color: feat.color }} />
                      </div>
                      <div>
                        <p className="font-semibold text-textPrimary text-sm">{feat.title}</p>
                        <p className="text-textMuted text-xs mt-0.5">{feat.desc}</p>
                      </div>
                    </div>
                  )
                })}
              </div>

              <button
                onClick={handleFinish}
                className="w-full py-4 rounded-2xl font-syne font-bold text-base bg-accent text-black hover:opacity-90 transition-all"
              >
                Let's go 🚀
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mt-10">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={clsx(
                'rounded-full transition-all duration-300',
                i === step
                  ? 'w-6 h-2 bg-accent'
                  : i < step
                  ? 'w-2 h-2 bg-accent/50'
                  : 'w-2 h-2 bg-bdr'
              )}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
