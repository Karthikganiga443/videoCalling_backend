const express = require("express");
const cors = require("cors");
const meetingRoutes = require("./routes/meetingRoutes");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/meetings", meetingRoutes);

// serve client folder
app.use(express.static("../client"));

module.exports = app;
