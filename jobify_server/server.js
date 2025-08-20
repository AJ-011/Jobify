// server.js

// 1. Import required packages
const express = require('express');
const multer = require('multer');
const pdf = require('pdf-parse');
const cors = require('cors');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// 2. Initialize Express app
const app = express();
const port = 3001;

// 3. Configure Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


// --- Weighted Keyword Scoring for Rubric Selection ---
const rubricKeywords = {
  backend: { file: 'backend_rubric.md', score: 0, keywords: { 'software engineer': 15, 'backend': 10, 'api': 5, 'database': 5, 'python': 3, 'java': 3, 'node.js': 3, 'scalability': 8, 'microservices': 8, 'sql': 4, 'nosql': 4, 'server-side': 7 } },
  frontend: { file: 'frontend_rubric.md', score: 0, keywords: { 'frontend': 10, 'react': 8, 'angular': 8, 'vue': 8, 'javascript': 4, 'css': 5, 'ui/ux': 5, 'typescript': 4, 'html': 3, 'user interface': 6 } },
  data_science: { file: 'data_science_rubric.md', score: 0, keywords: { 'data scientist': 10, 'data analyst': 10, 'machine learning': 9, 'python': 5, ' r ': 5, 'pandas': 7, 'numpy': 6, 'scikit-learn': 7, 'tensorflow': 7, 'pytorch': 7, 'sql': 3, 'statistics': 6 } },
  devops: { file: 'devops_rubric.md', score: 0, keywords: { 'devops': 10, 'sre': 10, 'aws': 7, 'gcp': 7, 'azure': 7, 'docker': 8, 'kubernetes': 9, 'ci/cd': 8, 'terraform': 8, 'infrastructure': 6 } }
};

function getRoleSpecificRubric(jobDescription) {
  const jd = jobDescription.toLowerCase();
  
  let scores = {};
  for (const role in rubricKeywords) {
    scores[role] = 0;
    for (const keyword in rubricKeywords[role].keywords) {
      const occurrences = (jd.match(new RegExp(`\\b${keyword.replace('.', '\\.')}\\b`, 'g')) || []).length;
      if (occurrences > 0) {
        scores[role] += rubricKeywords[role].keywords[keyword] * occurrences;
      }
    }
  }

  let bestRole = 'backend';
  let maxScore = 0;
  for (const role in scores) {
    if (scores[role] > maxScore) {
      maxScore = scores[role];
      bestRole = role;
    }
  }

  const selectedRubricFile = maxScore > 0 ? rubricKeywords[bestRole].file : 'backend_rubric.md';
  console.log(`Selected Rubric: ${selectedRubricFile} (Scores: ${JSON.stringify(scores)})`);

  try {
    const rubricPath = path.join(__dirname, 'knowledge_base', selectedRubricFile);
    return fs.readFileSync(rubricPath, 'utf-8');
  } catch (error) {
    console.error(`CRITICAL ERROR: Could not load the rubric file: ${selectedRubricFile}`, error);
    return null;
  }
}


async function analyzeWithGemini(resumeText, jobDescription) {
    const apiKey = process.env.GEMINI_API_KEY;
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

    const evaluationRubric = getRoleSpecificRubric(jobDescription);
    if (!evaluationRubric) {
      throw new Error("Internal Server Error: Missing or unreadable evaluation rubric.");
    }

    const prompt = `
        Act as a critical and direct hiring manager. Your analysis MUST be based *exclusively* on the provided Evaluation Rubric.
        Analyze the following resume against the job description.

        ---EVALUATION RUBRIC---
        ${evaluationRubric}
        ---END OF RUBRIC---

        ---DATA TO ANALYZE---
        Resume: ${resumeText}
        Job Description: ${jobDescription}
        ---END OF DATA---
    `;

    // --- NEW: Define the JSON Schema for Structured Output ---
    const responseSchema = {
      type: "OBJECT",
      properties: {
        "overallVerdict": { "type": "STRING" },
        "matchScore": { "type": "NUMBER" },
        "atsAnalysis": {
          "type": "OBJECT",
          "properties": {
            "keywordsFound": { "type": "ARRAY", "items": { "type": "STRING" } },
            "keywordsMissing": { "type": "ARRAY", "items": { "type": "STRING" } }
          }
        },
        "feedbackOnStrengths": {
          "type": "ARRAY",
          "items": {
            "type": "OBJECT",
            "properties": {
              "skill": { "type": "STRING" },
              "feedback": { "type": "STRING" }
            }
          }
        },
        "criticalImprovementAreas": {
          "type": "ARRAY",
          "items": {
            "type": "OBJECT",
            "properties": {
              "area": { "type": "STRING" },
              "feedback": { "type": "STRING" }
            }
          }
        }
      }
    };

    const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: responseSchema,
        },
    };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error("API Error Response:", errorBody);
            throw new Error(`API call failed with status: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        const responseText = result.candidates[0].content.parts[0].text;
        
        // With structured output, the responseText is guaranteed to be a valid JSON string.
        return JSON.parse(responseText);

    } catch (error) {
        console.error("Error in analyzeWithGemini:", error);
        throw error;
    }
}

app.post('/analyze', upload.single('resume'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No resume file uploaded.' });
        const { jobDescription } = req.body;
        if (!jobDescription) return res.status(400).json({ error: 'No job description provided.' });

        const pdfData = await pdf(req.file.buffer);
        const analysisResult = await analyzeWithGemini(pdfData.text, jobDescription);
        
        res.json(analysisResult);

    } catch (error) {
        console.error('Error during analysis:', error.message);
        res.status(500).json({ error: 'An error occurred during analysis.' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
