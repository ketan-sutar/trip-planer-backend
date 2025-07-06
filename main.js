const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser"); // Already included, good!
const cors = require("cors");


const travelRoutes = require("./routes/travelRoutes"); // Assuming you have a travelRoutes.js file for handling travel plans

const app = express();
const port = process.env.PORT || 3000;
app.use(cors({ origin: "http://localhost:5173" }));

app.use((req, res, next) => {
  // console.log(`Incoming request: ${req.method} ${req.url}`);
  next();
});


// Middleware for parsing request bodies
app.use(bodyParser.json());
app.use(express.json()); // Redundant if bodyParser.json() is used, but doesn't hurt.
app.use(express.urlencoded({ extended: true })); // Good for handling URL-encoded bodies

// ---
// Routes
// ---

app.get("/", (req, res) => {
  res.send("Hello World!");
});

// ---
// Gemini API Configuration
// ---

// Ensure your .env file has API_KEY, not GEMINI_API_KEY if you changed it.
// It's good practice to stick to one variable name, e.g., GEMINI_API_KEY.
const gemini_api_key = process.env.GEMINI_API_KEY; // Using GEMINI_API_KEY as per your .env example
const googleAI = new GoogleGenerativeAI(gemini_api_key);

// Initialize the model once.
// 'gemini-1.5-flash' is a valid model name if you have access to it.
// If you encounter issues, try 'gemini-pro'.
const geminiModel = googleAI.getGenerativeModel({
  // model: "gemini-1.5-flash",
  model: "gemini-2.5-flash-preview-05-20",
});

// ---
// AI Content Generation Function
// ---

const generate = async (question) => {
  try {
    // The generateContent method expects an array of parts, even for a single text prompt.
    const result = await geminiModel.generateContent([{ text: question }]);
    const response = result.response;

    // Check if response and its text method exist
    if (response && typeof response.text === "function") {
      let generatedText = await response.text();
      generatedText = generatedText
        .replace(/```(?:json)?\s*/g, "")
        .replace(/```$/, "");

      // const generatedText = response.json()

      try {
        const jsonResponse = JSON.parse(generatedText);
        return jsonResponse;
      } catch (e) {
        return {
          response: generatedText,
          metadata: {
            model: geminiModel.model,
            prompt: question,
            timestamp: new Date().toISOString(),
          },
        };
      }

      // console.log("Generated text (console log for server):", generatedText);
      return generatedText;
    } else {
      console.error(
        "Gemini API response did not contain expected text method:",
        response
      );
      throw new Error("Invalid Gemini API response structure.");
    }
  } catch (error) {
    // Log the error for server-side debugging
    console.error("Error generating content from Gemini API:", error);
    // Re-throw the error so the Express route can catch it and send an appropriate response
    throw error;
  }
};

//  routes part here

// ---
// API Endpoint for Content Generation
// ---

app.post("/api/content", async (req, res) => {
  try {
    const question = req.body.question; // Get the question from the request body

    if (!question) {
      // Send a 400 Bad Request if 'question' is missing
      return res.status(400).json({
        error: "Bad Request: 'question' is required in the request body.",
      });
    }

    const result = await generate(question);
    // console.log("Result being sent to client:", result); // Log the final result

    // Send the generated result as JSON
    res.json({ result: result });
  } catch (error) {
    // Catch any errors thrown by the 'generate' function
    console.error("Error in /api/content route:", error);
    res
      .status(500)
      .json({ error: "Internal Server Error during content generation." });
  }
});

// ---
// Start Server
// ---


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
