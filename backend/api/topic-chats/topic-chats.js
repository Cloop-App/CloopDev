const express = require('express')
const router = express.Router()
const { authenticateToken } = require('../../middleware/auth')
const { generateTopicChatResponse } = require('../../services/openai')

const { PrismaClient } = require('../../generated/prisma')
const prisma = new PrismaClient()

// GET /api/topic-chats/:topicId
// Fetch all chat messages for a specific topic
router.get('/:topicId', authenticateToken, async (req, res) => {
	let user_id = req.user?.user_id
	const { topicId } = req.params

	// For production, always require authenticated user
	if (!user_id) {
		return res.status(401).json({ error: 'Authentication required - please login' })
	}

	if (!topicId || isNaN(parseInt(topicId))) {
		return res.status(400).json({ error: 'Valid topic ID is required' })
	}

	try {
		// First verify that the user has access to this topic
		const topic = await prisma.topics.findFirst({
			where: {
				id: parseInt(topicId),
				user_id: user_id
			},
			include: {
				chapters: {
					select: {
						id: true,
						title: true,
						subject_id: true
					}
				},
				subjects: {
					select: {
						id: true,
						name: true,
						code: true
					}
				}
			}
		})

		if (!topic) {
			return res.status(403).json({ error: 'Topic not found or user does not have access' })
		}

		// Fetch chat messages for this topic
		const chatMessages = await prisma.topic_chats.findMany({
			where: {
				topic_id: parseInt(topicId),
				user_id: user_id
			},
			orderBy: {
				created_at: 'asc'
			},
			select: {
				id: true,
				sender: true,
				message: true,
				file_url: true,
				file_type: true,
				created_at: true
			}
		})

		return res.status(200).json({
			topic: {
				id: topic.id,
				title: topic.title,
				content: topic.content,
				is_completed: topic.is_completed,
				completion_percent: topic.completion_percent,
				chapter: topic.chapters,
				subject: topic.subjects
			},
			messages: chatMessages
		})
	} catch (err) {
		console.error('Error fetching topic chat messages:', err)
		return res.status(500).json({ error: 'Server error while fetching chat messages' })
	}
})

// POST /api/topic-chats/:topicId/message
// Send a new message in the topic chat
router.post('/:topicId/message', authenticateToken, async (req, res) => {
	let user_id = req.user?.user_id
	const { topicId } = req.params
	const { message, file_url, file_type } = req.body

	// For production, always require authenticated user
	if (!user_id) {
		return res.status(401).json({ error: 'Authentication required - please login' })
	}

	if (!topicId || isNaN(parseInt(topicId))) {
		return res.status(400).json({ error: 'Valid topic ID is required' })
	}

	if (!message && !file_url) {
		return res.status(400).json({ error: 'Message or file is required' })
	}

	try {
		// Verify user has access to this topic
		const topic = await prisma.topics.findFirst({
			where: {
				id: parseInt(topicId),
				user_id: user_id
			},
			include: {
				chapters: {
					select: {
						title: true
					}
				},
				subjects: {
					select: {
						name: true
					}
				}
			}
		})

		if (!topic) {
			return res.status(403).json({ error: 'Topic not found or user does not have access' })
		}

		// Get recent chat history for context
		const recentMessages = await prisma.topic_chats.findMany({
			where: {
				topic_id: parseInt(topicId),
				user_id: user_id
			},
			orderBy: {
				created_at: 'desc'
			},
			take: 10,
			select: {
				sender: true,
				message: true
			}
		})

		// Reverse to get chronological order
		const chatHistory = recentMessages.reverse()

		// Create user message
		const userMessage = await prisma.topic_chats.create({
			data: {
				user_id: user_id,
				subject_id: topic.subject_id,
				chapter_id: topic.chapter_id,
				topic_id: parseInt(topicId),
				sender: 'user',
				message: message || null,
				file_url: file_url || null,
				file_type: file_type || null
			},
			select: {
				id: true,
				sender: true,
				message: true,
				file_url: true,
				file_type: true,
				created_at: true
			}
		})

		// Generate AI response using GPT-4 with topic context
		let aiResponseText
		try {
			aiResponseText = await generateTopicChatResponse(
				message || 'User shared a file',
				topic.title,
				topic.content || 'No additional content provided',
				chatHistory
			)
		} catch (aiError) {
			console.error('Error generating AI response:', aiError)
			// Fallback to a generic error message
			aiResponseText = `I'm having trouble processing your message right now. Please try again in a moment. In the meantime, you can review the topic content: ${topic.title}`
		}
		
		const aiMessage = await prisma.topic_chats.create({
			data: {
				user_id: user_id,
				subject_id: topic.subject_id,
				chapter_id: topic.chapter_id,
				topic_id: parseInt(topicId),
				sender: 'ai',
				message: aiResponseText,
				file_url: null,
				file_type: null
			},
			select: {
				id: true,
				sender: true,
				message: true,
				file_url: true,
				file_type: true,
				created_at: true
			}
		})

		// Update user's chat count
		await prisma.users.update({
			where: { user_id: user_id },
			data: { num_chats: { increment: 1 } }
		})

		return res.status(201).json({
			userMessage,
			aiMessage
		})
	} catch (err) {
		console.error('Error sending topic chat message:', err)
		return res.status(500).json({ error: 'Server error while sending message' })
	}
})

module.exports = router