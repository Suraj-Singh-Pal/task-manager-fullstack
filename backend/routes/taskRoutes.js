const express = require("express");
const Task = require("../models/Task");
const auth = require("../middleware/authMiddleware");

const router = express.Router();
router.use(auth);

// GET all tasks
router.get("/", async (req, res) => {
  const tasks = await Task.find({ userId: req.user.id }).sort({ createdAt: -1 });
  res.json(tasks);
});

// POST create task
router.post("/", async (req, res) => {
  const { title, dueDate, priority } = req.body;

  const task = await Task.create({
    title,
    dueDate: dueDate ? new Date(dueDate) : null,
    priority: priority || "Medium",
    userId: req.user.id,
    status: "todo",
    completed: false,
  });

  res.status(201).json(task);
});

// PUT update task (toggle complete / update any field)
router.put("/:id", async (req, res) => {
  const updates = { ...req.body };

  // ✅ If status changes, automatically sync completed boolean
  if (updates.status) {
    updates.completed = updates.status === "done";
  }

  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.id },
    updates,
    { new: true }
  );

  if (!task) return res.status(404).json({ message: "Task not found" });
  res.json(task);
});

// DELETE task
router.delete("/:id", async (req, res) => {
  const task = await Task.findOneAndDelete({
    _id: req.params.id,
    userId: req.user.id,
  });

  if (!task) return res.status(404).json({ message: "Task not found" });
  res.json({ message: "Deleted ✅" });
});

module.exports = router;