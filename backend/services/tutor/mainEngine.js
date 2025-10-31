const ResourceFinder = require('./resourceFinder');
const AnswerEvaluator = require('./answerEvaluator');
const GoalContentManager = require('./goalContentManager');

/**
 * Main Engine Module
 * Orchestrates the entire teaching flow, calling all other modules as needed
 */
class MainEngine {
  constructor(database) {
    this.db = database;
    this.resourceFinder = new ResourceFinder();
    this.answerEvaluator = new AnswerEvaluator();
    this.goalContentManager = new GoalContentManager(database);
    this.sessions = new Map(); // Track active sessions
  }

  /**
   * Start a new tutoring session for a user and topic
   * @param {string} userId - The user ID
   * @param {string} topicId - The topic ID
   * @returns {Object} - Initial session response with greeting and first question
   */
  async startSession(userId, topicId) {
    try {
      // Get topic information
      const topic = await this.db.getTopic(topicId);
      if (!topic) {
        throw new Error(`Topic with ID ${topicId} not found`);
      }

      // Generate goals if they don't exist
      const goals = await this.goalContentManager.generateGoals(topic.title, topic.content);
      
      // Get current goal
      const currentGoal = await this.goalContentManager.getCurrentGoal(userId, topicId);
      
      // Get questions for current goal
      const questions = await this.goalContentManager.getQuestionsForGoal(currentGoal.id);
      
      // Create session object
      const session = {
        userId,
        topicId,
        topic,
        goals,
        currentGoal,
        questions,
        currentQuestionIndex: 0,
        answers: [],
        startTime: Date.now(),
        lastActivityTime: Date.now(),
        status: 'active'
      };
      
      // Store session
      this.sessions.set(`${userId}_${topicId}`, session);
      
      // Generate greeting
      const greeting = await this.generateGreeting(topic, currentGoal);
      
      // Get first question
      const firstQuestion = questions[0];
      
      return {
        messages: greeting.messages,
        currentQuestion: {
          id: firstQuestion.id,
          question: firstQuestion.question,
          goal: currentGoal.title
        },
        sessionInfo: {
          totalGoals: goals.length,
          currentGoalIndex: goals.findIndex(g => g.id === currentGoal.id) + 1,
          questionsInGoal: questions.length,
          estimatedDuration: '30 minutes'
        }
      };
    } catch (error) {
      console.error('Error starting session:', error);
      throw error;
    }
  }

  /**
   * Process a user's answer in a session
   * @param {string} userId - The user ID
   * @param {string} topicId - The topic ID
   * @param {string} answer - The user's answer
   * @returns {Object} - Response with evaluation and next question or resources
   */
  async processAnswer(userId, topicId, answer) {
    try {
      // Get session
      const sessionKey = `${userId}_${topicId}`;
      const session = this.sessions.get(sessionKey);
      
      if (!session) {
        throw new Error('No active session found');
      }
      
      // Update last activity time
      session.lastActivityTime = Date.now();
      
      // Get current question
      const currentQuestion = session.questions[session.currentQuestionIndex];
      
      // Evaluate answer
      const evaluation = await this.answerEvaluator.evaluateAnswer(
        answer,
        currentQuestion.answer,
        currentQuestion.question,
        session.currentGoal.title
      );
      
      // Store answer and evaluation
      session.answers.push({
        questionId: currentQuestion.id,
        question: currentQuestion.question,
        userAnswer: answer,
        evaluation,
        timestamp: Date.now()
      });
      
      // Prepare response
      let response = {
        evaluation,
        sessionInfo: {
          totalGoals: session.goals.length,
          currentGoalIndex: session.goals.findIndex(g => g.id === session.currentGoal.id) + 1,
          currentQuestionIndex: session.currentQuestionIndex + 1,
          questionsInGoal: session.questions.length,
          timeSpent: Math.round((Date.now() - session.startTime) / 1000 / 60) // in minutes
        }
      };
      
      // If answer is incorrect and user needs resources, provide them
      if (!evaluation.is_correct && evaluation.needs_resources) {
        response.resources = await this.resourceFinder.findResources(
          session.currentGoal.title,
          session.topic.title,
          'beginner'
        );
      }
      
      // If answer is correct, move to next question
      if (evaluation.is_correct) {
        session.currentQuestionIndex++;
        
        // Check if we've completed all questions for this goal
        if (session.currentQuestionIndex >= session.questions.length) {
          // Analyze performance for this goal
          const goalPerformance = await this.answerEvaluator.analyzeGoalPerformance(
            session.answers.filter(a => session.questions.find(q => q.id === a.questionId))
          );
          
          // Mark goal as completed
          await this.goalContentManager.completeGoal(
            userId,
            topicId,
            session.currentGoal.id,
            goalPerformance
          );
          
          // Check if there are more goals
          const nextGoal = await this.goalContentManager.getCurrentGoal(userId, topicId);
          
          if (nextGoal.id !== session.currentGoal.id) {
            // Move to next goal
            session.currentGoal = nextGoal;
            session.questions = await this.goalContentManager.getQuestionsForGoal(nextGoal.id);
            session.currentQuestionIndex = 0;
            session.answers = [];
            
            // Get first question for new goal
            const firstQuestion = session.questions[0];
            
            response.nextQuestion = {
              id: firstQuestion.id,
              question: firstQuestion.question,
              goal: nextGoal.title
            };
            
            response.goalCompleted = {
              goal: session.currentGoal.title,
              performance: goalPerformance
            };
          } else {
            // All goals completed, end session
            session.status = 'completed';
            const sessionSummary = await this.goalContentManager.getSessionSummary(userId, topicId);
            
            response.sessionCompleted = {
              summary: sessionSummary
            };
            
            // Remove session from active sessions
            this.sessions.delete(sessionKey);
          }
        } else {
          // Get next question
          const nextQuestion = session.questions[session.currentQuestionIndex];
          
          response.nextQuestion = {
            id: nextQuestion.id,
            question: nextQuestion.question,
            goal: session.currentGoal.title
          };
        }
      }
      
      return response;
    } catch (error) {
      console.error('Error processing answer:', error);
      throw error;
    }
  }

  /**
   * Handle user's selection from feedback options
   * @param {string} userId - The user ID
   * @param {string} topicId - The topic ID
   * @param {string} option - The selected option ("Got it" or "Explain")
   * @returns {Object} - Response with explanation or next question
   */
  async handleFeedbackOption(userId, topicId, option) {
    try {
      // Get session
      const sessionKey = `${userId}_${topicId}`;
      const session = this.sessions.get(sessionKey);
      
      if (!session) {
        throw new Error('No active session found');
      }
      
      // Update last activity time
      session.lastActivityTime = Date.now();
      
      // Prepare response
      let response = {};
      
      if (option === 'Explain') {
        // Get current question
        const currentQuestion = session.questions[session.currentQuestionIndex];
        
        // Find resources for this concept
        const resources = await this.resourceFinder.findResources(
          session.currentGoal.title,
          session.topic.title,
          'beginner'
        );
        
        response.explanation = {
          text: resources.explanation,
          resources: {
            videos: resources.videos,
            images: resources.images,
            articles: resources.articles
          }
        };
      }
      
      // Move to next question
      session.currentQuestionIndex++;
      
      // Check if we've completed all questions for this goal
      if (session.currentQuestionIndex >= session.questions.length) {
        // Analyze performance for this goal
        const goalPerformance = await this.answerEvaluator.analyzeGoalPerformance(
          session.answers.filter(a => session.questions.find(q => q.id === a.questionId))
        );
        
        // Mark goal as completed
        await this.goalContentManager.completeGoal(
          userId,
          topicId,
          session.currentGoal.id,
          goalPerformance
        );
        
        // Check if there are more goals
        const nextGoal = await this.goalContentManager.getCurrentGoal(userId, topicId);
        
        if (nextGoal.id !== session.currentGoal.id) {
          // Move to next goal
          session.currentGoal = nextGoal;
          session.questions = await this.goalContentManager.getQuestionsForGoal(nextGoal.id);
          session.currentQuestionIndex = 0;
          session.answers = [];
          
          // Get first question for new goal
          const firstQuestion = session.questions[0];
          
          response.nextQuestion = {
            id: firstQuestion.id,
            question: firstQuestion.question,
            goal: nextGoal.title
          };
          
          response.goalCompleted = {
            goal: session.currentGoal.title,
            performance: goalPerformance
          };
        } else {
          // All goals completed, end session
          session.status = 'completed';
          const sessionSummary = await this.goalContentManager.getSessionSummary(userId, topicId);
          
          response.sessionCompleted = {
            summary: sessionSummary
          };
          
          // Remove session from active sessions
          this.sessions.delete(sessionKey);
        }
      } else {
        // Get next question
        const nextQuestion = session.questions[session.currentQuestionIndex];
        
        response.nextQuestion = {
          id: nextQuestion.id,
          question: nextQuestion.question,
          goal: session.currentGoal.title
        };
      }
      
      return response;
    } catch (error) {
      console.error('Error handling feedback option:', error);
      throw error;
    }
  }

  /**
   * Generate a greeting for the session
   * @param {Object} topic - Topic object
   * @param {Object} currentGoal - Current goal object
   * @returns {Object} - Greeting response
   */
  async generateGreeting(topic, currentGoal) {
    try {
      return {
        messages: [
          { 
            message: `Let's start learning about ${topic.title}! 📚`, 
            message_type: 'text' 
          },
          { 
            message: `We'll begin with: ${currentGoal.title}. I'll ask you some questions to check your understanding.`, 
            message_type: 'text' 
          }
        ]
      };
    } catch (error) {
      console.error('Error generating greeting:', error);
      return {
        messages: [
          { 
            message: `Let's start learning about ${topic.title}! 📚`, 
            message_type: 'text' 
          }
        ]
      };
    }
  }

  /**
   * Clean up inactive sessions
   * @param {number} maxInactiveTime - Maximum inactive time in milliseconds (default: 1 hour)
   */
  cleanupInactiveSessions(maxInactiveTime = 3600000) {
    const now = Date.now();
    
    for (const [key, session] of this.sessions.entries()) {
      if (now - session.lastActivityTime > maxInactiveTime) {
        // Mark session as inactive in database
        this.db.markSessionInactive(session.userId, session.topicId);
        
        // Remove from active sessions
        this.sessions.delete(key);
      }
    }
  }
}

module.exports = MainEngine;