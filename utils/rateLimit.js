// utils/rateLimit.js
// Per-IP rate limiting. The strict limiters protect the endpoints that cost
// real money/quota (Gemini) or are abuse targets (auth), so a public deployment
// can't be scripted to run up the bill.
const rateLimit = require("express-rate-limit");

// Return a 429 in the same { success, message } shape the rest of the API uses.
const reply = (msg) => ({
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => res.status(429).json({ success: false, message: msg }),
});

// General ceiling for the whole API.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 300,
  ...reply("Too many requests. Please slow down and try again shortly."),
});

// Auth: stop brute-force logins and bulk account creation.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 20,
  ...reply("Too many attempts. Please wait a few minutes and try again."),
});

// Gemini-touching routes (save entry, detect emotion) — these call the paid API.
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 12,
  ...reply("You're going a little fast. Give it a moment and try again."),
});

module.exports = { apiLimiter, authLimiter, aiLimiter };
