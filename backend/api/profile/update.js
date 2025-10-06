const express = require('express');
const router = express.Router();

const { PrismaClient } = require('../../generated/prisma');
const prisma = new PrismaClient();

// PUT /api/profile/update
router.put('/update', async (req, res) => {
  const { 
    grade_level, 
    board, 
    subjects, 
    preferred_language, 
    study_goal,
    avatar_choice,
    avatar_url 
  } = req.body;

  // TODO: Add authentication middleware to get user_id
  const user_id = req.user?.user_id; // This will be set by auth middleware

  if (!user_id) {
    return res.status(401).json({ error: 'Authentication required' });
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