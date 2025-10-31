const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.API_KEY_OPENAI,
});

/**
 * Goal Content Manager Module
 * Manages topic goals, curriculum progress, and database synchronization
 */
class GoalContentManager {
  constructor(database) {
    this.db = database;
  }

  /**
   * Generate goals for a topic
   * @param {string} topicTitle - The title of the topic
   * @param {string} topicContent - The content of the topic
   * @returns {Array} - Array of goal objects
   */
  async generateGoals(topicTitle, topicContent) {
    try {
      // Check if goals already exist for this topic
      const existingGoals = await this.db.getGoalsForTopic(topicTitle);
      if (existingGoals && existingGoals.length > 0) {
        return existingGoals;
      }

      // Generate new goals if they don't exist
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `Generate 5-7 progressive learning goals for the topic "${topicTitle}".
            
            Each goal should:
            - Be clear and specific (5-10 words)
            - Be measurable (can ask questions about it)
            - Be progressive (builds on previous goals)
            - Use student-friendly language
            - Be achievable through conversation
            
            Goals should move from basic understanding to application.
            
            Return JSON:
            {
              "goals": [
                { "title": "Understand basic concept", "description": "Learn what ${topicTitle} means and why it matters", "order": 1 },
                { "title": "Identify key features", "description": "Recognize important characteristics and properties", "order": 2 },
                { "title": "Apply knowledge", "description": "Use understanding in practical examples", "order": 3 }
              ]
            }`
          }
        ],
        temperature: 0.8,
        max_tokens: 800,
        response_format: { type: "json_object" }
      });

      const content = response.choices[0].message.content.trim();
      const parsed = JSON.parse(content);
      
      // Save goals to database
      const savedGoals = await this.db.saveGoalsForTopic(topicTitle, parsed.goals);
      
      return savedGoals;
    } catch (error) {
      console.error('Error generating goals for', topicTitle, ':', error.message);
      // Fallback goals
      const fallbackGoals = [
        { title: "Understand the basics", description: `Learn what ${topicTitle} means and its importance`, order: 1 },
        { title: "Identify key concepts", description: "Recognize important ideas and components", order: 2 },
        { title: "Apply knowledge", description: "Use understanding in practical examples", order: 3 },
        { title: "Connect concepts", description: "Link this topic to related ideas", order: 4 }
      ];
      
      return this.db.saveGoalsForTopic(topicTitle, fallbackGoals);
    }
  }

  /**
   * Get the current goal for a user in a topic
   * @param {string} userId - The user ID
   * @param {string} topicId - The topic ID
   * @returns {Object} - The current goal object
   */
  async getCurrentGoal(userId, topicId) {
    try {
      // Get user's progress for this topic
      const progress = await this.db.getUserProgress(userId, topicId);
      
      // Get all goals for this topic
      const goals = await this.db.getGoalsForTopic(topicId);
      
      if (!goals || goals.length === 0) {
        throw new Error('No goals found for this topic');
      }
      
      // Find the first goal that is not completed
      const currentGoal = goals.find(goal => 
        !progress.completedGoals || !progress.completedGoals.includes(goal.id)
      );
      
      // If all goals are completed, return the last one
      return currentGoal || goals[goals.length - 1];
    } catch (error) {
      console.error('Error getting current goal:', error);
      throw error;
    }
  }

  /**
   * Mark a goal as completed for a user
   * @param {string} userId - The user ID
   * @param {string} topicId - The topic ID
   * @param {string} goalId - The goal ID
   * @param {Object} performance - Performance metrics for this goal
   * @returns {Object} - Updated progress
   */
  async completeGoal(userId, topicId, goalId, performance) {
    try {
      // Get current progress
      let progress = await this.db.getUserProgress(userId, topicId);
      
      if (!progress) {
        progress = {
          userId,
          topicId,
          completedGoals: [],
          goalPerformances: {},
          overallPerformance: {
            totalQuestions: 0,
            correctAnswers: 0,
            accuracyPercent: 0,
            timeSpent: 0
          },
          startedAt: new Date(),
          lastAccessedAt: new Date()
        };
      }
      
      // Update progress
      if (!progress.completedGoals.includes(goalId)) {
        progress.completedGoals.push(goalId);
      }
      
      progress.goalPerformances[goalId] = performance;
      progress.lastAccessedAt = new Date();
      
      // Update overall performance
      progress.overallPerformance.totalQuestions += performance.totalQuestions;
      progress.overallPerformance.correctAnswers += performance.correctAnswers;
      progress.overallPerformance.accuracyPercent = Math.round(
        (progress.overallPerformance.correctAnswers / progress.overallPerformance.totalQuestions) * 100
      );
      
      // Check if all goals are completed
      const allGoals = await this.db.getGoalsForTopic(topicId);
      const allCompleted = allGoals.every(goal => progress.completedGoals.includes(goal.id));
      
      if (allCompleted) {
        progress.completedAt = new Date();
        progress.status = 'completed';
      } else {
        progress.status = 'in_progress';
      }
      
      // Save updated progress
      return await this.db.updateUserProgress(progress);
    } catch (error) {
      console.error('Error completing goal:', error);
      throw error;
    }
  }

  /**
   * Get questions for a specific goal
   * @param {string} goalId - The goal ID
   * @param {number} count - Number of questions to generate (default: 18)
   * @returns {Array} - Array of question objects
   */
  async getQuestionsForGoal(goalId, count = 18) {
    try {
      // Check if questions already exist for this goal
      const existingQuestions = await this.db.getQuestionsForGoal(goalId);
      if (existingQuestions && existingQuestions.length >= count) {
        return existingQuestions.slice(0, count);
      }

      // Get goal details
      const goal = await this.db.getGoal(goalId);
      const topic = await this.db.getTopic(goal.topicId);
      
      // Generate new questions
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `Generate ${count} questions for the following learning goal:
            
            Topic: ${topic.title}
            Goal: ${goal.title} - ${goal.description}
            
            Questions should:
            - Test understanding of the goal
            - Vary in difficulty (easy to medium)
            - Be short and precise
            - Include a mix of conceptual and factual questions
            - Include the expected answer for each question
            
            Return JSON:
            {
              "questions": [
                { "question": "Question text", "answer": "Expected answer", "difficulty": "easy|medium" },
                ...
              ]
            }`
          }
        ],
        temperature: 0.8,
        max_tokens: 2000,
        response_format: { type: "json_object" }
      });

      const content = response.choices[0].message.content.trim();
      const parsed = JSON.parse(content);
      
      // Save questions to database
      const savedQuestions = await this.db.saveQuestionsForGoal(goalId, parsed.questions);
      
      return savedQuestions;
    } catch (error) {
      console.error('Error generating questions for goal:', error);
      throw error;
    }
  }

  /**
   * Get session summary for a user in a topic
   * @param {string} userId - The user ID
   * @param {string} topicId - The topic ID
   * @returns {Object} - Session summary
   */
  async getSessionSummary(userId, topicId) {
    try {
      const progress = await this.db.getUserProgress(userId, topicId);
      const topic = await this.db.getTopic(topicId);
      const goals = await this.db.getGoalsForTopic(topicId);
      
      if (!progress) {
        throw new Error('No progress found for this user and topic');
      }
      
      // Calculate time spent
      const timeSpent = progress.completedAt 
        ? progress.completedAt - progress.startedAt 
        : Date.now() - progress.startedAt;
      
      // Calculate star rating based on accuracy
      let starRating = 1;
      if (progress.overallPerformance.accuracyPercent >= 80) starRating = 3;
      else if (progress.overallPerformance.accuracyPercent >= 60) starRating = 2;
      
      // Identify learning gaps
      const learningGaps = [];
      Object.entries(progress.goalPerformances).forEach(([goalId, performance]) => {
        if (performance.accuracyPercent < 70) {
          const goal = goals.find(g => g.id === goalId);
          if (goal) {
            learningGaps.push(goal.title);
          }
        }
      });
      
      // Generate recommendations
      const recommendations = await this.generateRecommendations(
        topic, 
        goals, 
        progress, 
        learningGaps
      );
      
      return {
        topic: topic.title,
        totalGoals: goals.length,
        completedGoals: progress.completedGoals.length,
        overallPerformance: progress.overallPerformance,
        timeSpent: Math.round(timeSpent / 1000 / 60), // in minutes
        starRating,
        learningGaps,
        recommendations,
        status: progress.status
      };
    } catch (error) {
      console.error('Error generating session summary:', error);
      throw error;
    }
  }

  /**
   * Generate recommendations based on performance
   * @param {Object} topic - Topic object
   * @param {Array} goals - Array of goal objects
   * @param {Object} progress - User progress object
   * @param {Array} learningGaps - Array of learning gap titles
   * @returns {Array} - Array of recommendation strings
   */
  async generateRecommendations(topic, goals, progress, learningGaps) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Generate 3-5 personalized recommendations for a student who has completed a learning session.
            
            Topic: ${topic.title}
            Goals: ${goals.map(g => g.title).join(', ')}
            Performance: ${progress.overallPerformance.accuracyPercent}% accuracy
            Learning Gaps: ${learningGaps.join(', ') || 'None identified'}
            
            Recommendations should:
            - Be specific and actionable
            - Address learning gaps if any
            - Suggest ways to improve understanding
            - Be encouraging and positive
            
            Return JSON:
            {
              "recommendations": [
                "Recommendation 1",
                "Recommendation 2",
                ...
              ]
            }`
          }
        ],
        temperature: 0.8,
        max_tokens: 300,
        response_format: { type: "json_object" }
      });

      const content = response.choices[0].message.content.trim();
      const parsed = JSON.parse(content);
      
      return parsed.recommendations;
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return [
        "Review the concepts you found challenging",
        "Practice with more examples",
        "Try explaining the concepts to someone else"
      ];
    }
  }
}

module.exports = GoalContentManager;