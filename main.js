require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
const port = process.env.PORT || 3000;

app.use(
  cors({
    // origin: [
    //   "https://trip-planer-frontend.vercel.app",
    //   "http://localhost:5174",
    // ],
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Hello World! Backend Running!!.😊");
});

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// Simple cache to avoid duplicate API calls
const travelPlanCache = {}; // { prompt: result }

// Function to call OpenRouter API
const generateContent = async (prompt, previousMessages = []) => {
  const cacheKey = JSON.stringify({ prompt, previousMessages });
  if (travelPlanCache[cacheKey]) {
    console.log("✅ Using cached content");
    return travelPlanCache[cacheKey];
  }

  const messages = [
    ...previousMessages,
    {
      role: "user",
      content: prompt,
    },
  ];

  try {
    const res = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "xiaomi/mimo-v2-flash:free", // Use your chosen model
        messages,
        reasoning: { enabled: true },
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const assistantMessage = res.data.choices[0].message;

    const result = {
      content: assistantMessage.content,
      reasoning_details: assistantMessage.reasoning_details || null,
    };

    travelPlanCache[cacheKey] = result;
    return result;
  } catch (err) {
    console.error(
      "❌ OpenRouter API error:",
      err.response?.data || err.message
    );
    throw err;
  }
};

// API endpoint
app.post("/api/content", async (req, res) => {
  try {
    const { question, previousMessages } = req.body;
    if (!question)
      return res.status(400).json({ error: "'question' is required." });

    const result = await generateContent(question, previousMessages || []);
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: "Failed to generate content" });
  }
});

app.listen(port, () => console.log(`Server running on port ${port}`));
