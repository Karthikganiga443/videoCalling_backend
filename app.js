const express = require("express");
const cors = require("cors");
const meetingRoutes = require("./routes/meetingRoutes");

const app = express();

app.use(cors({
  origin: "https://video-calling-frontend-kappa.vercel.app",
  methods: ["GET", "POST"],
  credentials: true
}));

app.use(express.json());
app.use("/api/meetings", meetingRoutes);

app.get("/", (req, res) => {
  res.send("Backend running ✅");
});

module.exports = app;
