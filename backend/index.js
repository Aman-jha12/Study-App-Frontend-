// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const Study = require("./models/Study");

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("Missing MONGO_URI in env");
  process.exit(1);
}

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// Save session seconds to a date (adds to total, atomic)
app.post("/api/study-time", async (req, res) => {
  try {
    const { date, seconds } = req.body;
    if (!date || typeof seconds !== "number") {
      return res.status(400).json({ message: "date and seconds required" });
    }

    const updated = await Study.findOneAndUpdate(
      { date },
      { $inc: { totalSeconds: seconds } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get total for a specific date
app.get("/api/study-time/:date", async (req, res) => {
  try {
    const { date } = req.params;
    const doc = await Study.findOne({ date });
    res.json(doc || { date, totalSeconds: 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Weekly report: last 7 days including today
app.get("/api/weekly-report", async (req, res) => {
  try {
    const today = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(today.getDate() - 6);

    const startDate = weekAgo.toISOString().split("T")[0];
    const endDate = today.toISOString().split("T")[0];

    const docs = await Study.find({
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });

    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const doc = docs.find(x => x.date === dateStr);
      result.push({
        date: dateStr,
        totalSeconds: doc ? doc.totalSeconds : 0
      });
    }

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/", (req, res) => res.send("Study Tracker API is running"));

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
