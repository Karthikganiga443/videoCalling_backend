const mongoose = require("mongoose");

const meetingSchema = new mongoose.Schema({
  meetingId: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  host: { type: String, default: "anonymous" },
  participants: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Meeting", meetingSchema);
