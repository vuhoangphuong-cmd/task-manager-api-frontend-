

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

function formatAttachmentSize(size) {
  if (!size || size <= 0) return "";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}
import { useCallback, useEffect, useMemo, useState } from "react";


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

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";
const TOKEN_KEY = "task_manager_access_token";
const nativeFetch = window.fetch.bind(window);

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
const TASK_META_KEY = "khth_task_meta_v3";

const STATUS_OPTIONS = [
  {
    value: "todo",
    label: "Chưa thực hiện",
    chipBg: "#f8fafc",
    chipColor: "#475569",
    border: "#e2e8f0",
    accent: "#cbd5e1",
    rowBg: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
  },
  {
    value: "in_progress",
    label: "Đang thực hiện",
    chipBg: "#fef3c7",
    chipColor: "#b45309",
    border: "#fcd34d",
    accent: "#f59e0b",
    rowBg: "linear-gradient(180deg, #ffffff 0%, #fffaf0 100%)",
  },
  {
    value: "done",
    label: "Hoàn thành",
    chipBg: "#dcfce7",
    chipColor: "#15803d",
    border: "#86efac",
    accent: "#22c55e",
    rowBg: "linear-gradient(180deg, #ffffff 0%, #f3fff9 100%)",
  },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Thấp" },
  { value: "medium", label: "Trung bình" },
  { value: "high", label: "Cao" },
];

const REPORT_ACTION_OPTIONS = [
  { value: "de_nghi_phe_duyet", label: "Đề nghị phê duyệt" },
  { value: "da_hoan_thanh", label: "Đã hoàn thành" },
  { value: "xin_gia_han", label: "Xin gia hạn" },
];

function loadTaskMeta() {
  try {
    const raw = localStorage.getItem(TASK_META_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveTaskMeta(meta) {
  localStorage.setItem(TASK_META_KEY, JSON.stringify(meta));
}

function getStatusMeta(status) {
  return STATUS_OPTIONS.find((item) => item.value === status) || STATUS_OPTIONS[0];
}

function isOverdue(workItem) {
  if (!workItem?.due_date || workItem?.status === "done") return false;
  const today = new Date();
  const due = new Date(workItem.due_date);
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return due < today;
}

function formatDate(dateStr) {
  if (!dateStr) return "Chưa có";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("vi-VN");
}

function formatDateTime(dateStr) {
  if (!dateStr) return "Chưa có";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return `${d.toLocaleDateString("vi-VN")} ${d.toLocaleTimeString("vi-VN")}`;
}

function priorityStyle(priority) {
  switch (priority) {
    case "high":
      return { bg: "#fef2f2", color: "#b91c1c", border: "#fecaca", label: "Cao" };
    case "medium":
      return { bg: "#fff7ed", color: "#c2410c", border: "#fed7aa", label: "Trung bình" };
    default:
      return { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe", label: "Thấp" };
  }
}

function getSignalFromText(text = "") {
  const normalized = text.toLowerCase();
  if (normalized.includes("[de_nghi_phe_duyet]")) return "de_nghi_phe_duyet";
  if (normalized.includes("[da_hoan_thanh]")) return "da_hoan_thanh";
  if (normalized.includes("[xin_gia_han]")) return "xin_gia_han";
  return "";
}

function stripSignalTags(text = "") {
  return text
    .replace(/\[de_nghi_phe_duyet\]/gi, "")
    .replace(/\[da_hoan_thanh\]/gi, "")
    .replace(/\[xin_gia_han\]/gi, "")
    .trim();
}

function buildDescriptionWithSignal(baseDescription, reportText, reportAction) {
  const cleanBase = stripSignalTags(baseDescription || "");
  const cleanReport = (reportText || "").trim();

  const signalTag =
    reportAction === "de_nghi_phe_duyet"
      ? "[de_nghi_phe_duyet]"
      : reportAction === "da_hoan_thanh"
      ? "[da_hoan_thanh]"
      : reportAction === "xin_gia_han"
      ? "[xin_gia_han]"
      : "";

  const parts = [cleanBase];
  if (cleanReport) parts.push(`Báo cáo: ${cleanReport}`);
  if (signalTag) parts.push(signalTag);

  return parts.filter(Boolean).join("\n");
}

function mergeTasksWithMeta(tasks, metaStore) {
  return tasks.map((task) => ({
    ...task,
    meta: metaStore[String(task.id)] || {},
  }));
}

function readFilesAsDataUrls(files) {
  return Promise.all(
    files.map(
      (file) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            resolve({
              name: file.name,
              type: file.type || "application/octet-stream",
              size: file.size || 0,
              dataUrl: reader.result,
            });
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        })
    )
  );
}

function IconDashboard() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.8"/>
      <rect x="14" y="3" width="7" height="11" rx="2" stroke="currentColor" strokeWidth="1.8"/>
      <rect x="3" y="14" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.8"/>
      <rect x="14" y="18" width="7" height="3" rx="1.5" stroke="currentColor" strokeWidth="1.8"/>
    </svg>
  );
}

function IconSparkles() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M12 3L13.8 8.2L19 10L13.8 11.8L12 17L10.2 11.8L5 10L10.2 8.2L12 3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
      <path d="M19 16L19.8 18.2L22 19L19.8 19.8L19 22L18.2 19.8L16 19L18.2 18.2L19 16Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
    </svg>
  );
}

function IconFilter() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M4 6H20M7 12H17M10 18H14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

function IconHistory() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M4 12A8 8 0 1 0 6.34 6.34" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M4 4V10H10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 8V12L15 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconWork() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="4" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M8 12L10.5 14.5L16 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconUpload() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M12 16V5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M8.5 8.5L12 5L15.5 8.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5 19H19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

function IconApprove() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M5 12L10 17L19 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconLogout() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M10 17L15 12L10 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M15 12H4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M20 4V20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

function IconSwitch() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M16 3H21V8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8 21H3V16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M20 8C18.5 5.5 15.6 4 12.5 4C8.4 4 5 7.4 5 11.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M4 16C5.5 18.5 8.4 20 11.5 20C15.6 20 19 16.6 19 12.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at 0% 0%, rgba(59,130,246,0.10), transparent 24%), radial-gradient(circle at 100% 0%, rgba(16,185,129,0.08), transparent 18%), linear-gradient(180deg, #f8fbff 0%, #f3f6fb 55%, #eef3f8 100%)",
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    color: "#0f172a",
  },
  shell: {
    display: "grid",
    gridTemplateColumns: "260px minmax(0, 1fr)",
    minHeight: "100vh",
  },
  sidebar: {
    background: "linear-gradient(180deg, #0b1220 0%, #111c2f 52%, #10233b 100%)",
    color: "#e2e8f0",
    padding: "22px 16px",
    borderRight: "1px solid rgba(255,255,255,0.06)",
    boxShadow: "20px 0 50px rgba(15,23,42,0.16)",
    position: "sticky",
    top: 0,
    height: "100vh",
    boxSizing: "border-box",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 22,
  },
  brandIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    background: "linear-gradient(135deg, #2563eb 0%, #0f766e 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    boxShadow: "0 12px 28px rgba(37,99,235,0.28)",
    flexShrink: 0,
  },
  brandTitle: {
    fontSize: 15,
    fontWeight: 850,
    letterSpacing: "-0.03em",
    color: "#fff",
  },
  brandSub: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 2,
  },
  sideCard: {
    borderRadius: 18,
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    padding: 12,
    marginBottom: 12,
    backdropFilter: "blur(10px)",
  },
  sideSectionTitle: {
    fontSize: 10.5,
    fontWeight: 800,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#94a3b8",
    marginBottom: 8,
  },
  sideRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: 12.5,
    padding: "8px 0",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    gap: 8,
  },
  sidePill: {
    minWidth: 28,
    height: 22,
    borderRadius: 999,
    background: "rgba(255,255,255,0.09)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 10.5,
    fontWeight: 800,
    color: "#fff",
    padding: "0 8px",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  main: {
    padding: "20px 20px 24px",
  },
  topbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 14,
    marginBottom: 16,
  },
  topbarLeft: {
    display: "flex",
    flexDirection: "column",
    gap: 5,
  },
  pageTitle: {
    margin: 0,
    fontSize: 26,
    fontWeight: 900,
    letterSpacing: "-0.04em",
    color: "#0f172a",
  },
  pageDesc: {
    margin: 0,
    fontSize: 12.5,
    color: "#64748b",
    lineHeight: 1.6,
  },
  topbarRight: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  topBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "9px 13px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.82)",
    border: "1px solid #e2e8f0",
    boxShadow: "0 8px 20px rgba(15,23,42,0.05)",
    color: "#334155",
    fontSize: 11.5,
    fontWeight: 800,
  },
  topAction: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "9px 13px",
    borderRadius: 999,
    background: "#fff",
    border: "1px solid #dbe3ee",
    color: "#334155",
    fontSize: 11.5,
    fontWeight: 800,
    cursor: "pointer",
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "#22c55e",
    boxShadow: "0 0 0 4px rgba(34,197,94,0.16)",
  },
  statGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 20,
    background: "rgba(255,255,255,0.88)",
    border: "1px solid rgba(226,232,240,0.95)",
    padding: 14,
    boxShadow: "0 14px 34px rgba(15,23,42,0.06)",
    cursor: "pointer",
  },
  statCardActive: {
    border: "1px solid #93c5fd",
    boxShadow: "0 12px 30px rgba(37,99,235,0.12)",
  },
  statGlow: {
    position: "absolute",
    right: -18,
    top: -18,
    width: 84,
    height: 84,
    borderRadius: "50%",
    background: "rgba(59,130,246,0.08)",
    filter: "blur(10px)",
  },
  statLabel: {
    fontSize: 11.5,
    color: "#64748b",
    marginBottom: 8,
    fontWeight: 700,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 900,
    letterSpacing: "-0.04em",
    lineHeight: 1,
    color: "#0f172a",
  },
  statSub: {
    marginTop: 7,
    fontSize: 11.5,
    color: "#94a3b8",
  },
  card: {
    background: "rgba(255,255,255,0.88)",
    border: "1px solid rgba(226,232,240,0.95)",
    borderRadius: 20,
    padding: 16,
    boxShadow: "0 14px 34px rgba(15,23,42,0.06)",
    backdropFilter: "blur(10px)",
    marginBottom: 16,
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },
  sectionTitleWrap: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 12,
    background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
    color: "#1d4ed8",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid #bfdbfe",
    flexShrink: 0,
  },
  sectionTitle: {
    margin: 0,
    fontSize: 16,
    fontWeight: 850,
    letterSpacing: "-0.03em",
  },
  sectionSub: {
    fontSize: 11.5,
    color: "#94a3b8",
    marginTop: 4,
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #dbe3ee",
    background: "#fff",
    fontSize: 12.5,
    outline: "none",
    boxSizing: "border-box",
    color: "#0f172a",
  },
  textarea: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #dbe3ee",
    background: "#fff",
    fontSize: 12.5,
    outline: "none",
    boxSizing: "border-box",
    color: "#0f172a",
    resize: "vertical",
  },
  label: {
    display: "block",
    marginBottom: 6,
    fontSize: 10.5,
    fontWeight: 800,
    color: "#475569",
    letterSpacing: "0.04em",
    textTransform: "uppercase",
  },
  btnPrimary: {
    padding: "10px 14px",
    borderRadius: 12,
    border: "none",
    background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer",
    fontSize: 12,
    boxShadow: "0 12px 26px rgba(37,99,235,0.22)",
  },
  btnSecondary: {
    padding: "6px 8px",
    borderRadius: 10,
    border: "1px solid #dbe3ee",
    background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
    color: "#334155",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 10.5,
    width: "100%",
  },
  btnDanger: {
    padding: "5px 10px",
    borderRadius: 999,
    border: "1px solid #fecaca",
    background: "linear-gradient(180deg, #fff7f7 0%, #fff1f1 100%)",
    color: "#b91c1c",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 10.5,
    whiteSpace: "nowrap",
  },
  btnAi: {
    padding: "9px 12px",
    borderRadius: 12,
    border: "1px solid #bfdbfe",
    background: "linear-gradient(180deg, #eff6ff 0%, #dbeafe 100%)",
    color: "#1d4ed8",
    fontWeight: 800,
    cursor: "pointer",
    fontSize: 11.5,
  },
  checkboxWrap: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "linear-gradient(180deg, #fff8f1 0%, #fff3e6 100%)",
    border: "1px solid #fed7aa",
    borderRadius: 12,
    padding: "10px 12px",
    minHeight: 42,
    boxSizing: "border-box",
  },
  dashboardGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.9fr) 420px",
    gap: 16,
    alignItems: "start",
  },
  boardCard: {
    background: "rgba(255,255,255,0.72)",
    border: "1px solid rgba(226,232,240,0.92)",
    borderRadius: 22,
    padding: 12,
    boxShadow: "0 16px 36px rgba(15,23,42,0.05)",
    backdropFilter: "blur(12px)",
  },
  boardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    padding: "4px 6px 12px",
  },
  boardTitle: {
    fontSize: 16,
    fontWeight: 850,
    letterSpacing: "-0.03em",
  },
  boardSub: {
    fontSize: 11.5,
    color: "#94a3b8",
    marginTop: 4,
  },
  boardRows: {
    display: "grid",
    gap: 10,
  },
  flowRow: {
    display: "grid",
    gridTemplateColumns: "150px minmax(0, 1fr)",
    gap: 10,
    alignItems: "start",
  },
  rowLabelCard: {
    borderRadius: 16,
    padding: 10,
    border: "1px solid #e2e8f0",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8)",
  },
  rowLabelTitle: {
    fontSize: 12,
    fontWeight: 850,
    lineHeight: 1.25,
    color: "#0f172a",
    margin: 0,
  },
  rowLabelCount: {
    marginTop: 8,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 28,
    height: 24,
    padding: "0 8px",
    borderRadius: 999,
    background: "#fff",
    border: "1px solid #e2e8f0",
    fontSize: 10.5,
    fontWeight: 850,
    color: "#334155",
  },
  rowContent: {
    display: "grid",
    gap: 8,
  },
  emptyRow: {
    color: "#94a3b8",
    fontSize: 11.5,
    padding: "10px 12px",
    border: "1px dashed #cbd5e1",
    borderRadius: 14,
    background: "rgba(255,255,255,0.7)",
  },
  workCard: {
    position: "relative",
    overflow: "hidden",
    background: "linear-gradient(180deg, #ffffff 0%, #fbfdff 100%)",
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    padding: 10,
    boxShadow: "0 10px 18px rgba(15,23,42,0.04)",
    cursor: "pointer",
  },
  workTopBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  workLayout: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) 120px",
    gap: 10,
    alignItems: "start",
  },
  workMain: {
    display: "grid",
    gap: 6,
    minWidth: 0,
  },
  workActions: {
    display: "grid",
    gap: 5,
    alignSelf: "start",
  },
  detailPanel: {
    position: "sticky",
    top: 20,
    borderRadius: 22,
    padding: 16,
    background: "rgba(255,255,255,0.9)",
    border: "1px solid rgba(226,232,240,0.95)",
    boxShadow: "0 16px 38px rgba(15,23,42,0.08)",
    backdropFilter: "blur(12px)",
  },
  subCard: {
    background: "linear-gradient(180deg, #f8fafc 0%, #f4f8fb 100%)",
    border: "1px solid #e2e8f0",
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  roleBanner: {
    padding: "10px 12px",
    borderRadius: 12,
    marginBottom: 12,
    fontSize: 11.5,
    fontWeight: 700,
    lineHeight: 1.6,
  },
  attachmentItem: {
    display: "block",
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 10,
    padding: "8px 10px",
    fontSize: 11.5,
    color: "#1d4ed8",
    marginTop: 6,
    textDecoration: "none",
    wordBreak: "break-all",
  },
};

function ResultStatusPill({ status }) {
  const active = status || "todo";

  const map = {
    todo: {
      label: "Chưa làm",
      background: "#ffffff",
      color: "#0f172a",
      border: "#e2e8f0",
    },
    in_progress: {
      label: "Đang làm",
      background: "#fde68a",
      color: "#92400e",
      border: "#fcd34d",
    },
    done: {
      label: "Đã hoàn thành",
      background: "#86efac",
      color: "#166534",
      border: "#4ade80",
    },
  };

  const current = map[active] || map.todo;

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 92,
        padding: "5px 10px",
        borderRadius: 999,
        fontSize: 10.5,
        fontWeight: 800,
        background: current.background,
        color: current.color,
        border: `1px solid ${current.border}`,
        whiteSpace: "nowrap",
      }}
    >
      {current.label}
    </div>
  );
}

function Sidebar({ workItems, currentUser, onLogout, onSwitchAccount }) {
  const total = workItems.length;
  const todo = workItems.filter((w) => w.status === "todo").length;
  const inProgress = workItems.filter((w) => w.status === "in_progress").length;
  const done = workItems.filter((w) => w.status === "done").length;
  const overdue = workItems.filter((w) => isOverdue(w)).length;

  return (
    <aside style={styles.sidebar}>
      <div style={styles.brand}>
        <div style={styles.brandIcon}>
          <IconDashboard />
        </div>
        <div>
          <div style={styles.brandTitle}>Phòng KHTH</div>
          <div style={styles.brandSub}>Không gian làm việc realtime</div>
        </div>
      </div>

      <div style={styles.sideCard}>
        <div style={styles.sideSectionTitle}>Tài khoản đăng nhập</div>
        <div style={{ marginBottom: 6, fontSize: 13, color: "#fff", fontWeight: 800 }}>
          {currentUser.name}
        </div>
        <div style={{ marginBottom: 8, fontSize: 11.5, color: "#94a3b8", wordBreak: "break-word" }}>
          {currentUser.email}
        </div>
        <div style={{ ...styles.sideRow, borderBottom: "none" }}>
          <span>Vai trò</span>
          <span style={styles.sidePill}>
            {isManagerRole(currentUser?.role) ? "Manager" : "Staff"}
          </span>
        </div>
      </div>

      <div style={styles.sideCard}>
        <div style={styles.sideSectionTitle}>Tổng quan</div>
        <div style={styles.sideRow}>
          <span>Tổng công việc</span>
          <span style={styles.sidePill}>{total}</span>
        </div>
        <div style={styles.sideRow}>
          <span>Chưa thực hiện</span>
          <span style={styles.sidePill}>{todo}</span>
        </div>
        <div style={styles.sideRow}>
          <span>Đang thực hiện</span>
          <span style={styles.sidePill}>{inProgress}</span>
        </div>
        <div style={{ ...styles.sideRow, borderBottom: "none" }}>
          <span>Hoàn thành</span>
          <span style={styles.sidePill}>{done}</span>
        </div>
      </div>

      <div style={styles.sideCard}>
        <div style={styles.sideSectionTitle}>Cần chú ý</div>
        <div style={{ ...styles.sideRow, borderBottom: "none" }}>
          <span>Công việc quá hạn</span>
          <span
            style={{
              ...styles.sidePill,
              background: "rgba(239,68,68,0.12)",
              color: "#fecaca",
              border: "1px solid rgba(239,68,68,0.18)",
            }}
          >
            {overdue}
          </span>
        </div>
      </div>

      <div style={styles.sideCard}>
        <div style={styles.sideSectionTitle}>Tài khoản</div>

        <button
          onClick={onSwitchAccount}
          style={{ ...styles.topAction, width: "100%", justifyContent: "center", marginBottom: 8 }}
        >
          <IconSwitch />
          Đổi tài khoản
        </button>

        <button
          onClick={onLogout}
          style={{ ...styles.topAction, width: "100%", justifyContent: "center" }}
        >
          <IconLogout />
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}

function Topbar({ currentUser, onLogout, onSwitchAccount }) {
  return (
    <div style={styles.topbar}>
      <div style={styles.topbarLeft}>
        <h1 style={styles.pageTitle}>Bảng quản lý công việc phòng KHTH</h1>
        <p style={styles.pageDesc}>
          Xin chào {currentUser.name}. Hệ thống đang hiển thị dữ liệu theo tài khoản đăng nhập hiện tại.
        </p>
      </div>

      <div style={styles.topbarRight}>
        <button onClick={onSwitchAccount} style={styles.topAction}>
          <IconSwitch />
          Đổi tài khoản
        </button>

        <button onClick={onLogout} style={styles.topAction}>
          <IconLogout />
          Đăng xuất
        </button>

        <div style={styles.topBadge}>
          <span style={styles.liveDot} />
          {isManagerRole(currentUser?.role) ? "Chế độ lãnh đạo" : "Chế độ nhân viên"}
        </div>
      </div>
    </div>
  );
}

function Stats({ workItems, activeOverview, setActiveOverview }) {
  const total = workItems.length;
  const inProgress = workItems.filter((w) => w.status === "in_progress").length;
  const done = workItems.filter((w) => w.status === "done").length;
  const overdue = workItems.filter((w) => isOverdue(w)).length;

  const items = [
    { key: "all", label: "Tổng công việc", value: total, sub: "Hiển thị toàn bộ công việc hiện có" },
    { key: "in_progress", label: "Đang thực hiện", value: inProgress, sub: "Các công việc đang xử lý" },
    { key: "done", label: "Hoàn thành", value: done, sub: "Công việc đã hoàn thành" },
    { key: "overdue", label: "Quá hạn", value: overdue, sub: "Công việc cần ưu tiên" },
  ];

  return (
    <div style={styles.statGrid}>
      {items.map((item) => (
        <div
          key={item.key}
          style={{
            ...styles.statCard,
            ...(activeOverview === item.key ? styles.statCardActive : {}),
          }}
          onClick={() => setActiveOverview(item.key)}
        >
          <div style={styles.statGlow} />
          <div style={styles.statLabel}>{item.label}</div>
          <div style={styles.statValue}>{item.value}</div>
          <div style={styles.statSub}>{item.sub}</div>
        </div>
      ))}
    </div>
  );
}

function OverviewDashboard({ workItems, activeOverview }) {
  const filtered = workItems.filter((w) => {
    if (activeOverview === "all") return true;
    if (activeOverview === "overdue") return isOverdue(w);
    return w.status === activeOverview;
  });

  return (
    <div style={styles.card}>
      <div style={styles.sectionHeader}>
        <div style={styles.sectionTitleWrap}>
          <div style={styles.sectionIcon}>
            <IconDashboard />
          </div>
          <div>
            <div style={styles.sectionTitle}>Chi tiết tổng quan</div>
            <div style={styles.sectionSub}>
              {activeOverview === "all" && "Đang hiển thị toàn bộ công việc"}
              {activeOverview === "in_progress" && "Đang hiển thị nhóm công việc đang thực hiện"}
              {activeOverview === "done" && "Đang hiển thị nhóm công việc đã hoàn thành"}
              {activeOverview === "overdue" && "Đang hiển thị nhóm công việc quá hạn"}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        {filtered.length === 0 ? (
          <div style={{ color: "#94a3b8", fontSize: 11.5, padding: "10px 12px" }}>
            Không có công việc trong nhóm tổng quan này.
          </div>
        ) : (
          filtered.map((w) => {
            const statusMeta = getStatusMeta(w.status);
            const overdue = isOverdue(w);
            const pStyle = priorityStyle(w.priority);

            return (
              <div
                key={`overview-${w.id}`}
                style={{
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 14,
                  padding: 10,
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1fr) auto auto",
                  gap: 10,
                  alignItems: "center",
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>
                    {w.title}
                  </div>
                  <div style={{ fontSize: 11.5, color: "#64748b", lineHeight: 1.5 }}>
                    {w.assignee || "Chưa gán"} • Hạn: {formatDate(w.due_date)}
                    {overdue ? " • QUÁ HẠN" : ""}
                  </div>
                </div>

                <span
                  style={{
                    padding: "5px 8px",
                    borderRadius: 999,
                    fontSize: 10.5,
                    fontWeight: 800,
                    color: statusMeta.chipColor,
                    background: statusMeta.chipBg,
                    border: `1px solid ${statusMeta.border}`,
                    whiteSpace: "nowrap",
                  }}
                >
                  {statusMeta.label}
                </span>

                <span
                  style={{
                    padding: "5px 8px",
                    borderRadius: 999,
                    fontSize: 10.5,
                    fontWeight: 800,
                    background: pStyle.bg,
                    color: pStyle.color,
                    border: `1px solid ${pStyle.border}`,
                    whiteSpace: "nowrap",
                  }}
                >
                  {pStyle.label}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function CreateWorkForm({ onCreated, currentUser }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigner, setAssigner] = useState("");
  const [assignee, setAssignee] = useState(currentUser.roleLabel === "staff" ? currentUser.name : "");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [resultStatus, setResultStatus] = useState("todo");
  const [priority, setPriority] = useState("medium");

  
useEffect(() => {
  if (!isManagerRole(currentUser?.rawRole || currentUser?.role)) return;

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const res = await authFetch(`${API_BASE}/users`);
      if (!res.ok) throw new Error("Load users failed");
      const data = await res.json();
      setUsers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingUsers(false);
    }
  };

  loadUsers();
}, [currentUser]);

useEffect(() => {
    if (currentUser.roleLabel === "staff") {
      setAssignee(currentUser.name);
    }
  }, [currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      alert("Bạn cần nhập tiêu đề công việc");
      return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      assignee: (currentUser.roleLabel === "staff" ? currentUser.name : assignee.trim()) || "",
      priority,
      due_date: dueDate || null,
      status: resultStatus,
    };

    const res = await authFetch(`${API_BASE}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      alert(`Tạo công việc thất bại${errText ? ": " + errText : ""}`);
      return;
    }

    let createdTaskId = null;

    try {
      const maybeJson = await res.json();
      if (maybeJson && maybeJson.id !== undefined && maybeJson.id !== null) {
        createdTaskId = maybeJson.id;
      }
    } catch {}

    const listRes = await authFetch(`${API_BASE}/tasks`);
    const listData = await listRes.json().catch(() => []);
    const tasks = Array.isArray(listData) ? listData : [];

    if (!createdTaskId) {
      const matched = [...tasks].reverse().find(
        (t) =>
          (t.title || "").trim() === payload.title &&
          (t.assignee || "").trim() === payload.assignee &&
          (t.status || "").trim() === payload.status
      );
      if (matched?.id !== undefined && matched?.id !== null) {
        createdTaskId = matched.id;
      }
    }

    if (createdTaskId !== null) {
      const metaStore = loadTaskMeta();
      metaStore[String(createdTaskId)] = {
        assigner: assigner.trim(),
        start_date: startDate || "",
        result_status: resultStatus,
        raw_description: description.trim(),
        created_by_role: currentUser.roleLabel,
        created_by_name: currentUser.name,
        attachments: [],
      };
      saveTaskMeta(metaStore);
    }

    setTitle("");
    setDescription("");
    setAssigner("");
    setStartDate("");
    setDueDate("");
    setResultStatus("todo");
    setPriority("medium");
    if (currentUser.roleLabel !== "staff") setAssignee("");

    await onCreated?.();
    alert("Đã lưu công việc thành công");
  };

  return (
    <form onSubmit={handleSubmit} style={styles.card}>
      <div style={styles.sectionHeader}>
        <div style={styles.sectionTitleWrap}>
          <div style={styles.sectionIcon}>
            <IconWork />
          </div>
          <div>
            <div style={styles.sectionTitle}>Tạo công việc mới</div>
            <div style={styles.sectionSub}>Nhập đầy đủ thông tin công việc để hiển thị ở cả màn hình nhân viên và lãnh đạo</div>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            currentUser.roleLabel === "staff"
              ? "1.5fr 1.5fr 1fr 1fr 1fr 1fr auto"
              : "1.2fr 1.2fr 1fr 1fr 1fr 1fr 1fr auto",
          gap: 12,
          alignItems: "end",
        }}
      >
        <div>
          <label style={styles.label}>Tiêu đề</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={styles.input}
            placeholder="Nhập tiêu đề công việc"
          />
        </div>

        <div>
          <label style={styles.label}>Mô tả công việc đã thực hiện</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={styles.input}
            placeholder="Nhập mô tả"
          />
        </div>

        <div>
          <label style={styles.label}>Người giao việc</label>
          <input
            value={assigner}
            onChange={(e) => setAssigner(e.target.value)}
            style={styles.input}
            placeholder="Nhập người giao việc"
          />
        </div>

        {isManagerRole(currentUser?.role) && (
          <div>
            <label style={styles.label}>Người thực hiện</label>
            <input
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              style={styles.input}
              placeholder="Nhập người thực hiện"
            />
          </div>
        )}

        <div>
          <label style={styles.label}>Ngày bắt đầu</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={styles.input} />
        </div>

        <div>
          <label style={styles.label}>Ngày đến hạn</label>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={styles.input} />
        </div>

        <div>
          <label style={styles.label}>Kết quả công việc</label>
          <select value={resultStatus} onChange={(e) => setResultStatus(e.target.value)} style={styles.input}>
            <option value="todo">Chưa bắt đầu</option>
            <option value="in_progress">Đang làm</option>
            <option value="done">Đã hoàn thành</option>
          </select>
        </div>

        <button type="submit" style={styles.btnPrimary}>
          Tạo công việc
        </button>
      </div>
    </form>
  );
}

function FilterBar({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  assigneeFilter,
  setAssigneeFilter,
  overdueOnly,
  setOverdueOnly,
  currentUser,
}) {
  return (
    <div style={styles.card}>
      <div style={styles.sectionHeader}>
        <div style={styles.sectionTitleWrap}>
          <div style={styles.sectionIcon}>
            <IconFilter />
          </div>
          <div>
            <div style={styles.sectionTitle}>Bộ lọc</div>
            <div style={styles.sectionSub}>Lọc nhanh theo nội dung, trạng thái và quá hạn</div>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            currentUser.roleLabel === "staff" ? "2fr 1fr auto" : "2fr 1fr 1fr auto",
          gap: 12,
          alignItems: "end",
        }}
      >
        <div>
          <label style={styles.label}>Tìm kiếm</label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tiêu đề / mô tả / người thực hiện"
            style={styles.input}
          />
        </div>

        <div>
          <label style={styles.label}>Trạng thái</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={styles.input}>
            <option value="all">Tất cả</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {isManagerRole(currentUser?.role) && (
          <div>
            <label style={styles.label}>Người thực hiện</label>
            <input
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              placeholder="Ví dụ: Nguyễn Văn A"
              style={styles.input}
            />
          </div>
        )}

        <label style={styles.checkboxWrap}>
          <input type="checkbox" checked={overdueOnly} onChange={(e) => setOverdueOnly(e.target.checked)} />
          <span style={{ fontSize: 12, fontWeight: 800, color: "#9a3412" }}>
            Chỉ công việc quá hạn
          </span>
        </label>
      </div>
    </div>
  );
}

function WorkCard({ workItem, onSelect, onMove, onDelete, currentUser }) {
  const statusMeta = getStatusMeta(workItem.status);
  const overdue = isOverdue(workItem);
  const pStyle = priorityStyle(workItem.priority);
  const signal = getSignalFromText(workItem.description || "");
  const isManager = isManagerRole(currentUser?.role);
  const meta = workItem.meta || {};

  return (
    <div
      onClick={() => onSelect(workItem)}
      style={{
        ...styles.workCard,
        border: overdue ? "1px solid #fca5a5" : styles.workCard.border,
        boxShadow: overdue ? "0 14px 28px rgba(239,68,68,0.10)" : styles.workCard.boxShadow,
      }}
    >
      <div
        style={{
          ...styles.workTopBar,
          background: overdue
            ? "linear-gradient(90deg, #ef4444 0%, #fb7185 100%)"
            : `linear-gradient(90deg, ${statusMeta.accent} 0%, rgba(255,255,255,0) 100%)`,
        }}
      />

      <div style={styles.workLayout}>
        <div style={styles.workMain}>
          <div
            style={{
              fontWeight: 850,
              fontSize: 14.5,
              lineHeight: 1.35,
              color: "#0f172a",
              letterSpacing: "-0.01em",
              wordBreak: "break-word",
            }}
          >
            {workItem.title}
          </div>

          <div
            style={{
              fontSize: 12.5,
              color: "#334155",
              lineHeight: 1.55,
              wordBreak: "break-word",
              whiteSpace: "pre-line",
            }}
          >
            {stripSignalTags(meta.raw_description || workItem.description || "Không có mô tả")}
          </div>

          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <span
              style={{
                padding: "4px 8px",
                borderRadius: 999,
                fontSize: 10,
                fontWeight: 800,
                color: statusMeta.chipColor,
                background: statusMeta.chipBg,
                border: `1px solid ${statusMeta.border}`,
              }}
            >
              {statusMeta.label}
            </span>

            <span
              style={{
                padding: "4px 8px",
                borderRadius: 999,
                fontSize: 10,
                fontWeight: 800,
                background: pStyle.bg,
                color: pStyle.color,
                border: `1px solid ${pStyle.border}`,
              }}
            >
              {pStyle.label}
            </span>

            <span
              style={{
                padding: "4px 8px",
                borderRadius: 999,
                fontSize: 10,
                fontWeight: 700,
                background: "#f8fafc",
                color: "#475569",
                border: "1px solid #e2e8f0",
              }}
            >
              {workItem.assignee || "Chưa gán"}
            </span>

            {meta.assigner && (
              <span
                style={{
                  padding: "4px 8px",
                  borderRadius: 999,
                  fontSize: 10,
                  fontWeight: 700,
                  background: "#eff6ff",
                  color: "#1d4ed8",
                  border: "1px solid #bfdbfe",
                }}
              >
                Giao việc: {meta.assigner}
              </span>
            )}
          </div>

          <div style={{ fontSize: 10.5, color: "#64748b", lineHeight: 1.5 }}>
            Bắt đầu: {formatDate(meta.start_date)} • Đến hạn: {formatDate(workItem.due_date)}
            {overdue ? " • QUÁ HẠN" : ""}
          </div>

          {signal === "de_nghi_phe_duyet" && (
            <div style={{ fontSize: 10.5, color: "#1d4ed8", fontWeight: 800 }}>
              Đề nghị phê duyệt
            </div>
          )}

          {signal === "da_hoan_thanh" && (
            <div style={{ fontSize: 10.5, color: "#15803d", fontWeight: 800 }}>
              Báo cáo đã hoàn thành
            </div>
          )}

          {signal === "xin_gia_han" && (
            <div style={{ fontSize: 10.5, color: "#c2410c", fontWeight: 800 }}>
              Báo cáo xin gia hạn
            </div>
          )}
        </div>

        <div style={styles.workActions}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMove(workItem.id, "todo");
            }}
            style={styles.btnSecondary}
          >
            Chưa làm
          </button>

          {!isManager && workItem.status !== "in_progress" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMove(workItem.id, "in_progress");
              }}
              style={styles.btnSecondary}
            >
              Đang làm
            </button>
          )}

          {!isManager && workItem.status !== "done" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMove(workItem.id, "done");
              }}
              style={styles.btnSecondary}
            >
              Hoàn thành
            </button>
          )}

          {isManager && signal === "de_nghi_phe_duyet" && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  alert("Đã chuyển sang chờ phê duyệt");
                }}
                style={styles.btnSecondary}
              >
                Chờ phê duyệt
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  alert("Đã từ chối");
                }}
                style={styles.btnSecondary}
              >
                Từ chối
              </button>
            </>
          )}

          {isManager && signal === "da_hoan_thanh" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMove(workItem.id, "done");
              }}
              style={styles.btnSecondary}
            >
              Kết thúc
            </button>
          )}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <ResultStatusPill status={meta.result_status || workItem.status} />

            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(workItem.id);
              }}
              style={styles.btnDanger}
            >
              Xóa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function WorkflowBoard({ groupedWorks, onSelect, onMove, onDelete, currentUser }) {
  return (
    <div style={styles.boardCard}>
      <div style={styles.boardHeader}>
        <div>
          <div style={styles.boardTitle}>Quản lý công việc theo luồng trạng thái</div>
          <div style={styles.boardSub}>Công việc tạo ở tài khoản nhân viên sẽ xuất hiện đồng thời ở màn hình nhân viên và lãnh đạo</div>
        </div>
      </div>

      <div style={styles.boardRows}>
        {STATUS_OPTIONS.map((col) => (
          <div key={col.value} style={styles.flowRow}>
            <div
              style={{
                ...styles.rowLabelCard,
                background: col.rowBg,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: col.accent,
                    boxShadow: `0 0 0 6px rgba(255,255,255,0.75)`,
                    flexShrink: 0,
                  }}
                />
                <h3 style={styles.rowLabelTitle}>{col.label}</h3>
              </div>
              <div style={styles.rowLabelCount}>
                {groupedWorks[col.value]?.length || 0}
              </div>
            </div>

            <div style={styles.rowContent}>
              {(groupedWorks[col.value] || []).length === 0 ? (
                <div style={styles.emptyRow}>Không có công việc trong nhóm này</div>
              ) : (
                groupedWorks[col.value].map((workItem) => (
                  <WorkCard
                    key={workItem.id}
                    workItem={workItem}
                    onSelect={onSelect}
                    onMove={onMove}
                    onDelete={onDelete}
                    currentUser={currentUser}
                  />
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AttachmentLinks({ attachments }) {
  if (!attachments || attachments.length === 0) {
    return <div style={{ color: "#64748b", fontSize: 12.5 }}>Chưa có file đính kèm</div>;
  }

  return (
    <div>
      {attachments.map((file, index) => (
        <a
          key={`${file.name}-${index}`}
          href={file.dataUrl}
          target="_blank"
          rel="noreferrer"
          download={file.name}
          style={styles.attachmentItem}
        >
          {file.name}
        </a>
      ))}
    </div>
  );
}

function DetailPanel({
  selectedWork,
  detail,
  history,
  aiSuggestion,
  aiLoading,
  onRefreshDetail,
  onSaveDetail,
  onAskAI,
  currentUser,
  allWorks,
}) {
  const [form, setForm] = useState(null);
  const [reportText, setReportText] = useState("");
  const [reportAction, setReportAction] = useState("de_nghi_phe_duyet");
  const [attachmentFiles, setAttachmentFiles] = useState([]);

  const currentMeta = useMemo(() => {
    const matched = allWorks.find((w) => String(w.id) === String(selectedWork?.id));
    return matched?.meta || {};
  }, [allWorks, selectedWork]);

  useEffect(() => {
    if (detail) {
      setForm({
        title: detail.title || "",
        description: detail.description || "",
        assignee: detail.assignee || "",
        status: detail.status || "todo",
        priority: detail.priority || "medium",
        due_date: detail.due_date || "",
      });
    }
  }, [detail]);

  if (!selectedWork) {
    return (
      <div style={styles.detailPanel}>
        <div style={styles.sectionHeader}>
          <div style={styles.sectionTitleWrap}>
            <div style={styles.sectionIcon}>
              <IconWork />
            </div>
            <div>
              <div style={styles.sectionTitle}>Chi tiết công việc</div>
              <div style={styles.sectionSub}>Chọn công việc để xem chi tiết</div>
            </div>
          </div>
        </div>
        <div style={{ color: "#64748b", fontSize: 13, lineHeight: 1.7 }}>
          Chọn một công việc ở bên trái để chỉnh sửa nội dung, dùng AI gợi ý, theo dõi lịch sử hoặc xử lý báo cáo/phê duyệt.
        </div>
      </div>
    );
  }

  if (!form) {
    return <div style={styles.detailPanel}>Đang tải chi tiết...</div>;
  }

  
const addLinkAttachment = () => {
  const url = prompt("Nhập link:");
  if (!url) return;
  const name = prompt("Tên hiển thị:", url) || url;
  setForm({
    ...form,
    attachments: [...(form.attachments || []), { kind: "link", name, url }]
  });
};

const handleFileUpload = async (e) => {
  const files = Array.from(e.target.files || []);
  const items = await Promise.all(files.map(fileToAttachment));
  setForm({
    ...form,
    attachments: [...(form.attachments || []), ...items]
  });
};

const removeAttachment = (i) => {
  const arr = [...(form.attachments || [])];
  arr.splice(i, 1);
  setForm({ ...form, attachments: arr });
};



{/* ===== ATTACHMENTS ===== */}
<div style={{ marginTop: 16 }}>
  <div style={{ fontWeight: 700, marginBottom: 8 }}>
    Đính kèm minh chứng
  </div>

  <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
    <button onClick={addLinkAttachment}>+ Link</button>
    <input type="file" multiple onChange={handleFileUpload} />
  </div>

  <div>
    {(form.attachments || []).map((a, i) => (
      <div key={i} style={{ display: "flex", gap: 10 }}>
        <span>{a.name}</span>
        <a href={a.url} target="_blank">Mở</a>
        <button onClick={() => removeAttachment(i)}>Xóa</button>
      </div>
    ))}
  </div>
</div>


const handleSave = async () => {

    const payload = { ...form };
    const metaStore = loadTaskMeta();
    const nextMeta = {
      ...(metaStore[String(selectedWork.id)] || {}),
      ...(currentMeta || {}),
    };

    nextMeta.raw_description = form.description;

    if (currentUser.roleLabel === "staff") {
      payload.description = buildDescriptionWithSignal(form.description, reportText, reportAction);

      if (reportAction === "de_nghi_phe_duyet") {
        nextMeta.result_status = form.status;
      }

      if (reportAction === "da_hoan_thanh") {
        nextMeta.result_status = "done";
        payload.status = "done";
      }

      if (attachmentFiles.length > 0) {
        const uploaded = await readFilesAsDataUrls(attachmentFiles);
        nextMeta.attachments = [...(nextMeta.attachments || []), ...uploaded];
      }
    }

    metaStore[String(selectedWork.id)] = nextMeta;
    saveTaskMeta(metaStore);

    await onSaveDetail(selectedWork.id, payload);
    setAttachmentFiles([]);
    alert("Đã lưu công việc và file đính kèm");
  };

  return (
    <div style={styles.detailPanel}>
      <div
        style={{
          ...styles.roleBanner,
          background: isManagerRole(currentUser?.role) ? "#eff6ff" : "#ecfdf5",
          color: isManagerRole(currentUser?.role) ? "#1d4ed8" : "#047857",
          border: isManagerRole(currentUser?.role) ? "1px solid #bfdbfe" : "1px solid #a7f3d0",
        }}
      >
        {isManagerRole(currentUser?.role)
          ? `${getDisplayRole(currentUser)}: ${currentUser.name} (${currentUser.email}) đang xem các công việc cần theo dõi và phê duyệt.`
          : `${getDisplayRole(currentUser)}: ${currentUser.name} (${currentUser.email}) đang xem các công việc được giao cho mình.`}
      </div>

      <div style={styles.sectionHeader}>
        <div style={styles.sectionTitleWrap}>
          <div style={styles.sectionIcon}>
            <IconWork />
          </div>
          <div>
            <div style={styles.sectionTitle}>Chi tiết công việc</div>
            <div style={styles.sectionSub}>Quản lý nội dung, AI, file đính kèm và lịch sử thay đổi</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={onRefreshDetail} style={styles.btnSecondary}>
            Làm mới
          </button>
          <button onClick={onAskAI} style={styles.btnAi} disabled={aiLoading}>
            {aiLoading ? "AI đang phân tích..." : "AI gợi ý"}
          </button>
          <button onClick={handleSave} style={styles.btnPrimary}>
            Lưu
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gap: 10, marginBottom: 14 }}>
        <div>
          <label style={styles.label}>Tiêu đề</label>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            style={styles.input}
          />
        </div>

        <div>
          <label style={styles.label}>Mô tả</label>
          <textarea
            rows={4}
            value={stripSignalTags(currentMeta.raw_description || form.description)}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            style={styles.textarea}
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr 1fr",
            gap: 10,
          }}
        >
          <div>
            <label style={styles.label}>Người thực hiện</label>
            <input
              value={form.assignee}
              onChange={(e) => setForm({ ...form, assignee: e.target.value })}
              style={styles.input}
            />
          </div>

          <div>
            <label style={styles.label}>Trạng thái</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              style={styles.input}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={styles.label}>Mức ưu tiên</label>
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              style={styles.input}
            >
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={styles.label}>Hạn hoàn thành</label>
            <input
              type="date"
              value={form.due_date || ""}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              style={styles.input}
            />
          </div>
        </div>
      </div>

      {(currentMeta.assigner || currentMeta.start_date) && (
        <div style={styles.subCard}>
          <div style={{ fontSize: 13, fontWeight: 850, marginBottom: 8 }}>Thông tin công việc</div>
          <div style={{ fontSize: 12.5, color: "#475569", lineHeight: 1.7 }}>
            Người giao việc: {currentMeta.assigner || "Chưa có"} <br />
            Ngày bắt đầu: {formatDate(currentMeta.start_date)}
          </div>
        </div>
      )}

      <div style={styles.subCard}>
        <div style={{ fontSize: 13, fontWeight: 850, marginBottom: 8 }}>File đính kèm</div>

        {currentUser.roleLabel === "staff" && (
          <div style={{ marginBottom: 10 }}>
            <input
              type="file"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                setAttachmentFiles(files);
              }}
              style={styles.input}
            />
          </div>
        )}

        {attachmentFiles.length > 0 && currentUser.roleLabel === "staff" && (
          <div style={{ marginBottom: 10 }}>
            {attachmentFiles.map((file, index) => (
              <div key={`${file.name}-${index}`} style={{ ...styles.attachmentItem, color: "#334155", cursor: "default" }}>
                {file.name}
              </div>
            ))}
          </div>
        )}

        <AttachmentLinks attachments={currentMeta.attachments || []} />
      </div>

      {currentUser.roleLabel === "staff" && (
        <div style={styles.subCard}>
          <div style={{ ...styles.sectionHeader, marginBottom: 8 }}>
            <div style={styles.sectionTitleWrap}>
              <div style={{ ...styles.sectionIcon, width: 30, height: 30 }}>
                <IconUpload />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 850 }}>Báo cáo thực hiện</div>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 10 }}>
            <label style={styles.label}>Nội dung báo cáo</label>
            <textarea
              rows={4}
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              style={styles.textarea}
              placeholder="Nhập kết quả thực hiện, tiến độ, khó khăn hoặc đề xuất..."
            />
          </div>

          <div style={{ marginBottom: 10 }}>
            <label style={styles.label}>Lựa chọn xử lý</label>
            <select
              value={reportAction}
              onChange={(e) => setReportAction(e.target.value)}
              style={styles.input}
            >
              {REPORT_ACTION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {isManagerRole(currentUser?.role) && (
        <div style={styles.subCard}>
          <div style={{ ...styles.sectionHeader, marginBottom: 8 }}>
            <div style={styles.sectionTitleWrap}>
              <div style={{ ...styles.sectionIcon, width: 30, height: 30 }}>
                <IconApprove />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 850 }}>Phản hồi của lãnh đạo</div>
              </div>
            </div>
          </div>

          <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6 }}>
            Lãnh đạo có thể mở file đính kèm đã được nhân viên lưu trước đó ngay trong khung chi tiết công việc.
          </div>
        </div>
      )}

      <div style={styles.subCard}>
        <div style={{ ...styles.sectionHeader, marginBottom: 8 }}>
          <div style={styles.sectionTitleWrap}>
            <div style={{ ...styles.sectionIcon, width: 30, height: 30 }}>
              <IconSparkles />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 850 }}>AI gợi ý</div>
            </div>
          </div>
        </div>

        {aiLoading ? (
          <div style={{ color: "#1d4ed8", fontSize: 12.5, fontWeight: 700 }}>
            Đang lấy gợi ý từ AI...
          </div>
        ) : aiSuggestion ? (
          <>
            <div
              style={{
                marginBottom: 8,
                fontSize: 12.5,
                fontWeight: 800,
                color: "#334155",
                lineHeight: 1.5,
              }}
            >
              {aiSuggestion.summary}
            </div>
            <ul
              style={{
                margin: 0,
                paddingLeft: 18,
                color: "#475569",
                fontSize: 12.5,
                lineHeight: 1.7,
              }}
            >
              {aiSuggestion.suggestions?.map((item, idx) => (
                <li key={idx} style={{ marginBottom: 6 }}>
                  {item}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div style={{ color: "#64748b", fontSize: 12.5 }}>
            Bấm “AI gợi ý” để xem đề xuất tối ưu công việc.
          </div>
        )}
      </div>

      <div style={{ ...styles.subCard, marginBottom: 0 }}>
        <div style={{ ...styles.sectionHeader, marginBottom: 8 }}>
          <div style={styles.sectionTitleWrap}>
            <div style={{ ...styles.sectionIcon, width: 30, height: 30 }}>
              <IconHistory />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 850 }}>Lịch sử thay đổi</div>
            </div>
          </div>
        </div>

        {history.length === 0 ? (
          <div style={{ color: "#64748b", fontSize: 12.5 }}>Chưa có lịch sử thay đổi</div>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {history.map((item) => (
              <div
                key={item.id}
                style={{
                  background: "#fff",
                  borderRadius: 14,
                  border: "1px solid #e5e7eb",
                  padding: 10,
                  boxShadow: "0 6px 14px rgba(15,23,42,0.03)",
                }}
              >
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: 12.5,
                    color: "#0f172a",
                    marginBottom: 4,
                  }}
                >
                  {item.action}
                </div>
                <div
                  style={{
                    color: "#475569",
                    fontSize: 12.5,
                    lineHeight: 1.55,
                    marginBottom: 5,
                  }}
                >
                  {item.detail}
                </div>
                <div style={{ fontSize: 10.5, color: "#94a3b8" }}>
                  {formatDateTime(item.created_at)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function TaskBoard({ currentUser, onLogout, onSwitchAccount }) {
  const [allWorks, setAllWorks] = useState([]);
  const [selectedWork, setSelectedWork] = useState(null);
  const [detail, setDetail] = useState(null);
  const [history, setHistory] = useState([]);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [activeOverview, setActiveOverview] = useState("all");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [overdueOnly, setOverdueOnly] = useState(false);

  const fetchWorks = useCallback(async () => {
    const res = await authFetch(`${API_BASE}/tasks`);
    const data = await res.json();
    const metaStore = loadTaskMeta();
    setAllWorks(mergeTasksWithMeta(Array.isArray(data) ? data : [], metaStore));
  }, []);

  const fetchWorkDetail = useCallback(async (workId) => {
    const res = await authFetch(`${API_BASE}/tasks/${workId}`);
    if (!res.ok) return;
    const data = await res.json();
    setDetail(data);
  }, []);

  const fetchWorkHistory = useCallback(async (workId) => {
    const res = await authFetch(`${API_BASE}/tasks/${workId}/history`);
    if (!res.ok) return;
    const data = await res.json();
    setHistory(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => {
    fetchWorks();
  }, [fetchWorks]);

  useEffect(() => {
    const handleRealtime = async (event) => {
      const changedWorkId = event.detail?.task_id;
      await fetchWorks();

      if (selectedWork && changedWorkId === selectedWork.id) {
        await fetchWorkDetail(selectedWork.id);
        await fetchWorkHistory(selectedWork.id);
      }
    };

    window.addEventListener("task-realtime-event", handleRealtime);
    return () => {
      window.removeEventListener("task-realtime-event", handleRealtime);
    };
  }, [fetchWorks, fetchWorkDetail, fetchWorkHistory, selectedWork]);

  const worksByRole = useMemo(() => {
    if (isManagerRole(currentUser?.role)) {
      return allWorks;
    }

    const staffName = (currentUser.name || "").trim().toLowerCase();
    const staffEmail = (currentUser.email || "").trim().toLowerCase();

    return allWorks.filter((w) => {
      const assignee = (w.assignee || "").trim().toLowerCase();
      return assignee === staffName || assignee === staffEmail;
    });
  }, [allWorks, currentUser]);

  const visibleWorks = useMemo(() => {
    return worksByRole.filter((w) => {
      if (activeOverview === "all") return true;
      if (activeOverview === "overdue") return isOverdue(w);
      return w.status === activeOverview;
    });
  }, [worksByRole, activeOverview]);

  const filteredWorks = useMemo(() => {
    return visibleWorks.filter((workItem) => {
      const q = search.trim().toLowerCase();
      const searchBlob = [
        workItem.title,
        workItem.description,
        workItem.assignee,
        workItem.meta?.assigner,
        workItem.meta?.raw_description,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !q || searchBlob.includes(q);
      const matchesStatus = statusFilter === "all" || workItem.status === statusFilter;

      const matchesAssignee =
        currentUser.roleLabel === "staff"
          ? true
          : !assigneeFilter.trim() ||
            (workItem.assignee || "").toLowerCase().includes(assigneeFilter.trim().toLowerCase());

      const matchesOverdue = !overdueOnly || isOverdue(workItem);

      return matchesSearch && matchesStatus && matchesAssignee && matchesOverdue;
    });
  }, [visibleWorks, search, statusFilter, assigneeFilter, overdueOnly, currentUser]);

  const groupedWorks = useMemo(() => {
    return {
      todo: filteredWorks.filter((w) => w.status === "todo"),
      in_progress: filteredWorks.filter((w) => w.status === "in_progress"),
      done: filteredWorks.filter((w) => w.status === "done"),
    };
  }, [filteredWorks]);

  const handleSelectWork = async (workItem) => {
    setSelectedWork(workItem);
    setAiSuggestion(null);
    await fetchWorkDetail(workItem.id);
    await fetchWorkHistory(workItem.id);
  };

  const handleMoveWork = async (workId, status) => {
    const res = await authFetch(`${API_BASE}/tasks/${workId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (!res.ok) {
      alert("Cập nhật trạng thái công việc thất bại");
      return;
    }

    const metaStore = loadTaskMeta();
    if (metaStore[String(workId)]) {
      metaStore[String(workId)].result_status = status;
      saveTaskMeta(metaStore);
    }

    await fetchWorks();

    if (selectedWork?.id === workId) {
      await fetchWorkDetail(workId);
      await fetchWorkHistory(workId);
    }
  };

  const handleDeleteWork = async (workId) => {
    if (!window.confirm("Bạn chắc chắn muốn xóa công việc này?")) return;

    const res = await authFetch(`${API_BASE}/tasks/${workId}`, { method: "DELETE" });

    if (!res.ok) {
      alert("Xóa công việc thất bại");
      return;
    }

    const metaStore = loadTaskMeta();
    delete metaStore[String(workId)];
    saveTaskMeta(metaStore);

    if (selectedWork?.id === workId) {
      setSelectedWork(null);
      setDetail(null);
      setHistory([]);
      setAiSuggestion(null);
      setAiLoading(false);
    }

    await fetchWorks();
  };

  const handleSaveDetail = async (workId, form) => {
    const res = await authFetch(`${API_BASE}/tasks/${workId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      alert("Lưu công việc thất bại");
      return;
    }

    await fetchWorks();
    await fetchWorkDetail(workId);
    await fetchWorkHistory(workId);
  };

  const handleAskAI = async () => {
    if (!selectedWork?.id) {
      alert("Bạn cần chọn một công việc trước khi dùng AI gợi ý.");
      return;
    }

    try {
      setAiLoading(true);
      setAiSuggestion(null);

      const res = await authFetch(`${API_BASE}/ai/suggest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task_id: selectedWork.id }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Không lấy được gợi ý AI");
      }

      const data = await res.json();
      setAiSuggestion(data);
    } catch (error) {
      console.error("AI suggest error:", error);
      alert("Nút AI gợi ý chưa lấy được dữ liệu. Hãy kiểm tra backend /ai/suggest.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <Sidebar
          workItems={worksByRole}
          currentUser={currentUser}
          onLogout={onLogout}
          onSwitchAccount={onSwitchAccount}
        />

        <main style={styles.main}>
          <Topbar
            currentUser={currentUser}
            onLogout={onLogout}
            onSwitchAccount={onSwitchAccount}
          />

          <Stats
            workItems={worksByRole}
            activeOverview={activeOverview}
            setActiveOverview={setActiveOverview}
          />

          <OverviewDashboard
            workItems={worksByRole}
            activeOverview={activeOverview}
          />

          <CreateWorkForm
            onCreated={fetchWorks}
            currentUser={currentUser}
          />

          <FilterBar
            search={search}
            setSearch={setSearch}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            assigneeFilter={assigneeFilter}
            setAssigneeFilter={setAssigneeFilter}
            overdueOnly={overdueOnly}
            setOverdueOnly={setOverdueOnly}
            currentUser={currentUser}
          />

          <div style={styles.dashboardGrid}>
            <WorkflowBoard
              groupedWorks={groupedWorks}
              onSelect={handleSelectWork}
              onMove={handleMoveWork}
              onDelete={handleDeleteWork}
              currentUser={currentUser}
            />

            <DetailPanel
              selectedWork={selectedWork}
              detail={detail}
              history={history}
              aiSuggestion={aiSuggestion}
              aiLoading={aiLoading}
              onRefreshDetail={async () => {
                if (!selectedWork) return;
                await fetchWorkDetail(selectedWork.id);
                await fetchWorkHistory(selectedWork.id);
              }}
              onSaveDetail={handleSaveDetail}
              onAskAI={handleAskAI}
              currentUser={currentUser}
              allWorks={allWorks}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
