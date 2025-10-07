const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');

const { PrismaClient } = require('../../generated/prisma');
const prisma = new PrismaClient();

// GET /api/profile
router.get('/', authenticateToken, async (req, res) => {
  // Get user_id from authenticated token
  let user_id = req.user?.user_id;

  // Allow a query fallback for development/testing: /api/profile?user_id=1
  if (!user_id && req.query && req.query.user_id) {
    // coerce to number when possible
    const parsed = Number(req.query.user_id);
    if (!Number.isNaN(parsed)) user_id = parsed;
  }

  // If still no user_id, return error
  if (!user_id) {
    return res.status(400).json({ error: 'User ID not found in token' });
  }

  try {
    const user = await prisma.users.findUnique({
      where: { user_id: user_id },
      select: {
        user_id: true,
        name: true,
        email: true,
        grade_level: true,
        board: true,
        subjects: true,
        preferred_language: true,
        study_goal: true,
        avatar_choice: true,
        avatar_url: true,
        num_chats: true,
        num_lessons: true,
        created_at: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json(user);
  } catch (err) {
    console.error('Error fetching user profile:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;