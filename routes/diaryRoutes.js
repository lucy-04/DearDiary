// routes/diaryRoutes.js
const express = require('express');
const { body } = require('express-validator');
const {
  getAllEntries,
  getEntry,
  createEntry,
  updateEntry,
  deleteEntry,
  getCalendarEntries,
  detectEmotion
} = require("../controllers/diartcontroller.js");
const authMiddleware = require("../middlewatre/authmiddleware.js");

const router = express.Router();

// Apply authentication to all routes
router.use(authMiddleware);

const entryValidation = [
  body('title').optional().trim().isLength({ max: 200 }),
  body('content').trim().notEmpty(),
  body('entry_date').isISO8601()
];

router.get('/', getAllEntries);
router.get('/calendar/:year/:month', getCalendarEntries);
router.get('/:id', getEntry);
router.post('/', entryValidation, createEntry);
router.put('/:id', updateEntry);
router.delete('/:id', deleteEntry);

// Emotion detection endpoint
router.post('/detect-emotion', [body('text').trim().notEmpty()], detectEmotion);

module.exports = router;
