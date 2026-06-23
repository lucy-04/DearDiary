import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api.js";
import { useToast } from "../context/ToastContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { MOOD_LIST, getMood } from "../lib/moods.js";
import EntryModal from "../components/EntryModal.jsx";

const today = () => new Date().toISOString().split("T")[0];
const shortDate = (d) =>
  new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });

export default function Write() {
  const toast = useToast();
  const { logout } = useAuth();
  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState({ title: "", content: "", entry_date: today() });
  const [mood, setMood] = useState(null); // chosen/detected mood key
  const [detecting, setDetecting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(null); // entry being read

  const loadEntries = async () => {
    try {
      const res = await api.getEntries();
      setEntries(res.data || []);
    } catch (err) {
      if (err.status === 401) return logout();
      toast(err.message, "error");
    }
  };

  useEffect(() => {
    loadEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const detect = async () => {
    if (form.content.trim().length < 10) {
      toast("Write a little more first — at least 10 characters.", "warning");
      return;
    }
    setDetecting(true);
    try {
      const res = await api.detectEmotion(form.content);
      const m = res.data.mood;
      setMood(m);
      toast(`Gemini felt this was ${getMood(m).label.toLowerCase()} ${getMood(m).emoji}`, "success");
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setDetecting(false);
    }
  };

  const save = async (e) => {
    e.preventDefault();
    if (form.content.trim().length < 10) {
      toast("An entry needs at least 10 characters.", "warning");
      return;
    }
    setSaving(true);
    try {
      // If no mood was picked, the backend asks Gemini on save.
      await api.createEntry({ ...form, mood: mood || undefined });
      setForm({ title: "", content: "", entry_date: today() });
      setMood(null);
      await loadEntries();
      toast("Saved. Tonight is remembered.", "success");
    } catch (err) {
      if (err.status === 401) return logout();
      toast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete this entry for good?")) return;
    try {
      await api.deleteEntry(id);
      setOpen(null);
      await loadEntries();
      toast("Entry deleted.", "success");
    } catch (err) {
      toast(err.message, "error");
    }
  };

  const stats = useMemo(() => computeStats(entries), [entries]);
  const recent = entries.slice(0, 6);

  return (
    <div className="write">
      <section className="composer card">
        <header className="composer__head">
          <p className="eyebrow">{new Date(form.entry_date + "T00:00").toLocaleDateString("en-US", { weekday: "long" })}</p>
          <h1 className="composer__title">What happened today?</h1>
        </header>

        <form className="composer__form" onSubmit={save}>
          <div className="composer__meta">
            <input
              className="input input--seam"
              name="title"
              value={form.title}
              onChange={onChange}
              placeholder="Give it a title (optional)"
              maxLength={200}
            />
            <input
              className="input input--seam input--date"
              type="date"
              name="entry_date"
              value={form.entry_date}
              max={today()}
              onChange={onChange}
            />
          </div>

          <textarea
            className="paper"
            name="content"
            value={form.content}
            onChange={onChange}
            placeholder="Dear diary…"
            rows={12}
          />

          <div className="composer__moods">
            {MOOD_LIST.map((key) => {
              const m = getMood(key);
              const active = mood === key;
              return (
                <button
                  type="button"
                  key={key}
                  className={`mood-pill${active ? " is-active" : ""}`}
                  style={{ "--mood": m.color }}
                  onClick={() => setMood(active ? null : key)}
                  aria-pressed={active}
                  title={m.label}
                >
                  <span className="mood-pill__emoji">{m.emoji}</span>
                  <span className="mood-pill__label">{m.label}</span>
                </button>
              );
            })}
          </div>

          <div className="composer__actions">
            <span className="char-count">{form.content.trim().length} characters</span>
            <div className="composer__buttons">
              <button
                type="button"
                className={`btn btn--ghost${detecting ? " is-thinking" : ""}`}
                onClick={detect}
                disabled={detecting}
              >
                {detecting ? "Gemini is reading…" : "Ask Gemini how this feels"}
              </button>
              <button className="btn btn--primary" disabled={saving}>
                {saving ? "Saving…" : "Save entry"}
              </button>
            </div>
          </div>
        </form>
      </section>

      <aside className="sidebar">
        <div className="card stats">
          <Stat label="Entries" value={stats.total} />
          <Stat label="Day streak" value={stats.streak} />
          <Stat
            label="Most felt"
            value={stats.topMood ? `${getMood(stats.topMood).emoji}` : "—"}
            sub={stats.topMood ? getMood(stats.topMood).label : "yet"}
          />
        </div>

        <div className="card recent">
          <h2 className="recent__title">Recent pages</h2>
          {recent.length === 0 ? (
            <p className="empty">Your diary is waiting for its first page.</p>
          ) : (
            <ul className="recent__list">
              {recent.map((entry) => {
                const m = getMood(entry.mood);
                return (
                  <li key={entry.id}>
                    <button className="recent__item" onClick={() => setOpen(entry)} style={{ "--mood": m.color }}>
                      <span className="recent__orb" aria-hidden="true">{m.emoji}</span>
                      <span className="recent__text">
                        <span className="recent__entry-title">{entry.title || "Untitled"}</span>
                        <span className="recent__preview">{entry.content}</span>
                      </span>
                      <span className="recent__date">{shortDate(entry.entry_date)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>

      {open && <EntryModal entry={open} onClose={() => setOpen(null)} onDelete={remove} />}
    </div>
  );
}

function Stat({ label, value, sub }) {
  return (
    <div className="stat">
      <span className="stat__value">{value}</span>
      <span className="stat__label">
        {label}
        {sub ? ` · ${sub}` : ""}
      </span>
    </div>
  );
}

function computeStats(entries) {
  const total = entries.length;

  const counts = {};
  entries.forEach((e) => {
    const m = (e.mood || "neutral").toLowerCase();
    counts[m] = (counts[m] || 0) + 1;
  });
  const topMood = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

  // Streak: consecutive days up to today that have an entry.
  const days = new Set(entries.map((e) => e.entry_date.split("T")[0]));
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  while (days.has(cursor.toISOString().split("T")[0])) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return { total, topMood, streak };
}
