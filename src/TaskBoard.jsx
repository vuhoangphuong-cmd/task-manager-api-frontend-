import { useCallback, useEffect, useMemo, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";
const TOKEN_KEY = "task_manager_access_token";
const nativeFetch = window.fetch.bind(window);

const ROLE_LABELS = {
  truong_phong: "Trưởng phòng",
  pho_truong_phong: "Phó trưởng phòng",
  chuyen_vien: "Chuyên viên",
  manager: "Trưởng phòng",
  staff: "Chuyên viên",
};

function getRoleLabel(role) {
  return ROLE_LABELS[role] || role || "Chuyên viên";
}

function getDisplayRole(currentUser) {
  if (!currentUser) return "Chuyên viên";
  return currentUser.roleLabel || getRoleLabel(currentUser.rawRole || currentUser.role);
}

function isManagerRole(role) {
  return role === "truong_phong" || role === "pho_truong_phong" || role === "manager";
}

async function authFetch(input, init = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers = new Headers(init.headers || {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return nativeFetch(input, {
    ...init,
    headers,
  });
}

const DEFAULT_FORM = {
  title: "",
  description: "",
  assignee: "",
  priority: "medium",
  due_date: "",
  status: "todo",
};

function TaskModal({
  open,
  mode,
  form,
  setForm,
  onClose,
  onSubmit,
  users,
  currentUser,
  loading,
}) {
  if (!open) return null;

  const canAssignOthers = isManagerRole(currentUser?.rawRole || currentUser?.role);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.45)",
        display: "grid",
        placeItems: "center",
        zIndex: 1000,
        padding: 16,
      }}
    >
      <div
        style={{
          width: 720,
          maxWidth: "96vw",
          background: "#fff",
          borderRadius: 20,
          padding: 20,
          boxShadow: "0 24px 60px rgba(15,23,42,0.22)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#0f172a" }}>
              {mode === "create" ? "Tạo công việc" : "Cập nhật công việc"}
            </div>
            <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
              {mode === "create"
                ? "Điền thông tin công việc và chọn đúng người được giao."
                : "Chỉnh sửa nội dung công việc hiện tại."}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              border: "1px solid #dbe3ee",
              background: "#fff",
              borderRadius: 10,
              padding: "8px 12px",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            Đóng
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 800, marginBottom: 6 }}>Tiêu đề</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Nhập tiêu đề công việc"
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 12,
                border: "1px solid #dbe3ee",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 800, marginBottom: 6 }}>Mô tả</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Nhập mô tả công việc"
              rows={4}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 12,
                border: "1px solid #dbe3ee",
                boxSizing: "border-box",
                resize: "vertical",
                fontFamily: "inherit",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 800, marginBottom: 6 }}>Người được giao</label>

            {canAssignOthers ? (
              <select
                value={form.assignee}
                onChange={(e) => setForm({ ...form, assignee: e.target.value })}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: "1px solid #dbe3ee",
                  boxSizing: "border-box",
                  background: "#fff",
                }}
              >
                <option value="">-- Chọn người được giao --</option>
                {users.map((u) => (
                  <option key={u.id} value={u.email}>
                    {u.full_name} ({u.email}) - {getRoleLabel(u.role)}
                  </option>
                ))}
              </select>
            ) : (
              <input
                value={currentUser?.email || ""}
                disabled
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: "1px solid #dbe3ee",
                  boxSizing: "border-box",
                  background: "#f8fafc",
                  color: "#475569",
                }}
              />
            )}
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 800, marginBottom: 6 }}>Mức độ ưu tiên</label>
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 12,
                border: "1px solid #dbe3ee",
                boxSizing: "border-box",
                background: "#fff",
              }}
            >
              <option value="low">Thấp</option>
              <option value="medium">Trung bình</option>
              <option value="high">Cao</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 800, marginBottom: 6 }}>Hạn hoàn thành</label>
            <input
              type="date"
              value={form.due_date || ""}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 12,
                border: "1px solid #dbe3ee",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 800, marginBottom: 6 }}>Trạng thái</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 12,
                border: "1px solid #dbe3ee",
                boxSizing: "border-box",
                background: "#fff",
              }}
            >
              <option value="todo">Chưa thực hiện</option>
              <option value="in_progress">Đang thực hiện</option>
              <option value="done">Hoàn thành</option>
            </select>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18 }}>
          <button
            onClick={onClose}
            style={{
              border: "1px solid #dbe3ee",
              background: "#fff",
              borderRadius: 12,
              padding: "10px 16px",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            Hủy
          </button>
          <button
            onClick={onSubmit}
            disabled={loading}
            style={{
              border: "none",
              background: "#2563eb",
              color: "#fff",
              borderRadius: 12,
              padding: "10px 16px",
              cursor: "pointer",
              fontWeight: 800,
            }}
          >
            {loading ? "Đang lưu..." : mode === "create" ? "Lưu công việc" : "Cập nhật"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TaskBoard({ currentUser, onLogout }) {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [form, setForm] = useState(DEFAULT_FORM);

  const canManageAll = isManagerRole(currentUser?.rawRole || currentUser?.role);

  const loadTasks = useCallback(async () => {
    try {
      setLoadingTasks(true);
      const res = await authFetch(`${API_BASE}/tasks`);
      if (!res.ok) throw new Error("Không tải được danh sách công việc");
      const data = await res.json();
      setTasks(data);
    } catch (e) {
      console.error(e);
      alert("Không tải được danh sách công việc");
    } finally {
      setLoadingTasks(false);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    if (!canManageAll) {
      setUsers([]);
      return;
    }

    try {
      setLoadingUsers(true);
      const res = await authFetch(`${API_BASE}/users`);
      if (!res.ok) throw new Error("Không tải được danh sách nhân sự");
      const data = await res.json();
      setUsers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingUsers(false);
    }
  }, [canManageAll]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const grouped = useMemo(() => {
    return {
      todo: tasks.filter((t) => t.status === "todo"),
      in_progress: tasks.filter((t) => t.status === "in_progress"),
      done: tasks.filter((t) => t.status === "done"),
    };
  }, [tasks]);

  const openCreate = () => {
    setModalMode("create");
    setEditingTaskId(null);
    setForm({
      ...DEFAULT_FORM,
      assignee: canManageAll ? "" : currentUser?.email || "",
    });
    setModalOpen(true);
  };

  const openEdit = (task) => {
    setModalMode("edit");
    setEditingTaskId(task.id);
    setForm({
      title: task.title || "",
      description: task.description || "",
      assignee: task.assignee || "",
      priority: task.priority || "medium",
      due_date: task.due_date || "",
      status: task.status || "todo",
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingTaskId(null);
    setForm(DEFAULT_FORM);
  };

  const submitTask = async () => {
    if (!form.title.trim()) {
      alert("Bạn cần nhập tiêu đề công việc");
      return;
    }

    if (canManageAll && !form.assignee.trim()) {
      alert("Bạn cần chọn người được giao");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        ...form,
        assignee: canManageAll ? form.assignee.trim() : (currentUser?.email || ""),
      };

      const url =
        modalMode === "create"
          ? `${API_BASE}/tasks`
          : `${API_BASE}/tasks/${editingTaskId}`;

      const method = modalMode === "create" ? "POST" : "PUT";

      const res = await authFetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Lưu công việc thất bại");
      }

      closeModal();
      await loadTasks();
      alert(modalMode === "create" ? "Đã lưu công việc" : "Đã cập nhật công việc");
    } catch (e) {
      alert(`Tạo công việc thất bại: ${e.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (taskId, status) => {
    try {
      const res = await authFetch(`${API_BASE}/tasks/${taskId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Cập nhật trạng thái thất bại");

      await loadTasks();
    } catch (e) {
      alert(e.message);
    }
  };

  const deleteTask = async (taskId) => {
    if (!confirm("Bạn chắc chắn muốn xóa công việc này?")) return;

    try {
      const res = await authFetch(`${API_BASE}/tasks/${taskId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Xóa công việc thất bại");

      await loadTasks();
    } catch (e) {
      alert(e.message);
    }
  };

  const renderColumn = (key, title, items) => (
    <div
      style={{
        background: "#fff",
        borderRadius: 18,
        padding: 14,
        border: "1px solid #e2e8f0",
        boxShadow: "0 10px 26px rgba(15,23,42,0.05)",
        minHeight: 420,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ fontWeight: 900, color: "#0f172a" }}>{title}</div>
        <div
          style={{
            minWidth: 28,
            height: 28,
            borderRadius: 999,
            display: "grid",
            placeItems: "center",
            background: "#eff6ff",
            color: "#2563eb",
            fontWeight: 800,
            fontSize: 12,
          }}
        >
          {items.length}
        </div>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {items.map((task) => (
          <div
            key={task.id}
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: 14,
              padding: 12,
              background: "#fff",
            }}
          >
            <div style={{ fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>{task.title}</div>

            <div style={{ fontSize: 13, color: "#475569", marginBottom: 8, lineHeight: 1.6 }}>
              {task.description || "Không có mô tả"}
            </div>

            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>
              Người được giao: <b>{task.assignee || "Chưa gán"}</b>
            </div>

            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>
              Ưu tiên: <b>{task.priority}</b>
            </div>

            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 10 }}>
              Hạn: <b>{task.due_date || "Chưa đặt"}</b>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {task.status !== "todo" && (
                <button
                  onClick={() => updateStatus(task.id, "todo")}
                  style={btnSecondary}
                >
                  Chưa thực hiện
                </button>
              )}
              {task.status !== "in_progress" && (
                <button
                  onClick={() => updateStatus(task.id, "in_progress")}
                  style={btnSecondary}
                >
                  Đang thực hiện
                </button>
              )}
              {task.status !== "done" && (
                <button
                  onClick={() => updateStatus(task.id, "done")}
                  style={btnSecondary}
                >
                  Hoàn thành
                </button>
              )}

              <button onClick={() => openEdit(task)} style={btnPrimary}>
                Sửa
              </button>

              {canManageAll && (
                <button onClick={() => deleteTask(task.id)} style={btnDanger}>
                  Xóa
                </button>
              )}
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <div
            style={{
              border: "1px dashed #cbd5e1",
              borderRadius: 14,
              padding: 16,
              textAlign: "center",
              color: "#94a3b8",
              fontSize: 13,
            }}
          >
            Chưa có công việc
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at 0% 0%, rgba(59,130,246,0.10), transparent 24%), radial-gradient(circle at 100% 0%, rgba(16,185,129,0.08), transparent 18%), linear-gradient(180deg, #f8fbff 0%, #f3f6fb 55%, #eef3f8 100%)",
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        color: "#0f172a",
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", minHeight: "100vh" }}>
        <aside
          style={{
            background: "#0f172a",
            color: "#fff",
            padding: 20,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div>
            <div style={{ fontSize: 22, fontWeight: 900 }}>Task Manager</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.72)", marginTop: 6 }}>
              Quản lý công việc theo phòng ban
            </div>
          </div>

          <div
            style={{
              background: "rgba(255,255,255,0.08)",
              borderRadius: 16,
              padding: 14,
              lineHeight: 1.8,
            }}
          >
            <div style={{ fontSize: 13, opacity: 0.8 }}>Người dùng</div>
            <div style={{ fontWeight: 900 }}>{currentUser?.name}</div>
            <div style={{ fontSize: 13, opacity: 0.85 }}>{currentUser?.email}</div>
            <div
              style={{
                marginTop: 8,
                display: "inline-block",
                background: "#2563eb",
                borderRadius: 999,
                padding: "4px 10px",
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              {getDisplayRole(currentUser)}
            </div>
          </div>

          <div
            style={{
              background: "rgba(255,255,255,0.06)",
              borderRadius: 16,
              padding: 14,
              fontSize: 13,
              lineHeight: 1.7,
              color: "rgba(255,255,255,0.85)",
            }}
          >
            {isManagerRole(currentUser?.rawRole || currentUser?.role)
              ? `${getDisplayRole(currentUser)}: ${currentUser.name} (${currentUser.email}) đang xem toàn bộ công việc trong phòng và có thể giao việc cho nhân sự khác.`
              : `${getDisplayRole(currentUser)}: ${currentUser.name} (${currentUser.email}) chỉ xem được các công việc được giao cho chính mình.`}
          </div>

          <div style={{ marginTop: "auto", display: "grid", gap: 10 }}>
            <button onClick={openCreate} style={sidebarPrimaryBtn}>
              + Tạo công việc
            </button>
            <button onClick={onLogout} style={sidebarGhostBtn}>
              Đăng xuất
            </button>
          </div>
        </aside>

        <main style={{ padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 28, fontWeight: 900 }}>Bảng công việc</div>
              <div style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>
                {loadingTasks ? "Đang tải dữ liệu..." : `Tổng số công việc hiển thị: ${tasks.length}`}
                {canManageAll && (
                  <span style={{ marginLeft: 12 }}>
                    {loadingUsers ? " | Đang tải danh sách nhân sự..." : ` | Số nhân sự: ${users.length}`}
                  </span>
                )}
              </div>
            </div>

            <button onClick={openCreate} style={topPrimaryBtn}>
              + Tạo công việc
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {renderColumn("todo", "Chưa thực hiện", grouped.todo)}
            {renderColumn("in_progress", "Đang thực hiện", grouped.in_progress)}
            {renderColumn("done", "Hoàn thành", grouped.done)}
          </div>
        </main>
      </div>

      <TaskModal
        open={modalOpen}
        mode={modalMode}
        form={form}
        setForm={setForm}
        onClose={closeModal}
        onSubmit={submitTask}
        users={users}
        currentUser={currentUser}
        loading={submitting}
      />
    </div>
  );
}

const sidebarPrimaryBtn = {
  border: "none",
  borderRadius: 12,
  padding: "12px 14px",
  background: "#2563eb",
  color: "#fff",
  fontWeight: 800,
  cursor: "pointer",
};

const sidebarGhostBtn = {
  border: "1px solid rgba(255,255,255,0.16)",
  borderRadius: 12,
  padding: "12px 14px",
  background: "transparent",
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
};

const topPrimaryBtn = {
  border: "none",
  borderRadius: 12,
  padding: "12px 16px",
  background: "#2563eb",
  color: "#fff",
  fontWeight: 800,
  cursor: "pointer",
};

const btnPrimary = {
  border: "none",
  borderRadius: 10,
  padding: "8px 10px",
  background: "#2563eb",
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
  fontSize: 12,
};

const btnSecondary = {
  border: "1px solid #dbe3ee",
  borderRadius: 10,
  padding: "8px 10px",
  background: "#fff",
  color: "#0f172a",
  fontWeight: 700,
  cursor: "pointer",
  fontSize: 12,
};

const btnDanger = {
  border: "none",
  borderRadius: 10,
  padding: "8px 10px",
  background: "#dc2626",
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
  fontSize: 12,
};
