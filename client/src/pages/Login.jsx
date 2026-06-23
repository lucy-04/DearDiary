import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { REPO_URL } from "../lib/config.js";

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [busy, setBusy] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await login(form);
      navigate("/");
    } catch (err) {
      toast(err.message || "Couldn't sign you in.", "error");
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <div className="auth__aurora" aria-hidden="true" />

      <aside className="auth__poem">
        <span className="brand-mark brand-mark--lg">✶</span>
        <p className="auth__quote">
          Some nights are too full to keep inside.
          <br />
          Leave them here.
        </p>
        <p className="auth__sig">— Dear Diary</p>
      </aside>

      <main className="auth__panel">
        <p className="eyebrow">Welcome back</p>
        <h1 className="auth__title">Pick up where your heart left off.</h1>

        <form className="form" onSubmit={onSubmit}>
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
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </label>

          <button className="btn btn--primary btn--block" disabled={busy}>
            {busy ? "Opening…" : "Open my diary"}
          </button>
        </form>

        <p className="auth__switch">
          New here? <Link to="/register">Start your first page</Link>
        </p>
        <a className="auth__repo" href={REPO_URL} target="_blank" rel="noopener noreferrer">
          View source on GitHub ↗
        </a>
      </main>
    </div>
  );
}
