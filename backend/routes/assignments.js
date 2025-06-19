
const express = require('express');
const Assignment = require('../models/Assignment');
const router = express.Router();

router.get('/', async (req, res) => {
  const assignments = await Assignment.find();
  res.json(assignments);
});

router.post('/', async (req, res) => {
  const assignment = new Assignment(req.body);
  await assignment.save();
  res.status(201).json(assignment);
});

// Add PUT, DELETE as needed

module.exports = router;
