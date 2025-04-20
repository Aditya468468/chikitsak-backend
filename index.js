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

// ✅ API Route (Updated with grouping logic)
app.post("/api/symptoms", (req, res) => {
  const userSymptoms = req.body.symptoms.map(s => s.toLowerCase());
  const resultMap = {};

  diseaseData.forEach((entry) => {
    let matchCount = 0;
    for (let symptom in entry) {
      if (
        symptom !== "Disease" &&
        entry[symptom].toLowerCase() === "yes" &&
        userSymptoms.includes(symptom.toLowerCase())
      ) {
        matchCount++;
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

