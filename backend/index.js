const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const path = require('path')
const { startContinuousProcessing } = require('./services/background-processor')

dotenv.config({ path: path.join(__dirname, '.env') })

const app = express()

// Configure CORS for Expo development
const corsOptions = {
  origin: [
    'http://localhost:8081',        // Expo dev server
    'http://localhost:19000',       // Alternative Expo port
    'http://localhost:19002',       // Alternative Expo port
    /^http:\/\/192\.168\.\d+\.\d+:8081$/, // Local network IPs for mobile devices
    /^http:\/\/10\.\d+\.\d+\.\d+:8081$/,  // Alternative local network range
    /^http:\/\/172\.\d+\.\d+\.\d+:8081$/, // Docker/VPN network range
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}

app.use(cors(corsOptions))
app.use(express.json())

// Mount API routes
app.use('/api/signup', require('./api/signup/signup'))
app.use('/api/signup/options', require('./api/signup/options'))
app.use('/api/login', require('./api/login/login'))
// Profile routes
app.use('/api/profile', require('./api/profile/get-profile'))
app.use('/api/profile', require('./api/profile/update'))
app.use('/api/profile', require('./api/profile/manage-subjects'))
app.use('/api/profile/chat-history', require('./api/profile/chat-history'))
app.use('/api/profile/metrics', require('./api/profile/metrics'))
// Chapters and Topics routes
app.use('/api/chapters', require('./api/chapters/chapters'))
app.use('/api/topics', require('./api/topics/topics'))
// Topic Chat routes
app.use('/api/topic-chats', require('./api/topic-chats/topic-chats'))
// Normal Chat routes
app.use('/api/normal-chat', require('./api/normal-chat/normal-chat'))
// Content Generation (AI Pipeline) routes
app.use('/api/content-generation', require('./api/content-generation/content-generation'))

const PORT = process.env.PORT || 4000
app.listen(PORT, async () => {
	console.log(`\n🚀 Backend server listening on port ${PORT}`)
	console.log('=' .repeat(60))
	
	// Start continuous background processor
	console.log('\n🔄 Initializing Content Generation Background Processor...')
	try {
		// Wait 3 seconds after server starts, then start continuous processing
		setTimeout(async () => {
			try {
				await startContinuousProcessing()
			} catch (error) {
				console.error('❌ Error starting background processor:', error)
			}
		}, 3000)
	} catch (error) {
		console.error('❌ Failed to initialize background processor:', error)
	}
})

// Graceful shutdown
process.on('SIGINT', () => {
	console.log('\n\n🛑 Shutting down server...')
	const { stopContinuousProcessing } = require('./services/background-processor')
	stopContinuousProcessing()
	process.exit(0)
})

process.on('SIGTERM', () => {
	console.log('\n\n🛑 Shutting down server...')
	const { stopContinuousProcessing } = require('./services/background-processor')
	stopContinuousProcessing()
	process.exit(0)
})

module.exports = app
