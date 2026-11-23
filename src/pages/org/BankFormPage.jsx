import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import OrgShell from "../../components/org/OrgShell";
import { AccountFields } from "../../components/org/AccountFields";
import { Field, Notice, TextInput } from "../../components/org/ui";
import { getApiErrorMessages } from "../../api";
import { createBank } from "../../services/orgApi";
import { SUCCESS } from "../../constants/org";
import { showFlashMessage } from "../../flashMessage";
import { accountPayload, emptyAccount, mapFieldErrors } from "../../utils/org";

export default function BankFormPage() {
  const navigate = useNavigate();
  const [bank, setBank] = useState({ name: "", region: "", address: "" });
  const [representative, setRepresentative] = useState(emptyAccount);
  const [errors, setErrors] = useState({});
  const [banner, setBanner] = useState("");
  const [saving, setSaving] = useState(false);
  const submitting = useRef(false);

  function updateBank(name, value) {
    setBank((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  }

  function updateRepresentative(name, value) {
    setRepresentative((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [`representative.${name}`]: "" }));
  }

  async function submit(event) {
    event.preventDefault();
    if (submitting.current) return;

    submitting.current = true;
    setSaving(true);
    setErrors({});
    setBanner("");
    try {
      const result = await createBank({
        name: bank.name.trim(),
        region: bank.region.trim(),
        address: bank.address.trim() || null,
        representative: accountPayload(representative),
      });
      showFlashMessage(result.message || SUCCESS.bankCreated);
      navigate("/admin/banks", { replace: true });
    } catch (error) {
      const fields = mapFieldErrors(error);
      setErrors(fields);
      if (!Object.keys(fields).length) setBanner(getApiErrorMessages(error).join(" "));
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  }

  const representativeErrors = Object.fromEntries(
    Object.keys(emptyAccount).map((name) => [name, errors[`representative.${name}`]]),
  );

  return (
    <OrgShell title="إضافة بنك دم">
      <Notice type="error">{banner}</Notice>
      <form onSubmit={submit} noValidate>
        <div className="org-form-two">
          <fieldset className="org-card org-pad" disabled={saving}>
            <legend>بيانات المؤسسة</legend>
            <Field id="bank-name" label="اسم البنك" required error={errors.name}>
              <TextInput id="bank-name" required maxLength={120} value={bank.name} error={errors.name}
                onChange={(event) => updateBank("name", event.target.value)} />
            </Field>
            <Field id="bank-region" label="المدينة أو المنطقة" required error={errors.region}>
              <TextInput id="bank-region" required maxLength={120} value={bank.region} error={errors.region}
                onChange={(event) => updateBank("region", event.target.value)} />
            </Field>
            <Field id="bank-address" label="العنوان التفصيلي" error={errors.address}>
              <TextInput id="bank-address" maxLength={500} value={bank.address} error={errors.address}
                onChange={(event) => updateBank("address", event.target.value)} />
            </Field>
          </fieldset>
          <fieldset className="org-card org-pad" disabled={saving}>
            <legend>الممثل الرسمي الأول</legend>
            <p className="org-sub">بريد الممثل ورقم جواله هما بيانات التواصل للمؤسسة. يستخدم الممثل كلمة المرور الأولية عند تسجيل الدخول.</p>
            <AccountFields prefix="representative" values={representative}
              errors={representativeErrors} onChange={updateRepresentative} />
          </fieldset>
        </div>
        <div className="org-form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "جاري الحفظ…" : "حفظ وإنشاء"}</button>
          <Link to="/admin/banks" className="btn btn-outline-secondary" aria-disabled={saving}
            onClick={(event) => { if (saving) event.preventDefault(); }}>إلغاء</Link>
        </div>
      </form>
    </OrgShell>
  );
}
