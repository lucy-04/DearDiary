import { useEffect } from "react";
import { getMood } from "../lib/moods.js";

const longDate = (d) =>
  new Date(d).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

// Reading view for a single entry. `entry` must include `content`.
export default function EntryModal({ entry, onClose, onDelete }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!entry) return null;
  const mood = getMood(entry.mood);

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <header className="modal__head">
          <div>
            <p className="modal__date">{longDate(entry.entry_date)}</p>
            <span className="mood-chip" style={{ "--mood": mood.color }}>
              <span className="mood-chip__dot" />
              {mood.emoji} {mood.label}
            </span>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </header>

        {entry.title && entry.title !== "Untitled" && (
          <h2 className="modal__title">{entry.title}</h2>
        )}
        <p className="modal__body">{entry.content}</p>

        <footer className="modal__foot">
          <button className="btn btn--danger btn--sm" onClick={() => onDelete(entry.id)}>
            Delete this entry
          </button>
        </footer>
      </div>
    </div>
  );
}
