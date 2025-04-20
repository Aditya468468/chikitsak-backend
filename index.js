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

// ✅ Load cleaned CSV data into memory
fs.createReadStream("cleaned_symptom_disease_dataset.csv")
  .pipe(csv())
  .on("data", (row) => {
    diseaseData.push(row);
  })
  .on("end", () => {
    console.log("CSV loaded ✅");
  });

// ✅ Symptom weights (optional, modify as needed)
const symptomWeights = {
  asthma: {
    "wheezing": 3,
    "cough": 2,
    "shortness_of_breath": 3,
    "chest_tightness": 2,
    "difficulty_breathing": 3,
  },
  heartattack: {
    "chest_pain": 5,
    "shortness_of_breath": 4,
    "nausea": 3,
    "dizziness": 3,
    "pain_in_left_arm": 4,
    "sweating": 4,
    "fatigue": 3,
  },
  flu: {
    "fever": 3,
    "fatigue": 2,
    "body_ache": 2,
    "headache": 2,
    "chills": 2,
    "cough": 3,
  },
  covid: {
    "fever": 3,
    "cough": 2,
    "shortness_of_breath": 4,
    "loss_of_taste": 3,
    "loss_of_smell": 3,
  },
  anxiety: {
    "rapid_heartbeat": 4,
    "sweating": 3,
    "trembling": 3,
    "shortness_of_breath": 3,
    "feeling_of_dread": 4,
    "difficulty_concentrating": 2,
  },
  allergies: {
    "itchy_eyes": 2,
    "sneezing": 3,
    "runny_nose": 3,
    "congestion": 2,
  },
  foodpoisoning: {
    "nausea": 3,
    "vomiting": 3,
    "diarrhea": 3,
    "stomach_cramps": 3,
  },
  migraine: {
    "headache": 4,
    "sensitivity_to_light": 3,
    "nausea": 3,
    "visual_disturbances": 3,
  },
  dehydration: {
    "thirst": 2,
    "dry_mouth": 2,
    "fatigue": 3,
    "dizziness": 3,
    "dark_urine": 3,
  },
  legpain: {
    "leg_pain": 5,
    "swelling": 4,
    "bruising": 3,
    "pain_when_walking": 4,
    "numbness": 3,
  }
};

// ✅ POST endpoint to get matching diseases
app.post("/api/symptoms", (req, res) => {
  const userSymptoms = req.body.symptoms.map(s => s.toLowerCase().replace(/ /g, "_"));
  const resultMap = {};

  diseaseData.forEach(entry => {
    const disease = entry.Disease;
    const symptoms = JSON.parse(entry.All_Symptoms.replace(/'/g, '"'));

    let matchCount = 0;

    userSymptoms.forEach(symptom => {
      if (symptoms.includes(symptom)) {
        const weights = symptomWeights[disease.toLowerCase().replace(/ /g, "")];
        if (weights && weights[symptom]) {
          matchCount += weights[symptom];
        } else {
          matchCount++;
        }
      }
    });

    if (matchCount > 0) {
      resultMap[disease] = matchCount;
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
    res.json(result.slice(0, 3)); // Return top 3 diseases
  }
});

// ✅ Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} 🔥`);
});
