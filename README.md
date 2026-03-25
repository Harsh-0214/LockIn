# Clutch

**Get your life together. Finally.**

Clutch is a dark-mode life-organization app for people who struggle with motivation, consistency, and discipline. Track your body, build habits, manage your calendar, and keep notes — all in one place, beautifully designed.

---

## What's Inside

| Tab | What it does |
|-----|-------------|
| **Home** | Dashboard with daily greeting, motivational quote, today's events, body stats, and habit streak |
| **Body** | Weight tracking with chart, calorie ring, water intake, and workout log |
| **Notes** | Notebooks, search, pin, and a markdown-lite editor with auto-save |
| **Calendar** | Custom month grid, event management, and local push notification reminders |
| **Focus** | Daily habit checklist, 30-day streak heatmap, and milestone messages |

---

## Getting the App on Your Phone

You don't need a Mac, Xcode, or any build tools. Everything runs through **Expo Go**, a free app on the App Store.

### Step 1 — Install Expo Go

On your iPhone, open the App Store and search **"Expo Go"** — it's the white app with a blue circle. Install it.

### Step 2 — Get the code

Open a terminal on your computer and run:

```bash
git clone https://github.com/harsh-0214/lockin.git
cd lockin
```

### Step 3 — Install dependencies

```bash
npm install
```

This pulls down all the packages. Takes about a minute.

### Step 4 — Start the dev server

```bash
npx expo start
```

A QR code will appear in your terminal.

### Step 5 — Open on your iPhone

- Open the **Camera** app on your iPhone
- Point it at the QR code in the terminal
- Tap the **"Open in Expo Go"** banner that appears
- The app loads in seconds

That's it. Every time you want to use the app during development, just run `npx expo start` and scan the code.

---

## First Launch

When you open Clutch for the first time, you'll go through a short 3-screen onboarding:

1. **Your name** — just your first name, no account needed
2. **Body goals** — current weight, goal weight, daily calorie target
3. **Ready** — a summary of the app features, then straight in

After onboarding, the app is pre-loaded with realistic sample data so everything looks alive from the start — weight entries, meals, habits with streaks, notes, and calendar events.

---

## Features

### Home
- Time-based greeting (morning / afternoon / evening)
- Daily rotating motivational quote
- Today's top 3 events at a glance
- Calorie and weight summary widget
- Habit streak widget
- **+** floating button to quickly add a task, log weight, write a note, or create a habit

### Body
- Log weight with kg/lbs toggle
- Line chart for the last 7 weight entries (expandable to 1M / 3M / All)
- Current / Start / Goal / Lost stats row
- Calorie ring showing consumed vs. daily goal
- Log meals with optional macros (protein / carbs / fat)
- Quick-add chips for common items (customizable in Settings)
- 8-cup water tracker — tap each cup to fill
- Log workouts by type (Lift / Cardio / Walk / Sport / Other)
- Weekly workout bar chart

### Notes
- Create notes in seconds
- Organize into color-coded notebooks
- Pin important notes to the top
- Real-time search across all notes
- Markdown-lite editor: **bold**, - bullet lists, [ ] checkboxes
- Auto-saves as you type

### Calendar
- Full custom month grid with event dots
- Tap any day to see its events
- Add events with category, start/end time, repeat, and optional reminder
- Local push notifications for reminders (no internet required)
- Categories: Work (blue) / Health (green) / Personal (purple) / Other (grey)

### Focus
- Today's habit checklist based on your schedule
- Tap to check off — spring animation + haptic feedback
- View any habit's 30-day heatmap grid
- Stats: current streak, longest streak, 30-day completion rate
- Milestone messages at 3 / 7 / 21 / 30 days
- Set habits for every day or specific days of the week
- Optional grace day — one missed day won't break your streak
- Archive habits you've paused

### Settings
- Edit your name and avatar emoji
- Change weight units (kg / lbs)
- Update body goals and calorie target
- Customize quick-add meal chips
- Manage notification permissions
- Export all your data as JSON
- Clear all data with double-confirm

---

## Tech Stack

- **React Native + Expo SDK 51** — runs on iOS via Expo Go, no build required
- **Expo Router v3** — file-based navigation
- **Zustand** — lightweight state management with AsyncStorage persistence
- **expo-sqlite + drizzle-orm** — structured local database
- **expo-notifications** — fully offline local push notifications
- **react-native-reanimated + moti** — smooth animations throughout
- **react-native-gifted-charts** — weight and workout charts
- **@gorhom/bottom-sheet** — quick-add sheet
- **Syne Bold + DM Sans** — typography via @expo-google-fonts

---

## Project Structure

```
clutch/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx       # Home / Dashboard
│   │   ├── body.tsx        # Weight & fitness
│   │   ├── notes.tsx       # Notes
│   │   ├── calendar.tsx    # Calendar
│   │   └── focus.tsx       # Habits & streaks
│   ├── onboarding.tsx
│   ├── note-editor.tsx
│   ├── settings.tsx
│   └── _layout.tsx
├── components/ui/          # Design system components
├── store/                  # Zustand stores
├── db/                     # SQLite schema + queries
├── hooks/
├── constants/
└── utils/
```

---

## Troubleshooting

**"Something went wrong" on launch**
Run `npx expo start --clear` to clear the Metro cache.

**QR code not scanning**
Make sure your phone and computer are on the same Wi-Fi network. If it still doesn't work, press `s` in the terminal to switch to Expo Go tunnel mode.

**Fonts not loading**
This resolves itself after the first full load. If it persists, shake your phone in Expo Go and tap "Reload".

**Notifications not working**
Go to Settings → tap "Re-request Permission" → allow notifications in the system prompt that appears.

---

## License

MIT
