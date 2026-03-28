// /home/user/LockIn/store/useNotesStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Note {
  id: string;
  title: string;
  content: string;
  notebookId?: string;
  pinned: boolean;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export interface Notebook {
  id: string;
  name: string;
  color: string;
}

interface NotesState {
  notes: Note[];
  notebooks: Notebook[];

  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => Note;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  togglePin: (id: string) => void;
  addNotebook: (name: string, color: string) => void;
  deleteNotebook: (id: string) => void;
  getNotesByNotebook: (notebookId?: string) => Note[];
  searchNotes: (query: string) => Note[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function genId(): string {
  return Math.random().toString(36).substr(2, 9);
}

/** Returns an ISO string for N days ago at the given hour. */
function isoOffset(daysAgo: number, hour = 10): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

// ---------------------------------------------------------------------------
// Seed notebooks
// ---------------------------------------------------------------------------

const seedNotebooks: Notebook[] = [
  { id: 'nb-personal', name: 'Personal', color: '#C8F04A' },
  { id: 'nb-work', name: 'Work', color: '#60A5FA' },
  { id: 'nb-health', name: 'Health', color: '#4ADE80' },
];

// ---------------------------------------------------------------------------
// Seed notes
// ---------------------------------------------------------------------------

const seedNotes: Note[] = [
  {
    id: genId(),
    title: '12-Week Strength Program',
    content: `PHASE 1 — Weeks 1–4 (Foundation)
──────────────────────────────
• 3 days/week full-body
• Focus: form over load, build baseline

Monday (Push)
  Bench Press      4×8  @ RPE 7
  Overhead Press   3×10 @ RPE 7
  Incline DB Press 3×12
  Tricep Pushdown  3×15

Wednesday (Pull)
  Barbell Row      4×8
  Pull-ups         3×AMRAP
  Face Pulls       3×15
  Bicep Curl       3×12

Friday (Legs)
  Squat            4×8 @ RPE 7
  Romanian DL      3×10
  Leg Press        3×15
  Calf Raises      4×20

PHASE 2 — Weeks 5–8 (Intensity)
──────────────────────────────
Increase load 5% each week. Add 4th session (upper/lower split).

PHASE 3 — Weeks 9–12 (Peak)
──────────────────────────────
Deload week 11. Test 1RM week 12 on squat, bench, deadlift.

Notes: Sleep 8 h minimum. Protein target 2 g/kg BW.`,
    notebookId: 'nb-health',
    pinned: true,
    createdAt: isoOffset(14, 9),
    updatedAt: isoOffset(2, 18),
  },
  {
    id: genId(),
    title: 'Q2 Goals — 2026',
    content: `CAREER
  ☐ Ship the Clutch v1.0 public beta by end of April
  ☐ Write 2 technical blog posts (React Native perf, Zustand patterns)
  ☐ Complete AWS Solutions Architect cert — book exam before May 1

FITNESS
  ☑ Hit 78 kg by April 15
  ☐ Run 5 km without stopping (currently at 3.5 km)
  ☐ Maintain gym streak — no more than 2 missed weeks

LEARNING
  ☐ Finish "Designing Data-Intensive Applications" — chapter 9 onwards
  ☐ Complete 30-day Duolingo Spanish streak
  ☐ Side project: experiment with on-device ML in RN

PERSONAL
  ☐ Plan weekend trip — options: Lisbon, Porto, or Barcelona
  ☐ Call parents every Sunday (calendar reminder set)
  ☐ Digital detox: no social media after 9 pm

Quarterly review date: June 25, 2026`,
    notebookId: 'nb-personal',
    pinned: false,
    createdAt: isoOffset(7, 8),
    updatedAt: isoOffset(1, 11),
  },
  {
    id: genId(),
    title: 'Grocery Run – This Week',
    content: `PRODUCE
  • Spinach (200 g bag)
  • Broccoli × 2 heads
  • Cherry tomatoes
  • Bananas × 6
  • Avocados × 3
  • Bell peppers (red + yellow)
  • Garlic bulb

PROTEIN
  • Chicken breast (1 kg)
  • Salmon fillets × 4
  • Greek yogurt × 4 (0% fat)
  • Eggs × 12
  • Cottage cheese (500 g)

GRAINS / CARBS
  • Rolled oats (1 kg)
  • Brown rice (2 kg)
  • Wholegrain bread
  • Sweet potatoes × 5

PANTRY
  • Olive oil (if running low)
  • Soy sauce
  • Hot sauce (Frank's)
  • Protein powder — chocolate whey
  • Mixed nuts (500 g)

DAIRY / MISC
  • Oat milk × 2
  • Cheddar block
  • Hummus

Budget: ~€65`,
    notebookId: 'nb-personal',
    pinned: false,
    createdAt: isoOffset(1, 7),
    updatedAt: isoOffset(0, 9),
  },
  {
    id: genId(),
    title: 'Books to Read — 2026',
    content: `CURRENTLY READING
  📖 Designing Data-Intensive Applications — Martin Kleppmann
     Progress: ch. 8 / 12  ★★★★★

NEXT UP
  1. Clear Thinking — Shane Parrish
  2. The Pragmatic Programmer (20th anniv. ed.)
  3. Never Finished — David Goggins
  4. Zero to One — Peter Thiel (re-read)

FICTION
  • Blood Meridian — Cormac McCarthy
  • Piranesi — Susanna Clarke
  • The Long Way to a Small, Angry Planet — Becky Chambers

COMPLETED THIS YEAR
  ✓ Atomic Habits — James Clear           ★★★★☆
  ✓ Deep Work — Cal Newport               ★★★★★
  ✓ The Psychology of Money — M. Housel   ★★★★★
  ✓ Can't Hurt Me — David Goggins         ★★★★☆
  ✓ Surrounded by Idiots — T. Erikson     ★★★☆☆

RECOMMENDATIONS FROM FRIENDS
  • The Almanack of Naval Ravikant (from Alex)
  • Thinking, Fast and Slow — Kahneman (from Sarah)
  • How to Win Friends… — Carnegie (classic, keep postponing)

Goal: 24 books in 2026 → on track (6 read, target pace: 2/month)`,
    notebookId: 'nb-personal',
    pinned: false,
    createdAt: isoOffset(20, 14),
    updatedAt: isoOffset(3, 20),
  },
];

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useNotesStore = create<NotesState>()(
  persist(
    (set, get) => ({
      notes: seedNotes,
      notebooks: seedNotebooks,

      // -----------------------------------------------------------------------
      // Notes CRUD
      // -----------------------------------------------------------------------
      addNote: (note) => {
        const now = new Date().toISOString();
        const newNote: Note = {
          ...note,
          id: genId(),
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ notes: [newNote, ...state.notes] }));
        return newNote;
      },

      updateNote: (id, updates) => {
        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === id
              ? { ...n, ...updates, updatedAt: new Date().toISOString() }
              : n
          ),
        }));
      },

      deleteNote: (id) => {
        set((state) => ({ notes: state.notes.filter((n) => n.id !== id) }));
      },

      togglePin: (id) => {
        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === id
              ? { ...n, pinned: !n.pinned, updatedAt: new Date().toISOString() }
              : n
          ),
        }));
      },

      // -----------------------------------------------------------------------
      // Notebooks
      // -----------------------------------------------------------------------
      addNotebook: (name, color) => {
        const newNotebook: Notebook = { id: genId(), name, color };
        set((state) => ({ notebooks: [...state.notebooks, newNotebook] }));
      },

      deleteNotebook: (id) => {
        set((state) => ({
          notebooks: state.notebooks.filter((nb) => nb.id !== id),
          notes: state.notes.map((n) =>
            n.notebookId === id ? { ...n, notebookId: undefined } : n
          ),
        }));
      },

      // -----------------------------------------------------------------------
      // Selectors
      // -----------------------------------------------------------------------
      getNotesByNotebook: (notebookId) => {
        const { notes } = get();
        if (notebookId === undefined) return notes;
        return notes.filter((n) => n.notebookId === notebookId);
      },

      searchNotes: (query) => {
        if (!query.trim()) return get().notes;
        const q = query.toLowerCase();
        return get().notes.filter(
          (n) =>
            n.title.toLowerCase().includes(q) ||
            n.content.toLowerCase().includes(q)
        );
      },
    }),
    {
      name: 'clutch-notes-store',
    }
  )
);
