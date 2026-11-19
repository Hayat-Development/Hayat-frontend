import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import { getApiErrorMessages, getBloodBanks, updateBloodBankStatus } from "../../api";

export default function BloodBanksPage() {
  const [banks, setBanks] = useState([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const location = useLocation();
  useEffect(() => { getBloodBanks().then((r) => setBanks(r.data?.data || [])).catch((e) => setError(getApiErrorMessages(e).join(" - "))).finally(() => setLoading(false)); }, []);
  const visible = useMemo(() => banks.filter((b) => `${b.name} ${b.region} ${b.users?.[0]?.name || ""}`.includes(query)), [banks, query]);
  async function toggle(bank) {
    setUpdating(bank.id); setError("");
    try { const status = bank.status === "active" ? "suspended" : "active"; await updateBloodBankStatus(bank.id, status); setBanks((items) => items.map((x) => x.id === bank.id ? { ...x, status } : x)); }
    catch (e) { setError(getApiErrorMessages(e).join(" - ")); } finally { setUpdating(null); }
  }
  return <AdminLayout title="بنوك الدم" description="إدارة المؤسسات والممثلين الرسميين المرتبطين بها." activePage="blood-banks">
    {location.state?.message && <div className="alert alert-success">{location.state.message}</div>}
    {error && <div className="alert alert-danger">{error}</div>}
    <div className="sprint-stats row g-3 mb-4"><div className="col-md-6"><div className="stat-card"><span><i className="ti ti-building-hospital" /></span><div><small>إجمالي المؤسسات</small><strong>{banks.length}</strong></div></div></div><div className="col-md-6"><div className="stat-card"><span className="teal"><i className="ti ti-circle-check" /></span><div><small>مؤسسات نشطة</small><strong>{banks.filter((b) => b.status === "active").length}</strong></div></div></div></div>
    <div className="card sprint-card"><div className="card-header sprint-card-header"><h2 className="card-title">المؤسسات المسجلة</h2><Link className="btn btn-primary" to="/admin/blood-banks/create"><i className="ti ti-plus ms-2" />إضافة بنك دم</Link></div>
      <div className="card-body border-bottom"><input className="form-control" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ابحث باسم المؤسسة أو المنطقة أو الممثل" /></div>
      {loading ? <div className="card-body text-center">جاري التحميل...</div> : <div className="table-responsive"><table className="table table-vcenter card-table"><thead><tr><th>المؤسسة</th><th>المنطقة</th><th>الممثل الرسمي</th><th>الحالة</th><th>الإجراء</th></tr></thead><tbody>{visible.map((bank) => <tr key={bank.id}><td><strong>{bank.name}</strong><small className="d-block">{bank.email}</small></td><td>{bank.region}</td><td>{bank.users?.[0]?.name || "—"}<small className="d-block">{bank.users?.[0]?.email}</small></td><td><span className={`status-badge ${bank.status}`}>{bank.status === "active" ? "نشط" : "موقوف"}</span></td><td><button className="btn btn-outline-secondary btn-sm" disabled={updating === bank.id} onClick={() => toggle(bank)}>{bank.status === "active" ? "إيقاف" : "إعادة التفعيل"}</button></td></tr>)}</tbody></table></div>}
    </div>
  </AdminLayout>;
}
