
const mongoose = require('mongoose');

const AssignmentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: String,
  targetClass: String,
  targetSection: String,
  description: String,
});

module.exports = mongoose.model('Assignment', AssignmentSchema);
