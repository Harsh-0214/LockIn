// /home/user/LockIn/components/StreakGrid.tsx
'use client'

import { useMemo } from 'react'
import { format, subDays, getDay } from 'date-fns'
import clsx from 'clsx'

interface StreakGridProps {
  habitId?: string
  completedDates?: string[] // alternative: pass completed dates directly
  color?: string
}

const DAY_HEADERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

export default function StreakGrid({ completedDates = [], color = '#C8F04A' }: StreakGridProps) {
  const days = useMemo(() => {
    const result = []
    for (let i = 29; i >= 0; i--) {
      const date = subDays(new Date(), i)
      const dateStr = format(date, 'yyyy-MM-dd')
      const dayOfWeek = getDay(date) // 0=Sun, 6=Sat
      result.push({
        dateStr,
        dayOfWeek,
        completed: completedDates.includes(dateStr),
        isToday: i === 0,
      })
    }
    return result
  }, [completedDates])

  // Calculate the starting day of week offset so the grid aligns
  // We'll render 30 boxes in a 5-col x 6-row grid
  return (
    <div className="w-full">
      {/* Day of week headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAY_HEADERS.map((d, i) => (
          <div key={i} className="text-center text-[10px] text-textMuted font-medium">
            {d}
          </div>
        ))}
      </div>

      {/* Grid — we place 30 days starting from the right offset */}
      <DayGrid days={days} color={color} />
    </div>
  )
}

interface DayData {
  dateStr: string
  dayOfWeek: number
  completed: boolean
  isToday: boolean
}

function DayGrid({ days, color }: { days: DayData[]; color: string }) {
  // Find the day of week of the first day to figure out padding
  const firstDayOfWeek = days[0]?.dayOfWeek ?? 0
  const paddingCells = firstDayOfWeek // 0=Sun needs 0 padding, 1=Mon needs 1, etc.

  // Total cells = padding + 30 days, rounded up to full weeks
  const totalCells = paddingCells + days.length
  const rows = Math.ceil(totalCells / 7)
  const allCells: (DayData | null)[] = [
    ...Array(paddingCells).fill(null),
    ...days,
  ]
  // Pad to full grid
  while (allCells.length < rows * 7) allCells.push(null)

  return (
    <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
      {allCells.map((cell, idx) => {
        if (!cell) {
          return <div key={`pad-${idx}`} className="aspect-square rounded-sm" />
        }
        return (
          <div
            key={cell.dateStr}
            title={cell.dateStr}
            className={clsx(
              'aspect-square rounded-sm border transition-all',
              cell.completed
                ? 'border-transparent'
                : cell.isToday
                ? 'border-bdr bg-surfaceElevated'
                : 'border-transparent bg-surface'
            )}
            style={
              cell.completed
                ? { backgroundColor: color, opacity: 0.9 }
                : undefined
            }
          />
        )
      })}
    </div>
  )
}
