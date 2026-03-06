const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    title: { type: String, required: true, trim: true },

    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },

    dueDate: { type: Date, default: null },

    status: { type: String, enum: ["todo", "progress", "done"], default: "todo" },

    completed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Task", TaskSchema);