import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api.js";
import { useToast } from "../context/ToastContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { getMood } from "../lib/moods.js";
import EntryModal from "../components/EntryModal.jsx";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function Calendar() {
  const toast = useToast();
  const { logout } = useAuth();
  const now = new Date();
  const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() }); // month 0-11
  const [rows, setRows] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [open, setOpen] = useState(null);

  const load = async () => {
    try {
      const res = await api.calendar(cursor.year, cursor.month + 1);
      setRows(res.data || []);
      setSelectedDay(null);
    } catch (err) {
      if (err.status === 401) return logout();
      toast(err.message, "error");
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursor.year, cursor.month]);

  // Map day-of-month → entries for that day.
  const byDay = useMemo(() => {
    const map = {};
    rows.forEach((r) => {
      const day = parseInt(r.entry_date.slice(8, 10), 10);
      (map[day] = map[day] || []).push(r);
    });
    return map;
  }, [rows]);

  const firstWeekday = new Date(cursor.year, cursor.month, 1).getDay();
  const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
  const cells = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  const move = (delta) => {
    setCursor((c) => {
      const d = new Date(c.year, c.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  const isToday = (day) =>
    day === now.getDate() && cursor.month === now.getMonth() && cursor.year === now.getFullYear();

  const readEntry = async (id) => {
    try {
      const res = await api.getEntry(id);
      if (res.data) setOpen(res.data);
    } catch (err) {
      toast(err.message, "error");
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete this entry for good?")) return;
    try {
      await api.deleteEntry(id);
      setOpen(null);
      await load();
      toast("Entry deleted.", "success");
    } catch (err) {
      toast(err.message, "error");
    }
  };

  const selectedEntries = selectedDay ? byDay[selectedDay] || [] : [];

  return (
    <div className="calendar-view">
      <section className="card calendar">
        <header className="calendar__head">
          <div>
            <p className="eyebrow">Your month in moods</p>
            <h1 className="calendar__title">
              {MONTHS[cursor.month]} <span className="calendar__year">{cursor.year}</span>
            </h1>
          </div>
          <div className="calendar__nav">
            <button className="icon-btn" onClick={() => move(-1)} aria-label="Previous month">‹</button>
            <button className="btn btn--ghost btn--sm" onClick={() => setCursor({ year: now.getFullYear(), month: now.getMonth() })}>
              Today
            </button>
            <button className="icon-btn" onClick={() => move(1)} aria-label="Next month">›</button>
          </div>
        </header>

        <div className="calendar__weekdays">
          {WEEKDAYS.map((d) => (
            <span key={d} className="calendar__weekday">{d}</span>
          ))}
        </div>

        <div className="calendar__grid">
          {cells.map((day, i) => {
            if (day === null) return <span key={`b${i}`} className="cal-cell cal-cell--blank" />;
            const entries = byDay[day];
            const mood = entries ? getMood(entries[0].mood) : null;
            return (
              <button
                key={day}
                className={`cal-cell${entries ? " has-entry" : ""}${isToday(day) ? " is-today" : ""}${selectedDay === day ? " is-selected" : ""}`}
                style={mood ? { "--mood": mood.color } : undefined}
                onClick={() => entries && setSelectedDay(day)}
                disabled={!entries}
              >
                <span className="cal-cell__num">{day}</span>
                {mood && (
                  <span className="cal-cell__orb" aria-hidden="true">
                    {mood.emoji}
                  </span>
                )}
                {entries && entries.length > 1 && (
                  <span className="cal-cell__count">{entries.length}</span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <aside className="card day-panel">
        {!selectedDay ? (
          <div className="day-panel__empty">
            <span className="day-panel__glyph">✶</span>
            <p>Tap a glowing day to revisit it.</p>
          </div>
        ) : (
          <>
            <h2 className="day-panel__title">
              {MONTHS[cursor.month]} {selectedDay}
            </h2>
            <ul className="day-panel__list">
              {selectedEntries.map((e) => {
                const m = getMood(e.mood);
                return (
                  <li key={e.id}>
                    <button className="day-entry" style={{ "--mood": m.color }} onClick={() => readEntry(e.id)}>
                      <span className="day-entry__orb">{m.emoji}</span>
                      <span className="day-entry__title">{e.title || "Untitled"}</span>
                      <span className="day-entry__mood">{m.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </aside>

      {open && <EntryModal entry={open} onClose={() => setOpen(null)} onDelete={remove} />}
    </div>
  );
}
