// The mood spectrum. Each mood has an emoji, a label, and a glow colour used
// across the calendar orbs, picker, and entry chips.
export const MOODS = {
  happy: { emoji: "😊", label: "Happy", color: "#FFD66B" },
  excited: { emoji: "🤩", label: "Excited", color: "#FF9E5E" },
  love: { emoji: "🥰", label: "Love", color: "#FF8FB1" },
  calm: { emoji: "😌", label: "Calm", color: "#7FD1C4" },
  neutral: { emoji: "😐", label: "Neutral", color: "#9AA0B5" },
  anxious: { emoji: "😰", label: "Anxious", color: "#B89BFF" },
  sad: { emoji: "😢", label: "Sad", color: "#6E8BE0" },
  angry: { emoji: "😠", label: "Angry", color: "#E5614C" },
};

// Order shown in the picker — roughly brightest to heaviest.
export const MOOD_LIST = ["happy", "excited", "love", "calm", "neutral", "anxious", "sad", "angry"];

export function getMood(name) {
  return MOODS[(name || "").toLowerCase()] || MOODS.neutral;
}
