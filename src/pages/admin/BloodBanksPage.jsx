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
  const [suspending, setSuspending] = useState(null);
  const [reason, setReason] = useState("");
  const location = useLocation();

  useEffect(() => {
    getBloodBanks().then((result) => setBanks(result.data?.data || []))
      .catch((requestError) => setError(getApiErrorMessages(requestError).join(" - ")))
      .finally(() => setLoading(false));
  }, []);

  const visible = useMemo(() => banks.filter((bank) =>
    `${bank.name} ${bank.region} ${bank.users?.[0]?.name || ""}`.includes(query)
  ), [banks, query]);

  async function changeStatus(bank, status, suspensionReason = null) {
    setUpdating(bank.id); setError("");
    try {
      const result = await updateBloodBankStatus(bank.id, status, suspensionReason);
      const updated = result.data || { ...bank, status, suspension_reason: suspensionReason };
      setBanks((items) => items.map((item) => item.id === bank.id ? { ...item, ...updated } : item));
      setSuspending(null); setReason("");
    } catch (requestError) {
      setError(getApiErrorMessages(requestError).join(" - "));
    } finally { setUpdating(null); }
  }

  function submitSuspension(event) {
    event.preventDefault();
    if (!suspending || reason.trim().length < 3) {
      setError("سبب التوقيف مطلوب ويجب أن يكون 3 أحرف على الأقل.");
      return;
    }
    changeStatus(suspending, "suspended", reason.trim());
  }

  return <AdminLayout title="بنوك الدم" description="إدارة المؤسسات والممثلين الرسميين المرتبطين بها." activePage="blood-banks">
    {location.state?.message && <div className="alert alert-success">{location.state.message}</div>}
    {error && <div className="alert alert-danger">{error}</div>}
    <div className="sprint-stats row g-3 mb-4">
      <div className="col-md-6"><div className="stat-card"><span><i className="ti ti-building-hospital" /></span><div><small>إجمالي المؤسسات</small><strong>{banks.length}</strong></div></div></div>
      <div className="col-md-6"><div className="stat-card"><span className="teal"><i className="ti ti-circle-check" /></span><div><small>مؤسسات نشطة</small><strong>{banks.filter((bank) => bank.status === "active").length}</strong></div></div></div>
    </div>
    <div className="card sprint-card">
      <div className="card-header sprint-card-header"><h2 className="card-title">المؤسسات المسجلة</h2><Link className="btn btn-primary" to="/admin/blood-banks/create"><i className="ti ti-plus ms-2" />إضافة بنك دم</Link></div>
      <div className="card-body border-bottom"><input className="form-control" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث باسم المؤسسة أو المنطقة أو الممثل" /></div>
      {loading ? <div className="card-body text-center">جاري التحميل...</div> : <div className="table-responsive"><table className="table table-vcenter card-table">
        <thead><tr><th>المؤسسة</th><th>المنطقة</th><th>الممثل الرسمي</th><th>الحالة</th><th>الإجراء</th></tr></thead>
        <tbody>{visible.map((bank) => <tr key={bank.id}>
          <td><strong>{bank.name}</strong><small className="d-block">{bank.email}</small></td>
          <td>{bank.region}</td>
          <td>{bank.users?.[0]?.name || "—"}<small className="d-block">{bank.users?.[0]?.email}</small></td>
          <td><span className={`status-badge ${bank.status}`}>{bank.status === "active" ? "نشط" : "موقوف"}</span>{bank.suspension_reason && <small className="d-block text-danger mt-1">السبب: {bank.suspension_reason}</small>}</td>
          <td><button className="btn btn-outline-secondary btn-sm" disabled={updating === bank.id} onClick={() => bank.status === "active" ? (setSuspending(bank), setReason(""), setError("")) : changeStatus(bank, "active")}>{bank.status === "active" ? "إيقاف" : "إعادة التفعيل"}</button></td>
        </tr>)}</tbody>
      </table></div>}
    </div>

    {suspending && <div className="modal-backdrop-custom"><div className="sprint-modal" role="dialog" aria-modal="true" aria-labelledby="suspend-bank-title">
      <div className="modal-heading"><h2 id="suspend-bank-title">إيقاف {suspending.name}</h2><button className="btn-close" onClick={() => setSuspending(null)} /></div>
      <form onSubmit={submitSuspension}>
        <div className="modal-body-custom"><label className="form-label" htmlFor="bank-suspension-reason">سبب التوقيف</label><textarea id="bank-suspension-reason" className="form-control" rows="4" maxLength="500" required value={reason} onChange={(event) => setReason(event.target.value)} placeholder="اكتب سبب توقيف المؤسسة..." /></div>
        <div className="modal-actions"><button type="button" className="btn btn-outline-secondary" onClick={() => setSuspending(null)}>إلغاء</button><button className="btn btn-danger" disabled={updating === suspending.id}>تأكيد التوقيف</button></div>
      </form>
    </div></div>}
  </AdminLayout>;
}
