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

// ✅ API Route
app.post("/api/symptoms", (req, res) => {
  const userSymptoms = req.body.symptoms.map(s => s.toLowerCase());
  const result = [];

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
      result.push({
        disease: entry.Disease,
        matches: matchCount,
      });
    }
  });

  // ✅ Sort and return top 3 matches
  result.sort((a, b) => b.matches - a.matches);
  res.json(result.slice(0, 3));
});

// ✅ Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} 🔥`);
});
