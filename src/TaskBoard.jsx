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

function isLeadership(currentUser) {
  const role = currentUser?.rawRole || currentUser?.role;
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
  attachments: [],
};

function fileToAttachment(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        kind: "file",
        name: file.name,
        url: reader.result,
        mime_type: file.type || "",
        size: file.size || 0,
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function DetailModal({
  open,
  currentUser,
  users,
  form,
  setForm,
  mode,
  onClose,
  onSave,
  saving,
  aiSuggestion,
  onAskAI,
}) {
  if (!open) return null;

  const leadership = isLeadership(currentUser);
  const canEditAssignment = leadership;
  const canEditTitle = leadership;
  const canEditPriority = leadership;
  const canEditDueDate = leadership;

  const addLinkAttachment = () => {
    const url = prompt("Nhập đường link tài liệu / ảnh / file:");
    if (!url) return;
    const name = prompt("Nhập tên hiển thị cho link đính kèm:", url) || url;
    setForm({
      ...form,
      attachments: [
        ...(form.attachments || []),
        {
          kind: "link",
          name,
          url,
          mime_type: "",
          size: 0,
        },
      ],
    });
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    try {
      const items = await Promise.all(files.map(fileToAttachment));
      setForm({
        ...form,
        attachments: [...(form.attachments || []), ...items],
      });
    } catch (e) {
      alert("Không đọc được file đính kèm");
    } finally {
      event.target.value = "";
    }
  };

  const removeAttachment = (index) => {
    const next = [...(form.attachments || [])];
    next.splice(index, 1);
    setForm({ ...form, attachments: next });
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.45)",
        display: "grid",
        placeItems: "center",
        zIndex: 1000,
        padding: 18,
      }}
    >
      <div
        style={{
          width: 920,
          maxWidth: "96vw",
          maxHeight: "92vh",
          overflow: "auto",
          background: "#fff",
          borderRadius: 22,
          padding: 22,
          boxShadow: "0 24px 60px rgba(15,23,42,0.22)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 16, marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 900, color: "#0f172a" }}>
              {mode === "create" ? "Tạo công việc" : "Chi tiết công việc"}
            </div>
            <div style={{ marginTop: 6, fontSize: 13, color: "#64748b", lineHeight: 1.7 }}>
              {leadership
                ? "Lãnh đạo có thể giao việc, xem chi tiết, cập nhật và theo dõi báo cáo."
                : "Chuyên viên có thể cập nhật mô tả báo cáo, đính kèm minh chứng và đổi trạng thái công việc của mình."}
            </div>
          </div>

          <button onClick={onClose} style={btnSecondary}>
            Đóng
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 18 }}>
          <div style={{ display: "grid", gap: 14 }}>
            <div>
              <label style={labelStyle}>Tiêu đề công việc</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                disabled={!canEditTitle}
                style={inputStyle(!canEditTitle)}
              />
            </div>

            <div>
              <label style={labelStyle}>Mô tả / báo cáo thực hiện</label>
              <textarea
                rows={8}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Chuyên viên có thể cập nhật báo cáo tiến độ, kết quả thực hiện, khó khăn và đề xuất tại đây."
                style={{
                  ...inputStyle(false),
                  resize: "vertical",
                  fontFamily: "inherit",
                }}
              />
            </div>

            <div>
              <label style={labelStyle}>Đính kèm minh chứng</label>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
                <button type="button" onClick={addLinkAttachment} style={btnSecondary}>
                  + Thêm link
                </button>

                <label style={{ ...btnSecondary, display: "inline-flex", alignItems: "center", cursor: "pointer" }}>
                  + Chọn file
                  <input
                    type="file"
                    multiple
                    accept=".doc,.docx,.xls,.xlsx,.ppt,.pptx,.pdf,image/*"
                    onChange={handleFileUpload}
                    style={{ display: "none" }}
                  />
                </label>
              </div>

              <div style={{ display: "grid", gap: 8 }}>
                {(form.attachments || []).length === 0 && (
                  <div style={{ fontSize: 13, color: "#94a3b8" }}>
                    Chưa có đính kèm.
                  </div>
                )}

                {(form.attachments || []).map((item, index) => (
                  <div
                    key={`${item.name}-${index}`}
                    style={{
                      border: "1px solid #e2e8f0",
                      borderRadius: 12,
                      padding: 10,
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 10,
                      alignItems: "center",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: "#0f172a", wordBreak: "break-all" }}>{item.name}</div>
                      <div style={{ fontSize: 12, color: "#64748b", wordBreak: "break-all" }}>
                        {item.kind === "link" ? "Link" : item.mime_type || "File"}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                      <a href={item.url} target="_blank" rel="noreferrer" style={btnLink}>
                        Mở
                      </a>
                      <button type="button" onClick={() => removeAttachment(index)} style={btnDanger}>
                        Xóa
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label style={labelStyle}>AI gợi ý theo công việc này</label>
              <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                <button type="button" onClick={onAskAI} style={btnPrimary}>
                  Gợi ý AI
                </button>
              </div>

              {aiSuggestion ? (
                <div
                  style={{
                    border: "1px solid #dbeafe",
                    background: "#f8fbff",
                    borderRadius: 14,
                    padding: 14,
                  }}
                >
                  <div style={{ fontWeight: 800, color: "#1d4ed8", marginBottom: 8 }}>
                    {aiSuggestion.summary}
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 18, color: "#334155", lineHeight: 1.7 }}>
                    {(aiSuggestion.suggestions || []).map((x, idx) => (
                      <li key={idx}>{x}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div style={{ fontSize: 13, color: "#94a3b8" }}>
                  Chưa có gợi ý. Bấm “Gợi ý AI” để phân tích riêng công việc này.
                </div>
              )}
            </div>
          </div>

          <div style={{ display: "grid", gap: 14, alignContent: "start" }}>
            <div>
              <label style={labelStyle}>Người được giao</label>
              {leadership ? (
                <input
                  value={form.assignee}
                  onChange={(e) => setForm({ ...form, assignee: e.target.value })}
                  list="task-user-list"
                  placeholder="Nhập email hoặc họ tên người được giao"
                  style={inputStyle(false)}
                />
              ) : (
                <input value={form.assignee} disabled style={inputStyle(true)} />
              )}

              <datalist id="task-user-list">
                {users.map((u) => (
                  <option key={u.id} value={u.email}>
                    {u.full_name} ({getRoleLabel(u.role)})
                  </option>
                ))}
              </datalist>
            </div>

            <div>
              <label style={labelStyle}>Ưu tiên</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                disabled={!canEditPriority}
                style={inputStyle(!canEditPriority)}
              >
                <option value="low">Thấp</option>
                <option value="medium">Trung bình</option>
                <option value="high">Cao</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Hạn hoàn thành</label>
              <input
                type="date"
                value={form.due_date || ""}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                disabled={!canEditDueDate}
                style={inputStyle(!canEditDueDate)}
              />
            </div>

            <div>
              <label style={labelStyle}>Trạng thái báo cáo / công việc</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                style={inputStyle(false)}
              >
                <option value="todo">Chưa thực hiện</option>
                <option value="in_progress">Đang thực hiện</option>
                <option value="done">Hoàn thành</option>
              </select>
            </div>

            <div style={{ border: "1px solid #e2e8f0", borderRadius: 14, padding: 14, background: "#f8fafc" }}>
              <div style={{ fontWeight: 800, marginBottom: 8 }}>Nguyên tắc cập nhật</div>
              <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.7 }}>
                - Chuyên viên cập nhật mô tả để làm báo cáo.<br />
                - Chuyên viên chọn đúng trạng thái hiện tại rồi bấm <b>Lưu</b>.<br />
                - Sau khi lưu, công việc sẽ chuyển cột trạng thái tương ứng ở cả hai phía.
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button type="button" onClick={onClose} style={btnSecondary}>
                Hủy
              </button>
              <button type="button" onClick={onSave} style={btnPrimary} disabled={saving}>
                {saving ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Column({ title, items, onOpenDetail }) {
  return (
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
              {task.description || "Chưa có mô tả / báo cáo"}
            </div>

            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>
              Người được giao: <b>{task.assignee || "Chưa gán"}</b>
            </div>

            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>
              Ưu tiên: <b>{task.priority}</b>
            </div>

            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>
              Hạn: <b>{task.due_date || "Chưa đặt"}</b>
            </div>

            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 10 }}>
              Đính kèm: <b>{(task.attachments || []).length}</b>
            </div>

            <button onClick={() => onOpenDetail(task)} style={btnPrimary}>
              Chi tiết / Cập nhật
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TaskBoard({ currentUser, onLogout }) {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailMode, setDetailMode] = useState("create");
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);

  const [aiSuggestion, setAiSuggestion] = useState(null);

  const leadership = isLeadership(currentUser);

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
    if (!leadership) {
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
  }, [leadership]);

  useEffect(() => {
    loadTasks();
    loadUsers();
  }, [loadTasks, loadUsers]);

  useEffect(() => {
    const timer = setInterval(() => {
      loadTasks();
    }, 8000);

    return () => clearInterval(timer);
  }, [loadTasks]);

  const grouped = useMemo(() => {
    return {
      todo: tasks.filter((t) => t.status === "todo"),
      in_progress: tasks.filter((t) => t.status === "in_progress"),
      done: tasks.filter((t) => t.status === "done"),
    };
  }, [tasks]);

  const openCreate = () => {
    setDetailMode("create");
    setEditingTaskId(null);
    setAiSuggestion(null);
    setForm({
      ...DEFAULT_FORM,
      assignee: leadership ? "" : (currentUser?.email || ""),
    });
    setDetailOpen(true);
  };

  const openDetail = (task) => {
    setDetailMode("edit");
    setEditingTaskId(task.id);
    setAiSuggestion(null);
    setForm({
      title: task.title || "",
      description: task.description || "",
      assignee: task.assignee || "",
      priority: task.priority || "medium",
      due_date: task.due_date || "",
      status: task.status || "todo",
      attachments: task.attachments || [],
    });
    setDetailOpen(true);
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setEditingTaskId(null);
    setAiSuggestion(null);
    setForm(DEFAULT_FORM);
  };

  const saveTask = async () => {
    if (!form.title.trim()) {
      alert("Bạn cần nhập tiêu đề công việc");
      return;
    }

    if (leadership && !form.assignee.trim()) {
      alert("Bạn cần nhập người được giao");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        ...form,
        assignee: leadership ? form.assignee.trim() : (currentUser?.email || ""),
      };

      const url =
        detailMode === "create"
          ? `${API_BASE}/tasks`
          : `${API_BASE}/tasks/${editingTaskId}`;

      const method = detailMode === "create" ? "POST" : "PUT";

      const res = await authFetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Lưu công việc thất bại");

      closeDetail();
      await loadTasks();
      alert("Đã lưu công việc");
    } catch (e) {
      alert(`Lưu công việc thất bại: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const askAI = async () => {
    if (!editingTaskId) {
      alert("Hãy mở chi tiết một công việc đã có để lấy gợi ý AI.");
      return;
    }

    try {
      const res = await authFetch(`${API_BASE}/ai/suggest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ task_id: editingTaskId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Không lấy được gợi ý AI");

      setAiSuggestion(data);
    } catch (e) {
      alert(e.message);
    }
  };

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
            {leadership
              ? `${getDisplayRole(currentUser)}: xem toàn bộ công việc, giao việc cho nhân sự và theo dõi báo cáo tiến độ.`
              : `${getDisplayRole(currentUser)}: chỉ xem các công việc được giao cho mình, cập nhật mô tả báo cáo, đính kèm minh chứng và đổi trạng thái.`}
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
                {leadership && (
                  <span style={{ marginLeft: 12 }}>
                    {loadingUsers ? " | Đang tải nhân sự..." : ` | Số nhân sự: ${users.length}`}
                  </span>
                )}
              </div>
            </div>

            <button onClick={openCreate} style={topPrimaryBtn}>
              + Tạo công việc
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            <Column title="Chưa thực hiện" items={grouped.todo} onOpenDetail={openDetail} />
            <Column title="Đang thực hiện" items={grouped.in_progress} onOpenDetail={openDetail} />
            <Column title="Hoàn thành" items={grouped.done} onOpenDetail={openDetail} />
          </div>
        </main>
      </div>

      <DetailModal
        open={detailOpen}
        currentUser={currentUser}
        users={users}
        form={form}
        setForm={setForm}
        mode={detailMode}
        onClose={closeDetail}
        onSave={saveTask}
        saving={saving}
        aiSuggestion={aiSuggestion}
        onAskAI={askAI}
      />
    </div>
  );
}

const labelStyle = {
  display: "block",
  marginBottom: 6,
  fontSize: 12,
  fontWeight: 800,
  color: "#334155",
};

function inputStyle(disabled) {
  return {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid #dbe3ee",
    boxSizing: "border-box",
    background: disabled ? "#f8fafc" : "#fff",
    color: disabled ? "#64748b" : "#0f172a",
  };
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
  padding: "8px 12px",
  background: "#2563eb",
  color: "#fff",
  fontWeight: 800,
  cursor: "pointer",
  textDecoration: "none",
};

const btnSecondary = {
  border: "1px solid #dbe3ee",
  borderRadius: 10,
  padding: "8px 12px",
  background: "#fff",
  color: "#0f172a",
  fontWeight: 700,
  cursor: "pointer",
  textDecoration: "none",
};

const btnDanger = {
  border: "none",
  borderRadius: 10,
  padding: "8px 12px",
  background: "#dc2626",
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
};

const btnLink = {
  border: "1px solid #dbe3ee",
  borderRadius: 10,
  padding: "8px 12px",
  background: "#fff",
  color: "#0f172a",
  fontWeight: 700,
  cursor: "pointer",
  textDecoration: "none",
};
