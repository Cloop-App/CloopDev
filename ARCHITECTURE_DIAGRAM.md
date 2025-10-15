# AI Content Generation Pipeline - Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           USER PROFILE DATA                             │
│  ┌─────────────┬──────────────┬─────────────┬────────────────────────┐ │
│  │  user_id: 1 │ grade: "8"   │ board: CBSE │ subjects: [science,..] │ │
│  └─────────────┴──────────────┴─────────────┴────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        API ENDPOINTS (Express.js)                       │
│                                                                         │
│  POST /api/content-generation/generate-subject                         │
│  POST /api/content-generation/generate-all                             │
│  GET  /api/content-generation/status/:userId/:subjectId                │
│  POST /api/content-generation/reset                                    │
│                                                                         │
│  [JWT Authentication Middleware Required]                              │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    CONTENT PIPELINE ORCHESTRATOR                        │
│                  (services/content-pipeline.js)                         │
│                                                                         │
│  1. checkGenerationStatus()                                            │
│     └─> Query: content_generation_status table                         │
│     └─> Return: pending | in_progress | completed | failed             │
│                                                                         │
│  2. IF not exists OR status = pending:                                 │
│     runContentGenerationPipeline(userId, subjectId)                    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                 ┌──────────────────┴──────────────────┐
                 ▼                                     ▼
    ┌─────────────────────────┐         ┌─────────────────────────┐
    │  Update Status Table    │         │   Fetch User + Subject  │
    │  status = "in_progress" │         │   Data from Database    │
    └─────────────────────────┘         └─────────────────────────┘
                 │                                     │
                 └──────────────────┬──────────────────┘
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      STEP 1: GENERATE CHAPTERS                          │
│                      (services/openai.js)                               │
│                                                                         │
│  generateChapters(gradeLevel, board, subject)                          │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────┐       │
│  │  GPT-4/5 API CALL                                          │       │
│  │  Prompt: "Generate chapters for Class 8 CBSE Science"     │       │
│  │  Response: [                                               │       │
│  │    { title: "Chapter 1", content: "Description..." },     │       │
│  │    { title: "Chapter 2", content: "Description..." },     │       │
│  │    ...                                                     │       │
│  │  ]                                                         │       │
│  └────────────────────────────────────────────────────────────┘       │
│                                                                         │
│  Parse JSON → Store in chapters table                                  │
│  Update: chapters_generated = true                                     │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    STEP 2: GENERATE TOPICS                              │
│                    (Loop for each chapter)                              │
│                                                                         │
│  FOR EACH chapter in chapters:                                         │
│                                                                         │
│    generateTopics(gradeLevel, board, subject, chapterTitle)            │
│                                                                         │
│    ┌──────────────────────────────────────────────────────────┐       │
│    │  GPT-4/5 API CALL                                        │       │
│    │  Prompt: "Generate topics for Chapter: Matter..."       │       │
│    │  Response: [                                             │       │
│    │    { title: "States of Matter", content: "..." },       │       │
│    │    { title: "Physical Properties", content: "..." },    │       │
│    │    ...                                                   │       │
│    │  ]                                                       │       │
│    └──────────────────────────────────────────────────────────┘       │
│                                                                         │
│    Parse JSON → Store in topics table                                  │
│    Update chapter.total_topics                                         │
│                                                                         │
│  NEXT chapter (with 2-second delay)                                    │
│  Update: topics_generated = true                                       │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      STEP 3: FINALIZATION                               │
│                                                                         │
│  1. Update user_subjects table                                         │
│     └─> total_chapters = count(chapters)                               │
│                                                                         │
│  2. Update content_generation_status                                   │
│     └─> status = "completed"                                           │
│     └─> generation_completed_at = NOW()                                │
│                                                                         │
│  3. Return success response                                            │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        DATABASE FINAL STATE                             │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────┐           │
│  │ content_generation_status                               │           │
│  │ ─────────────────────────────────────────────────────── │           │
│  │ user_id: 1, subject_id: 3                              │           │
│  │ status: "completed"                                     │           │
│  │ chapters_generated: true                                │           │
│  │ topics_generated: true                                  │           │
│  └─────────────────────────────────────────────────────────┘           │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────┐           │
│  │ chapters (15 records)                                   │           │
│  │ ─────────────────────────────────────────────────────── │           │
│  │ id: 1, user_id: 1, subject_id: 3,                      │           │
│  │ title: "Matter in Our Surroundings"                    │           │
│  │ total_topics: 8                                         │           │
│  │ ...                                                     │           │
│  └─────────────────────────────────────────────────────────┘           │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────┐           │
│  │ topics (98 records)                                     │           │
│  │ ─────────────────────────────────────────────────────── │           │
│  │ id: 1, chapter_id: 1, subject_id: 3,                   │           │
│  │ title: "States of Matter"                              │           │
│  │ ...                                                     │           │
│  └─────────────────────────────────────────────────────────┘           │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────┐           │
│  │ user_subjects                                           │           │
│  │ ─────────────────────────────────────────────────────── │           │
│  │ user_id: 1, subject_id: 3                              │           │
│  │ total_chapters: 15                                      │           │
│  │ completed_chapters: 0                                   │           │
│  └─────────────────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND INTEGRATION                            │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────┐          │
│  │  React Component: ContentGenerationScreen.tsx            │          │
│  │  ────────────────────────────────────────────────────    │          │
│  │  - Display subjects with status                          │          │
│  │  - Trigger generation (single or all)                    │          │
│  │  - Poll status every 5 seconds                           │          │
│  │  - Show progress indicators                              │          │
│  │  - Handle errors and retries                             │          │
│  └──────────────────────────────────────────────────────────┘          │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────┐          │
│  │  API Client: content-generation.ts                       │          │
│  │  ────────────────────────────────────────────────────    │          │
│  │  - generateContentForSubject()                           │          │
│  │  - generateContentForAllSubjects()                       │          │
│  │  - checkGenerationStatus()                               │          │
│  │  - pollGenerationStatus() with auto-retry               │          │
│  │  - useContentGeneration() React hook                    │          │
│  └──────────────────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════
                            KEY DESIGN FEATURES
═══════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────────┐
│  ✓ ONE-TIME EXECUTION                                                   │
│    Unique constraint prevents duplicate generation                     │
│    [user_id, subject_id, grade_level, board]                           │
│                                                                         │
│  ✓ ERROR RECOVERY                                                       │
│    Failed status → Can retry                                            │
│    Error messages stored for debugging                                 │
│    Partial completion tracked (chapters vs topics)                     │
│                                                                         │
│  ✓ RATE LIMITING                                                        │
│    2-second delay between subjects                                     │
│    Prevents OpenAI API throttling                                      │
│                                                                         │
│  ✓ REAL-TIME UPDATES                                                    │
│    Frontend polls status every 5 seconds                               │
│    Visual progress indicators                                          │
│    Background processing support                                       │
│                                                                         │
│  ✓ SCALABILITY                                                          │
│    Database indexes on user_id, status                                 │
│    Batch processing support                                            │
│    Ready for job queue integration                                     │
└─────────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════
                            TIMING & PERFORMANCE
═══════════════════════════════════════════════════════════════════════════

  Single Subject Timeline:
  
  [0s]      Request received
  [1s]      Status check + validation
  [5-30s]   Generate chapters (GPT API call)
  [10-40s]  Store chapters in database
  [15-45s]  Start topic generation (chapter 1)
  [20-60s]  Generate topics for chapter 1 (GPT API call)
  [25-65s]  Store topics for chapter 1
  ...       (Repeat for each chapter)
  [2-3min]  Final status update
  [2-3min]  ✓ COMPLETE

  Multiple Subjects:
  - Subject 1: 0-3 min
  - [2s delay]
  - Subject 2: 3-6 min
  - [2s delay]
  - Subject 3: 6-9 min
  Total: 10-15 min for 3 subjects


═══════════════════════════════════════════════════════════════════════════
                              DATA FLOW SUMMARY
═══════════════════════════════════════════════════════════════════════════

  User Input         AI Processing           Database Storage
  ──────────         ─────────────           ────────────────
  
  Grade: 8      →    GPT-4/5 Analysis   →    chapters table
  Board: CBSE   →    Chapter Generation →    (15 records)
  Subject: Science   Topic Generation   →    topics table
                                             (98 records)
                                             
                                             content_generation_status
                                             (tracking record)
                                             
                                             user_subjects
                                             (progress tracking)
```

## Technology Stack

- **Backend**: Node.js + Express.js
- **Database**: PostgreSQL + Prisma ORM
- **AI**: OpenAI GPT-4 (ready for GPT-5)
- **Frontend**: React Native + TypeScript
- **Authentication**: JWT
- **API**: RESTful endpoints

## Security Layers

1. JWT authentication on all endpoints
2. User validation before generation
3. Status checks prevent duplicate processing
4. Error sanitization
5. Environment variable protection (API keys)

---

**Total Implementation**: 7 new files, 2 modified files, 1 new database table
