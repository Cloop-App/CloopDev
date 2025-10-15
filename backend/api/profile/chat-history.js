const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');

const { PrismaClient } = require('../../generated/prisma');
const prisma = new PrismaClient();

// GET /api/profile/chat-history
// Fetch user's topic chat history grouped by topics
router.get('/', authenticateToken, async (req, res) => {
  let user_id = req.user?.user_id;

  if (!user_id) {
    return res.status(401).json({ error: 'Authentication required - please login' });
  }

  try {
    // Get distinct topics that user has chatted about
    const chatHistory = await prisma.topic_chats.findMany({
      where: {
        user_id: user_id
      },
      select: {
        topic_id: true,
        created_at: true,
        topics: {
          select: {
            id: true,
            title: true,
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
        }
      },
      orderBy: {
        created_at: 'desc'
      },
      distinct: ['topic_id']
    });

    // Format the response
    const formattedHistory = chatHistory.map(chat => ({
      topic_id: chat.topic_id,
      title: chat.topics.title,
      subject: chat.topics.subjects.name,
      chapter: chat.topics.chapters.title,
      last_activity: chat.created_at
    }));

    return res.status(200).json({
      chatHistory: formattedHistory
    });
  } catch (err) {
    console.error('Error fetching chat history:', err);
    return res.status(500).json({ error: 'Server error while fetching chat history' });
  }
});

module.exports = router;