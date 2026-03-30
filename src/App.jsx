import { useEffect, useMemo, useState } from "react";
import TaskBoard from "./TaskBoard.jsx";

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";
const TOKEN_KEY = "task_manager_access_token";

function LoginScreen({ onLogin, loading }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onLogin(username, password);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background:
          "radial-gradient(circle at 0% 0%, rgba(59,130,246,0.10), transparent 24%), radial-gradient(circle at 100% 0%, rgba(16,185,129,0.08), transparent 18%), linear-gradient(180deg, #f8fbff 0%, #f3f6fb 55%, #eef3f8 100%)",
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: 420,
          maxWidth: "92vw",
          background: "rgba(255,255,255,0.92)",
          border: "1px solid rgba(226,232,240,0.95)",
          borderRadius: 24,
          padding: 24,
          boxShadow: "0 20px 50px rgba(15,23,42,0.10)",
        }}
      >
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#0f172a", marginBottom: 6 }}>
            Task Manager
          </div>
          <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>
            Đăng nhập bằng tài khoản thật để truy cập hệ thống công việc.
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 700 }}>
            Username
          </label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Nhập username"
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: 14,
              border: "1px solid #dbe3ee",
              boxSizing: "border-box",
              fontSize: 14,
            }}
          />
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 700 }}>
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Nhập mật khẩu"
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: 14,
              border: "1px solid #dbe3ee",
              boxSizing: "border-box",
              fontSize: 14,
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px 16px",
            borderRadius: 14,
            border: "none",
            background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
            color: "#fff",
            fontWeight: 800,
            cursor: "pointer",
            fontSize: 14,
            boxShadow: "0 12px 26px rgba(37,99,235,0.22)",
          }}
        >
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>

        <div style={{ marginTop: 14, fontSize: 12, color: "#94a3b8", lineHeight: 1.6 }}>
          Ví dụ test: manager01 / Manager@123 hoặc staff01 / Staff@123
        </div>
      </form>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);
  const [loading, setLoading] = useState(false);

  const currentUser = useMemo(() => {
    if (!user) return null;
    return {
      name: user.full_name || user.username,
      email: user.email,
      role: user.role,
    };
  }, [user]);

  useEffect(() => {
    const restore = async () => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        setBooting(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Token hết hạn hoặc không hợp lệ");

        const me = await res.json();
        setUser(me);
      } catch (err) {
        localStorage.removeItem(TOKEN_KEY);
        setUser(null);
      } finally {
        setBooting(false);
      }
    };

    restore();
  }, []);

  const handleLogin = async (username, password) => {
    if (!username.trim() || !password.trim()) {
      alert("Bạn cần nhập username và password");
      return;
    }

    try {
      setLoading(true);

      const body = new URLSearchParams();
      body.set("username", username.trim());
      body.set("password", password);

      const res = await fetch(`${API_BASE}/auth/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(errText || "Đăng nhập thất bại");
      }

      const data = await res.json();
      localStorage.setItem(TOKEN_KEY, data.access_token);
      setUser(data.user);
    } catch (err) {
      alert(`Đăng nhập thất bại: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  };

  if (booting) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          fontFamily:
            'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        Đang kiểm tra phiên đăng nhập...
      </div>
    );
  }

  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} loading={loading} />;
  }

  return (
    <TaskBoard
      currentUser={currentUser}
      onLogout={handleLogout}
      onSwitchAccount={handleLogout}
    />
  );
}
