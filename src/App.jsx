import { useEffect, useState } from "react";
import { Toaster } from "sonner";
import { useRealtimeToast } from "./hooks/useRealtimeToast";
import TaskBoard from "./TaskBoard";

const USERS_KEY = "khth_users";
const CURRENT_USER_KEY = "khth_current_user";

function normalize(value) {
  return (value || "").trim().toLowerCase();
}

function prettyPosition(position) {
  if (position === "truong_phong") return "Trưởng phòng";
  if (position === "pho_truong_phong") return "Phó trưởng phòng";
  return "Chuyên viên";
}

function mapPositionToRole(position) {
  if (position === "truong_phong" || position === "pho_truong_phong") {
    return "manager";
  }
  return "staff";
}

function loadUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    const users = raw ? JSON.parse(raw) : [];
    return Array.isArray(users) ? users : [];
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function loadCurrentUser() {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveCurrentUser(user) {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  localStorage.setItem("user", JSON.stringify(user));
  localStorage.setItem("currentUser", JSON.stringify(user));
  localStorage.setItem("auth_user", JSON.stringify(user));
  localStorage.setItem("profile", JSON.stringify(user));
}

function clearCurrentUser() {
  localStorage.removeItem(CURRENT_USER_KEY);
  localStorage.removeItem("user");
  localStorage.removeItem("currentUser");
  localStorage.removeItem("auth_user");
  localStorage.removeItem("profile");
}

function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [users, setUsers] = useState(loadUsers());
  const [message, setMessage] = useState("");

  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    position: "chuyen_vien",
  });

  const [loginValue, setLoginValue] = useState("");

  useEffect(() => {
    setUsers(loadUsers());
  }, []);

  const handleRegister = (e) => {
    e.preventDefault();

    const name = registerForm.name.trim();
    const email = registerForm.email.trim().toLowerCase();
    const position = registerForm.position;

    if (!name || !email) {
      setMessage("Vui lòng nhập đầy đủ họ tên và email.");
      return;
    }

    const exists = users.find(
      (u) => normalize(u.name) === normalize(name) || normalize(u.email) === normalize(email)
    );

    if (exists) {
      setMessage("Tài khoản đã tồn tại. Vui lòng đăng nhập.");
      setMode("login");
      return;
    }

    const newUser = {
      id: `user_${Date.now()}`,
      name,
      email,
      position,
      role: mapPositionToRole(position),
      created_at: new Date().toISOString(),
    };

    const nextUsers = [...users, newUser];
    saveUsers(nextUsers);
    saveCurrentUser(newUser);
    setUsers(nextUsers);
    setMessage("");
    onLogin(newUser);
  };

  const handleLogin = (e) => {
    e.preventDefault();

    const value = normalize(loginValue);
    if (!value) {
      setMessage("Vui lòng nhập họ tên hoặc email.");
      return;
    }

    const found = users.find(
      (u) => normalize(u.name) === value || normalize(u.email) === value
    );

    if (!found) {
      setMessage("Không tìm thấy tài khoản phù hợp.");
      return;
    }

    saveCurrentUser(found);
    setMessage("");
    onLogin(found);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(59,130,246,0.10), transparent 24%), radial-gradient(circle at top right, rgba(16,185,129,0.08), transparent 18%), linear-gradient(180deg, #f8fbff 0%, #f3f6fb 55%, #eef3f8 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 980,
          display: "grid",
          gridTemplateColumns: "1.15fr 0.95fr",
          gap: 20,
        }}
      >
        <div
          style={{
            borderRadius: 28,
            padding: 30,
            background: "linear-gradient(135deg, #0b1220 0%, #172337 40%, #1f3250 70%, #0f766e 100%)",
            color: "#fff",
            boxShadow: "0 26px 70px rgba(15, 23, 42, 0.22)",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 14px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.10)",
              border: "1px solid rgba(255,255,255,0.14)",
              fontSize: 12,
              fontWeight: 800,
              marginBottom: 18,
            }}
          >
            Hệ thống quản lý công việc
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: 34,
              lineHeight: 1.08,
              fontWeight: 900,
              letterSpacing: "-0.04em",
            }}
          >
            Phòng KHTH
          </h1>

          <p
            style={{
              marginTop: 14,
              marginBottom: 0,
              fontSize: 14,
              lineHeight: 1.75,
              color: "rgba(255,255,255,0.82)",
            }}
          >
            Đăng ký lần đầu để khai báo họ tên, email và vị trí công tác. Sau đó đăng nhập lại bằng họ tên hoặc email đã khai báo.
          </p>

          <div style={{ marginTop: 24, display: "grid", gap: 12 }}>
            {[
              "Trưởng phòng và Phó trưởng phòng vào chế độ lãnh đạo.",
              "Chuyên viên vào chế độ nhân viên.",
              "Dữ liệu tài khoản đang được lưu cục bộ trên trình duyệt.",
            ].map((item, idx) => (
              <div
                key={idx}
                style={{
                  padding: "12px 14px",
                  borderRadius: 16,
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  fontSize: 13,
                  lineHeight: 1.65,
                }}
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            background: "rgba(255,255,255,0.92)",
            border: "1px solid rgba(226,232,240,0.95)",
            borderRadius: 28,
            padding: 24,
            boxShadow: "0 16px 38px rgba(15,23,42,0.08)",
          }}
        >
          <div style={{ marginBottom: 18 }}>
            <div
              style={{
                fontSize: 24,
                fontWeight: 900,
                letterSpacing: "-0.03em",
                color: "#0f172a",
              }}
            >
              {mode === "register" ? "Khai báo tài khoản lần đầu" : "Đăng nhập hệ thống"}
            </div>
            <div
              style={{
                marginTop: 6,
                fontSize: 13,
                color: "#64748b",
                lineHeight: 1.6,
              }}
            >
              {mode === "register"
                ? "Khai báo thông tin người dùng để tạo tài khoản."
                : "Đăng nhập bằng họ tên hoặc email đã khai báo."}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
            <button
              onClick={() => {
                setMode("login");
                setMessage("");
              }}
              style={{
                flex: 1,
                padding: "11px 14px",
                borderRadius: 14,
                border: mode === "login" ? "1px solid #bfdbfe" : "1px solid #dbe3ee",
                background: mode === "login" ? "#eff6ff" : "#fff",
                color: mode === "login" ? "#1d4ed8" : "#334155",
                fontWeight: 800,
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              Đăng nhập
            </button>

            <button
              onClick={() => {
                setMode("register");
                setMessage("");
              }}
              style={{
                flex: 1,
                padding: "11px 14px",
                borderRadius: 14,
                border: mode === "register" ? "1px solid #bfdbfe" : "1px solid #dbe3ee",
                background: mode === "register" ? "#eff6ff" : "#fff",
                color: mode === "register" ? "#1d4ed8" : "#334155",
                fontWeight: 800,
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              Đăng ký lần đầu
            </button>
          </div>

          {mode === "register" ? (
            <form onSubmit={handleRegister} style={{ display: "grid", gap: 14 }}>
              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 800, color: "#475569" }}>
                  Họ tên
                </label>
                <input
                  value={registerForm.name}
                  onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                  placeholder="Nhập họ tên"
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: 14,
                    border: "1px solid #dbe3ee",
                    fontSize: 13,
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 800, color: "#475569" }}>
                  Email
                </label>
                <input
                  type="email"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                  placeholder="Nhập email"
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: 14,
                    border: "1px solid #dbe3ee",
                    fontSize: 13,
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 800, color: "#475569" }}>
                  Vị trí
                </label>
                <select
                  value={registerForm.position}
                  onChange={(e) => setRegisterForm({ ...registerForm, position: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: 14,
                    border: "1px solid #dbe3ee",
                    fontSize: 13,
                    boxSizing: "border-box",
                  }}
                >
                  <option value="truong_phong">Trưởng phòng</option>
                  <option value="pho_truong_phong">Phó trưởng phòng</option>
                  <option value="chuyen_vien">Chuyên viên</option>
                </select>
              </div>

              <button
                type="submit"
                style={{
                  padding: "12px 16px",
                  borderRadius: 14,
                  border: "none",
                  background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Đăng ký và vào hệ thống
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin} style={{ display: "grid", gap: 14 }}>
              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 800, color: "#475569" }}>
                  Họ tên hoặc email
                </label>
                <input
                  value={loginValue}
                  onChange={(e) => setLoginValue(e.target.value)}
                  placeholder="Nhập họ tên hoặc email đã khai báo"
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: 14,
                    border: "1px solid #dbe3ee",
                    fontSize: 13,
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <button
                type="submit"
                style={{
                  padding: "12px 16px",
                  borderRadius: 14,
                  border: "none",
                  background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Đăng nhập
              </button>
            </form>
          )}

          {message && (
            <div
              style={{
                marginTop: 14,
                fontSize: 12.5,
                color: "#b91c1c",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                padding: "10px 12px",
                borderRadius: 12,
                lineHeight: 1.6,
              }}
            >
              {message}
            </div>
          )}

          {users.length > 0 && (
            <div style={{ marginTop: 18, borderTop: "1px solid #e5e7eb", paddingTop: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#64748b", marginBottom: 8 }}>
                Tài khoản đã khai báo
              </div>

              <div style={{ display: "grid", gap: 8, maxHeight: 160, overflow: "auto" }}>
                {users.map((u) => (
                  <div
                    key={u.id}
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: 12,
                      padding: "10px 12px",
                      background: "#fff",
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>
                      {u.name}
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 3 }}>
                      {u.email}
                    </div>
                    <div style={{ fontSize: 12, color: "#2563eb", marginTop: 4, fontWeight: 700 }}>
                      {prettyPosition(u.position)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AppContent({ currentUser, onLogout, onSwitchAccount }) {
  useRealtimeToast(true);

  return (
    <>
      <Toaster position="top-right" richColors closeButton />
      <TaskBoard
        currentUser={currentUser}
        onLogout={onLogout}
        onSwitchAccount={onSwitchAccount}
      />
    </>
  );
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(loadCurrentUser());

  const handleLogin = (user) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    clearCurrentUser();
    setCurrentUser(null);
  };

  const handleSwitchAccount = () => {
    clearCurrentUser();
    setCurrentUser(null);
  };

  if (!currentUser) {
    return (
      <>
        <Toaster position="top-right" richColors closeButton />
        <AuthScreen onLogin={handleLogin} />
      </>
    );
  }

  return (
    <AppContent
      currentUser={currentUser}
      onLogout={handleLogout}
      onSwitchAccount={handleSwitchAccount}
    />
  );
}
