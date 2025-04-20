const express = require("express");
const fs = require("fs");
const csv = require("csv-parser");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 5000;

// ✅ CORS Setup: Allow frontend from *.vercel.app
const allowedOrigins = [/\.vercel\.app$/];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.some(pattern =>
      pattern instanceof RegExp ? pattern.test(origin) : pattern === origin
    )) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  }
}));

app.use(express.json());

let diseaseData = [];

// ✅ Load CSV data into memory
fs.createReadStream("Disease_symptom_and_patient_profile_dataset.csv")
  .pipe(csv())
  .on("data", (row) => {
    diseaseData.push(row);
  })
  .on("end", () => {
    console.log("CSV loaded ✅");
  });

// ✅ Symptom weights for each disease
const symptomWeights = {
  asthma: {
    "wheezing": 3,
    "cough": 2,
    "shortness of breath": 3,
    "chest tightness": 2,
    "difficulty breathing": 3,
  },
  heartAttack: {
    "chest pain": 5,
    "shortness of breath": 4,
    "nausea": 3,
    "dizziness": 3,
    "pain in left arm": 4,
    "sweating": 4,
    "fatigue": 3,
  },
  anxiety: {
    "rapid heartbeat": 4,
    "sweating": 3,
    "trembling": 3,
    "shortness of breath": 3,
    "feeling of dread": 4,
    "difficulty concentrating": 2,
  },
  flu: {
    "fever": 3,
    "fatigue": 2,
    "body ache": 2,
    "headache": 2,
    "chills": 2,
    "cough": 3,
  },
  covid: {
    "fever": 3,
    "cough": 2,
    "shortness of breath": 4,
    "loss of taste": 3,
    "loss of smell": 3,
  },
  allergies: {
    "itchy eyes": 2,
    "sneezing": 3,
    "runny nose": 3,
    "congestion": 2,
  },
  foodPoisoning: {
    "nausea": 3,
    "vomiting": 3,
    "diarrhea": 3,
    "stomach cramps": 3,
  },
  migraine: {
    "headache": 4,
    "sensitivity to light": 3,
    "nausea": 3,
    "visual disturbances": 3,
  },
  dehydration: {
    "thirst": 2,
    "dry mouth": 2,
    "fatigue": 3,
    "dizziness": 3,
    "dark urine": 3,
  },
};

// ✅ API Route (Updated with symptom weights)
app.post("/api/symptoms", (req, res) => {
  const userSymptoms = req.body.symptoms.map(s => s.toLowerCase());
  const resultMap = {};

  diseaseData.forEach((entry) => {
    let matchCount = 0;

    // Iterate over all symptoms in the entry (disease profile)
    for (let symptom in entry) {
      if (symptom !== "Disease" && entry[symptom].toLowerCase() === "yes") {
        
        // Apply symptom weights if available
        if (symptomWeights[entry.Disease.toLowerCase()] && symptomWeights[entry.Disease.toLowerCase()][symptom.toLowerCase()]) {
          matchCount += symptomWeights[entry.Disease.toLowerCase()][symptom.toLowerCase()];
        } else {
          // Default weight (1) if no weight is defined
          matchCount++;
        }
      }
    }

    if (matchCount > 0) {
      const disease = entry.Disease;
      if (!resultMap[disease]) {
        resultMap[disease] = matchCount;
      } else {
        resultMap[disease] += matchCount;
      }
    }
  });

  const result = Object.entries(resultMap).map(([disease, matches]) => ({
    disease,
    matches,
  }));

  result.sort((a, b) => b.matches - a.matches);

  console.log("Backend result:", result);

  if (result.length === 0) {
    res.json({ message: "No diseases matched your symptoms." });
  } else {
    res.json(result.slice(0, 3)); // Top 3 diseases
  }
});

// ✅ Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} 🔥`);
});


