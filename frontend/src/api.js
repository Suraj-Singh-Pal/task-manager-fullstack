const BASE_URL = "http://localhost:5000";

export async function getTasks() {
  const res = await fetch(`${BASE_URL}/api/tasks`);
  return res.json();
}

export async function addTask(title) {
  const res = await fetch(`${BASE_URL}/api/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  return res.json();
}

export async function deleteTask(id) {
  await fetch(`${BASE_URL}/api/tasks/${id}`, { method: "DELETE" });
}