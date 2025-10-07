const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');

const { PrismaClient } = require('../../generated/prisma');
const prisma = new PrismaClient();

// PUT /api/profile/update
router.put('/update', authenticateToken, async (req, res) => {
  const { 
    grade_level, 
    board, 
    subjects, 
    preferred_language, 
    study_goal,
    avatar_choice,
    avatar_url 
  } = req.body;

  // Get user_id from authenticated token
  const user_id = req.user?.user_id;

  if (!user_id) {
    return res.status(401).json({ error: 'User ID not found in token' });
  }

  try {
    const updatedUser = await prisma.users.update({
      where: {
        user_id: user_id
      },
      data: {
        grade_level,
        board,
        subjects,
        preferred_language,
        study_goal,
        avatar_choice,
        avatar_url
      },
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
        avatar_url: true
      }
    });

    return res.json({ success: true, user: updatedUser });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;