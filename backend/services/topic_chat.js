const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.API_KEY_OPENAI,
});

/**
 * Enhanced Topic Chat Service with Micro-Assessment and Real-Time Error Correction
 * Uses GPT-4 for interactive questioning with immediate feedback
 */

/**
 * Generate AI response for topic-specific chat (Question-Based Tutor)
 * Focuses on asking questions and providing instant feedback with error correction
 * Session-based: 5-7 questions per session with performance tracking
 */
async function generateTopicChatResponse(userMessage, topicTitle, topicContent, chatHistory = [], currentGoal = null, topicGoals = []) {
  try {
    // Analyze chat history to determine session state
    const isFirstMessage = chatHistory.length === 0;
    const aiMessages = chatHistory.filter(m => m.sender === 'ai');
    const userResponses = chatHistory.filter(m => m.sender === 'user');
    const questionsAsked = aiMessages.filter(m => m.message && m.message.includes('?')).length;
    const lastAIMessage = aiMessages.slice(-1)[0];
    // Check if the last AI message was a question and user is responding
    const hasAskedQuestion = lastAIMessage && lastAIMessage.message && lastAIMessage.message.includes('?');
    
    // Session management: Check if we should end the session (after 5-7 questions answered)
    const shouldEndSession = questionsAsked >= 5 && hasAskedQuestion;
    
    // Build comprehensive system prompt with questioning focus
    const systemPrompt = `You are an expert academic tutor conducting interactive chat-based lessons using micro-assessment and real-time error correction for the topic "${topicTitle}".

🎯 YOUR OBJECTIVES:
1. Keep questions SHORT and PRECISE (one concept at a time)
2. Check user's answer for: spelling mistakes, grammar errors, and conceptual understanding
3. Provide corrected answer directly in user's message bubble with visual corrections
4. ALWAYS provide the COMPLETE CORRECT ANSWER as part of feedback
5. After correction, show TWO OPTIONS: "Got it" and "Confused" for user to choose
6. If user selects "Confused": explain the concept in simple terms, then move to next question
7. If user selects "Got it": immediately move to next question
8. Classify and tag error types for student dashboard
9. Ensure mastery before moving to next goal (80%+ accuracy)
10. Once mastery achieved, congratulate and move to next topic


⚡ CRITICAL FLOW RULE: 
EVERY response when evaluating an answer MUST include the next question in a SEPARATE message. The session should flow continuously and proactively without any user prompting.

🧠 COMPREHENSIVE LEARNING APPROACH:
- Start with foundational concepts before advanced topics
- Ask follow-up questions to ensure deep understanding
- Connect new concepts to previously learned material
- Use real-world examples and applications
- Repeat similar questions with different contexts to reinforce learning
- Only move to the next goal when current concept is mastered (80%+ accuracy)

📚 TOPIC CONTENT FOR QUESTIONS:
${topicContent || 'General topic introduction'}

🎓 LEARNING GOALS (${topicGoals.length} goals):
${topicGoals.map((g, i) => `${i + 1}. ${g.title}: ${g.description || 'Master this concept'}`).join('\n')}

🎯 CURRENT GOAL: ${currentGoal ? `"${currentGoal.title}" - ${currentGoal.description}` : 'Start with first concept questions'}

📊 SESSION PROGRESS:
- Questions Asked: ${questionsAsked} / 5-7
- User Responses: ${userResponses.length}
- Session Stage: ${isFirstMessage ? 'Starting New Session' : shouldEndSession ? 'Ready to End Session' : hasAskedQuestion ? 'Awaiting Student Answer' : 'Providing Feedback'}

⏱️ SESSION DURATION: Aim for 5-7 questions or 12-15 minutes max

🎨 QUESTIONING FLOW YOU MUST FOLLOW:

STEP 1: ASK SHORT, PRECISE QUESTIONS
- Keep questions brief (one sentence, one concept)
- Examples: "What is force?", "How do plants make food?"
- Use "message_type": "text" for all questions
- Build complexity gradually

STEP 2: USER ANSWERS → YOU EVALUATE
When student replies with their answer, CHECK FOR:
1. **Spelling mistakes** (e.g., "photosinthesis" → "photosynthesis")
2. **Grammar errors** (e.g., "plant is make food" → "plants make food")
3. **Sentence structure** (word order, missing words)
4. **Conceptual understanding** (is the core concept correct?)
5. **Factual accuracy** (is the information correct?)

✅ IF COMPLETELY CORRECT:
- You MUST return a "user_correction" object.
- "diff_html": The user's original answer (no <del> or <ins> tags).
- "complete_answer": A short confirmation, e.g., "That's exactly right!" or "Correct! Great job."
- "options": ["Got it", "Confused"]
- "feedback": { "is_correct": true, "bubble_color": "green", "score_percent": 100 }

❌ IF HAS ANY ERRORS (Spelling, Grammar, Conceptual):
You MUST provide ONLY ONE thing:

CORRECTION ON USER'S BUBBLE:
- Apply correction directly to the USER'S message (not a new AI message)
- "diff_html": Show what's wrong (strikethrough red) and what's correct (green)
  - Format: "This is the user's sentence with <del>incorect</del><ins>incorrect</ins> parts and conceptual <del>erors</del><ins>errors</ins> fixed in-line."
  - Example: User said "Force is a push or pull on an object that causess it to change its not motion or no shape." → "Force is a push or pull on an object that <del>causess</del><ins>causes</ins> it to change its <del>not</del> motion or <del>no</del> shape."- "is_correct": false
- "bubble_color": "red"
- "complete_answer": The full correct explanation in simple language
- TWO OPTIONS appear below the user's corrected bubble: ["Got it", "Confused"]
- message_type: "user_correction" (special type for user bubble correction)

STEP 3: WAIT FOR USER'S OPTION CHOICE
⚠️ CRITICAL: After showing correction, you MUST WAIT. Do NOT ask next question yet.

🟢 IF USER SELECTS "Got it":
- Brief acknowledgment: "Great! Let's continue."
- Immediately ask the NEXT question

🔵 IF USER SELECTS "Confused":
- Provide simple explanation (2-3 sentences with example)
- Then ask the NEXT question

STEP 4: GOAL PROGRESSION
- Continue this flow for each question
- Only move to next goal when 80%+ accuracy achieved
- End session after all goals covered or 15-20 questions
- Provide session summary at end

🎯 RESPONSE RULES:

1. **QUESTIONS**: Always short and precise (one sentence)
   - Example: "What is photosynthesis?"
   - Use "message_type": "text"

2. **WHEN ANSWER IS CORRECT** (No errors at all):
   Return correction that applies to USER'S BUBBLE (same as error flow):
   
   {
     "messages": [],
     "user_correction": {
       "message_type": "user_correction",
       "diff_html": "Diffusion is the movement of particles from high to low concentration", // The user's (correct) text, no corrections
       "complete_answer": "That's exactly right! It's the movement of particles from high to low concentration.", // A simple reinforcement
       "options": ["Got it", "Confused"],
       "feedback": {
         "is_correct": true,
         "bubble_color": "green",
         "score_percent": 100
       }
     }
   }
   
   The correction appears ON the user's bubble with:
   - Green bubble
   - Complete answer (praise) shown below
   - Two buttons: "Got it" and "Confused" below the user's bubble
   - ⚠️ DO NOT send any AI message. WAIT for user to click an option.
   
3. **WHEN ANSWER HAS ERRORS** (Most Important):
   Return correction that applies to USER'S BUBBLE (not AI message):
   
   {
     "messages": [],
     "user_correction": {
       "message_type": "user_correction",
       "diff_html": "<del>difusion is force</del> <ins>Diffusion is the movement of particles from high to low concentration</ins>",
       "complete_answer": "Diffusion is the movement of particles from an area of high concentration to an area of low concentration. It happens naturally without any force needed.",
       "options": ["Got it", "Confused"],
       "feedback": {
         "is_correct": false,
         "bubble_color": "red",
         "error_type": "Spelling" | "Grammar" | "Conceptual",
         "score_percent": 0-100
       }
     }
   }
   
   The correction appears ON the user's bubble with:
   - Red strikethrough for wrong parts
   - Green text for correct parts
   - Complete answer shown below
   - Two buttons: "Got it" and "Confused" below the user's bubble
   
   ⚠️ DO NOT send any AI message. WAIT for user to click an option.

4. **HANDLING "Got it" or "Confused"** (Only after user clicks):
   - If "Got it": 
     { "messages": [{ "message": "Great! Let's continue.", "message_type": "text" }, { "message": "[Next question]", "message_type": "text" }] }
   
   - If "Confused": 
     { "messages": [{ "message": "[Simple explanation with example]", "message_type": "text" }, { "message": "[Next question]", "message_type": "text" }] }

5. **diff_html Format**:
   - Show what user wrote (wrong) vs. correct version
   - Format: "<del>user's exact text</del> <ins>complete correct answer</ins>"
   - Be thorough and clear

📝 EXAMPLE RESPONSES:

✅ If answer is CORRECT:
User said: "Diffusion is the movement of particles from high to low concentration"
{
  "messages": [],
  "user_correction": {
    "message_type": "user_correction",
    "diff_html": "Diffusion is the movement of particles from high to low concentration",
    "complete_answer": "That's exactly right! It's the movement of particles from high to low concentration.",
    "options": ["Got it", "Confused"],
    "feedback": {
      "is_correct": true,
      "bubble_color": "green",
      "score_percent": 100
    }
  }
}
(Shows correction ON user's bubble, green, with complete answer and two buttons below. System WAITS for user to click.)

❌ If answer has ERRORS:
User said: "difusion is force"
{
  "messages": [],
  "user_correction": {
    "message_type": "user_correction",
    "diff_html": "<del>difusion is force</del> <ins>Diffusion is the movement of particles from high to low concentration</ins>",
    "complete_answer": "Diffusion is the movement of particles from an area of high concentration to an area of low concentration. It happens naturally without any force - like when perfume spreads across a room.",
    "options": ["Got it", "Confused"],
    "feedback": {
      "is_correct": false,
      "bubble_color": "red",
      "error_type": "Conceptual",
      "score_percent": 30
    }
  }
}
(Shows correction ON user's bubble with red strikethrough and green correct text, plus complete answer and two buttons below. System WAITS for user to click.)

🟢 If user clicks "Got it":
{
  "messages": [
    { "message": "Great! Let's continue.", "message_type": "text" },
    { "message": "What are the main factors that affect diffusion rate?", "message_type": "text" }
  ]
}

🔵 If user clicks "Confused":
{
  "messages": [
    { "message": "No problem! Think of it like this: Imagine spraying perfume in one corner of a room. The perfume molecules naturally spread out until they're evenly distributed. That's diffusion - particles moving from where there's a lot of them to where there's fewer, without any force pushing them.", "message_type": "text" },
    { "message": "What are the main factors that affect diffusion rate?", "message_type": "text" }
  ]
}

🎯 CURRENT CONTEXT:
User just said: "${userMessage}"
${hasAskedQuestion ? '(This is their typed answer - evaluate it, provide feedback, AND ask next question in separate messages!)' : '(Ready for next question)'}

YOUR TASK:
${shouldEndSession ? 
  'END THE SESSION. Calculate final performance and provide session summary with star rating, error analysis, and recommendations.' :
  hasAskedQuestion ? 
    'IMPORTANT: EVALUATE their answer, provide encouraging feedback with any needed corrections, then IMMEDIATELY ask the next question in SEPARATE MESSAGES. Be completely proactive!' :
    'ASK A NEW OPEN-ENDED QUESTION about the topic (user will type their answer).'}

RESPONSE FORMAT (MUST BE VALID JSON):
${shouldEndSession ? `
{
  "messages": [
    { "message": "Great session! Let's review your progress.", "message_type": "text" }
  ],
  "session_summary": {
    "total_questions": ${questionsAsked},
    "correct_answers": 0,
    "incorrect_answers": 0,
    "star_rating": 1-3,
    "error_types": {},
    "learning_gaps": [],
    "recommendations": [],
    "performance_percent": 0-100
  }
}` : hasAskedQuestion ? `
IF CORRECT (Use user_correction object):
{
  "messages": [],
  "user_correction": {
    "message_type": "user_correction",
    "diff_html": "User's correct answer text",
    "complete_answer": "Positive reinforcement, e.g., 'Correct!'",
    "options": ["Got it", "Confused"],
    "feedback": {
      "is_correct": true,
      "bubble_color": "green",
      "score_percent": 100
    }
  }
}

IF HAS ERRORS (Use user_correction object):
{
  "messages": [],
  "user_correction": {
    "message_type": "user_correction",
    "diff_html": "<del>user's wrong answer</del> <ins>complete correct answer</ins>",
    "complete_answer": "Full explanation in simple language",
    "options": ["Got it", "Confused"],
    "feedback": {
      "is_correct": false,
      "bubble_color": "red",
      "error_type": "Grammar" | "Spelling" | "Conceptual",
      "score_percent": 0-100
    }
  }
}` : `
{
  "messages": [
    { "message": "What is [concept to ask about]?", "message_type": "text" }
  ]
}`}

🚨 CRITICAL REMINDERS: 
1. When evaluating answer with ERRORS: Apply correction to USER'S BUBBLE (not AI message). Show options below user's bubble. Then WAIT.
2. When answer is CORRECT: You MUST return the "user_correction" object with "options" ["Got it", "Confused"] and "is_correct": true.
3. Only ask next question AFTER user clicks "Got it" or "Confused".
4. Never say "Let me show you the correction" or "Do you understand now?" - those are NOT needed!`;

    const messages = [
      {
        role: 'system',
        content: systemPrompt
      }
    ];

    // Add recent chat history (last 8 messages for context)
    const recentHistory = chatHistory.slice(-8);
    for (const msg of recentHistory) {
      messages.push({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.message || ''
      });
    }

    // Add current user message
    messages.push({
      role: 'user',
      content: userMessage
    });

    // Primary model call: use low temperature for deterministic JSON output when evaluating answers
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Using GPT-4o for JSON mode support
      messages: messages,
      temperature: 0.2,
      max_tokens: 800,
      response_format: { type: "json_object" }
    });

    // Log raw response for debugging (trim only for readability)
    const rawContent = response.choices[0].message.content;
    console.log('[topic_chat] Raw model output (trim):', rawContent && rawContent.substring(0, 1000));

    let parsed = {};
    try {
      const content = rawContent.trim();
      parsed = JSON.parse(content);
    } catch (parseErr) {
      console.error('[topic_chat] Failed to parse model JSON response:', parseErr.message);
      // Fallback: try to recover by attempting to extract a JSON substring
      const maybeJsonMatch = rawContent && rawContent.match(/\{[\s\S]*\}/);
      if (maybeJsonMatch) {
        try {
          parsed = JSON.parse(maybeJsonMatch[0]);
          console.log('[topic_chat] Recovered JSON from model output');
        } catch (e) {
          console.error('[topic_chat] Recovery parse failed:', e.message);
        }
      }
    }

    // Normalize option labels: replace any "Confused" with "Explain"
    if (parsed.user_correction && Array.isArray(parsed.user_correction.options)) {
      // Normalize known variants and ensure stable option ordering used by frontend
      parsed.user_correction.options = parsed.user_correction.options.map(opt => {
        if (!opt) return opt;
        if (/confused|explain/i.test(opt)) return 'Explain';
        if (/got it|gotit|ok|confirm/i.test(opt)) return 'Got it';
        return opt;
      });

      // If options are missing or don't include the canonical set, replace with defaults
      const opts = parsed.user_correction.options.filter(Boolean).map(o => String(o));
      const hasGot = opts.some(o => /got it/i.test(o));
      const hasExplain = opts.some(o => /explain/i.test(o));
      if (!hasGot || !hasExplain) {
        parsed.user_correction.options = ['Got it', 'Explain'];
      }

      // Ensure message_type is set to the special bubble type frontend expects
      if (!parsed.user_correction.message_type) {
        parsed.user_correction.message_type = 'user_correction';
      }

      // Ensure feedback object exists and has minimal expected fields
      if (!parsed.user_correction.feedback || typeof parsed.user_correction.feedback !== 'object') {
        parsed.user_correction.feedback = { is_correct: false, bubble_color: 'red', score_percent: 0 };
      } else {
        parsed.user_correction.feedback.is_correct = !!parsed.user_correction.feedback.is_correct;
        parsed.user_correction.feedback.bubble_color = parsed.user_correction.feedback.bubble_color || (parsed.user_correction.feedback.is_correct ? 'green' : 'red');
        parsed.user_correction.feedback.score_percent = typeof parsed.user_correction.feedback.score_percent === 'number' ? parsed.user_correction.feedback.score_percent : (parsed.user_correction.feedback.is_correct ? 100 : 0);
        // Add a best-effort error_type if missing
        if (!parsed.user_correction.feedback.error_type && parsed.user_correction.feedback.is_correct === false) {
          parsed.user_correction.feedback.error_type = parsed.user_correction.feedback.error_type || 'Conceptual';
        }
      }
    }

    // If the model did not return a `user_correction` but we believe the user just answered
    // (hasAskedQuestion === true), retry with a focused, low-temperature JSON-only prompt
    if (hasAskedQuestion && !parsed.user_correction) {
      try {
        console.log('[topic_chat] No user_correction found in primary response — retrying with strict JSON prompt');
        const correctionPrompt = [
          { role: 'system', content: 'You are a JSON-only assistant. Respond with a single JSON object. Do NOT include any extra text.' },
          { role: 'user', content: `User answer: "${userMessage}"\nTask: Evaluate this answer and return a "user_correction" object only using the format described previously. If the answer is correct, set feedback.is_correct=true and provide options ["Got it","Explain"]. If incorrect, set feedback.is_correct=false and provide a diff_html and complete_answer.` }
        ];

        const retryResp = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: correctionPrompt,
          temperature: 0.0,
          max_tokens: 400,
          response_format: { type: 'json_object' }
        });

        const retryRaw = retryResp.choices[0].message.content;
        console.log('[topic_chat] Retry raw output (trim):', retryRaw && retryRaw.substring(0, 1000));
        try {
          const retryParsed = JSON.parse(retryRaw.trim());
          // Merge user_correction if present
          if (retryParsed.user_correction) {
            parsed.user_correction = retryParsed.user_correction;
            // Ensure options normalization
            if (Array.isArray(parsed.user_correction.options)) {
              parsed.user_correction.options = parsed.user_correction.options.map(opt => /confused/i.test(opt) ? 'Explain' : opt);
            }
            console.log('[topic_chat] Obtained user_correction from retry');
          }
        } catch (rpErr) {
          console.error('[topic_chat] Failed to parse retry JSON:', rpErr.message);
        }
      } catch (retryErr) {
        console.error('[topic_chat] Retry for user_correction failed:', retryErr.message);
      }
    }

    // *** DELETED THE 'if (parsed.feedback && parsed.feedback.is_correct)' BLOCK ***
    // The prompt now handles this, so this workaround is no longer needed.

    // Log the full AI response for debugging and content review
    console.log('AI Response:', JSON.stringify(parsed, null, 2));
    
    // Log token usage for monitoring
    console.log(`✓ Topic chat response generated | Topic: ${topicTitle} | Tokens: ${response.usage.total_tokens} (input: ${response.usage.prompt_tokens}, output: ${response.usage.completion_tokens})`);
    
    return parsed;
  } catch (error) {
    console.error('Error generating topic chat response:', error);
    // Fallback to simple response
    return {
      messages: [
        { message: "I'm here to help you learn!", message_type: "text" },
        { message: "Could you rephrase that?", message_type: "text" }
      ]
    };
  }
}

/**
 * Generate initial greeting and introduce the questioning session
 * Sets expectations for micro-assessment approach
 */
async function generateTopicGreeting(topicTitle, topicContent, topicGoals = []) {
  try {
    const goalsOverview = topicGoals.length > 0 
      ? topicGoals.map((g, i) => `${i + 1}. ${g.title}`).join('\n')
      : 'We\'ll test your knowledge through questions';

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a friendly AI tutor starting a new QUESTIONING SESSION on "${topicTitle}".

IMPORTANT: This is a MICRO-ASSESSMENT session, NOT a teaching session.

GOALS TO ASSESS:
${goalsOverview}

TOPIC CONTENT:
${topicContent ? topicContent.substring(0, 200) + '...' : 'General introduction'}

YOUR TASK:
Create a simple greeting and immediately ask the first question.

RULES:
- Two messages: greeting + first question
- Greeting: "Let's start [topic name]"
- First question: A simple, short question about the topic basics
- Keep it friendly and brief

Return VALID JSON:
{
  "messages": [
    { "message": "Let's start [topic name]! 📚", "message_type": "text" },
    { "message": "[First simple question about the topic]", "message_type": "text" }
  ]
}`
        },
        {
          role: 'user',
          content: `Generate greeting for: ${topicTitle}`
        }
      ],
      temperature: 0.8,
      max_tokens: 400,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content.trim();
    const parsed = JSON.parse(content);
    
    console.log(`✓ Topic greeting generated | Topic: ${topicTitle}`);
    
    return parsed;
  } catch (error) {
    console.error('Error generating greeting:', error);
    // Fallback greeting
    return {
      messages: [
        { message: `Let's start this topic of ${topicTitle}.`, message_type: "text" }
      ]
    };
  }
}

/**
 * Generate topic goals for learning progression
 * Creates measurable, sequential learning objectives
 */
async function generateTopicGoals(topicTitle, topicContent) {
  // Truncate topic content to essential info for token efficiency
  const topicSummary = topicContent && topicContent.length > 150 
    ? topicContent.substring(0, 150) + '...'
    : topicContent || 'General introduction to the topic';
  
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // GPT-4o for better goal structuring and JSON mode support
      messages: [
        {
          role: 'system',
          content: `Generate 3-5 progressive learning goals for the topic "${topicTitle}".
          
Each goal should be:
- Clear and specific (5-10 words)
- Measurable (can ask questions about it)
- Progressive (builds on previous goals)
- Student-friendly language
- Achievable through conversation

Goals should move from basic understanding to application.

Return JSON:
{
  "goals": [
    { "title": "Understand basic concept", "description": "Learn what ${topicTitle} means and why it matters", "order": 1 },
    { "title": "Identify key features", "description": "Recognize important characteristics and properties", "order": 2 },
    { "title": "Apply knowledge", "description": "Use understanding in practical examples", "order": 3 }
  ]
}`
        },
        {
          role: 'user',
          content: `Topic: ${topicTitle}\nContent Summary: ${topicSummary}`
        }
      ],
      temperature: 0.8,
      max_tokens: 600,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content.trim();
    const parsed = JSON.parse(content);
    
    // Validate and ensure we have at least 3 goals
    if (!parsed.goals || parsed.goals.length < 3) {
      throw new Error('Generated less than 3 goals');
    }
    
    console.log(`✓ Topic goals generated | Topic: ${topicTitle} | Goals: ${parsed.goals.length}`);
    
    return parsed;
  } catch (error) {
    console.error('Error generating goals for', topicTitle, ':', error.message);
    // Fallback goals
    return {
      goals: [
        { title: "Understand the basics", description: `Learn what ${topicTitle} means and its importance`, order: 1 },
        { title: "Identify key concepts", description: "Recognize important ideas and components", order: 2 },
        { title: "Apply knowledge", description: "Use understanding in practical examples", order: 3 },
        { title: "Connect concepts", description: "Link this topic to related ideas", order: 4 }
      ]
    };
  }
}

module.exports = {
  generateTopicChatResponse,
  generateTopicGreeting,
  generateTopicGoals,
};