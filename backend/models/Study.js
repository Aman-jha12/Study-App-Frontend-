const mongoose = require("mongoose");

const studySchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true },
  totalSeconds: { type: Number, default: 0 }
});

module.exports = mongoose.model("Study", studySchema);
