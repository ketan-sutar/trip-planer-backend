const mongoose = require('mongoose');

const PlaceSchema = new mongoose.Schema({
  name: String,
  desc: String,
  img: String,
  coords: String,
  ticket: String,
  rating: Number,
  travel_time: String,
  best_time: String,
});

const ItineraryDaySchema = new mongoose.Schema({
  day: Number,
  places: [PlaceSchema],
});

const HotelSchema = new mongoose.Schema({
  name: String,
  addr: String,
  price: String,
  img: String,
  coords: String,
  rating: Number,
});

const TravelPlanSchema = new mongoose.Schema({
  destination: String,
  days: Number,
  groupType: String,
  budgetType: String,
  hotels: [HotelSchema],
  itinerary: [ItineraryDaySchema],
});

module.exports = mongoose.model('TravelPlan', TravelPlanSchema);
