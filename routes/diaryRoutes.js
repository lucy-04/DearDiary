// routes/diaryRoutes.js
const express = require("express");
const { body } = require("express-validator");
const {
  getAllEntries,
  getEntry,
  createEntry,
  updateEntry,
  deleteEntry,
  getCalendarEntries,
  detectEmotion,
} = require("../controllers/diartcontroller.js");
const authMiddleware = require("../middlewatre/authmiddleware.js");
const validate = require("../utils/validate");
const { aiLimiter } = require("../utils/rateLimit");

const router = express.Router();

// Apply authentication to all routes
router.use(authMiddleware);

const entryValidation = [
  body("title").optional().trim().isLength({ max: 200 }),
  body("content").trim().notEmpty().isLength({ max: 10000 }),
  body("entry_date").isISO8601(),
];

router.get("/", getAllEntries);
router.get("/calendar/:year/:month", getCalendarEntries);
router.get("/:id", getEntry);
router.post("/", aiLimiter, entryValidation, validate, createEntry); // calls Gemini
router.put("/:id", aiLimiter, updateEntry); // calls Gemini
router.delete("/:id", deleteEntry);

// Emotion detection preview (calls Gemini)
router.post(
  "/detect-emotion",
  aiLimiter,
  [body("text").trim().notEmpty().isLength({ max: 10000 })],
  validate,
  detectEmotion
);

module.exports = router;
