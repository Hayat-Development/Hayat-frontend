import { useCallback, useEffect, useRef, useState } from "react";
import OrgShell from "../../components/org/OrgShell";
import { ActivationLinkBox, ConfirmDialog, EmptyState, ErrorScreen, Field, Notice, Pagination, StatusChip, TableSkeleton, TextInput } from "../../components/org/ui";
import { useSession } from "../../context/SessionContext";
import useBlockingError from "../../hooks/useBlockingError";
import useDebounce from "../../hooks/useDebounce";
import { createStaff, listStaff, reactivateStaff, resendActivation, suspendStaff } from "../../services/sprint2Api";
import { MESSAGES, SUCCESS } from "../../constants/org";
import { isEmail, isPhone, normalizeEmail, normalizePhone } from "../../utils/org";

export default function StaffPage() {
  const me = useSession();
  const [search, setSearch] = useState("");
  const q = useDebounce(search);
  const [page, setPage] = useState(1);
  const [res, setRes] = useState(null);
  const [netErr, setNetErr] = useState(false);
  const [notice, setNotice] = useState(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [confirm, setConfirm] = useState(null); // { member, action }
  const [busy, setBusy] = useState(false);
  const [adding, setAdding] = useState(false);
  const [block, handle] = useBlockingError();

  useEffect(() => setPage(1), [q]);
  const load = useCallback(() => {
    setNetErr(false);
    listStaff({ search: q, page }).then(setRes).catch((e) => { if (!handle(e)) setNetErr(true); });
  }, [q, page, handle]);
  useEffect(() => { load(); }, [load]);

  const fail = (e) => {
    if (handle(e)) return;
    const c = e?.data?.code;
    setNotice({ type: "error", text: c?.includes("SUSPEND") || c?.includes("LAST") ? MESSAGES.SELF_SUSPEND : e.status ? MESSAGES.ROLE_FORBIDDEN : MESSAGES.NETWORK });
  };

  async function runConfirm() {
    const { member, action } = confirm; setBusy(true);
    try {
      await (action === "suspend" ? suspendStaff(member.id) : reactivateStaff(member.id));
      setNotice({ type: "success", text: action === "suspend" ? SUCCESS.staffSuspended : SUCCESS.staffReactivated });
      setConfirm(null); load();
    } catch (e) { setConfirm(null); fail(e); } finally { setBusy(false); }
  }
  async function resend(m) {
    try { const r = await resendActivation(m.id); setLinkUrl(r.activation_url); setNotice({ type: "success", text: SUCCESS.linkResent }); } catch (e) { fail(e); }
  }

  if (block && ["org_suspended", "account_suspended"].includes(block.kind)) return <ErrorScreen full kind={block.kind} reason={block.reason} backTo="/login" backText="العودة لتسجيل الدخول" />;
  if (block) return <OrgShell title="إدارة الموظفين"><ErrorScreen kind={block.kind} backTo="/org" /></OrgShell>;
  const rows = res?.data;
  const addBtn = <button type="button" className="btn btn-primary" onClick={() => setAdding(true)}><i className="ti ti-plus" />إضافة موظف</button>;

  return (
    <OrgShell title={`فريق ${me?.bank?.name || "المؤسسة"}`} actions={addBtn}>
      <Notice type={notice?.type} onClose={() => setNotice(null)}>{notice?.text}</Notice>
      {linkUrl && <div className="org-card org-pad mb-3"><ActivationLinkBox url={linkUrl} /></div>}
      <div className="org-search">
        <i className="ti ti-search" aria-hidden="true" />
        <input type="search" className="form-control" placeholder="بحث بالاسم" aria-label="بحث بالاسم" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <section className="org-card">
        {netErr ? <ErrorScreen kind="network" onRetry={load} />
          : !rows ? <TableSkeleton />
          : rows.length === 0 ? (q
              ? <EmptyState title="لا نتائج مطابقة" text="جرّب اسمًا آخر." />
              : <EmptyState title="لا يوجد موظفون بعد" text="أضف أول موظف لمؤسستك." actionText="إضافة موظف" onAction={() => setAdding(true)} />)
          : (
            <>
              <table className="org-table">
                <thead><tr><th>الاسم</th><th>البريد</th><th>الحالة</th><th>الإجراء</th></tr></thead>
                <tbody>
                  {rows.map((m) => {
                    const isRep = m.role === "rep_bank";
                    return (
                      <tr key={m.id}>
                        <td data-label="الاسم"><strong>{m.name}</strong>{isRep && <span className="org-tag">{m.id === me.id ? "أنت · الممثل الرسمي" : "الممثل الرسمي"}</span>}</td>
                        <td data-label="البريد" dir="ltr" className="org-ltr">{m.email}</td>
                        <td data-label="الحالة"><StatusChip status={m.status} /></td>
                        <td data-label="الإجراء" className="org-actions">
                          {!isRep && m.status === "active" && <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => setConfirm({ member: m, action: "suspend" })}>إيقاف</button>}
                          {!isRep && m.status === "pending" && <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => resend(m)}>إعادة إرسال الرابط</button>}
                          {!isRep && m.status === "suspended" && <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => setConfirm({ member: m, action: "reactivate" })}>إعادة تفعيل</button>}
                          {isRep && <span className="org-sub">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <Pagination meta={res.meta} onPage={setPage} />
            </>
          )}
      </section>

      {confirm && (
        <ConfirmDialog busy={busy} danger={confirm.action === "suspend"}
          title={confirm.action === "suspend" ? `إيقاف ${confirm.member.name}؟` : `إعادة تفعيل ${confirm.member.name}؟`}
          text={confirm.action === "suspend" ? "لن يستطيع استخدام لوحة المؤسسة حتى تعيد تفعيله." : "سيعود لاستخدام حسابه إن كان قد أكمل التفعيل، وإلا يعود بانتظار التفعيل."}
          confirmText={confirm.action === "suspend" ? "تأكيد الإيقاف" : "تأكيد إعادة التفعيل"}
          onConfirm={runConfirm} onCancel={() => setConfirm(null)} />
      )}
      {adding && <StaffFormDialog onClose={() => setAdding(false)} handle={handle}
        onCreated={(url) => { setAdding(false); setLinkUrl(url); setNotice({ type: "success", text: SUCCESS.staffAdded }); load(); }} />}
    </OrgShell>
  );
}

// لا يوجد حقل role ولا blood_bank_id — الباك يحددهما من حساب الممثل.
function StaffFormDialog({ onClose, onCreated, handle }) {
  const [f, setF] = useState({ name: "", email: "", phone: "" });
  const [errors, setErrors] = useState({});
  const [banner, setBanner] = useState("");
  const [saving, setSaving] = useState(false);
  const lock = useRef(false);
  const set = (k) => (e) => { setF({ ...f, [k]: e.target.value }); setErrors({ ...errors, [k]: undefined }); };

  async function submit(ev) {
    ev.preventDefault();
    if (saving || lock.current) return;
    const e = {};
    if (!f.name.trim()) e.name = "هذا الحقل مطلوب.";
    if (!isEmail(normalizeEmail(f.email))) e.email = f.email.trim() ? "صيغة البريد غير صحيحة." : "هذا الحقل مطلوب.";
    if (!isPhone(normalizePhone(f.phone))) e.phone = f.phone.trim() ? "أدخل الهاتف مع رمز الدولة." : "هذا الحقل مطلوب.";
    setErrors(e); setBanner("");
    if (Object.keys(e).length) { setBanner(MESSAGES.VALIDATION); return; }
    lock.current = true;
    setSaving(true);
    try {
      const r = await createStaff({ name: f.name.trim(), email: normalizeEmail(f.email), phone: normalizePhone(f.phone) });
      onCreated(r.activation_url);
    } catch (err) {
      if (handle(err)) return onClose();
      if (err.status === 409) setErrors(String(err.data?.code).includes("PHONE") ? { phone: MESSAGES.PHONE_TAKEN } : { email: MESSAGES.EMAIL_TAKEN });
      else if (err.status === 422) { const m = {}; Object.entries(err.data?.errors || {}).forEach(([k, v]) => (m[k] = [].concat(v)[0])); setErrors(m); setBanner(MESSAGES.VALIDATION); }
      else setBanner(err.status ? "تعذّر الحفظ ولم يُنشأ أي سجل." : MESSAGES.NETWORK);
    } finally { lock.current = false; setSaving(false); }
  }

  return (
    <div className="org-overlay" role="presentation">
      <form className="org-modal org-modal-form" role="dialog" aria-modal="true" aria-labelledby="sf-t" onSubmit={submit} noValidate>
        <h2 id="sf-t">إضافة موظف</h2>
        <Notice type="error">{banner}</Notice>
        <Field id="s_name" label="الاسم" required error={errors.name}><TextInput id="s_name" value={f.name} onChange={set("name")} error={errors.name} disabled={saving} autoFocus /></Field>
        <Field id="s_email" label="البريد" required error={errors.email}><TextInput id="s_email" ltr value={f.email} onChange={set("email")} error={errors.email} disabled={saving} placeholder="name@example.com" /></Field>
        <Field id="s_phone" label="الهاتف" required error={errors.phone} hint="مع رمز الدولة"><TextInput id="s_phone" ltr type="tel" value={f.phone} onChange={set("phone")} error={errors.phone} disabled={saving} placeholder="+970 59 000 0000" /></Field>
        <div className="org-modal-actions">
          <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={saving}>إلغاء</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "جاري الحفظ..." : "حفظ الحساب"}</button>
        </div>
      </form>
    </div>
  );
}
