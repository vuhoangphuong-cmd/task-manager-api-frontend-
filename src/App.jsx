import { useEffect, useMemo, useState } from "react";
import TaskBoard from "./TaskBoard.jsx";

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";
const TOKEN_KEY = "task_manager_access_token";

function getRoleLabel(role) {
  if (role === "truong_phong") return "Trưởng phòng";
  if (role === "pho_truong_phong") return "Phó trưởng phòng";
  if (role === "chuyen_vien") return "Chuyên viên";
  if (role === "manager") return "Trưởng phòng";
  if (role === "staff") return "Chuyên viên";
  return "Chuyên viên";
}

function getCompatRole(role) {
  if (role === "truong_phong" || role === "pho_truong_phong") return "manager";
  return "staff";
}

function AuthScreen({ onLogin, onRegister, loading }) {
  const [mode, setMode] = useState("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("chuyen_vien");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (mode === "login") {
      await onLogin(email, password);
      return;
    }

    await onRegister({
      full_name: fullName,
      email,
      role,
      password,
    });
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
          width: 430,
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
            {mode === "login"
              ? "Đăng nhập bằng email và mật khẩu."
              : "Đăng ký tài khoản lần đầu bằng họ tên, email, vai trò và mật khẩu."}
          </div>
        </div>

        {mode === "register" && (
          <>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 700 }}>
                Họ tên
              </label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nhập họ tên"
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

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 700 }}>
                Vai trò
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 14,
                  border: "1px solid #dbe3ee",
                  boxSizing: "border-box",
                  fontSize: 14,
                  background: "#fff",
                }}
              >
                <option value="truong_phong">Trưởng phòng</option>
                <option value="pho_truong_phong">Phó trưởng phòng</option>
                <option value="chuyen_vien">Chuyên viên</option>
              </select>
            </div>
          </>
        )}

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 700 }}>
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Nhập email"
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
            Mật khẩu
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
          {loading
            ? "Đang xử lý..."
            : mode === "login"
            ? "Đăng nhập"
            : "Đăng ký"}
        </button>

        <button
          type="button"
          onClick={() => setMode(mode === "login" ? "register" : "login")}
          style={{
            width: "100%",
            marginTop: 10,
            padding: "10px 12px",
            borderRadius: 12,
            border: "1px solid #dbe3ee",
            background: "#fff",
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          {mode === "login" ? "Chưa có tài khoản? Đăng ký" : "Đã có tài khoản? Đăng nhập"}
        </button>
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
      name: user.full_name || user.email,
      full_name: user.full_name,
      email: user.email,
      rawRole: user.role,
      role: getCompatRole(user.role),
      roleLabel: getRoleLabel(user.role),
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

  const handleLogin = async (email, password) => {
    if (!email.trim() || !password.trim()) {
      alert("Bạn cần nhập email và mật khẩu");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_BASE}/auth/login-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Đăng nhập thất bại");
      }

      localStorage.setItem(TOKEN_KEY, data.access_token);
      setUser(data.user);
    } catch (err) {
      alert(`Đăng nhập thất bại: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (payload) => {
    if (!payload.full_name.trim() || !payload.email.trim() || !payload.password.trim()) {
      alert("Bạn cần nhập đầy đủ họ tên, email và mật khẩu");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Đăng ký thất bại");
      }

      localStorage.setItem(TOKEN_KEY, data.access_token);
      setUser(data.user);
    } catch (err) {
      alert(`Đăng ký thất bại: ${err.message}`);
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
    return <AuthScreen onLogin={handleLogin} onRegister={handleRegister} loading={loading} />;
  }

  return (
    <TaskBoard
      currentUser={currentUser}
      onLogout={handleLogout}
      onSwitchAccount={handleLogout}
    />
  );
}
