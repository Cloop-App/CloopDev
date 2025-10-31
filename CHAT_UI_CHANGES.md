# Chat UI & Time Tracking Updates

## Summary
Updated the topic chat interface to a simple ChatGPT-style layout and added time tracking for learning sessions.

## Changes Made

### 1. **Database Schema** (`backend/prisma/schema.prisma`)
- Added `time_spent_seconds` column to `topics` table to track total time spent on each topic
- Created migration file: `backend/prisma/migrations/add_time_tracking.sql`

### 2. **Chat UI Layout** (ChatGPT-style)
**Before:** Complex layout with user on left, AI on right  
**After:** Simple layout with AI on left (purple icon), User on right (blue icon)

#### Updated Files:
- `cloop/app/chat/topic-chat.tsx`
  - Simplified message layout
  - AI messages: Left side with purple robot icon
  - User messages: Right side with blue person icon
  - Cleaner, more intuitive design

- `cloop/components/chat/MessageBubble.tsx`
  - Simplified bubble colors
  - User bubbles: Blue (#2563EB)
  - AI bubbles: Light gray (#F3F4F6)
  - Removed complex color-changing logic

### 3. **Time Tracking**

#### Frontend (`cloop/app/chat/topic-chat.tsx`)
- Added `elapsedSeconds` state to track session time
- Timer updates every second during chat session
- Session time sent with each message to backend
- Timer displayed in header

#### Backend (`backend/api/topic-chats/topic-chats.js`)
- Accepts `session_time_seconds` in POST request
- Increments `time_spent_seconds` in topics table
- Returns time data in GET responses

#### Topic List (`cloop/app/chapter-topic/topic.tsx`)
- Shows time spent on each topic (e.g., "2h 15m", "45 min", "Not started")
- Helper function `formatTimeSpent()` formats seconds into readable format

### 4. **TypeScript Interfaces**
- Updated `Topic` interface in `cloop/src/client/chapters/chapters.ts`
- Added `time_spent_seconds?: number` field

## Database Migration

Run this SQL to add the new column:

```sql
ALTER TABLE topics ADD COLUMN IF NOT EXISTS time_spent_seconds INTEGER DEFAULT 0;
UPDATE topics SET time_spent_seconds = 0 WHERE time_spent_seconds IS NULL;
```

Or use the migration file:
```bash
cd backend
psql $DATABASE_URL -f prisma/migrations/add_time_tracking.sql
```

## Visual Changes

### Chat Layout
```
┌─────────────────────────────────┐
│  [←] Topic Title        [⏱ 2:45]│
├─────────────────────────────────┤
│ 🤖 AI: Question here?           │
│                                 │
│           User: My answer    👤 │
│                                 │
│ 🤖 AI: Good! Next question?     │
└─────────────────────────────────┘
```

### Topic Card (Time Display)
```
┌─────────────────────────────────┐
│ ✓ Topic Name                    │
│ Progress: 80% Complete          │
│ ⏱ 1h 23m  📄 Has content       │
└─────────────────────────────────┘
```

## Benefits

1. **Simpler UX**: ChatGPT-style layout is familiar to users
2. **Time Tracking**: Track learning progress and engagement
3. **Clean Design**: Removed unnecessary complexity
4. **Better Metrics**: Can analyze time spent per topic for insights

## Next Steps

1. Run database migration
2. Test chat interface
3. Verify time tracking works correctly
4. Consider adding total time analytics in profile/metrics screen
