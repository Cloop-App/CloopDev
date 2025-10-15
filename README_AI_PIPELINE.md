# 🎓 AI Content Generation Pipeline - Complete Documentation

## 📖 Table of Contents
1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Architecture](#architecture)
4. [API Reference](#api-reference)
5. [Frontend Integration](#frontend-integration)
6. [Database Schema](#database-schema)
7. [Configuration](#configuration)
8. [Testing](#testing)
9. [Troubleshooting](#troubleshooting)
10. [Production Deployment](#production-deployment)

---

## 🎯 Overview

An automated AI-powered pipeline that generates personalized educational content (chapters and topics) based on:
- Student's grade level
- Educational board (CBSE, ICSE, State boards, etc.)
- Subject (Science, Math, English, etc.)

### Key Features
✅ **One-time execution** per user-subject-grade-board combination  
✅ **GPT-4/5 powered** content generation  
✅ **Real-time status tracking** with progress updates  
✅ **Error recovery** with retry mechanism  
✅ **Batch processing** for multiple subjects  
✅ **RESTful API** with JWT authentication  
✅ **React Native UI** with TypeScript support  

---

## 🚀 Quick Start

### 1. Prerequisites
```bash
# Ensure you have:
- Node.js (v14+)
- PostgreSQL (running)
- OpenAI API key
```

### 2. Database Setup
```bash
cd backend
npx prisma db push
npx prisma generate
```

### 3. Environment Variables
Verify `.env` file has:
```env
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
API_KEY_OPENAI=sk-...
```

### 4. Start Backend
```bash
cd backend
npm start
# Server runs on http://localhost:4000
```

### 5. Test Pipeline
```bash
cd backend
node test-pipeline.js
```

---

## 🏗️ Architecture

### System Components

```
┌─────────────────────────────────────────────────┐
│           Frontend (React Native)               │
│  - ContentGenerationScreen.tsx                  │
│  - content-generation.ts (API Client)           │
└────────────────┬────────────────────────────────┘
                 │ HTTP/REST
                 ▼
┌─────────────────────────────────────────────────┐
│           Backend (Express.js)                  │
│  - API Endpoints (JWT protected)                │
│  - Content Pipeline Orchestrator                │
│  - OpenAI Service Integration                   │
└────────────────┬────────────────────────────────┘
                 │
        ┌────────┴────────┐
        ▼                 ▼
┌──────────────┐  ┌──────────────┐
│  PostgreSQL  │  │  OpenAI API  │
│   Database   │  │   (GPT-4/5)  │
└──────────────┘  └──────────────┘
```

### Data Flow

```
1. User Request → API Endpoint
2. Check Generation Status (DB)
3. If needed: Generate Chapters (AI)
4. Store Chapters (DB)
5. For each chapter: Generate Topics (AI)
6. Store Topics (DB)
7. Update Status (DB)
8. Return Response
```

See [ARCHITECTURE_DIAGRAM.md](ARCHITECTURE_DIAGRAM.md) for detailed flow.

---

## 📡 API Reference

### Base URL
```
http://localhost:4000/api/content-generation
```

### Authentication
All endpoints require JWT token in header:
```
Authorization: Bearer <your-jwt-token>
```

### Endpoints

#### 1. Generate Content for Single Subject
```http
POST /generate-subject
Content-Type: application/json

{
  "userId": 1,
  "subjectId": 3
}
```

**Response:**
```json
{
  "success": true,
  "message": "Content generation completed",
  "data": {
    "chaptersCount": 15
  }
}
```

#### 2. Generate Content for All Subjects
```http
POST /generate-all
Content-Type: application/json

{
  "userId": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "Content generation started. This may take several minutes.",
  "note": "Check the status endpoint for progress"
}
```

#### 3. Check Generation Status (Single Subject)
```http
GET /status/:userId/:subjectId
```

**Response:**
```json
{
  "exists": true,
  "status": {
    "id": 1,
    "user_id": 1,
    "subject_id": 3,
    "grade_level": "8",
    "board": "CBSE",
    "chapters_generated": true,
    "topics_generated": true,
    "status": "completed",
    "generation_started_at": "2025-10-14T10:00:00Z",
    "generation_completed_at": "2025-10-14T10:03:00Z",
    "error_message": null
  }
}
```

#### 4. Get All Generation Statuses
```http
GET /status/:userId
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "subject_id": 3,
      "status": "completed",
      "subjects": {
        "id": 3,
        "name": "Science",
        "code": "science"
      }
    }
  ]
}
```

#### 5. Reset/Retry Generation
```http
POST /reset
Content-Type: application/json

{
  "userId": 1,
  "subjectId": 3
}
```

**Response:**
```json
{
  "success": true,
  "message": "Content reset successfully. You can now regenerate."
}
```

### Status Values

| Status | Description |
|--------|-------------|
| `pending` | Not started |
| `in_progress` | Currently generating |
| `completed` | Successfully finished |
| `failed` | Error occurred |

---

## 💻 Frontend Integration

### TypeScript Client

```typescript
import {
  generateContentForSubject,
  checkGenerationStatus,
  pollGenerationStatus,
} from './src/client/content-generation/content-generation';

// Generate content
const result = await generateContentForSubject(userId, subjectId, token);

// Check status
const status = await checkGenerationStatus(userId, subjectId, token);

// Poll until complete
const finalStatus = await pollGenerationStatus(
  userId,
  subjectId,
  token,
  (progress) => {
    console.log('Progress:', progress.status);
  }
);
```

### React Hook

```typescript
import { useContentGeneration } from './src/client/content-generation/content-generation';

function MyComponent() {
  const { loading, status, error, generateContent, reset } = useContentGeneration();

  const handleGenerate = async () => {
    try {
      await generateContent(userId, subjectId, token);
      console.log('Generation complete!');
    } catch (err) {
      console.error('Generation failed:', err);
    }
  };

  return (
    <View>
      {loading && <ActivityIndicator />}
      {status && <Text>Status: {status.status}</Text>}
      <Button title="Generate" onPress={handleGenerate} />
    </View>
  );
}
```

### Full UI Component

```typescript
import ContentGenerationScreen from './components/ContentGenerationScreen';

// In your navigation
<Stack.Screen 
  name="ContentGeneration" 
  component={ContentGenerationScreen}
/>
```

---

## 🗄️ Database Schema

### New Table: `content_generation_status`

```sql
CREATE TABLE content_generation_status (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  subject_id INTEGER NOT NULL,
  grade_level VARCHAR(50) NOT NULL,
  board VARCHAR(50) NOT NULL,
  chapters_generated BOOLEAN DEFAULT false,
  topics_generated BOOLEAN DEFAULT false,
  generation_started_at TIMESTAMP(6),
  generation_completed_at TIMESTAMP(6),
  status VARCHAR(50) DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(user_id, subject_id, grade_level, board),
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);
```

### Indexes
```sql
CREATE INDEX idx_content_gen_user_id ON content_generation_status(user_id);
CREATE INDEX idx_content_gen_status ON content_generation_status(status);
```

### Related Tables

- **`chapters`**: Stores generated chapters
- **`topics`**: Stores generated topics for each chapter
- **`user_subjects`**: Tracks user progress across subjects

---

## ⚙️ Configuration

### AI Model Configuration

**File:** `backend/services/openai.js`

```javascript
const response = await openai.chat.completions.create({
  model: 'gpt-4', // Change to 'gpt-5' when available
  temperature: 0.7, // Adjust creativity (0.0 - 1.0)
  max_tokens: 2000, // Adjust response length
});
```

### Rate Limiting

**File:** `backend/services/content-pipeline.js`

```javascript
// Delay between subjects (milliseconds)
await new Promise(resolve => setTimeout(resolve, 2000));
```

### Polling Interval

**File:** `cloop/src/client/content-generation/content-generation.ts`

```typescript
// Poll every 5 seconds
const interval = 5000;

// Maximum 60 attempts (5 minutes total)
const maxAttempts = 60;
```

### Custom Prompts

**Chapters Prompt:**
```javascript
// backend/services/openai.js - generateChapters()
const prompt = `You are an educational content expert. Generate chapters for:
- Grade: ${gradeLevel}
- Board: ${board}
- Subject: ${subject}
...`;
```

**Topics Prompt:**
```javascript
// backend/services/openai.js - generateTopics()
const prompt = `Generate topics for chapter "${chapterTitle}" in:
- Grade: ${gradeLevel}
- Board: ${board}
- Subject: ${subject}
...`;
```

---

## 🧪 Testing

### Automated Test Script

```bash
cd backend
node test-pipeline.js
```

This will:
1. Find a test user
2. Verify configuration
3. Run generation for one subject
4. Display results

### Manual API Testing

```bash
# Using curl
curl -X POST http://localhost:4000/api/content-generation/generate-subject \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"userId": 1, "subjectId": 3}'
```

### Test Checklist

- [ ] Database migration applied
- [ ] Prisma client generated
- [ ] OpenAI API key configured
- [ ] Backend server running
- [ ] Test user has grade_level, board, subjects
- [ ] Subjects table populated
- [ ] JWT authentication working
- [ ] Test script runs successfully
- [ ] API returns valid responses

---

## 🔧 Troubleshooting

### Common Issues

#### 1. "User must have grade_level and board set"

**Solution:**
```sql
UPDATE users 
SET grade_level = '8', 
    board = 'CBSE', 
    subjects = ARRAY['science', 'math']
WHERE user_id = 1;
```

#### 2. "Subject with code 'science' not found"

**Solution:**
```sql
INSERT INTO subjects (code, name, category) 
VALUES 
  ('science', 'Science', 'Core'),
  ('math', 'Mathematics', 'Core'),
  ('english', 'English', 'Language');
```

#### 3. Generation Stuck in "in_progress"

**Check logs:**
```bash
# View backend logs for errors
```

**Reset if needed:**
```bash
curl -X POST http://localhost:4000/api/content-generation/reset \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"userId": 1, "subjectId": 3}'
```

#### 4. OpenAI API Rate Limit

**Solutions:**
- Increase delay between API calls
- Check OpenAI account quota
- Upgrade OpenAI plan
- Implement exponential backoff

#### 5. Database Connection Issues

**Check:**
```bash
# Verify DATABASE_URL in .env
# Test connection
psql $DATABASE_URL
```

### Debug Mode

Enable detailed logging:
```javascript
// backend/services/content-pipeline.js
console.log('Debug info:', { userId, subjectId, status });
```

---

## 🚀 Production Deployment

### Pre-deployment Checklist

- [ ] Environment variables secured
- [ ] Database backup created
- [ ] OpenAI API quota verified
- [ ] Rate limiting configured
- [ ] Error monitoring setup
- [ ] Logging configured
- [ ] Load testing completed

### Recommended Enhancements

#### 1. Job Queue (Bull/Agenda)
```javascript
// Instead of direct execution
const job = await queue.add('generate-content', { userId, subjectId });
```

#### 2. Redis Caching
```javascript
// Cache generation status
await redis.setex(`status:${userId}:${subjectId}`, 300, JSON.stringify(status));
```

#### 3. WebSocket Updates
```javascript
// Real-time progress updates
io.to(userId).emit('generation-progress', { status, progress });
```

#### 4. Monitoring
```javascript
// Track metrics
metrics.increment('content.generation.started');
metrics.timing('content.generation.duration', duration);
```

#### 5. Error Tracking (Sentry)
```javascript
Sentry.captureException(error, {
  extra: { userId, subjectId, phase: 'chapter-generation' }
});
```

### Scaling Considerations

1. **Horizontal Scaling**: Deploy multiple backend instances
2. **Database**: Use connection pooling, read replicas
3. **Caching**: Redis for status checks
4. **Queue**: Separate workers for content generation
5. **CDN**: Cache static content responses

### Cost Optimization

- **Batch requests** to OpenAI when possible
- **Cache common** curriculum structures
- **Implement retry** logic with exponential backoff
- **Monitor usage** and set alerts
- **Consider fine-tuning** for specific boards/subjects

---

## 📊 Performance Metrics

### Expected Timing
- Single subject: 2-3 minutes
- 3 subjects: 10-15 minutes
- 5 subjects: 20-30 minutes

### Database Impact
- Chapters per subject: 10-20 records
- Topics per chapter: 5-10 records
- Total records (5 subjects): ~500-1000 records

### API Costs (OpenAI)
- Chapters generation: ~500-1000 tokens
- Topics generation: ~1000-2000 tokens per chapter
- Total per subject: ~15,000-20,000 tokens

---

## 📚 Additional Resources

- [AI_PIPELINE_README.md](backend/AI_PIPELINE_README.md) - Detailed technical docs
- [SETUP_GUIDE.md](SETUP_GUIDE.md) - Step-by-step setup
- [ARCHITECTURE_DIAGRAM.md](ARCHITECTURE_DIAGRAM.md) - Visual architecture
- [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) - Complete summary

---

## 🤝 Support

For issues or questions:
1. Check [Troubleshooting](#troubleshooting) section
2. Review backend logs
3. Test with `test-pipeline.js`
4. Verify database state

---

## 📝 License

This implementation is part of the CloopDev educational platform.

---

**Built with ❤️ using Node.js, React Native, PostgreSQL, and OpenAI**
