const express = require('express');
const router = express.Router();
const { getSymptomIntent } = require('../nlpProcessor');

router.post('/checkSymptoms', async (req, res) => {
  const { userInput } = req.body;
  if (!userInput) return res.status(400).json({ error: 'No input provided' });

  try {
    const matchedSymptoms = await getSymptomIntent(userInput);
    res.json({ matchedSymptoms });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to process input' });
  }
});

module.exports = router;
