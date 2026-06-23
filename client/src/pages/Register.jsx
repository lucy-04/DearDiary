import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { REPO_URL } from "../lib/config.js";

export default function Register() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await register(form);
      navigate("/");
    } catch (err) {
      const detail = err.data?.errors?.[0]?.msg;
      toast(detail || err.message || "Couldn't create your account.", "error");
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <div className="auth__aurora" aria-hidden="true" />

      <aside className="auth__poem">
        <span className="brand-mark brand-mark--lg">✶</span>
        <p className="auth__quote">
          A year from now,
          <br />
          you'll want to remember tonight.
        </p>
        <p className="auth__sig">— Dear Diary</p>
      </aside>

      <main className="auth__panel">
        <p className="eyebrow">First page</p>
        <h1 className="auth__title">Begin a diary that remembers how you felt.</h1>

        <form className="form" onSubmit={onSubmit}>
          <label className="field">
            <span className="field__label">Username</span>
            <input
              className="input"
              name="username"
              value={form.username}
              onChange={onChange}
              placeholder="3–10 characters"
              minLength={3}
              maxLength={10}
              required
            />
          </label>

          <label className="field">
            <span className="field__label">Email</span>
            <input
              className="input"
              type="email"
              name="email"
              value={form.email}
              onChange={onChange}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </label>

          <label className="field">
            <span className="field__label">Password</span>
            <input
              className="input"
              type="password"
              name="password"
              value={form.password}
              onChange={onChange}
              placeholder="At least 6 characters"
              minLength={6}
              autoComplete="new-password"
              required
            />
          </label>

          <button className="btn btn--primary btn--block" disabled={busy}>
            {busy ? "Creating…" : "Create my diary"}
          </button>
        </form>

        <p className="auth__switch">
          Already have one? <Link to="/login">Sign in</Link>
        </p>
        <a className="auth__repo" href={REPO_URL} target="_blank" rel="noopener noreferrer">
          View source on GitHub ↗
        </a>
      </main>
    </div>
  );
}
