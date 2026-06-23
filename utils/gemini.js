// utils/gemini.js
// Emotion classification using the Gemini API. Called server-side so the API
// key never reaches the browser.
const { GoogleGenerativeAI } = require("@google/generative-ai");

// The fixed set of moods we support, each with a display colour.
const MOOD_COLORS = {
  happy: "#FFD700",
  sad: "#4169E1",
  angry: "#DC143C",
  anxious: "#9370DB",
  calm: "#87CEEB",
  excited: "#FF8C00",
  love: "#FF69B4",
  neutral: "#808080",
};

const MOODS = Object.keys(MOOD_COLORS);
const FALLBACK = { mood: "neutral", color: MOOD_COLORS.neutral };

// Set up the model once. If there's no key we leave it null and fall back.
let model = null;
if (process.env.GEMINI_API_KEY) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  model = genAI.getGenerativeModel({
    // A current, cheap, fast model that's reliable for a simple classifier. If
    // this ever 404s, list available models at
    // GET https://generativelanguage.googleapis.com/v1beta/models?key=... and
    // pick another. The full "flash" models are often busier (503) on free tier.
    model: "gemini-2.5-flash-lite",
    generationConfig: { responseMimeType: "application/json" },
  });
} else {
  console.warn("⚠️  GEMINI_API_KEY not set — emotion detection will default to 'neutral'.");
}

// Classify a piece of diary text into one of our moods.
// Always resolves (never throws) so a failed call just gives a neutral mood.
async function classifyMood(text) {
  if (!model || !text || !text.trim()) {
    return FALLBACK;
  }

  const prompt = `You are an emotion classifier for a journaling app.
Read the diary entry below and pick the single mood that best matches it.
Choose exactly one from this list: ${MOODS.join(", ")}.
Reply ONLY with JSON like {"mood": "happy"}.

Diary entry:
"""${text}"""`;

  // The model can briefly return 503/429 under load — retry a couple of times
  // with a short backoff before giving up and falling back to neutral.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const parsed = JSON.parse(result.response.text());
      const mood = String(parsed.mood || "").toLowerCase();
      return MOODS.includes(mood) ? { mood, color: MOOD_COLORS[mood] } : FALLBACK;
    } catch (err) {
      const retryable = /\b(503|429)\b/.test(err.message);
      if (retryable && attempt < 2) {
        await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
        continue;
      }
      console.error("Gemini classification failed:", err.message);
      return FALLBACK;
    }
  }
  return FALLBACK;
}

module.exports = { classifyMood, MOOD_COLORS, MOODS };
