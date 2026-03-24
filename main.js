
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");

const app = express();
const port = process.env.PORT || 3000;

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Hello World! Backend Running 😊");
});

// OpenRouter Client
const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

console.log("API KEY:", process.env.OPENROUTER_API_KEY);

// simple cache
const travelPlanCache = {};

// Function to generate AI content
const generateContent = async (prompt, previousMessages = []) => {
  const cacheKey = JSON.stringify({ prompt, previousMessages });

  if (travelPlanCache[cacheKey]) {
    console.log("✅ Using cached result");
    return travelPlanCache[cacheKey];
  }

  const models = [
    "nvidia/nemotron-3-nano-30b-a3b:free",
    "minimax/minimax-m2.5:free",
    "stepfun-ai/step-3.5-flash:free",
    "arcee-ai/trinity-mini:free",
  ];

  const messages = [
    ...previousMessages,
    {
      role: "user",
      content: prompt,
    },
  ];

  for (let model of models) {
    try {
      console.log(`⚡ Trying model: ${model}`);

      const apiResponse = await client.chat.completions.create({
        model,
        messages,
      });

      const assistantMessage = apiResponse?.choices?.[0]?.message;

      if (!assistantMessage) {
        throw new Error("Invalid response from OpenRouter");
      }

      const result = {
        content: assistantMessage.content,
        reasoning_details: assistantMessage.reasoning_details || null,
      };

      travelPlanCache[cacheKey] = result;

      console.log(`✅ Success using model: ${model}`);

      return result;
    } catch (err) {
      console.log(`❌ Model failed: ${model}`);
      console.log(err.message);

      if (model === models[models.length - 1]) {
        throw err;
      }
    }
  }
};

// API endpoint
app.post("/api/content", async (req, res) => {
  try {
    const { question, previousMessages } = req.body;

    if (!question) {
      return res.status(400).json({
        error: "'question' is required",
      });
    }

    const result = await generateContent(question, previousMessages || []);

    res.json({ result });
  } catch (err) {
    console.error("❌ SERVER ERROR:", err);

    res.status(500).json({
      error: "Failed to generate content",
      details: err.message,
    });
  }
});

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
