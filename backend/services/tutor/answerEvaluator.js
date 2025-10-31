const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.API_KEY_OPENAI,
});

/**
 * Answer Evaluator Module
 * Processes student answers, determines correctness, generates feedback with diff_html
 */
class AnswerEvaluator {
  constructor() {
    this.errorTypes = ['Spelling', 'Grammar', 'Conceptual', 'Factual', 'Incomplete'];
  }

  /**
   * Evaluate a student's answer against the expected answer
   * @param {string} userAnswer - The student's answer
   * @param {string} expectedAnswer - The correct answer
   * @param {string} question - The question that was asked
   * @param {string} concept - The concept being tested
   * @returns {Object} - Evaluation result with feedback
   */
  async evaluateAnswer(userAnswer, expectedAnswer, question, concept) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an expert educator evaluating a student's answer.
            
            Question: ${question}
            Concept: ${concept}
            Expected Answer: ${expectedAnswer}
            Student's Answer: ${userAnswer}
            
            Evaluate the answer for:
            1. Spelling mistakes
            2. Grammar errors
            3. Conceptual understanding
            4. Factual accuracy
            5. Completeness
            
            Return a JSON response with:
            {
              "is_correct": boolean,
              "score_percent": number (0-100),
              "error_type": "Spelling" | "Grammar" | "Conceptual" | "Factual" | "Incomplete" | "None",
              "diff_html": string with <del> for incorrect parts and <ins> for corrections,
              "complete_answer": string with the full correct answer,
              "feedback": string with encouraging feedback,
              "needs_resources": boolean (true if the student seems confused)
            }`
          }
        ],
        temperature: 0.3, // Lower temperature for more consistent evaluation
        max_tokens: 500,
        response_format: { type: "json_object" }
      });

      const evaluation = JSON.parse(response.choices[0].message.content.trim());
      
      // Add bubble color based on correctness
      evaluation.bubble_color = evaluation.is_correct ? 'green' : 'red';
      
      // Add options for user to choose from
      if (!evaluation.is_correct) {
        evaluation.options = ["Got it", "Explain"];
      }
      
      return evaluation;
    } catch (error) {
      console.error('Error evaluating answer:', error);
      // Fallback evaluation
      return {
        is_correct: false,
        score_percent: 50,
        error_type: 'Conceptual',
        diff_html: `<del>${userAnswer}</del> <ins>${expectedAnswer}</ins>`,
        complete_answer: expectedAnswer,
        feedback: "Let's review this concept.",
        bubble_color: 'red',
        options: ["Got it", "Explain"],
        needs_resources: true
      };
    }
  }

  /**
   * Generate a follow-up question based on the student's answer
   * @param {string} userAnswer - The student's answer
   * @param {string} question - The original question
   * @param {string} concept - The concept being tested
   * @param {boolean} wasCorrect - Whether the previous answer was correct
   * @returns {string} - A follow-up question
   */
  async generateFollowUpQuestion(userAnswer, question, concept, wasCorrect) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Generate a follow-up question based on the student's answer.
            
            Original Question: ${question}
            Concept: ${concept}
            Student's Answer: ${userAnswer}
            Was Correct: ${wasCorrect}
            
            ${wasCorrect 
              ? 'The student answered correctly. Ask a slightly more challenging question about the same concept.'
              : 'The student struggled with this concept. Ask an easier or more fundamental question about the same concept.'
            }
            
            Return just the question, no additional text.`
          }
        ],
        temperature: 0.7,
        max_tokens: 100
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error('Error generating follow-up question:', error);
      return "Can you tell me more about what you understand?";
    }
  }

  /**
   * Analyze overall performance on a specific goal
   * @param {Array} answers - Array of answer evaluations
   * @returns {Object} - Performance analysis
   */
  async analyzeGoalPerformance(answers) {
    try {
      const totalQuestions = answers.length;
      const correctAnswers = answers.filter(a => a.is_correct).length;
      const accuracyPercent = Math.round((correctAnswers / totalQuestions) * 100);
      
      // Count error types
      const errorCounts = {};
      answers.forEach(answer => {
        if (!answer.is_correct && answer.error_type) {
          errorCounts[answer.error_type] = (errorCounts[answer.error_type] || 0) + 1;
        }
      });
      
      // Identify most common error type
      const mostCommonError = Object.keys(errorCounts).reduce((a, b) => 
        errorCounts[a] > errorCounts[b] ? a : b, null);
      
      // Determine if goal is mastered (80% accuracy)
      const isMastered = accuracyPercent >= 80;
      
      return {
        totalQuestions,
        correctAnswers,
        accuracyPercent,
        isMastered,
        mostCommonError,
        errorCounts,
        needsMorePractice: !isMastered
      };
    } catch (error) {
      console.error('Error analyzing goal performance:', error);
      return {
        totalQuestions: answers.length,
        correctAnswers: 0,
        accuracyPercent: 0,
        isMastered: false,
        mostCommonError: null,
        errorCounts: {},
        needsMorePractice: true
      };
    }
  }
}

module.exports = AnswerEvaluator;