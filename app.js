const express = require("express");
const cors = require("cors");
const meetingRoutes = require("./routes/meetingRoutes");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/meetings", meetingRoutes);
app.use(express.static("../client"));

module.exports = app;
