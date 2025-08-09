// src/App.jsx
import React, { useState, useRef, useEffect } from "react";
import { getToday, addSession, getWeeklyReport } from "./api";

function formatTime(seconds) {
  const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function App() {
  const today = new Date().toISOString().split("T")[0];
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [weekly, setWeekly] = useState([]);
  const timerRef = useRef(null);
  const startTimestampRef = useRef(null);

  // Load today's total from backend
  useEffect(() => {
    getToday(today).then((data) => {
      setTotalSeconds(data.totalSeconds || 0);
    });
  }, [today]);

  const start = () => {
    if (isRunning) return;
    setIsRunning(true);
    startTimestampRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setSessionSeconds(Math.floor((Date.now() - startTimestampRef.current) / 1000));
    }, 1000);
  };

  const stop = async () => {
    if (!isRunning) return;
    clearInterval(timerRef.current);
    setIsRunning(false);

    const secondsToAdd = sessionSeconds;
    setSessionSeconds(0);

    try {
      const updated = await addSession(today, secondsToAdd);
      if (updated.totalSeconds !== undefined) {
        setTotalSeconds(updated.totalSeconds);
      } else {
        setTotalSeconds((prev) => prev + secondsToAdd);
      }
    } catch (err) {
      console.error("Failed to save session:", err);
    }
  };

  const resetToday = () => {
    if (!window.confirm("This only resets the UI. To reset the DB, delete the record in MongoDB.")) return;
    setTotalSeconds(0);
  };

  const loadWeekly = async () => {
    const report = await getWeeklyReport();
    setWeekly(report);
  };

  return (
    <div style={{ fontFamily: "Arial", textAlign: "center", marginTop: 40 }}>
      <h1>📚 Study Timer</h1>

      <div style={{ margin: "20px 0" }}>
        <h2>Today's Total: {formatTime(totalSeconds)}</h2>
        <h3>Current Session: {formatTime(sessionSeconds)}</h3>
      </div>

      <div>
        <button onClick={start} disabled={isRunning} style={{ marginRight: 8, padding: "8px 16px" }}>
          Start
        </button>
        <button onClick={stop} disabled={!isRunning} style={{ marginRight: 8, padding: "8px 16px" }}>
          Stop
        </button>
        <button onClick={resetToday} style={{ padding: "8px 16px" }}>
          Reset Today (UI)
        </button>
      </div>

      <hr style={{ margin: "30px 0" }} />

      <div>
        <button onClick={loadWeekly} style={{ padding: "8px 16px" }}>
          📅 Load Weekly Report
        </button>

        {weekly.length > 0 && (
          <table style={{ margin: "20px auto", borderCollapse: "collapse" }} border="1">
            <thead>
              <tr>
                <th style={{ padding: 8 }}>Date</th>
                <th style={{ padding: 8 }}>Hours</th>
              </tr>
            </thead>
            <tbody>
              {weekly.map((day) => (
                <tr key={day.date}>
                  <td style={{ padding: 8 }}>{day.date}</td>
                  <td style={{ padding: 8 }}>{(day.totalSeconds / 3600).toFixed(2)} hrs</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default App;
