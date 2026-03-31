import { useEffect, useMemo, useState } from "react";
import TaskBoard from "./TaskBoard.jsx";

const API_BASE = import.meta.env.VITE_API_BASE;
const TOKEN_KEY = "task_manager_access_token";

function mapRole(role) {
  if (role === "truong_phong") return { label: "Trưởng phòng", ui: "manager" };
  if (role === "pho_truong_phong") return { label: "Phó trưởng phòng", ui: "manager" };
  return { label: "Chuyên viên", ui: "staff" };
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const currentUser = useMemo(() => {
    if (!user) return null;
    const r = mapRole(user.role);
    return {
      name: user.full_name || user.email,
      email: user.email,
      rawRole: user.role,
      role: r.ui,
      roleLabel: r.label,
    };
  }, [user]);

  const login = async (email, password) => {
    setLoading(true);
    const res = await fetch(`${API_BASE}/auth/login-email`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return alert(data.detail);

    localStorage.setItem(TOKEN_KEY, data.access_token);
    setUser(data.user);
  };

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;

    fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(setUser)
      .catch(() => localStorage.removeItem(TOKEN_KEY));
  }, []);

  if (!currentUser) {
    return (
      <div style={{padding:40}}>
        <h2>Login</h2>
        <button onClick={() => login("vuhoangphuong@hmu.edu.vn","YOUR_PASSWORD")}>
          Login test
        </button>
      </div>
    );
  }

  return (
    <TaskBoard
      currentUser={currentUser}
      onLogout={() => {
        localStorage.removeItem(TOKEN_KEY);
        setUser(null);
      }}
    />
  );
}
