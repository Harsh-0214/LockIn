// /home/user/LockIn/app/calendar/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
} from 'date-fns'
import { ChevronLeft, ChevronRight, Plus, Trash2, Clock } from 'lucide-react'
import clsx from 'clsx'

import { useCalendarStore } from '@/store/useCalendarStore'
import type { CalendarEvent } from '@/store/useCalendarStore'
import Modal from '@/components/Modal'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const CATEGORY_CONFIG: Record<CalendarEvent['category'], { color: string; label: string }> = {
  Work: { color: '#60A5FA', label: 'Work' },
  Health: { color: '#4ADE80', label: 'Health' },
  Personal: { color: '#A78BFA', label: 'Personal' },
  Other: { color: '#8B8FA8', label: 'Other' },
}

const CATEGORIES = Object.keys(CATEGORY_CONFIG) as CalendarEvent['category'][]

const REPEAT_OPTIONS: { value: CalendarEvent['repeat']; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
]

const ALERT_OPTIONS = [
  { value: 0, label: 'None' },
  { value: 15, label: '15 min before' },
  { value: 60, label: '1 hour before' },
  { value: 1440, label: '1 day before' },
]

// ---------------------------------------------------------------------------
// Calendar Grid
// ---------------------------------------------------------------------------

interface CalendarGridProps {
  currentMonth: Date
  selectedDate: string
  onSelectDate: (date: string) => void
  getEventsForDate: (date: string) => CalendarEvent[]
}

function CalendarGrid({ currentMonth, selectedDate, onSelectDate, getEventsForDate }: CalendarGridProps) {
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const gridStart = startOfWeek(monthStart)
  const gridEnd = endOfWeek(monthEnd)

  const days: Date[] = []
  let day = gridStart
  while (day <= gridEnd) {
    days.push(day)
    day = addDays(day, 1)
  }

  return (
    <div>
      {/* Day headers */}
      <div className="grid grid-cols-7 mb-2">
        {DAYS_OF_WEEK.map((d) => (
          <div key={d} className="text-center text-xs text-textMuted font-medium py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-0.5">
        {days.map((d, i) => {
          const dateStr = format(d, 'yyyy-MM-dd')
          const inMonth = isSameMonth(d, currentMonth)
          const isSelected = dateStr === selectedDate
          const today = isToday(d)
          const dayEvents = getEventsForDate(dateStr)
          const hasEvents = dayEvents.length > 0
          const eventColors = dayEvents
            .slice(0, 3)
            .map((e) => CATEGORY_CONFIG[e.category].color)

          return (
            <button
              key={i}
              onClick={() => onSelectDate(dateStr)}
              className={clsx(
                'relative flex flex-col items-center py-1.5 px-0.5 rounded-xl transition-all',
                !inMonth && 'opacity-25',
                isSelected && !today && 'bg-accent/20',
                today && !isSelected && 'bg-surfaceElevated',
                today && isSelected && 'bg-accent/30',
                'hover:bg-surfaceElevated'
              )}
            >
              <span
                className={clsx(
                  'text-sm w-7 h-7 flex items-center justify-center rounded-lg font-medium',
                  today ? 'text-accent font-bold' : isSelected ? 'text-textPrimary' : 'text-textSecondary'
                )}
              >
                {format(d, 'd')}
              </span>
              {hasEvents && (
                <div className="flex gap-0.5 mt-0.5">
                  {eventColors.map((color, idx) => (
                    <div key={idx} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                  ))}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Add Event Form
// ---------------------------------------------------------------------------

interface AddEventFormProps {
  selectedDate: string
  onSave: () => void
  onClose: () => void
}

function AddEventForm({ selectedDate, onSave, onClose }: AddEventFormProps) {
  const { addEvent } = useCalendarStore()
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(selectedDate)
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:00')
  const [category, setCategory] = useState<CalendarEvent['category']>('Work')
  const [repeat, setRepeat] = useState<CalendarEvent['repeat']>('none')
  const [alertOffset, setAlertOffset] = useState(0)
  const [notes, setNotes] = useState('')

  const handleSave = () => {
    if (!title.trim()) return
    const startISO = new Date(`${date}T${startTime}:00`).toISOString()
    const endISO = new Date(`${date}T${endTime}:00`).toISOString()
    addEvent({
      title: title.trim(),
      startTime: startISO,
      endTime: endISO,
      category,
      repeat,
      alertOffset: alertOffset || undefined,
      notes: notes.trim() || undefined,
    })
    onSave()
    onClose()
  }

  return (
    <div className="space-y-4">
      {/* Title */}
      <div>
        <label className="text-xs text-textMuted uppercase tracking-wider font-medium mb-1.5 block">Title</label>
        <input type="text" placeholder="Event title" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus className="w-full" />
      </div>

      {/* Date */}
      <div>
        <label className="text-xs text-textMuted uppercase tracking-wider font-medium mb-1.5 block">Date</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full" />
      </div>

      {/* Time row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-textMuted uppercase tracking-wider font-medium mb-1.5 block">Start Time</label>
          <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full" />
        </div>
        <div>
          <label className="text-xs text-textMuted uppercase tracking-wider font-medium mb-1.5 block">End Time</label>
          <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full" />
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="text-xs text-textMuted uppercase tracking-wider font-medium mb-2 block">Category</label>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((cat) => {
            const cfg = CATEGORY_CONFIG[cat]
            return (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
                style={
                  category === cat
                    ? { backgroundColor: `${cfg.color}22`, borderColor: `${cfg.color}55`, color: cfg.color }
                    : { backgroundColor: '#1E2030', borderColor: '#2A2D40', color: '#8B8FA8' }
                }
              >
                {cat}
              </button>
            )
          })}
        </div>
      </div>

      {/* Repeat */}
      <div>
        <label className="text-xs text-textMuted uppercase tracking-wider font-medium mb-1.5 block">Repeat</label>
        <select value={repeat} onChange={(e) => setRepeat(e.target.value as CalendarEvent['repeat'])} className="w-full">
          {REPEAT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Alert */}
      <div>
        <label className="text-xs text-textMuted uppercase tracking-wider font-medium mb-1.5 block">Alert</label>
        <select value={alertOffset} onChange={(e) => setAlertOffset(parseInt(e.target.value))} className="w-full">
          {ALERT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Notes */}
      <div>
        <label className="text-xs text-textMuted uppercase tracking-wider font-medium mb-1.5 block">Notes</label>
        <textarea rows={3} placeholder="Optional notes..." value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full resize-none" />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-surfaceElevated border border-bdr text-textSecondary text-sm font-semibold">Cancel</button>
        <button
          onClick={handleSave}
          disabled={!title.trim()}
          className={clsx(
            'flex-1 py-3 rounded-xl font-syne font-bold text-sm transition-opacity',
            title.trim() ? 'bg-accent text-black hover:opacity-90' : 'bg-surfaceElevated text-textMuted cursor-not-allowed'
          )}
        >
          Save Event
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function CalendarPage() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const { events, selectedDate, setSelectedDate, getEventsForDate, deleteEvent } = useCalendarStore()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [addModal, setAddModal] = useState(false)

  if (!mounted) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const selectedEvents = getEventsForDate(selectedDate)

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-syne text-3xl font-bold text-textPrimary">Calendar</h1>
        <button
          onClick={() => setAddModal(true)}
          className="w-10 h-10 rounded-xl bg-accent text-black flex items-center justify-center hover:opacity-90 transition-opacity"
        >
          <Plus size={20} strokeWidth={2.5} />
        </button>
      </div>

      {/* Month navigation */}
      <div className="bg-surface rounded-2xl border border-bdr p-4 mb-5">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="w-9 h-9 rounded-xl bg-surfaceElevated border border-bdr flex items-center justify-center text-textSecondary hover:text-textPrimary transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="font-syne font-bold text-textPrimary">
            {format(currentMonth, 'MMMM yyyy')}
          </span>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="w-9 h-9 rounded-xl bg-surfaceElevated border border-bdr flex items-center justify-center text-textSecondary hover:text-textPrimary transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
        <CalendarGrid
          currentMonth={currentMonth}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          getEventsForDate={getEventsForDate}
        />
      </div>

      {/* Events panel */}
      <div>
        <h2 className="font-syne text-xs font-bold text-textSecondary uppercase tracking-wider mb-3">
          {format(new Date(selectedDate + 'T12:00:00'), 'EEEE, MMMM d')}
        </h2>

        {selectedEvents.length === 0 ? (
          <div className="bg-surface rounded-2xl border border-bdr p-6 text-center">
            <Clock size={28} className="text-textMuted mx-auto mb-2" />
            <p className="text-textSecondary text-sm">No events this day</p>
            <button
              onClick={() => setAddModal(true)}
              className="mt-3 text-accent text-sm font-semibold hover:underline"
            >
              + Add event
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {selectedEvents.map((event) => {
                const cfg = CATEGORY_CONFIG[event.category]
                return (
                  <motion.div
                    key={event.id + selectedDate}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="flex items-stretch bg-surface rounded-2xl border border-bdr overflow-hidden group"
                  >
                    {/* Category bar */}
                    <div className="w-1 flex-shrink-0" style={{ backgroundColor: cfg.color }} />
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-textPrimary font-semibold text-sm">{event.title}</p>
                          <p className="text-textMuted text-xs mt-0.5">
                            {format(new Date(event.startTime), 'h:mm a')} – {format(new Date(event.endTime), 'h:mm a')}
                            {event.repeat !== 'none' && <span className="ml-2 text-textMuted">· {event.repeat}</span>}
                          </p>
                          {event.notes && (
                            <p className="text-textSecondary text-xs mt-1.5 line-clamp-2">{event.notes}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: `${cfg.color}22`, color: cfg.color }}
                          >
                            {event.category}
                          </span>
                          <button
                            onClick={() => deleteEvent(event.id)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-textMuted hover:text-coral opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Add event modal */}
      <Modal visible={addModal} onClose={() => setAddModal(false)} title="Add Event" size="md">
        <AddEventForm
          selectedDate={selectedDate}
          onSave={() => {}}
          onClose={() => setAddModal(false)}
        />
      </Modal>
    </div>
  )
}
