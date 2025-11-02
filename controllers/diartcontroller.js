// controllers/diaryController.js
const client = require('../config/db');
const axios = require('axios');
const { getCurrentTimestamp } = require("../utils/timeStampHelper.js");


exports.getAllEntries = async (req,res,next) => {
    const userId = req.user.userId;

    try{
        const entries = await client.query(
            'SELECT * FROM diary_entries WHERE user_id = $1 ORDER BY entry_date DESC',
            [userId]
        )
        res.send(200).json({
            success : true,
            count: entries.rows.length,
            data: entries.rows
    });
  } catch (error) {
    next(error);
  }
};

exports.getEntry = async (req,res,next) => {
    const userId = req.user.userId;
    const {id} = req.params;

    try{
        const entries = await client.query(
            'SELECT * FROM diary_entries WHERE user_id = $1 AND id = $2 ORDER BY entry_date DESC',
            [userId,id]
        )
        res.send(200).json({
            success : true,
            count: entries.rows.length,
            data: entries.rows
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteEntry = async (req,res,next) => {
    const user_Id = req.user.userId;
    const {id} = req.params;

    try{
        const del = await client.query(
            'DELETE FROM diary_entries WHERE user_id = $1 AND id = $2',
            [user_Id, id]
        )
        res.send(200).json({
            success: true,
            message: 'field deleted successfully'
        });
    } catch( error ){
        next(error);
    }
}
// Create new entry
exports.createEntry = async (req, res, next) => {
  const { title, content, entry_date } = req.body;
  const userId = req.user.userId;
  
  try {
    let mood = 'neutral';
    let moodColor = '#808080';
    
    try {
      const aiResponse = await axios.post(
        process.env.AI_MODEL_API_URL,
        { text: content },
        { headers: { 'Authorization': `Bearer ${process.env.AI_MODEL_API_KEY}` } }
      );
      
      mood = aiResponse.data.mood || 'neutral';
      moodColor = getMoodColor(mood);
    } catch (aiError) {
      console.log('AI analysis failed, using default mood');
    }
    
    const now = getCurrentTimestamp();
    
    // Insert with explicit timestamps
    const newEntry = await client.query(
      `INSERT INTO diary_entries (user_id, title, content, mood, mood_color, entry_date, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [userId, title, content, mood, moodColor, entry_date, now, now]
    );
    
    res.status(201).json({
      success: true,
      message: 'Entry created successfully',
      data: newEntry.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

// Update entry - IMPORTANT: Set updated_at here
exports.updateEntry = async (req, res, next) => {
  const { id } = req.params;
  const { title, content } = req.body;
  const userId = req.user.userId;
  
  try {
    let mood, moodColor;
    
    if (content) {
      try {
        const aiResponse = await axios.post(
          process.env.AI_MODEL_API_URL,
          { text: content },
          { headers: { 'Authorization': `Bearer ${process.env.AI_MODEL_API_KEY}` } }
        );
        mood = aiResponse.data.mood || 'neutral';
        moodColor = getMoodColor(mood);
      } catch (aiError) {
        console.log('AI analysis failed during update');
      }
    }
    
    // CRITICAL: Always set updated_at when updating
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
      return res.status(404).json({ 
        success: false, 
        message: 'Entry not found' 
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Entry updated successfully',
      data: updatedEntry.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

exports.getCalendarEntries = async (req, res, next) => {
  const { year, month } = req.params;
  const userId = req.user.userId;
  
  try {
    const entries = await pool.query(
      `SELECT entry_date, mood, mood_color, title 
       FROM diary_entries 
       WHERE user_id = $1 
       AND EXTRACT(YEAR FROM entry_date) = $2 
       AND EXTRACT(MONTH FROM entry_date) = $3
       ORDER BY entry_date`,
      [userId, year, month]
    );
    
    res.status(200).json({
      success: true,
      data: entries.rows
    });
  } catch (error) {
    next(error);
  }
};

function getMoodColor(mood) {
  const moodColors = {
    happy: '#FFD700',
    sad: '#4169E1',
    angry: '#DC143C',
    anxious: '#9370DB',
    calm: '#87CEEB',
    excited: '#FF8C00',
    neutral: '#808080'
  };
  
  return moodColors[mood.toLowerCase()] || '#808080';
}
