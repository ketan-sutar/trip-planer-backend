const express = require("express");
const router = express.Router();
const TravelPlan = require("../models/TravelPlan");

// POST route to store travel plan
router.post("/add", async (req, res) => {
  // console.log("Received POST /add with body:", req.body);
  try {
    const travelPlan = new TravelPlan(req.body);
    await travelPlan.save();
    res.status(201).json({ message: "Travel plan saved successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET all plansy
router.get("/", async (req, res) => {
  try {
    const plans = await TravelPlan.find();
    res.json(plans);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
