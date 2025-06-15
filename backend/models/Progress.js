
const mongoose = require('mongoose');

const ProgressSchema = new mongoose.Schema({
  assignmentId: { type: String, required: true },
  studentId: { type: String, required: true },
  status: { type: String, enum: ["pending", "in-progress", "completed"], default: "pending" },
  bestScore: { type: Number, default: 0 },
  timeSpent: { type: Number, default: 0 }, // in minutes
});

module.exports = mongoose.model('Progress', ProgressSchema);
