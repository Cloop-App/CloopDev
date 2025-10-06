const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const path = require('path')

dotenv.config({ path: path.join(__dirname, '..', '.env') })

const app = express()
app.use(cors())
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
