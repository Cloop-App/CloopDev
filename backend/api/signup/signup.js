const express = require('express')
const bcrypt = require('bcryptjs')
const CurriculumAutoTrigger = require('../../services/curriculum-auto-trigger')

const router = express.Router()

const { PrismaClient } = require('../../generated/prisma')
const prisma = new PrismaClient()

// POST /api/signup/
// body: { name, email, phone?, grade_level?, board?, subjects?, preferred_language?, study_goal? }
// Now stores references to database table IDs and creates user_subjects entries
router.post('/', async (req, res) => {
	const { name, email, phone, grade_level, board, subjects, preferred_language, study_goal } = req.body
	if (!name || !email) {
		return res.status(400).json({ error: 'name and email are required' })
	}

	try {
		// Look up the actual database records to get their names/codes
		let boardName = null
		let languageName = null
		let gradeLevelValue = null
		
		if (board) {
			const boardRecord = await prisma.boards.findUnique({ where: { id: parseInt(board) } })
			boardName = boardRecord?.name
		}
		
		if (preferred_language) {
			const languageRecord = await prisma.languages.findUnique({ where: { id: parseInt(preferred_language) } })
			languageName = languageRecord?.name
		}
		
		if (grade_level) {
			const gradeRecord = await prisma.grades.findUnique({ where: { id: parseInt(grade_level) } })
			gradeLevelValue = gradeRecord?.grade_level?.toString()
		}

		// Create the user
		const user = await prisma.users.create({
			data: {
				name,
				email,
				phone,
				grade_level: gradeLevelValue,
				board: boardName,
				subjects: [], // Keep empty array since we'll use user_subjects table
				preferred_language: languageName,
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

		// Create user_subjects entries if subjects were selected
		if (subjects && subjects.length > 0) {
			const userSubjectsData = subjects.map(subjectId => ({
				user_id: user.user_id,
				subject_id: parseInt(subjectId)
			}))
			
			await prisma.user_subjects.createMany({
				data: userSubjectsData,
				skipDuplicates: true
			})
		}

		// Auto-trigger curriculum generation setup for new user
		// This will create pending content generation records
		CurriculumAutoTrigger.handleUserSignup(user.user_id).catch(error => {
			console.error('Auto-trigger curriculum generation setup after signup failed:', error);
		});

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
