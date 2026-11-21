import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import { createBloodBank, getApiErrorMessages } from "../../api";

const empty = {
  name: "", city: "غزة", area: "", address: "", representative: "",
  representativeEmail: "", representativePhone: "", representativeNationalId: "",
  password: "", passwordConfirmation: "",
};

export default function CreateBloodBankPage() {
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  async function submit(event) {
    event.preventDefault(); setSaving(true); setError("");
    try {
      await createBloodBank(form);
      navigate("/admin/blood-banks", { replace: true, state: { message: "تم إنشاء المؤسسة والممثل الرسمي بنجاح" } });
    } catch (requestError) {
      setError(getApiErrorMessages(requestError).join(" - "));
    } finally { setSaving(false); }
  }

  const field = (name, label, type = "text") => <div className="col-md-6">
    <label className="form-label" htmlFor={name}>{label}</label>
    <input required id={name} name={name} type={type} className="form-control" value={form[name]} onChange={change} />
  </div>;

  return <AdminLayout title="إضافة بنك دم" description="إنشاء المؤسسة وربط الممثل الرسمي الأول." activePage="blood-banks">
    <Link className="back-link" to="/admin/blood-banks">العودة إلى بنوك الدم</Link>
    {error && <div className="alert alert-danger mt-3">{error}</div>}
    <form onSubmit={submit} className="mt-3">
      <div className="card sprint-card mb-4">
        <div className="card-header"><h2 className="card-title">بيانات المؤسسة</h2></div>
        <div className="card-body"><div className="row g-3">
          {field("name", "اسم بنك الدم")}{field("city", "المدينة")}
          {field("area", "المنطقة")}{field("address", "العنوان التفصيلي")}
        </div></div>
      </div>
      <div className="card sprint-card mb-4">
        <div className="card-header"><h2 className="card-title">الممثل الرسمي الأول</h2></div>
        <div className="card-body">
          <p className="text-secondary">بريد ورقم هاتف الممثل هما بيانات التواصل الرسمية للمؤسسة.</p>
          <div className="row g-3">
            {field("representative", "الاسم الكامل")}{field("representativeEmail", "البريد الإلكتروني", "email")}
            {field("representativePhone", "رقم الهاتف", "tel")}{field("representativeNationalId", "رقم الهوية")}
            {field("password", "كلمة المرور الأولية", "password")}{field("passwordConfirmation", "تأكيد كلمة المرور", "password")}
          </div>
        </div>
      </div>
      <div className="form-actions">
        <Link className="btn btn-outline-secondary" to="/admin/blood-banks">إلغاء</Link>
        <button className="btn btn-primary" disabled={saving}>{saving ? "جاري الحفظ..." : "إنشاء المؤسسة والممثل"}</button>
      </div>
    </form>
  </AdminLayout>;
}
