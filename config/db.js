const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect("mongodb+srv://karthikganiga461:Karthik90711@karthik.4vhiagc.mongodb.net/video_calling_web_application?retryWrites=true&w=majority&appName=karthik");
    console.log("Mongo connected");
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
};

module.exports = connectDB;
