# AI Pipeline Updates - Implementation Summary

## Overview
This document outlines the updates made to implement topic-specific AI chat functionality using GPT-4 and automatic content generation pipeline on backend startup.

## Changes Made

### 1. Topic-Specific AI Chat with GPT-4

#### File: `services/openai.js`
- **Added Function**: `generateTopicChatResponse()`
  - Uses GPT-4 model for intelligent responses
  - Takes topic title and content as context
  - Includes chat history (last 10 messages) for continuity
  - Configured system prompt to keep AI focused on the specific topic
  - Temperature: 0.7 for balanced creativity
  - Max tokens: 500 for concise responses

**Features:**
- Topic-contextual responses
- Educational focus with examples and analogies
- Gentle redirection if user goes off-topic
- Student-appropriate language

#### File: `api/topic-chats/topic-chats.js`
- **Updated**: POST `/api/topic-chats/:topicId/message` endpoint
  - Removed mock AI response function
  - Integrated `generateTopicChatResponse()` from openai service
  - Fetches recent chat history (last 10 messages) for context
  - Includes topic details (title, content, chapter, subject) in query
  - Error handling with fallback message if AI service fails
  - Properly stores both user and AI messages in `topic_chats` table

**Key Improvements:**
- AI responses are now topic-specific and educational
- Uses actual topic content as context
- Maintains conversation history for better context
- More intelligent and relevant responses

---

### 2. Automatic Content Generation Pipeline

#### File: `services/content-pipeline.js`
- **Added Function**: `checkAndProcessPendingGenerations()`
  - Runs on backend startup
  - Searches for all pending or failed content generation tasks
  - Validates user profiles (grade_level, board)
  - Processes each pending task automatically
  - Includes rate limiting delays (2 seconds between tasks)
  - Comprehensive logging with statistics

**Process Flow:**
1. Query `content_generation_status` for pending/failed tasks
2. Validate each user's profile completeness
3. Run `runContentGenerationPipeline()` for each valid task
4. Update status to completed or failed
5. Display summary statistics

---

### 3. Backend Startup Integration

#### File: `index.js`
- **Updated**: Server startup logic
  - Imports `checkAndProcessPendingGenerations()`
  - Executes pipeline check 3 seconds after server starts
  - Runs in background to not block server
  - Error handling to prevent server crash
  - Informative console logging

**Startup Sequence:**
1. Server starts and listens on port
2. 3-second delay for database connections to stabilize
3. AI Pipeline checker runs automatically
4. Processes all pending content generation tasks
5. Server ready for requests

---

### 4. User Signup Content Generation Setup

#### File: `services/curriculum-auto-trigger.js` (NEW)
- **New Service**: Handles content generation setup for new users
- **Function**: `handleUserSignup(userId)`
  - Validates user profile (grade_level, board)
  - Retrieves all user's subjects from `user_subjects`
  - Creates `content_generation_status` records with status "pending"
  - Sets `chapters_generated` and `topics_generated` to false initially
  - One record per subject

**Status Flow:**
```
New User Signup → Pending Status Created → Backend Startup → AI Pipeline Processes → Completed
```

#### File: `api/signup/signup.js`
- **Updated**: POST `/api/signup/` endpoint
  - Fixed import of `curriculum-auto-trigger` service
  - Calls `handleUserSignup()` after user creation
  - Runs asynchronously (doesn't block signup response)
  - Creates pending status for each subject
  - Error handling with logging

---

## Database Schema Changes

No schema changes required! The existing `content_generation_status` table already supports all necessary fields:

```prisma
model content_generation_status {
  id                      Int       @id @default(autoincrement())
  user_id                 Int
  subject_id              Int
  grade_level             String    @db.VarChar(50)
  board                   String    @db.VarChar(50)
  chapters_generated      Boolean   @default(false)
  topics_generated        Boolean   @default(false)
  generation_started_at   DateTime? @db.Timestamp(6)
  generation_completed_at DateTime? @db.Timestamp(6)
  status                  String    @default("pending") @db.VarChar(50)
  error_message           String?
  created_at              DateTime? @default(now()) @db.Timestamp(6)
  updated_at              DateTime? @updatedAt @db.Timestamp(6)
  subjects                subjects  @relation(...)
}
```

**Status Values:**
- `pending` - Waiting for generation (created on signup)
- `in_progress` - Currently generating
- `completed` - Successfully generated
- `failed` - Generation failed (will retry on next startup)

---

## User Flow

### New User Signup Flow:
1. User completes signup with grade_level, board, and subjects
2. User record created in `users` table
3. User-subject relationships created in `user_subjects` table
4. `curriculum-auto-trigger` service creates pending content generation records
5. Backend responds with success (signup complete)
6. User can immediately access the app

### Background Content Generation:
1. Backend starts up
2. AI Pipeline checker runs after 3 seconds
3. Finds all pending content generation tasks
4. For each task:
   - Validates user profile
   - Generates chapters using GPT-4
   - Generates topics for each chapter using GPT-4
   - Updates status to completed
5. Content ready for user access

### Topic Chat Flow:
1. User opens a topic chat
2. User sends a message
3. Backend receives message with topic_id
4. Fetches topic details (title, content)
5. Retrieves recent chat history (last 10 messages)
6. Sends context to GPT-4:
   - Topic title and content
   - Chat history
   - User's new message
7. GPT-4 generates contextual response
8. Both messages saved to `topic_chats` table
9. Returns messages to frontend

---

## API Endpoints

### Topic Chat
- **GET** `/api/topic-chats/:topicId` - Fetch topic and chat messages
- **POST** `/api/topic-chats/:topicId/message` - Send message and get AI response

### Content Generation
- **POST** `/api/content-generation/generate-subject` - Manual generation for one subject
- **POST** `/api/content-generation/generate-all` - Manual generation for all subjects
- **GET** `/api/content-generation/status/:userId` - Check all generation statuses
- **POST** `/api/content-generation/reset` - Reset and regenerate content

---

## Environment Variables Required

Ensure `.env` file contains:
```env
API_KEY_OPENAI=your_openai_api_key_here
DATABASE_URL=your_postgresql_connection_string
PORT=4000
```

---

## Testing the Implementation

### 1. Test New User Signup:
```bash
# Create a new user
curl -X POST http://localhost:4000/api/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Student",
    "email": "test@example.com",
    "grade_level": 1,
    "board": 1,
    "subjects": [1, 2],
    "preferred_language": 1
  }'

# Check content generation status
curl http://localhost:4000/api/content-generation/status/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Test Backend Startup:
```bash
# Start the backend
cd backend
npm start

# Check console output for:
# - "Initializing AI Pipeline..."
# - "Found X pending content generation task(s)"
# - "Pipeline Check Complete"
```

### 3. Test Topic Chat:
```bash
# Send a message
curl -X POST http://localhost:4000/api/topic-chats/1/message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "message": "Can you explain this topic in simple terms?"
  }'

# Expected: AI response contextual to the topic
```

---

## Monitoring & Logging

The implementation includes comprehensive logging:

### Startup Logs:
```
Backend server listening on port 4000
Initializing AI Pipeline...

=== Checking for pending content generation ===
Found 2 pending content generation task(s)

Processing: User 1, Subject: Mathematics
✓ Successfully generated content for Mathematics

=== Pipeline Check Complete ===
Total tasks: 2
Processed: 2
Failed: 0
Skipped: 0
```

### Chat Logs:
- User message stored
- AI request to OpenAI
- AI response stored
- Error handling logged

---

## Error Handling

### AI Chat Errors:
- If GPT-4 fails, returns fallback message
- User experience not disrupted
- Error logged for debugging

### Pipeline Errors:
- Failed tasks marked as "failed" status
- Will retry on next backend startup
- User can manually trigger via API
- Error message stored in database

### Signup Errors:
- Pipeline setup failure doesn't block signup
- Logged for investigation
- Can be manually triggered later

---

## Performance Considerations

1. **Rate Limiting**: 2-second delay between content generation tasks
2. **Background Processing**: Pipeline runs without blocking server
3. **Startup Delay**: 3-second grace period for connections
4. **Token Limits**: GPT-4 responses limited to 500 tokens
5. **History Limit**: Only last 10 messages included in context

---

## Future Enhancements

1. **Job Queue**: Use Bull or RabbitMQ for better background processing
2. **Webhooks**: Notify frontend when content generation completes
3. **Progress Tracking**: Real-time progress updates
4. **Retry Logic**: Exponential backoff for failed tasks
5. **Caching**: Cache topic content to reduce database queries
6. **Model Selection**: Allow different models per use case
7. **User Preferences**: Let users choose AI response style

---

## Troubleshooting

### Issue: Pipeline not running on startup
- **Check**: Console logs for "Initializing AI Pipeline"
- **Solution**: Ensure PostgreSQL connection is stable

### Issue: AI responses are generic
- **Check**: Topic content is populated in database
- **Solution**: Regenerate content or manually add topic content

### Issue: Rate limit errors from OpenAI
- **Check**: Number of pending tasks
- **Solution**: Increase delay between tasks or use job queue

### Issue: Content generation stuck in "in_progress"
- **Check**: Status in database
- **Solution**: Use reset endpoint or manually update status to "pending"

---

## Summary

All requested features have been implemented:

✅ Topic-specific AI chat using GPT-4  
✅ Chat history stored in `topic_chats` table  
✅ AI pipeline checks on backend startup  
✅ Pending content generation created on signup  
✅ Automatic processing of pending tasks  
✅ Comprehensive error handling and logging  

The system is now production-ready for intelligent, topic-focused educational conversations!
