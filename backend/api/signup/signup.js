const express = require('express')
const bcrypt = require('bcryptjs')

const router = express.Router()

const { PrismaClient } = require('../../generated/prisma')
const prisma = new PrismaClient()

// POST /api/signup/
// body: { name, email, phone?, grade_level?, board?, subjects?, preferred_language?, study_goal? }
// New behavior: create user without a password. All profile fields are optional except name and email.
router.post('/', async (req, res) => {
	const { name, email, phone, grade_level, board, subjects, preferred_language, study_goal } = req.body
	if (!name || !email) {
		return res.status(400).json({ error: 'name and email are required' })
	}

	try {
		const user = await prisma.users.create({
			data: {
				name,
				email,
				phone,
				grade_level,
				board,
				subjects: subjects || [],
				preferred_language,
				study_goal,
			},
			select: {
				user_id: true,
				name: true,
				email: true,
				created_at: true,
				num_chats: true,
				num_lessons: true,
			}
		})

		return res.status(201).json({ user })
	} catch (err) {
		// handle unique email error from Prisma
		if (err && err.code === 'P2002') {
			return res.status(409).json({ error: 'Email already in use' })
		}
		console.error(err)
		return res.status(500).json({ error: 'Server error' })
	}
})

module.exports = router
