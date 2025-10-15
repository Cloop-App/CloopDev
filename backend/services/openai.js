const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.API_KEY_OPENAI,
});

/**
 * Generate chapters for a specific subject, grade, and board
 */
async function generateChapters(gradeLevel, board, subject) {
  const prompt = `You are an educational content expert. Generate a comprehensive list of chapters for the following:
- Grade/Class: ${gradeLevel}
- Board: ${board}
- Subject: ${subject}

Please provide a JSON array of chapters with the following structure:
[
  {
    "title": "Chapter title",
    "content": "Brief description of what this chapter covers"
  }
]

Make sure the chapters follow the official ${board} curriculum for ${gradeLevel} ${subject}.
Return ONLY the JSON array, no additional text.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4', // Update to 'gpt-5' when available
      messages: [
        {
          role: 'system',
          content: 'You are an expert educational content generator that creates structured curriculum content. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const content = response.choices[0].message.content.trim();
    // Remove markdown code blocks if present
    const jsonContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const chapters = JSON.parse(jsonContent);
    
    return chapters;
  } catch (error) {
    console.error('Error generating chapters:', error);
    throw new Error(`Failed to generate chapters: ${error.message}`);
  }
}

/**
 * Generate topics/exercises for a specific chapter
 */
async function generateTopics(gradeLevel, board, subject, chapterTitle, chapterContent) {
  const prompt = `You are an educational content expert. Generate a comprehensive list of topics and exercises for the following chapter:
- Grade/Class: ${gradeLevel}
- Board: ${board}
- Subject: ${subject}
- Chapter: ${chapterTitle}
- Chapter Description: ${chapterContent}

Please provide a JSON array of topics/exercises with the following structure:
[
  {
    "title": "Topic/Exercise title",
    "content": "Detailed description of the topic or exercise content"
  }
]

Make sure the topics follow the official ${board} curriculum and cover all important aspects of this chapter.
Return ONLY the JSON array, no additional text.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4', // Update to 'gpt-5' when available
      messages: [
        {
          role: 'system',
          content: 'You are an expert educational content generator that creates structured curriculum content. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 3000,
    });

    const content = response.choices[0].message.content.trim();
    // Remove markdown code blocks if present
    const jsonContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const topics = JSON.parse(jsonContent);
    
    return topics;
  } catch (error) {
    console.error('Error generating topics:', error);
    throw new Error(`Failed to generate topics: ${error.message}`);
  }
}

/**
 * Generate AI response for topic-specific chat
 * Uses the topic content as context to provide relevant answers
 */
async function generateTopicChatResponse(userMessage, topicTitle, topicContent, chatHistory = []) {
  try {
    // Build conversation history for context
    const messages = [
      {
        role: 'system',
        content: `You are an expert educational AI assistant helping students learn about "${topicTitle}". 

Topic Content: ${topicContent}

Your role is to:
1. Answer questions specifically about this topic
2. Provide clear, educational explanations
3. Use examples and analogies when helpful
4. Encourage critical thinking
5. Stay focused on the topic at hand
6. If the user asks about something unrelated to this topic, gently redirect them back to the topic

Keep your responses concise, friendly, and educational. Use simple language appropriate for students.`
      }
    ];

    // Add recent chat history for context (last 10 messages)
    const recentHistory = chatHistory.slice(-10);
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

    const response = await openai.chat.completions.create({
      model: 'gpt-4', // Using GPT-4 for better reasoning
      messages: messages,
      temperature: 0.7,
      max_tokens: 500,
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error generating topic chat response:', error);
    throw new Error(`Failed to generate chat response: ${error.message}`);
  }
}

module.exports = {
  generateChapters,
  generateTopics,
  generateTopicChatResponse,
};
