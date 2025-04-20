const express = require("express");
const fs = require("fs");
const csv = require("csv-parser");
const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

let diseaseData = [];

// Load CSV data into memory
fs.createReadStream("Disease_symptom_and_patient_profile_dataset.csv")
  .pipe(csv())
  .on("data", (row) => {
    diseaseData.push(row);
  })
  .on("end", () => {
    console.log("CSV loaded ✅");
  });

app.post("/api/symptoms", (req, res) => {
  const userSymptoms = req.body.symptoms.map(s => s.toLowerCase());
  const result = [];

  diseaseData.forEach((entry) => {
    let matchCount = 0;
    for (let symptom in entry) {
      if (symptom !== "Disease" && entry[symptom].toLowerCase() === "yes" && userSymptoms.includes(symptom.toLowerCase())) {
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

  // Sort by highest matches
  result.sort((a, b) => b.matches - a.matches);

  res.json(result.slice(0, 3)); // Return top 3
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} 🔥`);
});
