const Task = require("../models/Task");
const User = require("../models/User");
const sendEmail = require("./sendEmail");

const sendDueReminders = async () => {
  try {
    const now = new Date();

    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const dueTasks = await Task.find({
      dueDate: { $gte: startOfDay, $lte: endOfDay },
      completed: false,
    });

    if (dueTasks.length === 0) {
      console.log("ℹ️ No due tasks found for today.");
      return;
    }

    for (const task of dueTasks) {
      const user = await User.findById(task.userId);

      if (!user || !user.email) continue;

      const formattedDate = task.dueDate
        ? new Date(task.dueDate).toLocaleDateString()
        : "today";

      const subject = "⏰ Task Reminder";
      const text = `Hello ${user.name || "User"},

This is a reminder that your task is due today.

Task: ${task.title}
Priority: ${task.priority || "Medium"}
Due Date: ${formattedDate}

Please complete it on time.

- Task Manager`;

      await sendEmail(user.email, subject, text);
    }

    console.log(`✅ Due reminders processed for ${dueTasks.length} task(s).`);
  } catch (error) {
    console.log("❌ Reminder job error:", error.message);
  }
};

module.exports = sendDueReminders;