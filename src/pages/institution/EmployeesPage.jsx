import { useEffect, useState } from "react";
import InstitutionLayout from "../../components/InstitutionLayout";
import { createStaff, getApiErrorMessages, getApiFieldErrors, getStaff, updateStaffStatus } from "../../api";
import { showFlashMessage } from "../../flashMessage";

const empty = { name: "", email: "", phone: "", nationalId: "", password: "", passwordConfirmation: "" };
const labels = { active: "فعال", pending_verification: "بانتظار التفعيل", pending: "بانتظار التفعيل", suspended: "موقوف" };

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState(empty);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [notice, setNotice] = useState("");
  const [suspending, setSuspending] = useState(null);
  const [reason, setReason] = useState("");

  useEffect(() => {
    getStaff().then((result) => setEmployees(result.data?.data || []))
      .catch((requestError) => setError(getApiErrorMessages(requestError).join(" - ")))
      .finally(() => setLoading(false));
  }, []);

  const change = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: "" }));
  };

  async function submit(event) {
    event.preventDefault(); setSaving(true); setError(""); setFieldErrors({});
    try {
      const result = await createStaff(form);
      setEmployees((current) => [result.data, ...current]);
      setForm(empty); setShowForm(false); setNotice(""); setFieldErrors({});
      showFlashMessage(result.message || "تمت إضافة الموظف بنجاح.");
    } catch (requestError) {
      const errors = getApiFieldErrors(requestError, {
        national_id: "nationalId",
        password_confirmation: "passwordConfirmation",
      });
      setFieldErrors(errors);
      if (Object.keys(errors).length === 0) setError(getApiErrorMessages(requestError).join(" - "));
    }
    finally { setSaving(false); }
  }

  async function changeStatus(employee, status, suspensionReason = null) {
    setError("");
    try {
      const result = await updateStaffStatus(employee.id, status, suspensionReason);
      const updated = result.data || { ...employee, status, suspension_reason: suspensionReason };
      setEmployees((current) => current.map((item) => item.id === employee.id ? { ...item, ...updated } : item));
      setNotice(""); setSuspending(null); setReason("");
      showFlashMessage(status === "suspended" ? "تم إيقاف الموظف بنجاح." : "تمت إعادة تفعيل الموظف بنجاح.");
    } catch (requestError) { setError(getApiErrorMessages(requestError).join(" - ")); }
  }

  function submitSuspension(event) {
    event.preventDefault();
    if (!suspending || reason.trim().length < 3) { setError("سبب التوقيف مطلوب ويجب أن يكون 3 أحرف على الأقل."); return; }
    changeStatus(suspending, "suspended", reason.trim());
  }

  const field = (name, label, type = "text") => <div className="mb-3"><label className="form-label" htmlFor={`staff-${name}`}>{label}</label><input required id={`staff-${name}`} name={name} type={type} className={`form-control${fieldErrors[name] ? " is-invalid" : ""}`} value={form[name]} onChange={change} aria-invalid={Boolean(fieldErrors[name])} aria-describedby={fieldErrors[name] ? `staff-${name}-error` : undefined} />{fieldErrors[name] && <div className="field-error" id={`staff-${name}-error`} role="alert">{fieldErrors[name]}</div>}</div>;

  return <InstitutionLayout title="إدارة الموظفين" description="أضف أعضاء الفريق وتابع حالة حساباتهم.">
    {notice && <div className="alert alert-success">{notice}</div>}{error && !showForm && <div className="alert alert-danger">{error}</div>}
    <div className="card sprint-card"><div className="card-header sprint-card-header"><h2 className="card-title">فريق المؤسسة</h2><button className="btn btn-primary" onClick={() => { setError(""); setFieldErrors({}); setShowForm(true); }}>إضافة موظف</button></div>
      {loading ? <div className="card-body text-center">جاري التحميل...</div> : <div className="table-responsive"><table className="table table-vcenter card-table"><thead><tr><th>الموظف</th><th>الهاتف</th><th>الحالة</th><th>الإجراء</th></tr></thead><tbody>{employees.map((employee) => <tr key={employee.id}>
        <td><strong>{employee.name}</strong><small className="d-block">{employee.email}</small></td><td>{employee.phone}</td>
        <td><span className={`status-badge ${employee.status}`}>{labels[employee.status] || employee.status}</span>{employee.suspension_reason && <small className="d-block text-danger mt-1">السبب: {employee.suspension_reason}</small>}</td>
        <td><button className="btn btn-outline-secondary btn-sm" disabled={employee.status === "pending_verification" || employee.status === "pending"} onClick={() => employee.status === "suspended" ? changeStatus(employee, "active") : (setSuspending(employee), setReason(""), setError(""))}>{employee.status === "suspended" ? "إعادة التفعيل" : "إيقاف"}</button></td>
      </tr>)}</tbody></table></div>}
    </div>

    {showForm && <div className="modal-backdrop-custom"><div className="sprint-modal" role="dialog" aria-modal="true"><div className="modal-heading"><h2>إضافة موظف جديد</h2><button className="btn-close" onClick={() => { setShowForm(false); setError(""); setFieldErrors({}); }} /></div><form onSubmit={submit}><div className="modal-body-custom">{error && <div className="alert alert-danger" role="alert">{error}</div>}{field("name", "الاسم الكامل")}{field("email", "البريد الإلكتروني", "email")}{field("phone", "رقم الهاتف")}{field("nationalId", "رقم الهوية")}{field("password", "كلمة المرور الأولية", "password")}{field("passwordConfirmation", "تأكيد كلمة المرور", "password")}</div><div className="modal-actions"><button type="button" className="btn btn-outline-secondary" onClick={() => { setShowForm(false); setError(""); setFieldErrors({}); }}>إلغاء</button><button className="btn btn-primary" disabled={saving}>{saving ? "جاري الحفظ..." : "إضافة الموظف"}</button></div></form></div></div>}

    {suspending && <div className="modal-backdrop-custom"><div className="sprint-modal" role="dialog" aria-modal="true"><div className="modal-heading"><h2>إيقاف {suspending.name}</h2><button className="btn-close" onClick={() => setSuspending(null)} /></div><form onSubmit={submitSuspension}><div className="modal-body-custom"><label className="form-label" htmlFor="staff-suspension-reason">سبب التوقيف</label><textarea id="staff-suspension-reason" className="form-control" rows="4" maxLength="500" required value={reason} onChange={(event) => setReason(event.target.value)} placeholder="اكتب سبب توقيف المستخدم..." /></div><div className="modal-actions"><button type="button" className="btn btn-outline-secondary" onClick={() => setSuspending(null)}>إلغاء</button><button className="btn btn-danger">تأكيد التوقيف</button></div></form></div></div>}
  </InstitutionLayout>;
}
