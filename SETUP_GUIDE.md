# 🚀 Quick Setup Guide - AI Content Generation Pipeline

## Step-by-Step Setup

### 1️⃣ Database is Already Migrated ✅
Your database has been updated with the new `content_generation_status` table.

### 2️⃣ Backend is Ready ✅
All necessary files have been created:
- AI service integration
- Pipeline orchestration
- API endpoints

### 3️⃣ Start Your Backend Server

```bash
cd backend
npm start
```

Your backend should start on `http://localhost:4000`

### 4️⃣ Test the Pipeline (Optional)

Run the test script to verify everything works:

```bash
cd backend
node test-pipeline.js
```

This will:
- Find a test user
- Check their subjects
- Generate content for one subject
- Display the results

### 5️⃣ Use the API

#### Option A: Via REST API

**Generate content for a subject:**
```bash
# Replace YOUR_TOKEN with actual JWT token
curl -X POST http://localhost:4000/api/content-generation/generate-subject \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d "{\"userId\": 1, \"subjectId\": 3}"
```

**Check status:**
```bash
curl http://localhost:4000/api/content-generation/status/1/3 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Option B: Via Frontend

1. Navigate to the Content Generation screen
2. Click "Generate All Subjects" or individual "Generate" buttons
3. Monitor progress in real-time
4. Content will be available in your chapters and topics

### 6️⃣ Integrate with Your App

Add the Content Generation screen to your navigation:

```typescript
// In your navigation setup
import ContentGenerationScreen from './components/ContentGenerationScreen';

// Add to your stack or tabs
<Stack.Screen 
  name="ContentGeneration" 
  component={ContentGenerationScreen}
  options={{ title: "Generate Content" }}
/>
```

## 🎯 When to Trigger Content Generation

### Recommended Triggers:

1. **After User Signup/Onboarding**
   - When user completes profile setup
   - After selecting subjects, grade, and board
   - Automatically generate content in background

2. **On Subject Addition**
   - When user adds a new subject to their profile
   - Generate only for the new subject

3. **Manual Trigger**
   - Provide a button in settings or profile
   - Let users regenerate if needed

### Example: Auto-generate after signup

```typescript
// In your signup completion handler
const handleSignupComplete = async (userData) => {
  try {
    // Create user account
    const user = await createUser(userData);
    
    // Automatically start content generation
    await generateContentForAllSubjects(user.user_id, token);
    
    // Navigate to home
    navigation.navigate('Home');
    
    // Show notification
    showNotification('Content is being generated! This will take a few minutes.');
  } catch (error) {
    console.error('Signup error:', error);
  }
};
```

## 📋 Prerequisites for Generation

Ensure your users have these fields set:
- ✅ `grade_level` (e.g., "8", "9", "10")
- ✅ `board` (e.g., "CBSE", "ICSE", "State Board")
- ✅ `subjects` array (e.g., ["science", "math", "english"])

## 🔍 Monitoring Generation

### Check Status Programmatically
```typescript
import { checkGenerationStatus } from './src/client/content-generation/content-generation';

const status = await checkGenerationStatus(userId, subjectId, token);

if (status.exists && status.status) {
  console.log('Status:', status.status.status);
  console.log('Chapters generated:', status.status.chapters_generated);
  console.log('Topics generated:', status.status.topics_generated);
}
```

### Status Values
- `pending` - Not started
- `in_progress` - Currently generating
- `completed` - Successfully finished
- `failed` - Error occurred (check error_message)

## 🎨 Customizing AI Prompts

To customize what AI generates, edit:

**For Chapters:**
```javascript
// backend/services/openai.js - generateChapters()
const prompt = `Your custom prompt here...`;
```

**For Topics:**
```javascript
// backend/services/openai.js - generateTopics()
const prompt = `Your custom prompt here...`;
```

## ⚙️ Configuration Options

### Change AI Model
```javascript
// backend/services/openai.js
model: 'gpt-4', // Change to 'gpt-5' when available
```

### Adjust Rate Limiting
```javascript
// backend/services/content-pipeline.js
// Line ~200
await new Promise(resolve => setTimeout(resolve, 2000)); // 2 seconds
```

### Polling Interval
```typescript
// cloop/src/client/content-generation/content-generation.ts
const interval = setInterval(async () => {
  // ...check status
}, 5000); // 5 seconds - adjust as needed
```

## 🧪 Testing Checklist

- [ ] Backend server is running
- [ ] Database migration applied
- [ ] OpenAI API key is set in .env
- [ ] Test user has grade_level, board, and subjects
- [ ] Subjects table has matching records
- [ ] JWT authentication is working
- [ ] Test script runs successfully
- [ ] API endpoints respond correctly

## 🆘 Common Issues

### "User must have grade_level and board set"
**Solution:** Update user record:
```sql
UPDATE users 
SET grade_level = '8', board = 'CBSE', subjects = ARRAY['science', 'math']
WHERE user_id = 1;
```

### "Subject with code 'science' not found"
**Solution:** Add subjects to database:
```sql
INSERT INTO subjects (code, name, category) 
VALUES ('science', 'Science', 'Core');
```

### Generation takes too long
**Normal:** First generation can take 2-5 minutes for one subject
**Check:** Monitor backend logs for progress
**Tip:** Use the status endpoint to track progress

### Error: OpenAI API rate limit
**Solution:** 
1. Check your OpenAI account quota
2. Increase delay between API calls
3. Consider upgrading OpenAI plan

## 📊 Expected Performance

- **Single Subject:** 2-3 minutes
- **All Subjects (3-5):** 10-15 minutes
- **Chapters per Subject:** 10-20
- **Topics per Chapter:** 5-10

## 🎉 You're All Set!

Your AI content generation pipeline is ready to use. Start generating personalized educational content for your users!

### Next Steps:
1. Test with a user account
2. Integrate into your onboarding flow
3. Monitor generation status
4. Collect user feedback
5. Optimize prompts based on results

---

Need help? Check `AI_PIPELINE_README.md` for detailed documentation.
