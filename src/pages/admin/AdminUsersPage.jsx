import { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import { getAdminUsers, getApiErrorMessages, updateAdminUserStatus } from "../../api";

const roleLabels = { donor: "متبرع", bank_rep: "ممثل مؤسسة", bank_staff: "موظف مؤسسة", organization_representative: "ممثل مؤسسة" };

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [suspending, setSuspending] = useState(null);
  const [reason, setReason] = useState("");
  const [updating, setUpdating] = useState(null);

  async function load(search = "") {
    setLoading(true); setError("");
    try { const result = await getAdminUsers(search); setUsers(result.data?.data || []); }
    catch (requestError) { setError(getApiErrorMessages(requestError).join(" - ")); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    let active = true;
    getAdminUsers().then((result) => {
      if (active) setUsers(result.data?.data || []);
    }).catch((requestError) => {
      if (active) setError(getApiErrorMessages(requestError).join(" - "));
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  async function changeStatus(user, status, suspensionReason = null) {
    setUpdating(user.id); setError(""); setNotice("");
    try {
      const result = await updateAdminUserStatus(user.id, status, suspensionReason);
      setUsers((current) => current.map((item) => item.id === user.id ? { ...item, ...result.data } : item));
      setNotice(result.message || "تم تحديث حالة المستخدم بنجاح."); setSuspending(null); setReason("");
    } catch (requestError) { setError(getApiErrorMessages(requestError).join(" - ")); }
    finally { setUpdating(null); }
  }

  function submitSearch(event) { event.preventDefault(); load(query.trim()); }
  function submitSuspension(event) {
    event.preventDefault();
    if (!suspending || reason.trim().length < 3) { setError("سبب التوقيف مطلوب ويجب أن يكون 3 أحرف على الأقل."); return; }
    changeStatus(suspending, "suspended", reason.trim());
  }

  return <AdminLayout title="المستخدمون" description="إدارة حسابات مستخدمي المنصة وحالاتهم." activePage="users">
    {notice && <div className="alert alert-success">{notice}</div>}{error && <div className="alert alert-danger">{error}</div>}
    <div className="card sprint-card">
      <div className="card-header"><h2 className="card-title">المستخدمون المسجلون</h2></div>
      <form className="card-body border-bottom d-flex gap-2" onSubmit={submitSearch}><input className="form-control" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث بالاسم أو البريد أو الهاتف" /><button className="btn btn-primary">بحث</button></form>
      {loading ? <div className="card-body text-center">جاري التحميل...</div> : <div className="table-responsive"><table className="table table-vcenter card-table">
        <thead><tr><th>المستخدم</th><th>الهاتف</th><th>الدور</th><th>الحالة</th><th>الإجراء</th></tr></thead>
        <tbody>{users.map((user) => <tr key={user.id}>
          <td><strong>{user.name}</strong><small className="d-block">{user.email}</small></td><td>{user.phone}</td><td>{roleLabels[user.role] || user.role}</td>
          <td><span className={`status-badge ${user.status}`}>{user.status === "active" ? "نشط" : user.status === "suspended" ? "موقوف" : "بانتظار التفعيل"}</span>{user.suspension_reason && <small className="d-block text-danger mt-1">السبب: {user.suspension_reason}</small>}</td>
          <td><button className="btn btn-outline-secondary btn-sm" disabled={updating === user.id || !["active", "suspended"].includes(user.status)} onClick={() => user.status === "suspended" ? changeStatus(user, "active") : (setSuspending(user), setReason(""), setError(""))}>{user.status === "suspended" ? "إعادة التفعيل" : "إيقاف"}</button></td>
        </tr>)}</tbody>
      </table></div>}
    </div>

    {suspending && <div className="modal-backdrop-custom"><div className="sprint-modal" role="dialog" aria-modal="true"><div className="modal-heading"><h2>إيقاف {suspending.name}</h2><button className="btn-close" onClick={() => setSuspending(null)} /></div><form onSubmit={submitSuspension}><div className="modal-body-custom"><label className="form-label" htmlFor="admin-user-suspension-reason">سبب التوقيف</label><textarea id="admin-user-suspension-reason" className="form-control" rows="4" maxLength="500" required value={reason} onChange={(event) => setReason(event.target.value)} placeholder="اكتب سبب توقيف المستخدم..." /></div><div className="modal-actions"><button type="button" className="btn btn-outline-secondary" onClick={() => setSuspending(null)}>إلغاء</button><button className="btn btn-danger" disabled={updating === suspending.id}>تأكيد التوقيف</button></div></form></div></div>}
  </AdminLayout>;
}
