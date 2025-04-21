const { NlpManager } = require('node-nlp');

const manager = new NlpManager({ languages: ['en'], forceNER: true });

// Add symptom patterns (add more as needed)
manager.addDocument('en', 'I have a headache', 'symptom.headache');
manager.addDocument('en', 'my head hurts', 'symptom.headache');
manager.addDocument('en', 'sore throat', 'symptom.sore_throat');
manager.addDocument('en', 'I feel dizzy', 'symptom.dizziness');
manager.addDocument('en', 'I have a fever', 'symptom.fever');

// Train once when the app starts
const trainNLP = async () => {
  await manager.train();
  manager.save();
};

const getSymptomIntent = async (text) => {
  const response = await manager.process('en', text);
  return response.classifications
    .filter((c) => c.score > 0.3)
    .map((c) => c.intent.replace('symptom.', ''));
};

module.exports = { trainNLP, getSymptomIntent };
