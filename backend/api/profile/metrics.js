const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');

const { PrismaClient } = require('../../generated/prisma');
const prisma = new PrismaClient();

// GET /api/profile/metrics
// Fetch comprehensive user metrics including progress, weak/strong topics, etc.
router.get('/', authenticateToken, async (req, res) => {
  let user_id = req.user?.user_id;

  if (!user_id) {
    return res.status(401).json({ error: 'Authentication required - please login' });
  }

  try {
    // Get user's subjects with completion data
    const userSubjects = await prisma.user_subjects.findMany({
      where: { user_id: user_id },
      include: {
        subjects: {
          select: {
            id: true,
            name: true,
            code: true,
          }
        }
      }
    });

    // Get completed topics by subject
    const completedTopics = await prisma.topics.findMany({
      where: {
        user_id: user_id,
        is_completed: true
      },
      include: {
        subjects: {
          select: {
            name: true
          }
        },
        chapters: {
          select: {
            title: true
          }
        }
      }
    });

    // Get topic chat activity (to determine active/weak topics)
    const topicChatActivity = await prisma.topic_chats.groupBy({
      by: ['topic_id'],
      where: {
        user_id: user_id
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    });

    // Get topic details for chat activity
    const topicIds = topicChatActivity.map(activity => activity.topic_id);
    const topicDetails = await prisma.topics.findMany({
      where: {
        id: { in: topicIds }
      },
      include: {
        subjects: {
          select: {
            name: true
          }
        },
        chapters: {
          select: {
            title: true
          }
        }
      }
    });

    // Calculate metrics
    const totalSubjects = userSubjects.length;
    const completedSubjects = userSubjects.filter(us => us.completion_percent >= 100).length;
    const totalChapters = userSubjects.reduce((sum, us) => sum + (us.total_chapters || 0), 0);
    const completedChapters = userSubjects.reduce((sum, us) => sum + (us.completed_chapters || 0), 0);
    const totalCompletedTopics = completedTopics.length;

    // Determine strong and weak topics based on chat activity and completion
    const strongTopics = topicDetails
      .filter(topic => {
        const activity = topicChatActivity.find(a => a.topic_id === topic.id);
        return topic.is_completed && activity && activity._count.id >= 3;
      })
      .slice(0, 5);

    const weakTopics = topicDetails
      .filter(topic => {
        const activity = topicChatActivity.find(a => a.topic_id === topic.id);
        return !topic.is_completed && activity && activity._count.id >= 5;
      })
      .slice(0, 5);

    // Calculate subject-wise progress
    const subjectProgress = userSubjects.map(userSubject => ({
      subject: userSubject.subjects,
      total_chapters: userSubject.total_chapters || 0,
      completed_chapters: userSubject.completed_chapters || 0,
      completion_percent: parseFloat(userSubject.completion_percent?.toString() || '0'),
      topics_completed: completedTopics.filter(topic => 
        topic.subject_id === userSubject.subject_id
      ).length
    }));

    return res.status(200).json({
      overview: {
        total_subjects: totalSubjects,
        completed_subjects: completedSubjects,
        total_chapters: totalChapters,
        completed_chapters: completedChapters,
        total_topics_completed: totalCompletedTopics,
        overall_progress: totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0
      },
      subject_progress: subjectProgress,
      strong_topics: strongTopics.map(topic => ({
        id: topic.id,
        title: topic.title,
        subject: topic.subjects.name,
        chapter: topic.chapters.title,
        completion_percent: parseFloat(topic.completion_percent?.toString() || '0')
      })),
      weak_topics: weakTopics.map(topic => ({
        id: topic.id,
        title: topic.title,
        subject: topic.subjects.name,
        chapter: topic.chapters.title,
        chat_count: topicChatActivity.find(a => a.topic_id === topic.id)?._count.id || 0
      })),
      activity: {
        total_chat_sessions: topicChatActivity.length,
        most_active_topics: topicDetails
          .map(topic => ({
            id: topic.id,
            title: topic.title,
            subject: topic.subjects.name,
            chat_count: topicChatActivity.find(a => a.topic_id === topic.id)?._count.id || 0
          }))
          .sort((a, b) => b.chat_count - a.chat_count)
          .slice(0, 5)
      }
    });
  } catch (err) {
    console.error('Error fetching user metrics:', err);
    return res.status(500).json({ error: 'Server error while fetching metrics' });
  }
});

module.exports = router;