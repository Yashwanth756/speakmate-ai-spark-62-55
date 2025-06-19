
const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // username or uniqueId
  name: { type: String, required: true },
  class: { type: String, required: true },
  section: { type: String, required: true },
});

module.exports = mongoose.model('Student', StudentSchema);
