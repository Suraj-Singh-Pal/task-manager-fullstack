const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const cron = require("node-cron");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const taskRoutes = require("./routes/taskRoutes");
const sendDueReminders = require("./utils/sendDueReminders");

const app = express();

// Middleware
app.use(
  cors({
    origin: "*",
  })
);
app.use(express.json());

// Routes
app.get("/", (req, res) => {
  res.json({ message: "Task Manager API is running ✅" });
});

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);

const PORT = process.env.PORT || 5000;

// Connect DB + start server
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");

    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });

    // Run once when server starts
    sendDueReminders();

    // Run every day at 9:00 AM
    cron.schedule("0 9 * * *", async () => {
      console.log("⏰ Running daily reminder job...");
      await sendDueReminders();
    });
  })
  .catch((err) => {
    console.log("❌ MongoDB connection error:", err.message);
  });