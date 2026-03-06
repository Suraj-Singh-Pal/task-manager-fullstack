import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./App.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function App() {
  // -------------------- AUTH STATES --------------------
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState(""); // only for register
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // -------------------- APP STATES --------------------
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState(""); // for adding task
  const [priority, setPriority] = useState("Medium"); // for adding task
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState([]);

  // -------------------- ADVANCED FILTERS --------------------
  const [qTitle, setQTitle] = useState("");
  const [qPriority, setQPriority] = useState("all");
  const [qStatus, setQStatus] = useState("all"); // todo / progress / done / all
  const [qDate, setQDate] = useState(""); // exact date filter

  // ✅ token helpers
  const getToken = () => localStorage.getItem("token");
  const tokenExists = !!getToken();

  const authHeader = () => ({
    headers: { Authorization: `Bearer ${getToken()}` },
  });

  // -------------------- HELPERS --------------------
  const normalizeStatus = (t) => {
    // If your backend already stores status, we use it.
    // Otherwise, we map from completed => done / todo.
    if (t.status) return t.status; // "todo" | "progress" | "done"
    if (t.completed) return "done";
    return "todo";
  };

  const formatDate = (d) => {
    try {
      return new Date(d).toLocaleDateString();
    } catch {
      return "";
    }
  };

  // -------------------- API CALLS --------------------
  const fetchTasks = async () => {
    if (!getToken()) return;
    try {
      setLoading(true);
      const res = await axios.get(`${API}/api/tasks`, authHeader());
      // attach fallback status for UI
      const safe = (res.data || []).map((t) => ({
        ...t,
        status: normalizeStatus(t),
      }));
      setTasks(safe);
    } catch (err) {
      console.log(err);
      alert("Token invalid/expired. Please login again.");
      localStorage.removeItem("token");
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line
  }, []);

  const registerUser = async () => {
    try {
      const res = await axios.post(`${API}/api/auth/register`, {
        name,
        email,
        password,
      });
      localStorage.setItem("token", res.data.token);
      setName("");
      setEmail("");
      setPassword("");
      alert("Registered ✅");
      fetchTasks();
    } catch (err) {
      console.log(err);
      alert(err?.response?.data?.message || "Register failed");
    }
  };

  const loginUser = async () => {
    try {
      const res = await axios.post(`${API}/api/auth/login`, {
        email,
        password,
      });
      localStorage.setItem("token", res.data.token);
      setEmail("");
      setPassword("");
      alert("Logged in ✅");
      fetchTasks();
    } catch (err) {
      console.log(err);
      alert(err?.response?.data?.message || "Login failed");
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setTasks([]);
    alert("Logged out ✅");
  };

  const addTask = async () => {
    if (!title.trim()) return;
    try {
      const res = await axios.post(
        `${API}/api/tasks`,
        {
          title,
          dueDate: dueDate || null,
          priority,
          status: "todo", // ✅ new tasks start in Todo
          completed: false,
        },
        authHeader()
      );

      const created = {
        ...res.data,
        status: normalizeStatus(res.data),
      };

      setTasks((prev) => [created, ...prev]);
      setTitle("");
      setDueDate("");
      setPriority("Medium");
    } catch (err) {
      console.log(err);
      alert("Failed to add task");
    }
  };

  const deleteTask = async (id) => {
    try {
      await axios.delete(`${API}/api/tasks/${id}`, authHeader());
      setTasks((prev) => prev.filter((t) => t._id !== id));
    } catch (err) {
      console.log(err);
      alert("Failed to delete");
    }
  };

  // ✅ Move task in Kanban (Todo -> Progress -> Done)
  const moveTask = async (id, status) => {
    try {
      const completed = status === "done";
      const res = await axios.put(
        `${API}/api/tasks/${id}`,
        { status, completed },
        authHeader()
      );

      const updated = { ...res.data, status: normalizeStatus(res.data) };

      setTasks((prev) => prev.map((t) => (t._id === id ? updated : t)));
    } catch (err) {
      console.log(err);
      alert("Failed to move task");
    }
  };

  // -------------------- ADVANCED SEARCH (TITLE + PRIORITY + DATE + STATUS) --------------------
  const filteredTasks = useMemo(() => {
    const titleNeedle = qTitle.trim().toLowerCase();

    return tasks.filter((t) => {
      const tTitle = (t.title || "").toLowerCase();
      const tPriority = (t.priority || "Medium").toLowerCase();
      const tStatus = normalizeStatus(t);

      // 1) title filter
      const okTitle = titleNeedle ? tTitle.includes(titleNeedle) : true;

      // 2) priority filter
      const okPriority =
        qPriority === "all" ? true : tPriority === qPriority.toLowerCase();

      // 3) status filter
      const okStatus = qStatus === "all" ? true : tStatus === qStatus;

      // 4) exact due date filter (yyyy-mm-dd)
      const okDate = qDate
        ? t.dueDate
          ? new Date(t.dueDate).toISOString().slice(0, 10) === qDate
          : false
        : true;

      return okTitle && okPriority && okStatus && okDate;
    });
  }, [tasks, qTitle, qPriority, qStatus, qDate]);

  // -------------------- KANBAN GROUPING --------------------
  const todoTasks = filteredTasks.filter((t) => normalizeStatus(t) === "todo");
  const progressTasks = filteredTasks.filter(
    (t) => normalizeStatus(t) === "progress"
  );
  const doneTasks = filteredTasks.filter((t) => normalizeStatus(t) === "done");

  // -------------------- DASHBOARD STATS --------------------
  const total = tasks.length;
  const completedCount = tasks.filter((t) => normalizeStatus(t) === "done").length;
  const pendingCount = total - completedCount;
  const progressPercent = total === 0 ? 0 : Math.round((completedCount / total) * 100);

  // -------------------- UI --------------------
  return (
    <div className="appBg">
      <div className="container">
        <div className="glassCard">
          {/* Top Bar */}
          <div className="topBar">
            <div className="brand">
              <div className="brandMark">✅</div>
              <div>
                <div className="brandTitle">Task Manager</div>
                <div className="brandSub">Dashboard • Kanban • Filters</div>
              </div>
            </div>

            {tokenExists ? (
              <button className="btn ghost" onClick={logout}>
                Logout
              </button>
            ) : (
              <div className="pill">Secure Login</div>
            )}
          </div>

          {/* AUTH */}
          {!tokenExists ? (
            <div className="authWrap">
              <div className="authBox">
                <div className="authTitle">{isLogin ? "Login" : "Register"}</div>

                {!isLogin && (
                  <input
                    className="input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your Name"
                  />
                )}

                <input
                  className="input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                />

                <input
                  className="input"
                  value={password}
                  type="password"
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                />

                <button
                  className="btn primary full"
                  onClick={isLogin ? loginUser : registerUser}
                >
                  {isLogin ? "Login" : "Create Account"}
                </button>

                <div className="switchLine">
                  {isLogin ? "New user?" : "Already have an account?"}{" "}
                  <span className="link" onClick={() => setIsLogin(!isLogin)}>
                    {isLogin ? "Register" : "Login"}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* DASHBOARD STATS */}
              <div className="statsRow">
                <div className="stat">
                  <div className="statLabel">Total</div>
                  <div className="statValue">{total}</div>
                </div>
                <div className="stat statGood">
                  <div className="statLabel">Completed</div>
                  <div className="statValue">{completedCount}</div>
                </div>
                <div className="stat statWarn">
                  <div className="statLabel">Pending</div>
                  <div className="statValue">{pendingCount}</div>
                </div>
              </div>

              <div className="progressCard">
                <div className="progressTop">
                  <div className="progressTitle">Progress</div>
                  <div className="progressPct">{progressPercent}%</div>
                </div>
                <div className="progressBar">
                  <div className="progressFill" style={{ width: `${progressPercent}%` }} />
                </div>
              </div>

              {/* ADD TASK */}
              <div className="addCard">
                <div className="sectionTitle">Create Task</div>

                <div className="addGrid">
                  <input
                    className="input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter a task title..."
                  />

                  <input
                    className="input"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />

                  <select
                    className="select"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>

                  <button className="btn primary" onClick={addTask}>
                    Add Task
                  </button>
                </div>
              </div>

              {/* ADVANCED FILTERS */}
              <div className="filterCard">
                <div className="sectionTitle">Advanced Search</div>

                <div className="filterGrid">
                  <input
                    className="input"
                    value={qTitle}
                    onChange={(e) => setQTitle(e.target.value)}
                    placeholder="Search by title..."
                  />

                  <select
                    className="select"
                    value={qStatus}
                    onChange={(e) => setQStatus(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="todo">Todo</option>
                    <option value="progress">In Progress</option>
                    <option value="done">Completed</option>
                  </select>

                  <select
                    className="select"
                    value={qPriority}
                    onChange={(e) => setQPriority(e.target.value)}
                  >
                    <option value="all">All Priority</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>

                  <input
                    className="input"
                    type="date"
                    value={qDate}
                    onChange={(e) => setQDate(e.target.value)}
                    title="Filter by exact due date"
                  />

                  <button
                    className="btn ghost"
                    onClick={() => {
                      setQTitle("");
                      setQPriority("all");
                      setQStatus("all");
                      setQDate("");
                    }}
                  >
                    Clear Filters
                  </button>
                </div>

                <div className="hint">
                  Filtering works by: <b>title</b> + <b>priority</b> +{" "}
                  <b>status</b> + <b>due date</b>
                </div>
              </div>

              {/* KANBAN */}
              <div className="kanbanWrap">
                <div className="kanbanTop">
                  <div className="sectionTitle">Kanban Board</div>
                  <div className="subCount">
                    Showing: <b>{filteredTasks.length}</b> tasks
                  </div>
                </div>

                {loading ? (
                  <div className="loading">Loading...</div>
                ) : (
                  <div className="kanban">
                    {/* TODO */}
                    <Column
                      title="Todo"
                      count={todoTasks.length}
                      tone="todo"
                      tasks={todoTasks}
                      onMove={moveTask}
                      onDelete={deleteTask}
                      formatDate={formatDate}
                    />

                    {/* PROGRESS */}
                    <Column
                      title="In Progress"
                      count={progressTasks.length}
                      tone="progress"
                      tasks={progressTasks}
                      onMove={moveTask}
                      onDelete={deleteTask}
                      formatDate={formatDate}
                    />

                    {/* DONE */}
                    <Column
                      title="Completed"
                      count={doneTasks.length}
                      tone="done"
                      tasks={doneTasks}
                      onMove={moveTask}
                      onDelete={deleteTask}
                      formatDate={formatDate}
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// -------------------- UI COMPONENTS --------------------
function Column({ title, count, tone, tasks, onMove, onDelete, formatDate }) {
  return (
    <div className={`col ${tone}`}>
      <div className="colHead">
        <div className="colTitle">{title}</div>
        <div className="colCount">{count}</div>
      </div>

      <div className="colBody">
        {tasks.length === 0 ? (
          <div className="empty">No tasks here</div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              tone={tone}
              onMove={onMove}
              onDelete={onDelete}
              formatDate={formatDate}
            />
          ))
        )}
      </div>
    </div>
  );
}

function TaskCard({ task, onMove, onDelete, formatDate }) {
  const pr = (task.priority || "Medium").toLowerCase();
  const badgeClass = pr === "high" ? "high" : pr === "low" ? "low" : "medium";

  const status = task.status || (task.completed ? "done" : "todo");

  return (
    <div className="taskCard">
      {/* ✅ Bold heading */}
      <div className="taskTitleRow">
        <div className="taskTitleText">{task.title}</div>
        <span className={`badge ${badgeClass}`}>{task.priority || "Medium"}</span>
      </div>

      <div className="taskMeta">
        <div>{task.dueDate ? `Due: ${formatDate(task.dueDate)}` : "No due date"}</div>
        <div className="taskStatus">Status: {status}</div>
      </div>

      {/* ✅ gap between buttons */}
      <div className="taskActions">
        {status === "todo" && (
          <>
            <button className="btn mini" onClick={() => onMove(task._id, "progress")}>
              Start
            </button>
            <button className="btn mini ghost" onClick={() => onMove(task._id, "done")}>
              Mark Done
            </button>
          </>
        )}

        {status === "progress" && (
          <>
            <button className="btn mini" onClick={() => onMove(task._id, "todo")}>
              Back
            </button>
            <button className="btn mini ghost" onClick={() => onMove(task._id, "done")}>
              Complete
            </button>
          </>
        )}

        {status === "done" && (
          <>
            <button className="btn mini" onClick={() => onMove(task._id, "progress")}>
              Reopen
            </button>
            <button className="btn mini danger" onClick={() => onDelete(task._id)}>
              Delete
            </button>
          </>
        )}
      </div>
    </div>
  );
}