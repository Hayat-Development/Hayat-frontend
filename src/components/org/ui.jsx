import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

const STATUS = {
  active: { text: "فعال", icon: "ti-circle-check", cls: "ok" },
  pending: { text: "بانتظار التفعيل", icon: "ti-clock", cls: "wait" },
  suspended: { text: "موقوف", icon: "ti-ban", cls: "stop" },
  no_rep: { text: "بانتظار الممثل", icon: "ti-user-plus", cls: "wait" },
};
// الحالة بنص + لون + أيقونة معًا (لا يعتمد على اللون وحده)
export function StatusChip({ status, label }) {
  const s = STATUS[status] || STATUS.pending;
  return <span className={`org-chip org-chip-${s.cls}`}><i className={`ti ${s.icon}`} aria-hidden="true" />{label || s.text}</span>;
}

export function Notice({ type = "success", children, onClose }) {
  useEffect(() => {
    if (type !== "success" || !onClose) return;
    const t = setTimeout(onClose, 6000);
    return () => clearTimeout(t);
  }, [type, children, onClose]);
  if (!children) return null;
  return (
    <div className={`org-notice org-notice-${type}`} role={type === "success" ? "status" : "alert"}>
      <i className={`ti ${type === "success" ? "ti-circle-check" : "ti-alert-circle"}`} aria-hidden="true" />
      <span>{children}</span>
      {onClose && <button type="button" className="org-x" onClick={onClose} aria-label="إغلاق"><i className="ti ti-x" /></button>}
    </div>
  );
}

export function Field({ id, label, required, error, hint, ltr, children }) {
  return (
    <div className="mb-3">
      <label className="form-label" htmlFor={id}>{required && <span className="org-req" aria-hidden="true">* </span>}{label}</label>
      {children || null}
      {hint && !error && <div className="org-hint">{hint}</div>}
      {error && <div className="org-err" id={`${id}-err`} role="alert">{error}</div>}
    </div>
  );
}
// حقل نص: البريد والهاتف dir=ltr مع محاذاة لليمين داخل الواجهة العربية
export function TextInput({ id, ltr, error, ...rest }) {
  return (
    <input id={id} name={id} className={`form-control${error ? " is-invalid" : ""}${ltr ? " org-ltr" : ""}`}
      dir={ltr ? "ltr" : undefined} aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined} {...rest} />
  );
}

export function ConfirmDialog({ title, text, confirmText, danger, busy, onConfirm, onCancel }) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current?.focus();
    const k = (e) => e.key === "Escape" && !busy && onCancel();
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, [busy, onCancel]);
  return (
    <div className="org-overlay" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && !busy && onCancel()}>
      <div className="org-modal" role="alertdialog" aria-modal="true" aria-labelledby="cd-t" aria-describedby="cd-d">
        <h2 id="cd-t">{title}</h2>
        <p id="cd-d">{text}</p>
        <div className="org-modal-actions">
          <button ref={ref} type="button" className="btn btn-outline-secondary" onClick={onCancel} disabled={busy}>إلغاء</button>
          <button type="button" className={`btn ${danger ? "btn-danger" : "btn-primary"}`} onClick={onConfirm} disabled={busy}>
            {busy ? "جاري التنفيذ..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export function Pagination({ meta, onPage }) {
  if (!meta) return null;
  return (
    <div className="org-pager">
      <span>الصفحة {meta.page} من {meta.last_page} · {meta.per_page} سجلات في الصفحة</span>
      <div>
        <button type="button" className="btn btn-outline-secondary btn-sm" disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)}>السابق</button>
        <button type="button" className="btn btn-outline-secondary btn-sm" disabled={meta.page >= meta.last_page} onClick={() => onPage(meta.page + 1)}>التالي</button>
      </div>
    </div>
  );
}

// رابط التفعيل يظهر داخل الواجهة في النسخة التجريبية (بدون بريد حقيقي) — احذفه عند تفعيل البريد.
export function ActivationLinkBox({ url }) {
  const [copied, setCopied] = useState(false);
  if (!url) return null;
  const copy = async () => { try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* ignore */ } };
  return (
    <div className="org-link-box">
      <strong>رابط التفعيل</strong>
      <span className="org-hint">لمرة واحدة وصالح 48 ساعة. شاركه مع صاحب الحساب.</span>
      <div className="org-link-row">
        <code dir="ltr">{url}</code>
        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={copy}>{copied ? "تم النسخ" : "نسخ"}</button>
      </div>
    </div>
  );
}

/* ---------- الحالات المشتركة (شاشة 6) ---------- */
export function TableSkeleton({ rows = 4 }) {
  return (
    <div className="org-skel" aria-busy="true" aria-label="جاري التحميل">
      {Array.from({ length: rows }, (_, i) => <span key={i} style={{ width: `${95 - i * 12}%` }} />)}
    </div>
  );
}

export function EmptyState({ title, text, actionText, onAction }) {
  return (
    <div className="org-state">
      <i className="ti ti-users-group org-state-icon" aria-hidden="true" />
      <h3>{title}</h3><p>{text}</p>
      {actionText && <button type="button" className="btn btn-primary" onClick={onAction}>{actionText}</button>}
    </div>
  );
}

const SCREENS = {
  forbidden: { icon: "ti-lock", title: "لا تملك صلاحية لهذه الصفحة", text: "هذه الصفحة غير متاحة لدورك الحالي." },
  not_found: { icon: "ti-file-search", title: "السجل المطلوب غير موجود", text: "قد يكون الرابط خاطئًا أو أنه لا يخص مؤسستك." },
  account_suspended: { icon: "ti-user-off", title: "حسابك موقوف", text: "تواصل مع الممثل الرسمي لإعادة تفعيله." },
  org_suspended: { icon: "ti-building-off", title: "مؤسستك موقوفة حاليًا", text: "تواصل مع إدارة حياة.", danger: true },
  network: { icon: "ti-wifi-off", title: "تعذّر الاتصال", text: "ما أدخلته بقي في النموذج." },
  other: { icon: "ti-alert-triangle", title: "حدث خطأ غير متوقع", text: "حاول مرة أخرى بعد قليل." },
};
export function ErrorScreen({ kind = "other", reason, detail, backTo, backText = "العودة إلى اللوحة", onRetry, full }) {
  const s = SCREENS[kind] || SCREENS.other;
  return (
    <div className={full ? "org-full" : undefined}>
      <div className={`org-state org-block${s.danger ? " org-state-danger" : ""}`} role={kind === "network" ? "alert" : undefined}>
        <i className={`ti ${s.icon} org-state-icon`} aria-hidden="true" />
        <h2>{s.title}</h2>
        <p>{detail || s.text}</p>
        {kind === "org_suspended" && reason && <p className="org-reason"><strong>سبب المنع:</strong> {reason}</p>}
        {onRetry && <button type="button" className="btn btn-primary" onClick={onRetry}>أعد المحاولة</button>}
        {backTo && !onRetry && <Link className="btn btn-primary" to={backTo}>{backText}</Link>}
      </div>
    </div>
  );
}
