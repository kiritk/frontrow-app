# Front Row - React Native App

Track your live event memories with a beautiful, native mobile experience.

## Features

- 🎫 **Ticket-stub aesthetic** - Beautiful card design inspired by classic ticket stubs
- 📱 **Native feel** - Haptic feedback, smooth animations, gesture-based interactions
- ☁️ **Cloud sync** - Events sync across devices via Supabase
- 📊 **Stats dashboard** - Track your event history and trends
- 🎨 **Cream & Navy theme** - Signature Front Row color palette

## Project Structure

```
frontrow-app/
├── App.tsx                      # Main app entry with navigation
├── src/
│   ├── components/
│   │   ├── EventCard.tsx        # Swipeable event card
│   │   └── AddEventButton.tsx   # FAB + modal form
│   ├── context/
│   │   └── AuthContext.tsx      # Auth state management
│   ├── lib/
│   │   └── supabase.ts          # Supabase client config
│   ├── screens/
│   │   ├── AuthScreen.tsx       # Sign in/up
│   │   ├── EventsScreen.tsx     # Main events list
│   │   ├── StatsScreen.tsx      # Analytics
│   │   └── ProfileScreen.tsx    # User settings
│   └── theme/
│       └── colors.ts            # Color palette & design tokens
├── package.json
├── app.json                     # Expo config
├── babel.config.js              # Babel with Reanimated plugin
└── tsconfig.json
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Supabase

Open `src/lib/supabase.ts` and replace `YOUR_ANON_KEY_HERE` with your actual Supabase anon key.

You can find this in your Supabase dashboard:
1. Go to https://supabase.com/dashboard
2. Select your project
3. Settings → API → Project API keys → anon/public

### 3. Database Schema

Make sure your `events` table in Supabase has this schema:

```sql
create table events (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  event_name text not null,
  event_type text not null check (event_type in ('concert', 'sports', 'theater', 'comedy', 'festival', 'other')),
  venue text not null,
  city text not null,
  event_date date not null,
  section text,
  row text,
  seat text,
  rating integer check (rating >= 1 and rating <= 5),
  notes text,
  photo_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table events enable row level security;

-- Users can only see their own events
create policy "Users can view own events"
  on events for select
  using (auth.uid() = user_id);

-- Users can insert their own events
create policy "Users can insert own events"
  on events for insert
  with check (auth.uid() = user_id);

-- Users can update their own events
create policy "Users can update own events"
  on events for update
  using (auth.uid() = user_id);

-- Users can delete their own events
create policy "Users can delete own events"
  on events for delete
  using (auth.uid() = user_id);
```

### 4. Create Asset Placeholders

```bash
mkdir -p assets
# Add icon.png (1024x1024), splash.png (1284x2778), adaptive-icon.png (1024x1024), favicon.png (48x48)
```

### 5. Run the App

```bash
# Start Expo development server
npx expo start

# Or for specific platforms
npx expo start --ios
npx expo start --android
```

## Key Features Implemented

### Authentication
- Email/password sign in & sign up
- Session persistence with AsyncStorage
- Auth state managed via React Context

### Events
- List view with pull-to-refresh
- Animated card entrance (staggered fade-in)
- Swipe-to-delete with haptic feedback
- Add event modal with:
  - Event type selector
  - Date picker
  - Seat details (section/row/seat)
  - Star rating
  - Notes

### Stats
- Total events count
- Cities visited
- Average rating
- Events by type breakdown
- Top venues ranking

### Native Features
- Haptic feedback on all interactions
- Spring animations via Reanimated
- Gesture handling for swipe actions
- Safe area handling for notches

## Next Steps

1. Add date picker component (react-native-date-picker)
2. Implement photo upload with expo-image-picker
3. Add Apple Maps integration for venue lookup
4. Push notifications for upcoming events
5. Share event cards as images
6. Dark mode support

## Tech Stack

- **Expo** ~52.0.0
- **React Native** 0.76.0
- **TypeScript** ~5.3.0
- **Supabase** ^2.45.0
- **React Navigation** ^6.x
- **Reanimated** ~3.16.0
- **Gesture Handler** ~2.20.0
