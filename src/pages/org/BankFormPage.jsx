import { useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import OrgShell from "../../components/org/OrgShell";
import { ErrorScreen, Field, Notice, TextInput } from "../../components/org/ui";
import useBlockingError from "../../hooks/useBlockingError";
import { addRepresentative, createBankWithRep } from "../../services/sprint2Api.js";
import { MESSAGES, REGIONS, SUCCESS } from "../../constants/org";
import { isEmail, isPhone, mapFieldErrors, normalizeEmail, normalizePhone } from "../../utils/org";

const KEY_MAP = {
  "bank.name": "name", "bank.email": "email", "bank.contact_email": "email", contact_email: "email",
  "bank.phone": "phone", "bank.contact_phone": "phone", contact_phone: "phone", "bank.region": "region", city: "region",
  "representative.name": "rep_name", "representative.email": "rep_email", "representative.phone": "rep_phone",
};
const EMPTY = { name: "", email: "", phone: "", region: "", rep_name: "", rep_email: "", rep_phone: "" };

export default function BankFormPage() {
  const { bankId } = useParams();
  const repOnly = !!bankId;
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [banner, setBanner] = useState("");
  const [saving, setSaving] = useState(false);
  const lock = useRef(false);
  const [block, handle] = useBlockingError();

  const set = (k) => (e) => { setForm({ ...form, [k]: e.target.value }); if (errors[k]) setErrors({ ...errors, [k]: undefined }); };
  const title = repOnly ? "إضافة الممثل الرسمي" : "إضافة بنك دم";

  function validate() {
    const e = {}; const req = "هذا الحقل مطلوب.";
    if (!repOnly) {
      if (form.name.trim().length < 3 || form.name.trim().length > 120) e.name = "الاسم من 3 إلى 120 حرفًا.";
      if (!form.email.trim()) e.email = req; else if (!isEmail(normalizeEmail(form.email))) e.email = "صيغة البريد غير صحيحة.";
      if (!form.phone.trim()) e.phone = req; else if (!isPhone(normalizePhone(form.phone))) e.phone = "أدخل الهاتف مع رمز الدولة، مثل +970 59 000 0000.";
      if (!form.region) e.region = req;
    }
    if (!form.rep_name.trim()) e.rep_name = req;
    if (!form.rep_email.trim()) e.rep_email = req; else if (!isEmail(normalizeEmail(form.rep_email))) e.rep_email = "صيغة البريد غير صحيحة.";
    if (!form.rep_phone.trim()) e.rep_phone = req; else if (!isPhone(normalizePhone(form.rep_phone))) e.rep_phone = "أدخل الهاتف مع رمز الدولة.";
    return e;
  }

  async function submit(ev) {
    ev.preventDefault();
    if (saving || lock.current) return;
    setBanner("");
    const v = validate(); setErrors(v);
    if (Object.keys(v).length) { setBanner(MESSAGES.VALIDATION); return; }
    const representative = { name: form.rep_name.trim(), email: normalizeEmail(form.rep_email), phone: normalizePhone(form.rep_phone) };
    lock.current = true;
    setSaving(true);
    try {
      const res = repOnly
        ? await addRepresentative(bankId, representative)
        : await createBankWithRep({ bank: { name: form.name.trim(), email: normalizeEmail(form.email), phone: normalizePhone(form.phone), region: form.region }, representative });
      navigate("/admin/banks", { replace: true, state: { notice: repOnly ? SUCCESS.repAdded : SUCCESS.bankCreated, link: res.activation_url } });
    } catch (err) {
      if (handle(err)) return;
      const code = err?.data?.code;
      if (err.status === 422) { setErrors(mapFieldErrors(err, KEY_MAP)); setBanner(MESSAGES.VALIDATION); }
      else if (err.status === 409) {
        const isPhone409 = String(code).includes("PHONE");
        const field = err.data?.field || (isPhone409 ? (repOnly ? "rep_phone" : "phone") : (repOnly ? "rep_email" : "email"));
        setErrors({ [field]: isPhone409 ? MESSAGES.PHONE_TAKEN : MESSAGES.EMAIL_TAKEN });
      } else setBanner(err.status ? "تعذّر الحفظ ولم يُنشأ أي سجل. حاول مرة أخرى." : MESSAGES.NETWORK);
    } finally { lock.current = false; setSaving(false); }
  }

  if (block) return <OrgShell title={title}><ErrorScreen kind={block.kind} backTo="/admin/banks" backText="العودة للقائمة" /></OrgShell>;

  const rep = (
    <fieldset className="org-card org-pad" disabled={saving}>
      <legend>الممثل الرسمي الأول</legend>
      <Field id="rep_name" label="الاسم" required error={errors.rep_name}><TextInput id="rep_name" value={form.rep_name} onChange={set("rep_name")} error={errors.rep_name} autoComplete="off" /></Field>
      <Field id="rep_email" label="البريد" required error={errors.rep_email}><TextInput id="rep_email" ltr type="text" inputMode="email" value={form.rep_email} onChange={set("rep_email")} error={errors.rep_email} placeholder="name@example.com" /></Field>
      <Field id="rep_phone" label="الهاتف" required error={errors.rep_phone}><TextInput id="rep_phone" ltr type="tel" value={form.rep_phone} onChange={set("rep_phone")} error={errors.rep_phone} placeholder="+970 59 111 1111" /></Field>
    </fieldset>
  );

  return (
    <OrgShell title={title}>
      <Notice type="error" onClose={() => setBanner("")}>{banner}</Notice>
      <form onSubmit={submit} noValidate>
        <div className={repOnly ? "org-form-one" : "org-form-two"}>
          {!repOnly && (
            <fieldset className="org-card org-pad" disabled={saving}>
              <legend>بيانات المؤسسة</legend>
              <Field id="name" label="اسم البنك" required error={errors.name}><TextInput id="name" value={form.name} onChange={set("name")} error={errors.name} maxLength={120} autoComplete="off" /></Field>
              <Field id="email" label="بريد التواصل" required error={errors.email}><TextInput id="email" ltr type="text" inputMode="email" value={form.email} onChange={set("email")} error={errors.email} placeholder="info@example.ps" /></Field>
              <Field id="phone" label="الهاتف" required error={errors.phone} hint="مع رمز الدولة"><TextInput id="phone" ltr type="tel" value={form.phone} onChange={set("phone")} error={errors.phone} placeholder="+970 59 000 0000" /></Field>
              <Field id="region" label="المنطقة" required error={errors.region}>
                <select id="region" className={`form-select${errors.region ? " is-invalid" : ""}`} value={form.region} onChange={set("region")}>
                  <option value="">اختر المنطقة</option>{REGIONS.map((r) => <option key={r}>{r}</option>)}
                </select>
              </Field>
            </fieldset>
          )}
          {rep}
        </div>
        <div className="org-form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "جاري الحفظ..." : repOnly ? "حفظ" : "حفظ وإنشاء"}</button>
          <Link to="/admin/banks" className="btn btn-outline-secondary" aria-disabled={saving} onClick={(e) => saving && e.preventDefault()}>إلغاء</Link>
        </div>
      </form>
    </OrgShell>
  );
}
