import { useEffect, useRef, useState } from "react";
import { getApiErrorMessages } from "../../api";
import { showFlashMessage } from "../../flashMessage";
import { Field, Notice } from "./ui";

export default function StatusDialog({ title, text, status, save, success, onDone, onCancel }) {
  const suspending = status === "suspended";
  return (
    <ActionDialog title={title} text={text} requiresReason={suspending}
      confirmText={suspending ? "تأكيد الإيقاف" : "تأكيد إعادة التفعيل"}
      save={(reason) => save(status, reason)} success={success} onDone={onDone} onCancel={onCancel} />
  );
}

export function ActionDialog({
  title, text, confirmText, requiresReason = false, danger = requiresReason, save, success, onDone, onCancel,
}) {
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const initialFocus = useRef(null);

  useEffect(() => { initialFocus.current?.focus(); }, []);

  async function submit(event) {
    event.preventDefault();
    if (submitting.current) return;

    if (requiresReason && reason.trim().length < 3) {
      setReasonError("اكتب سبب التوقيف. الحد الأدنى 3 أحرف.");
      initialFocus.current?.focus();
      return;
    }

    submitting.current = true;
    setBusy(true);
    setError("");
    try {
      const result = await save(reason.trim());
      showFlashMessage(success || result.message);
      onDone(result.data);
    } catch (requestError) {
      const messages = requestError.data?.errors?.reason;
      if (messages) setReasonError([].concat(messages).join(" "));
      else setError(getApiErrorMessages(requestError).join(" "));
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  return (
    <div className="org-overlay" onKeyDown={(event) => {
      if (event.key === "Escape" && !busy) onCancel();
    }}>
      <form className={`org-modal${danger ? " org-modal-danger" : ""}`} role="dialog" aria-modal="true" aria-labelledby="status-title"
        aria-describedby="status-description" onSubmit={submit} noValidate>
        <h2 id="status-title">{title}</h2>
        <p id="status-description">{text}</p>
        <Notice type="error">{error}</Notice>
        {requiresReason && <Field id="status-reason" label="سبب التوقيف" required error={reasonError}>
          <textarea id="status-reason" ref={initialFocus} required rows={3} maxLength={500}
            className={`form-control${reasonError ? " is-invalid" : ""}`}
            aria-invalid={Boolean(reasonError)} aria-describedby={reasonError ? "status-reason-err" : undefined}
            value={reason} disabled={busy} onChange={(event) => { setReason(event.target.value); setReasonError(""); }} />
        </Field>}
        <div className="org-modal-actions">
          <button ref={!requiresReason ? initialFocus : null} type="button" className="btn btn-outline-secondary" onClick={onCancel} disabled={busy}>إلغاء</button>
          <button type="submit" className={`btn ${danger ? "btn-danger" : "btn-primary"}`} disabled={busy}>
            {busy ? "جاري التنفيذ…" : confirmText}
          </button>
        </div>
      </form>
    </div>
  );
}
