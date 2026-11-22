import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Field, Notice, TextInput } from "../../components/org/ui";
import { activateAccount } from "../../api.js";
import { MESSAGES } from "../../constants/org";

// شاشة تفعيل الحساب (جوال أولًا، 360px). الرابط: /activate?token=...
export default function ActivatePage() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [pw, setPw] = useState({ password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [banner, setBanner] = useState("");
  const [state, setState] = useState(token ? "form" : "invalid"); // form | done | invalid
  const [saving, setSaving] = useState(false);

  async function submit(ev) {
    ev.preventDefault();
    if (saving) return;
    const e = {};
    if (pw.password.length < 8) e.password = "كلمة المرور 8 أحرف على الأقل.";
    if (pw.confirm !== pw.password) e.confirm = "كلمتا المرور غير متطابقتين.";
    setErrors(e); setBanner("");
    if (Object.keys(e).length) return;
    setSaving(true);
    try {
      await activateAccount({ token, password: pw.password, password_confirmation: pw.confirm });
      setState("done");
    } catch (err) {
      if ([404, 410].includes(err.status)) setState("invalid");
      else if (err.status === 422) { setErrors({ password: [].concat(Object.values(err.data?.errors || {}).flat())[0] || MESSAGES.VALIDATION }); }
      else setBanner(MESSAGES.NETWORK);
    } finally { setSaving(false); }
  }

  return (
    <div className="org-full">
      <div className="org-card org-pad org-auth">
        <img src="/assets/img/hayat-logo-symbol.png" alt="حياة" width="34" height="42" />
        {state === "done" && (<><h1>تم تفعيل حسابك</h1><p className="org-sub">يمكنك الآن تسجيل الدخول.</p><Link className="btn btn-primary w-100" to="/login">تسجيل الدخول</Link></>)}
        {state === "invalid" && (<><i className="ti ti-link-off org-state-icon" /><h1>رابط التفعيل غير صالح</h1><p className="org-sub">الرابط منتهٍ أو استُخدم سابقًا. اطلب رابطًا جديدًا من الممثل الرسمي.</p><Link className="btn btn-outline-secondary w-100" to="/login">العودة لتسجيل الدخول</Link></>)}
        {state === "form" && (
          <form onSubmit={submit} noValidate>
            <h1>تفعيل حسابك</h1>
            <p className="org-sub">اختر كلمة مرور لبدء العمل في مؤسستك.</p>
            <Notice type="error">{banner}</Notice>
            <Field id="password" label="كلمة المرور" error={errors.password}><TextInput id="password" type="password" autoComplete="new-password" value={pw.password} onChange={(e) => setPw({ ...pw, password: e.target.value })} error={errors.password} disabled={saving} /></Field>
            <Field id="confirm" label="تأكيد كلمة المرور" error={errors.confirm}><TextInput id="confirm" type="password" autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} error={errors.confirm} disabled={saving} /></Field>
            <button type="submit" className="btn btn-primary w-100" disabled={saving}>{saving ? "جاري التفعيل..." : "تفعيل الحساب"}</button>
          </form>
        )}
      </div>
    </div>
  );
}
