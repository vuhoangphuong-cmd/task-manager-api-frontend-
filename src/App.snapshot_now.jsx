import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
  DragDropContext,
  Droppable,
  Draggable,
} from "@hello-pangea/dnd";

const API = "http://127.0.0.1:8000/api/v1";
const WS_URL = "ws://127.0.0.1:8000/ws/tasks";

export default function App() {
  const [email, setEmail] = useState("");
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [quickUserId, setQuickUserId] = useState("");
  const [tasks, setTasks] = useState([]);
  const wsRef = useRef(null);

  useEffect(() => {
    loadUsers();

    const saved = localStorage.getItem("user");
    if (saved) {
      const u = JSON.parse(saved);
      setUser(u);
      setEmail(u.email || "");
      setQuickUserId(u.id);
      loadTasks(u.id);
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    if (wsRef.current) {
      wsRef.current.close();
    }

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send("hello");
    };

    ws.onmessage = async () => {
      await loadTasks(user.id);
    };

    ws.onclose = () => {};

    return () => {
      ws.close();
    };
  }, [user]);

  const loadUsers = async () => {
    const res = await axios.get(`${API}/users`);
    setUsers(res.data.data || []);
  };

  const loadTasks = async (userId) => {
    const res = await axios.get(`${API}/dashboard/my-work/${userId}`);
    setTasks(res.data.data.my_tasks || []);
  };

  const login = async () => {
    try {
      const res = await axios.post(`${API}/auth/login`, { email: email.trim() });
      const u = res.data.data;
      setUser(u);
      setQuickUserId(u.id);
      localStorage.setItem("user", JSON.stringify(u));
      await loadTasks(u.id);
    } catch (err) {
      alert(err?.response?.data?.detail || "Login thất bại");
    }
  };

  const quickLogin = async () => {
    if (!quickUserId) {
      alert("Chọn user trước");
      return;
    }

    const picked = users.find((u) => u.id === quickUserId);
    if (!picked?.email) {
      alert("User không có email");
      return;
    }

    try {
      const res = await axios.post(`${API}/auth/login`, { email: picked.email.trim() });
      const u = res.data.data;
      setUser(u);
      setEmail(u.email || "");
      localStorage.setItem("user", JSON.stringify(u));
      await loadTasks(u.id);
    } catch (err) {
      alert(err?.response?.data?.detail || "Login nhanh thất bại");
    }
  };

  const switchUser = async (targetUserId) => {
    const picked = users.find((u) => u.id === targetUserId);
    if (!picked?.email) {
      alert("User không hợp lệ");
      return;
    }

    try {
      const res = await axios.post(`${API}/auth/login`, { email: picked.email.trim() });
      const u = res.data.data;
      setUser(u);
      setEmail(u.email || "");
      setQuickUserId(u.id);
      localStorage.setItem("user", JSON.stringify(u));
      await loadTasks(u.id);
    } catch (err) {
      alert(err?.response?.data?.detail || "Chuyển user thất bại");
    }
  };

  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
    setTasks([]);
    setEmail("");
    setQuickUserId("");
    if (wsRef.current) {
      wsRef.current.close();
    }
  };

  const updateStatus = async (task, targetStatus) => {
    try {
      if (task.status === "completed") {
        alert("Task completed không được kéo sang trạng thái khác");
        return;
      }

      const allowed = {
        assigned: ["in_progress"],
        in_progress: ["waiting_review"],
        waiting_review: [],
        completed: [],
      };

      if (!allowed[task.status]?.includes(targetStatus)) {
        alert(`Không thể chuyển từ "${task.status}" sang "${targetStatus}"`);
        return;
      }

      if (targetStatus === "in_progress") {
        await axios.post(`${API}/tasks/${task.id}/progress`, {
          actor_user_id: user.id,
          progress_percent: 10,
          comment: "Drag & drop sang in_progress",
        });
      }

      if (targetStatus === "waiting_review") {
        await axios.post(`${API}/tasks/${task.id}/progress`, {
          actor_user_id: user.id,
          progress_percent: 100,
          comment: "Drag & drop sang waiting_review",
        });
      }
    } catch (err) {
      alert(err?.response?.data?.detail || "Không đổi được trạng thái");
    }
  };

  const cols = useMemo(() => ({
    assigned: tasks.filter((t) => t.status === "assigned"),
    in_progress: tasks.filter((t) => t.status === "in_progress"),
    waiting_review: tasks.filter((t) => t.status === "waiting_review"),
    completed: tasks.filter((t) => t.status === "completed"),
  }), [tasks]);

  const onDragEnd = async (res) => {
    if (!res.destination) return;

    const sourceCol = res.source.droppableId;
    const destCol = res.destination.droppableId;

    if (sourceCol === destCol) return;

    const task = tasks.find((t) => t.id === res.draggableId);
    if (!task) return;

    await updateStatus(task, destCol);
  };

  if (!user) {
    return (
      <div style={{ padding: 40, maxWidth: 700, margin: "0 auto", fontFamily: "Arial, sans-serif" }}>
        <h2>Login</h2>

        <div style={{ marginBottom: 20 }}>
          <div style={{ marginBottom: 8 }}><b>Login nhanh theo user:</b></div>
          <div style={{ display: "flex", gap: 8 }}>
            <select
              value={quickUserId}
              onChange={(e) => setQuickUserId(e.target.value)}
              style={{ padding: 8, minWidth: 260 }}
            >
              <option value="">-- Chọn user --</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name} ({u.role})
                </option>
              ))}
            </select>
            <button onClick={quickLogin}>Login nhanh</button>
          </div>
        </div>

        <hr style={{ margin: "20px 0" }} />

        <div>
          <div style={{ marginBottom: 8 }}><b>Hoặc login bằng email:</b></div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email"
              style={{ padding: 8, minWidth: 260 }}
            />
            <button onClick={login}>Login</button>
          </div>
        </div>

        <div style={{ marginTop: 20, color: "#555" }}>
          <div>Email mẫu:</div>
          <div>- admin@test.local</div>
          <div>- manager@test.local</div>
          <div>- staff@test.local</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 20, fontFamily: "Arial, sans-serif" }}>
      <h2>Kanban Drag & Drop Realtime</h2>

      <div
        style={{
          marginBottom: 20,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          👤 <b>{user.full_name}</b> ({user.role}) — {user.email}
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select
            value={quickUserId}
            onChange={(e) => setQuickUserId(e.target.value)}
            style={{ padding: 8, minWidth: 220 }}
          >
            <option value="">-- Chuyển nhanh user --</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name} ({u.role})
              </option>
            ))}
          </select>

          <button onClick={() => switchUser(quickUserId)}>
            Switch User
          </button>

          <button
            onClick={logout}
            style={{
              background: "red",
              color: "white",
              border: "none",
              padding: "8px 12px",
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </div>
      </div>

      <div style={{ marginBottom: 12, color: "#555" }}>
        Quy tắc kéo thả:
        <div>- assigned → in_progress</div>
        <div>- in_progress → waiting_review</div>
        <div>- waiting_review và completed không kéo được</div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div style={{ display: "flex", gap: 20 }}>
          {Object.entries(cols).map(([key, list]) => (
            <Droppable droppableId={key} key={key}>
              {(p) => (
                <div
                  ref={p.innerRef}
                  {...p.droppableProps}
                  style={{
                    width: 260,
                    background: "#eee",
                    padding: 10,
                    borderRadius: 8,
                    minHeight: 400,
                  }}
                >
                  <h3>{key}</h3>

                  {list.map((t, i) => (
                    <Draggable
                      key={t.id}
                      draggableId={t.id}
                      index={i}
                      isDragDisabled={t.status === "completed" || t.status === "waiting_review"}
                    >
                      {(p) => (
                        <div
                          ref={p.innerRef}
                          {...p.draggableProps}
                          {...p.dragHandleProps}
                          style={{
                            background:
                              t.due_at && new Date(t.due_at) < new Date() && t.status !== "completed"
                                ? "#ffe5e5"
                                : "#fff",
                            border: "1px solid #ccc",
                            padding: 10,
                            marginBottom: 10,
                            borderRadius: 6,
                            opacity: (t.status === "completed" || t.status === "waiting_review") ? 0.7 : 1,
                            ...p.draggableProps.style,
                          }}
                        >
                          <b>{t.title}</b>
                          <p style={{ margin: "6px 0" }}>{t.task_code}</p>
                          <p style={{ margin: "6px 0" }}>{t.progress_percent}%</p>
                        </div>
                      )}
                    </Draggable>
                  ))}

                  {p.placeholder}
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}
