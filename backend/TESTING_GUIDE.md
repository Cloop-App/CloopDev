# Quick Testing Guide - AI Pipeline Updates

## Prerequisites
1. Backend server running on port 4000
2. PostgreSQL database connected
3. OpenAI API key configured in `.env`
4. At least one user in the system

## Test 1: New User Signup with Content Generation

### Step 1: Create a New User
```bash
# Windows PowerShell
$body = @{
    name = "Test Student"
    email = "teststudent@example.com"
    phone = "1234567890"
    grade_level = 1
    board = 1
    subjects = @(1, 2)
    preferred_language = 1
    study_goal = "Learn effectively"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:4000/api/signup" -Method POST -Body $body -ContentType "application/json"
```

### Expected Results:
- ✅ User created successfully
- ✅ Console shows: "Setting up content generation for new user"
- ✅ Console shows: "Created pending status for subject"

### Step 2: Check Database
```sql
-- Check if content_generation_status records were created
SELECT * FROM content_generation_status WHERE user_id = [NEW_USER_ID];

-- Expected: One record per subject with status = 'pending'
```

---

## Test 2: Backend Startup AI Pipeline

### Step 1: Restart Backend Server
```bash
cd backend
npm start
```

### Expected Console Output:
```
Backend server listening on port 4000

Initializing AI Pipeline...

=== Checking for pending content generation ===
Found X pending content generation task(s)

Processing: User 1, Subject: Mathematics
Generating chapters for User 1, Subject: Mathematics
Created X chapters for Mathematics
Generating topics for Chapter: [Chapter Title]
...
✓ Successfully generated content for Mathematics

=== Pipeline Check Complete ===
Total tasks: X
Processed: X
Failed: 0
Skipped: 0
```

### Step 2: Verify in Database
```sql
-- Check if chapters were created
SELECT * FROM chapters WHERE user_id = [USER_ID];

-- Check if topics were created
SELECT * FROM topics WHERE user_id = [USER_ID];

-- Check generation status updated
SELECT * FROM content_generation_status WHERE user_id = [USER_ID];
-- Expected: status = 'completed', chapters_generated = true, topics_generated = true
```

---

## Test 3: Topic-Specific AI Chat

### Step 1: Get a Topic ID
```sql
-- Find a topic for testing
SELECT id, title, content FROM topics WHERE user_id = [USER_ID] LIMIT 1;
```

### Step 2: Login and Get Token
```bash
$loginBody = @{
    email = "teststudent@example.com"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:4000/api/login" -Method POST -Body $loginBody -ContentType "application/json"
$token = $response.token
```

### Step 3: Send a Chat Message
```bash
$chatBody = @{
    message = "Can you explain this topic in simple terms with examples?"
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

Invoke-RestMethod -Uri "http://localhost:4000/api/topic-chats/[TOPIC_ID]/message" -Method POST -Body $chatBody -Headers $headers
```

### Expected Response:
```json
{
  "userMessage": {
    "id": 1,
    "sender": "user",
    "message": "Can you explain this topic in simple terms with examples?",
    "created_at": "2025-10-14T..."
  },
  "aiMessage": {
    "id": 2,
    "sender": "ai",
    "message": "Great question about [Topic Title]! Let me explain this concept...",
    "created_at": "2025-10-14T..."
  }
}
```

### Verify AI Response Quality:
- ✅ Response mentions the topic title
- ✅ Response is educational and helpful
- ✅ Response stays focused on the topic
- ✅ Response is concise (not too long)

### Step 4: Check Chat History
```bash
Invoke-RestMethod -Uri "http://localhost:4000/api/topic-chats/[TOPIC_ID]" -Method GET -Headers $headers
```

### Expected:
- ✅ Returns topic details
- ✅ Returns all messages in chronological order
- ✅ Both user and AI messages are stored

---

## Test 4: AI Context Memory

### Send Multiple Messages
```bash
# Message 1
$msg1 = @{ message = "What is this topic about?" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:4000/api/topic-chats/[TOPIC_ID]/message" -Method POST -Body $msg1 -Headers $headers

# Message 2 (follow-up)
$msg2 = @{ message = "Can you explain more about that?" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:4000/api/topic-chats/[TOPIC_ID]/message" -Method POST -Body $msg2 -Headers $headers

# Message 3 (reference to previous)
$msg3 = @{ message = "How does this relate to what you mentioned earlier?" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:4000/api/topic-chats/[TOPIC_ID]/message" -Method POST -Body $msg3 -Headers $headers
```

### Expected:
- ✅ AI understands "that" refers to previous explanation
- ✅ AI references earlier messages in conversation
- ✅ Conversation flows naturally with context

---

## Test 5: Content Generation Status Check

### Check All Statuses for a User
```bash
Invoke-RestMethod -Uri "http://localhost:4000/api/content-generation/status/[USER_ID]" -Method GET -Headers $headers
```

### Expected Response:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "subject_id": 1,
      "grade_level": "10",
      "board": "CBSE",
      "chapters_generated": true,
      "topics_generated": true,
      "status": "completed",
      "generation_started_at": "2025-10-14T...",
      "generation_completed_at": "2025-10-14T...",
      "subjects": {
        "id": 1,
        "name": "Mathematics",
        "code": "MATH"
      }
    }
  ]
}
```

---

## Test 6: Manual Content Generation

### Trigger Manual Generation for a Subject
```bash
$genBody = @{
    userId = [USER_ID]
    subjectId = 3
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:4000/api/content-generation/generate-subject" -Method POST -Body $genBody -Headers $headers -ContentType "application/json"
```

### Expected:
- ✅ Process starts immediately
- ✅ Console shows generation progress
- ✅ Chapters and topics created
- ✅ Status updated to completed

---

## Test 7: Error Handling

### Test AI Failure Gracefully
1. Temporarily set invalid OpenAI API key
2. Send a chat message
3. Expected: Fallback message returned, no crash

### Test Incomplete User Profile
1. Create user without grade_level or board
2. Backend startup should skip this user
3. Expected: Logged as "profile incomplete"

### Test Failed Generation Retry
1. Force a generation to fail (e.g., invalid API key)
2. Status should be "failed"
3. Restart backend
4. Expected: Pipeline retries failed tasks

---

## Common Issues & Solutions

### Issue: "OpenAI API Error"
**Solution**: Check `API_KEY_OPENAI` in `.env` file

### Issue: "No pending tasks found"
**Solution**: 
1. Check `content_generation_status` table
2. Create test user with pending status
3. Restart backend

### Issue: AI responses are not topic-specific
**Solution**:
1. Verify topic has `content` field populated
2. Check OpenAI service is using correct model (gpt-4)
3. Review console logs for API errors

### Issue: Chat history not working
**Solution**:
1. Check `topic_chats` table has records
2. Verify user_id matches in all queries
3. Check orderBy and take clauses in query

---

## Success Criteria

✅ All tests pass without errors  
✅ Content generated automatically on signup  
✅ Backend startup processes pending tasks  
✅ AI chat responses are topic-specific  
✅ Chat history maintains context  
✅ Error handling works gracefully  
✅ Database records created correctly  

## Performance Benchmarks

- **Signup**: < 1 second (async generation)
- **Backend Startup**: 3-5 seconds before pipeline starts
- **Chapter Generation**: 10-15 seconds per subject
- **Topic Generation**: 5-10 seconds per chapter
- **Chat Response**: 2-5 seconds per message

---

## Need Help?

1. Check `backend/AI_PIPELINE_UPDATES.md` for detailed implementation
2. Review console logs for error messages
3. Verify database schema matches expected structure
4. Test OpenAI API key with simple curl request
5. Check PostgreSQL connection and permissions

Happy Testing! 🚀
