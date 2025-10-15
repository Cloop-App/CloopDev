const express = require('express');
const router = express.Router();

// All content generation is now handled automatically by the backend pipeline
// No client-side API endpoints needed - content is generated on backend startup
// when pending records are found in content_generation_status table

module.exports = router;
