const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const path = require('path')

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
app.use('/api/login', require('./api/login/login'))
// Profile route
app.use('/api/profile', require('./api/profile/get-profile'))
app.use('/api/profile', require('./api/profile/update'))

const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
	console.log(`Backend server listening on port ${PORT}`)
})

module.exports = app
