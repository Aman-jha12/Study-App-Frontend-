// src/api.js
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

// Get today's study time
export async function getToday(date) {
  const res = await fetch(`${API_BASE}/api/study-time/${date}`);
  return res.json();
}

// Add a study session
export async function addSession(date, seconds) {
  const res = await fetch(`${API_BASE}/api/study-time`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ date, seconds }),
  });
  return res.json();
}

// Get weekly report
export async function getWeeklyReport() {
  const res = await fetch(`${API_BASE}/api/weekly-report`);
  return res.json();
}
