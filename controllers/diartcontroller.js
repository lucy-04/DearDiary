// controllers/diaryController.js
require("dotenv").config();
const client = require("../config/db");
const { getCurrentTimestamp } = require("../utils/timeStampHelper.js");
const { classifyMood, MOOD_COLORS } = require("../utils/gemini.js");

// Get all entries for the logged-in user
exports.getAllEntries = async (req, res, next) => {
  const userId = req.user.userId;

  try {
    const entries = await client.query(
      "SELECT * FROM diary_entries WHERE user_id = $1 ORDER BY entry_date DESC",
      [userId]
    );
    res.status(200).json({
      success: true,
      count: entries.rows.length,
      data: entries.rows,
    });
  } catch (error) {
    next(error);
  }
};

// Get a single entry by id
exports.getEntry = async (req, res, next) => {
  const userId = req.user.userId;
  const { id } = req.params;

  try {
    const entries = await client.query(
      "SELECT * FROM diary_entries WHERE user_id = $1 AND id = $2",
      [userId, id]
    );
    res.status(200).json({
      success: true,
      count: entries.rows.length,
      data: entries.rows[0] || null,
    });
  } catch (error) {
    next(error);
  }
};

// Delete an entry
exports.deleteEntry = async (req, res, next) => {
  const userId = req.user.userId;
  const { id } = req.params;

  try {
    await client.query(
      "DELETE FROM diary_entries WHERE user_id = $1 AND id = $2",
      [userId, id]
    );
    res.status(200).json({
      success: true,
      message: "Entry deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Create a new entry. If the client didn't send a mood, Gemini classifies the
// text on write and that result is stored (and later drives the calendar).
exports.createEntry = async (req, res, next) => {
  const { title, content, entry_date } = req.body;
  const userId = req.user.userId;

  try {
    let mood = req.body.mood;
    if (!mood) {
      const result = await classifyMood(content);
      mood = result.mood;
    }
    const moodColor = MOOD_COLORS[mood] || MOOD_COLORS.neutral;

    const now = getCurrentTimestamp();

    const newEntry = await client.query(
      `INSERT INTO diary_entries (user_id, title, content, mood, mood_color, entry_date, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [userId, title || "Untitled", content, mood, moodColor, entry_date, now, now]
    );

    res.status(201).json({
      success: true,
      message: "Entry created successfully",
      data: newEntry.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// Update an entry. Re-classifies the mood when the content changes, unless the
// client explicitly sends a mood.
exports.updateEntry = async (req, res, next) => {
  const { id } = req.params;
  const { title, content } = req.body;
  const userId = req.user.userId;

  try {
    let mood = req.body.mood;
    let moodColor;

    if (!mood && content) {
      const result = await classifyMood(content);
      mood = result.mood;
    }
    if (mood) {
      moodColor = MOOD_COLORS[mood] || MOOD_COLORS.neutral;
    }

    const now = getCurrentTimestamp();

    const updatedEntry = await client.query(
      `UPDATE diary_entries
       SET title = COALESCE($1, title),
           content = COALESCE($2, content),
           mood = COALESCE($3, mood),
           mood_color = COALESCE($4, mood_color),
           updated_at = $5
       WHERE id = $6 AND user_id = $7
       RETURNING *`,
      [title, content, mood, moodColor, now, id, userId]
    );

    if (updatedEntry.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Entry not found" });
    }

    res.status(200).json({
      success: true,
      message: "Entry updated successfully",
      data: updatedEntry.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// Entries for a given month — used by the calendar view.
exports.getCalendarEntries = async (req, res, next) => {
  const { year, month } = req.params;
  const userId = req.user.userId;

  try {
    const entries = await client.query(
      `SELECT id, entry_date, mood, mood_color, title
       FROM diary_entries
       WHERE user_id = $1
       AND EXTRACT(YEAR FROM entry_date) = $2
       AND EXTRACT(MONTH FROM entry_date) = $3
       ORDER BY entry_date`,
      [userId, year, month]
    );

    res.status(200).json({
      success: true,
      data: entries.rows,
    });
  } catch (error) {
    next(error);
  }
};

// Preview the mood for some text without saving (used by the "Detect" button).
exports.detectEmotion = async (req, res, next) => {
  const { text } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({
      success: false,
      message: "Text is required for emotion detection",
    });
  }

  try {
    const { mood, color } = await classifyMood(text);
    res.status(200).json({
      success: true,
      data: { mood, color },
    });
  } catch (error) {
    next(error);
  }
};
