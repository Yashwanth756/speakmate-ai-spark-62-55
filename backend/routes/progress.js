
const express = require('express');
const Progress = require('../models/Progress');
const router = express.Router();

router.get('/', async (req, res) => {
  const progress = await Progress.find();
  res.json(progress);
});

router.post('/', async (req, res) => {
  const progress = new Progress(req.body);
  await progress.save();
  res.status(201).json(progress);
});

// Add PUT, DELETE as needed

module.exports = router;
