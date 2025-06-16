// ================================
// 1. services/quizService.js
// ================================

const { initializeFirebase, admin } = require('../../config/firebase-config');
const logger = require('../../utils/logger');

// Initialize Firebase and get db instance
const db = initializeFirebase();

const QUIZ_COLLECTION = 'quizzes';
const QUIZ_ATTEMPTS_COLLECTION = 'quizAttempts';

class QuizService {
  // Get all quizzes
  async getAllQuizzes() {
    try {
      const snapshot = await db.collection(QUIZ_COLLECTION).get();
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      logger.error('Error fetching all quizzes:', error);
      throw new Error('Failed to fetch quizzes');
    }
  }

  // Get quiz by ID
  async getQuizById(quizId) {
    try {
      const doc = await db.collection(QUIZ_COLLECTION).doc(quizId).get();
      if (!doc.exists) {
        return null;
      }
      return {
        id: doc.id,
        ...doc.data()
      };
    } catch (error) {
      logger.error(`Error fetching quiz ${quizId}:`, error);
      throw new Error('Failed to fetch quiz');
    }
  }

  // Get quizzes by lesson ID
  async getQuizzesByLesson(lessonId) {
    try {
      const snapshot = await db.collection(QUIZ_COLLECTION)
        .where('lessonId', '==', lessonId)
        .get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      logger.error(`Error fetching quizzes for lesson ${lessonId}:`, error);
      throw new Error('Failed to fetch quizzes for lesson');
    }
  }

  // Get quizzes by course ID
  async getQuizzesByCourse(courseId) {
    try {
      const snapshot = await db.collection(QUIZ_COLLECTION)
        .where('courseId', '==', courseId)
        .get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      logger.error(`Error fetching quizzes for course ${courseId}:`, error);
      throw new Error('Failed to fetch quizzes for course');
    }
  }

  // Get quiz by lesson
  async getQuizByLesson(courseId, moduleId, lessonId) {
    try {
      logger.info(`Fetching quizzes for course: ${courseId}, module: ${moduleId}, lesson: ${lessonId}`);
      
      const snapshot = await db.collection(QUIZ_COLLECTION)
        .where('courseId', '==', courseId)
        .where('moduleId', '==', moduleId)
        .where('lessonId', '==', lessonId)
        .get();

      const quizzes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      logger.info(`Found ${quizzes.length} quizzes for lesson ${lessonId}`);
      return quizzes;
    } catch (error) {
      logger.error(`Error fetching quizzes for lesson ${lessonId}:`, error);
      throw new Error('Failed to fetch quizzes for lesson');
    }
  }

  // Create new quiz
  async createQuiz(quizData) {
    try {
      const quiz = {
        ...quizData,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        totalQuestions: quizData.questions ? quizData.questions.length : 0
      };

      const docRef = await db.collection(QUIZ_COLLECTION).add(quiz);
      const createdQuiz = await this.getQuizById(docRef.id);
      
      logger.info(`Quiz created with ID: ${docRef.id}`);
      return createdQuiz;
    } catch (error) {
      logger.error('Error creating quiz:', error);
      throw new Error('Failed to create quiz');
    }
  }

  // Update quiz
  async updateQuiz(quizId, updateData) {
    try {
      const updatePayload = {
        ...updateData,
        updatedAt: new Date()
      };

      // Update total questions if questions array is provided
      if (updateData.questions) {
        updatePayload.totalQuestions = updateData.questions.length;
      }

      await db.collection(QUIZ_COLLECTION).doc(quizId).update(updatePayload);
      const updatedQuiz = await this.getQuizById(quizId);
      
      logger.info(`Quiz updated: ${quizId}`);
      return updatedQuiz;
    } catch (error) {
      logger.error(`Error updating quiz ${quizId}:`, error);
      throw new Error('Failed to update quiz');
    }
  }

  // Delete quiz
  async deleteQuiz(quizId) {
    try {
      // Also delete all quiz attempts for this quiz
      const attemptsSnapshot = await db.collection(QUIZ_ATTEMPTS_COLLECTION)
        .where('quizId', '==', quizId)
        .get();

      const batch = db.batch();
      
      // Delete the quiz
      batch.delete(db.collection(QUIZ_COLLECTION).doc(quizId));
      
      // Delete all attempts
      attemptsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      
      logger.info(`Quiz deleted: ${quizId}`);
      return true;
    } catch (error) {
      logger.error(`Error deleting quiz ${quizId}:`, error);
      throw new Error('Failed to delete quiz');
    }
  }

  // Submit quiz attempt
  async submitQuizAttempt(quizId, attemptData) {
    try {
      const quiz = await this.getQuizById(quizId);
      if (!quiz) {
        throw new Error('Quiz not found');
      }

      // Calculate score
      const { score, correctAnswers, totalQuestions } = this.calculateScore(quiz.questions, attemptData.answers);

      const attempt = {
        quizId,
        userId: attemptData.userId,
        answers: attemptData.answers,
        score,
        correctAnswers,
        totalQuestions,
        percentage: Math.round((correctAnswers / totalQuestions) * 100),
        submittedAt: new Date(),
        timeSpent: attemptData.timeSpent || null
      };

      const docRef = await db.collection(QUIZ_ATTEMPTS_COLLECTION).add(attempt);
      
      logger.info(`Quiz attempt submitted: ${docRef.id}`);
      return {
        id: docRef.id,
        ...attempt
      };
    } catch (error) {
      logger.error(`Error submitting quiz attempt for quiz ${quizId}:`, error);
      throw new Error('Failed to submit quiz attempt');
    }
  }

  // Get quiz attempts by user
  async getQuizAttempts(quizId, userId) {
    try {
      const snapshot = await db.collection(QUIZ_ATTEMPTS_COLLECTION)
        .where('quizId', '==', quizId)
        .where('userId', '==', userId)
        .orderBy('submittedAt', 'desc')
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      logger.error(`Error fetching quiz attempts for quiz ${quizId} and user ${userId}:`, error);
      throw new Error('Failed to fetch quiz attempts');
    }
  }

  // Get all attempts for a quiz (for analytics)
  async getAllQuizAttempts(quizId) {
    try {
      const snapshot = await db.collection(QUIZ_ATTEMPTS_COLLECTION)
        .where('quizId', '==', quizId)
        .orderBy('submittedAt', 'desc')
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      logger.error(`Error fetching all attempts for quiz ${quizId}:`, error);
      throw new Error('Failed to fetch quiz attempts');
    }
  }

  // Get user's best attempt for a quiz
  async getUserBestAttempt(quizId, userId) {
    try {
      const snapshot = await db.collection(QUIZ_ATTEMPTS_COLLECTION)
        .where('quizId', '==', quizId)
        .where('userId', '==', userId)
        .orderBy('score', 'desc')
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      };
    } catch (error) {
      logger.error(`Error fetching best attempt for quiz ${quizId} and user ${userId}:`, error);
      throw new Error('Failed to fetch best attempt');
    }
  }

  // Get quiz analytics
  async getQuizAnalytics(quizId) {
    try {
      const attempts = await this.getAllQuizAttempts(quizId);
      
      if (attempts.length === 0) {
        return {
          totalAttempts: 0,
          averageScore: 0,
          highestScore: 0,
          lowestScore: 0,
          passRate: 0
        };
      }

      const scores = attempts.map(attempt => attempt.score);
      const totalAttempts = attempts.length;
      const averageScore = scores.reduce((sum, score) => sum + score, 0) / totalAttempts;
      const highestScore = Math.max(...scores);
      const lowestScore = Math.min(...scores);
      const passRate = (attempts.filter(attempt => attempt.percentage >= 70).length / totalAttempts) * 100;

      return {
        totalAttempts,
        averageScore: Math.round(averageScore * 100) / 100,
        highestScore,
        lowestScore,
        passRate: Math.round(passRate * 100) / 100,
        uniqueUsers: [...new Set(attempts.map(attempt => attempt.userId))].length
      };
    } catch (error) {
      logger.error(`Error getting analytics for quiz ${quizId}:`, error);
      throw new Error('Failed to get quiz analytics');
    }
  }

  // Helper method to calculate score
  calculateScore(questions, userAnswers) {
    let correctAnswers = 0;
    const totalQuestions = questions.length;

    questions.forEach((question, index) => {
      if (userAnswers[index] === question.correctAnswer) {
        correctAnswers++;
      }
    });

    const score = correctAnswers / totalQuestions;
    return {
      score,
      correctAnswers,
      totalQuestions
    };
  }

  // Toggle quiz active status
  async toggleQuizStatus(quizId) {
    try {
      const quiz = await this.getQuizById(quizId);
      if (!quiz) {
        throw new Error('Quiz not found');
      }

      const updatedQuiz = await this.updateQuiz(quizId, {
        isActive: !quiz.isActive
      });

      return updatedQuiz;
    } catch (error) {
      logger.error(`Error toggling quiz status ${quizId}:`, error);
      throw new Error('Failed to toggle quiz status');
    }
  }

  // Get quizzes from specific collection
  async getQuizzesByCollection(collectionName) {
    try {
      logger.info(`Attempting to fetch quizzes from collection: ${collectionName}`);
      
      // Get collection reference
      const collectionRef = db.collection(collectionName);
      
      // Get all documents in the collection
      const snapshot = await collectionRef.get();
      
      if (snapshot.empty) {
        logger.warn(`No documents found in collection: ${collectionName}`);
        return [];
      }

      // Map the documents to quiz objects
      const quizzes = snapshot.docs.map(doc => {
        const data = doc.data();
        logger.info(`Found quiz with ID: ${doc.id}`);
        return {
          id: doc.id,
          ...data
        };
      });

      logger.info(`Successfully retrieved ${quizzes.length} quizzes from ${collectionName}`);
      return quizzes;
    } catch (error) {
      logger.error(`Error fetching quizzes from collection ${collectionName}:`, error);
      throw new Error(`Failed to fetch quizzes from collection ${collectionName}: ${error.message}`);
    }
  }

  // Create test quiz in collection (for testing purposes)
  async createTestQuiz(collectionName) {
    try {
      logger.info(`Creating test quiz in collection: ${collectionName}`);
      
      const testQuiz = {
        title: "Java Basics Quiz",
        moduleId: "java_module_1",
        lessonId: "java_lesson_1_1",
        questions: [
          {
            id: "q1",
            question: "What is composition in Java?",
            options: {
              A: "IS-A relationship",
              B: "HAS-A relationship",
              C: "PART-OF relationship",
              D: "USES relationship"
            },
            correctAnswer: "B",
            difficulty: "NORMAL"
          }
        ],
        timeLimit: 30,
        passingScore: 70,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const docRef = await db.collection(collectionName).add(testQuiz);
      logger.info(`Test quiz created with ID: ${docRef.id} in collection: ${collectionName}`);
      
      return {
        id: docRef.id,
        ...testQuiz
      };
    } catch (error) {
      logger.error(`Error creating test quiz in collection ${collectionName}:`, error);
      throw new Error(`Failed to create test quiz: ${error.message}`);
    }
  }

  // Get specific quiz from collection
  async getQuizFromCollection(collectionName, quizId) {
    try {
      logger.info(`Fetching quiz ${quizId} from collection: ${collectionName}`);
      
      const doc = await db.collection(collectionName).doc(quizId).get();
      
      if (!doc.exists) {
        logger.warn(`Quiz ${quizId} not found in collection ${collectionName}`);
        return null;
      }

      const quiz = {
        id: doc.id,
        ...doc.data()
      };

      logger.info(`Successfully retrieved quiz ${quizId} from ${collectionName}`);
      return quiz;
    } catch (error) {
      logger.error(`Error fetching quiz ${quizId} from collection ${collectionName}:`, error);
      throw new Error(`Failed to fetch quiz: ${error.message}`);
    }
  }
}

module.exports = new QuizService();