const express = require('express')
const router = express.Router()

const { PrismaClient } = require('../../generated/prisma')
const prisma = new PrismaClient()

// GET /api/signup/options
// Returns all the options needed for signup form: grades, boards, subjects, languages
router.get('/', async (req, res) => {
	try {
		// Fetch all options in parallel
		const [grades, boards, subjects, languages] = await Promise.all([
			prisma.grades.findMany({
				orderBy: { grade_level: 'asc' }
			}),
			prisma.boards.findMany({
				orderBy: { name: 'asc' }
			}),
			prisma.subjects.findMany({
				orderBy: { name: 'asc' }
			}),
			prisma.languages.findMany({
				orderBy: { name: 'asc' }
			})
		])

		return res.status(200).json({
			grades: grades.map(grade => ({
				id: grade.id,
				level: grade.grade_level,
				description: grade.description
			})),
			boards: boards.map(board => ({
				id: board.id,
				code: board.code,
				name: board.name,
				description: board.description
			})),
			subjects: subjects.map(subject => ({
				id: subject.id,
				code: subject.code,
				name: subject.name,
				category: subject.category
			})),
			languages: languages.map(language => ({
				id: language.id,
				code: language.code,
				name: language.name,
				native_name: language.native_name,
				rtl: language.rtl
			}))
		})
	} catch (err) {
		console.error('Error fetching signup options:', err)
		return res.status(500).json({ error: 'Server error while fetching signup options' })
	}
})

module.exports = router