const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

/**
 * Handle user signup and create pending content generation records
 */
async function handleUserSignup(userId) {
  try {
    console.log(`Setting up content generation for new user: ${userId}`);

    // Get user details
    const user = await prisma.users.findUnique({
      where: { user_id: userId }
    });

    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    // Check if user has complete profile
    if (!user.grade_level || !user.board) {
      console.log(`User ${userId} has incomplete profile, skipping content generation setup`);
      return {
        success: false,
        message: 'User profile incomplete. Grade level and board are required.'
      };
    }

    // Get user's subjects
    const userSubjects = await prisma.user_subjects.findMany({
      where: { user_id: userId },
      include: {
        subjects: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    });

    if (userSubjects.length === 0) {
      console.log(`User ${userId} has no subjects, skipping content generation setup`);
      return {
        success: false,
        message: 'User has no subjects assigned.'
      };
    }

    // Create pending content generation status for each subject
    const createdStatuses = [];
    for (const userSubject of userSubjects) {
      try {
        const status = await prisma.content_generation_status.upsert({
          where: {
            user_id_subject_id_grade_level_board: {
              user_id: userId,
              subject_id: userSubject.subject_id,
              grade_level: user.grade_level,
              board: user.board
            }
          },
          update: {
            status: 'pending',
            updated_at: new Date()
          },
          create: {
            user_id: userId,
            subject_id: userSubject.subject_id,
            grade_level: user.grade_level,
            board: user.board,
            status: 'pending',
            chapters_generated: false,
            topics_generated: false
          }
        });

        createdStatuses.push({
          subject: userSubject.subjects.name,
          status: status.status
        });

        console.log(`✓ Created pending status for subject: ${userSubject.subjects.name}`);
      } catch (error) {
        console.error(`Error creating status for subject ${userSubject.subject_id}:`, error);
      }
    }

    console.log(`Content generation setup complete for user ${userId}. Created ${createdStatuses.length} pending task(s).`);
    console.log('Content will be generated when the backend starts or through the content generation API.');

    return {
      success: true,
      message: `Content generation scheduled for ${createdStatuses.length} subject(s)`,
      statuses: createdStatuses
    };

  } catch (error) {
    console.error('Error in handleUserSignup:', error);
    throw error;
  }
}

module.exports = {
  handleUserSignup
};
