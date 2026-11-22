import OrgShell from "../../components/org/OrgShell";
import { Link } from "react-router-dom";
import { StatusChip } from "../../components/org/ui";
import { useSession } from "../../context/SessionContext";

// نفس اللوحة للممثل والموظف؛ قسم إدارة الموظفين يظهر في OrgShell للممثل فقط.
export default function OrgDashboardPage() {
  const session = useSession() || {};
  const { bank, name, role } = session;
  const title = bank?.name || "لوحة المؤسسة";

  return (
    <OrgShell title={title} actions={bank?.status ? <StatusChip status={bank.status} label={bank.status === "active" ? "الحساب فعال" : undefined} /> : null}>
      <p className="org-sub mb-3">أهلًا {name || "بك"}</p>
      <section className="org-card org-pad">
        <h2 className="org-h2">بيانات المؤسسة</h2>
        <dl className="org-dl">
          <div><dt>الهاتف</dt><dd dir="ltr" className="org-ltr">{bank?.phone || "—"}</dd></div>
          <div><dt>البريد</dt><dd dir="ltr" className="org-ltr">{bank?.email || "—"}</dd></div>
          <div><dt>المنطقة</dt><dd>{bank?.region || "—"}</dd></div>
        </dl>
      </section>
      <h2 className="org-h2 mt-4">وظائف المؤسسة</h2>
      <div className="org-ops">
        {role === "rep_bank" && (
          <Link to="/org/staff" className="org-op"><i className="ti ti-users" /><strong>إدارة الموظفين</strong><span>إضافة الفريق وإيقافه وإعادة تفعيله</span></Link>
        )}
        <div className="org-op is-soon" aria-disabled="true"><i className="ti ti-droplet" /><strong>طلبات الدم</strong><span>قريبًا</span></div>
        <div className="org-op is-soon" aria-disabled="true"><i className="ti ti-speakerphone" /><strong>الحملات</strong><span>قريبًا</span></div>
      </div>
    </OrgShell>
  );
}
