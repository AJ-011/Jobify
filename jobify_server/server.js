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

// --- Dynamic RAG: Function to select and load the correct rubric ---
function getRoleSpecificRubric(jobDescription) {
  const jd = jobDescription.toLowerCase();
  let rubricFile = 'backend_rubric.md'; // Default to backend

  // This is a simple but effective heuristic to determine the role.
  if (jd.includes('frontend') || jd.includes('ui/ux') || jd.includes('react') || jd.includes('angular') || jd.includes('vue')) {
    rubricFile = 'frontend_rubric.md';
  } else if (jd.includes('data scientist') || jd.includes('data analyst') || jd.includes('machine learning')) {
    rubricFile = 'data_science_rubric.md';
  } else if (jd.includes('devops') || jd.includes('sre') || jd.includes('infrastructure') || jd.includes('aws') || jd.includes('gcp') || jd.includes('azure')) {
    rubricFile = 'devops_rubric.md';
  }

  console.log(`Selected Rubric: ${rubricFile}`); // For debugging

  try {
    const rubricPath = path.join(__dirname, 'knowledge_base', rubricFile);
    return fs.readFileSync(rubricPath, 'utf-8');
  } catch (error) {
    console.error(`CRITICAL ERROR: Could not load the rubric file: ${rubricFile}`, error);
    return null;
  }
}

// --- Function to call the Gemini API (Now with Dynamic RAG!) ---
async function analyzeWithGemini(resumeText, jobDescription) {
    const apiKey = process.env.GEMINI_API_KEY;
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

    // Dynamic RAG Step 1: Select and load the role-specific expert knowledge
    const evaluationRubric = getRoleSpecificRubric(jobDescription);
    if (!evaluationRubric) {
      throw new Error("Internal Server Error: Missing or unreadable evaluation rubric.");
    }

    // Dynamic RAG Step 2: Augment the prompt with the selected rubric
    const prompt = `
        Act as a critical and direct hiring manager. Your analysis MUST be based *exclusively* on the provided Evaluation Rubric.

        ---EVALUATION RUBRIC (Your Guide)---
        ${evaluationRubric}
        ---END OF RUBRIC---

        Now, using that rubric as your strict guide, analyze the following resume against the job description.

        ---RESUME TEXT---
        ${resumeText}
        ---END OF RESUME---

        ---JOB DESCRIPTION---
        ${jobDescription}
        ---END OF JOB DESCRIPTION---

        Your response MUST be a single, valid JSON object with the exact same structure as the last request.
    `;

    const payload = {
        contents: [{ parts: [{ text: prompt }] }]
    };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error(`API call failed with status: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        const responseText = result.candidates[0].content.parts[0].text;
        const cleanedJsonString = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanedJsonString);

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw error;
    }
}

// 4. Define the API Endpoint for Analysis
app.post('/analyze', upload.single('resume'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No resume file uploaded.' });
        }
        const { jobDescription } = req.body;
        if (!jobDescription) {
             return res.status(400).json({ error: 'No job description provided.' });
        }

        const pdfData = await pdf(req.file.buffer);
        const resumeText = pdfData.text;

        const analysisResult = await analyzeWithGemini(resumeText, jobDescription);

        res.json(analysisResult);

    } catch (error) {
        console.error('Error during analysis:', error);
        if (error.message.includes("rubric")) {
            return res.status(500).json({ error: "Internal server configuration error." });
        }
        res.status(500).json({ error: 'Failed to analyze resume.' });
    }
});

// 5. Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
