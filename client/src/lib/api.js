// Tiny fetch wrapper around the Express API. Attaches the JWT and throws an
// Error (with .status) on non-2xx so callers can handle failures simply.
const BASE = "/api";

function getToken() {
  return localStorage.getItem("token");
}

async function request(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(BASE + path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Can't reach the server. Is the backend running?");
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* empty / non-JSON response */
  }

  if (!res.ok) {
    const err = new Error(data?.message || "Something went wrong.");
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const api = {
  register: (body) => request("/auth/register", { method: "POST", body, auth: false }),
  login: (body) => request("/auth/login", { method: "POST", body, auth: false }),
  getEntries: () => request("/entries"),
  getEntry: (id) => request(`/entries/${id}`),
  createEntry: (body) => request("/entries", { method: "POST", body }),
  deleteEntry: (id) => request(`/entries/${id}`, { method: "DELETE" }),
  detectEmotion: (text) => request("/entries/detect-emotion", { method: "POST", body: { text } }),
  calendar: (year, month) => request(`/entries/calendar/${year}/${month}`),
};
