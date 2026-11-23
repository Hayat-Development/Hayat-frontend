import OrgShell from "../../components/org/OrgShell";
import { Link } from "react-router-dom";
import { StatusChip } from "../../components/org/ui";
import { useSession } from "../../context/SessionContext";
import { normalizeRole, ROLES } from "../../constants/org";

export default function OrgDashboardPage({ profile = false }) {
  const session = useSession() || {};
  const { bank, name, email, phone, role } = session;
  const isRepresentative = normalizeRole(role) === ROLES.REP;
  const title = profile ? "الملف المؤسسي" : bank?.name || "لوحة المؤسسة";

  return (
    <OrgShell title={title} actions={bank?.status ? <StatusChip status={bank.status} label={bank.status === "active" ? "الحساب فعال" : undefined} /> : null}>
      {!profile && <p className="org-sub mb-3">أهلًا {name || "بك"}</p>}
      <div className="org-form-two">
        <section className="org-card org-pad">
          <h2 className="org-h2">بيانات المؤسسة</h2>
          <dl className="org-dl">
            <div><dt>اسم المؤسسة</dt><dd>{bank?.name || "—"}</dd></div>
            <div><dt>رقم المؤسسة</dt><dd>{bank?.id ?? "—"}</dd></div>
          </dl>
        </section>
        <section className="org-card org-pad">
          <h2 className="org-h2">بيانات الحساب</h2>
          <dl className="org-dl">
            <div><dt>الاسم</dt><dd>{name || "—"}</dd></div>
            <div><dt>البريد الإلكتروني</dt><dd dir="ltr" className="org-ltr">{email || "—"}</dd></div>
            <div><dt>رقم الهاتف</dt><dd dir="ltr" className="org-ltr">{phone || "—"}</dd></div>
            <div><dt>الدور</dt><dd>{isRepresentative ? "الممثل الرسمي" : "موظف بنك دم"}</dd></div>
          </dl>
        </section>
      </div>
      {!profile && <>
        <h2 className="org-h2 mt-4">وظائف المؤسسة</h2>
        <div className="org-ops">
          {isRepresentative && (
            <Link to="/org/staff" className="org-op"><i className="ti ti-users" /><strong>إدارة الموظفين</strong><span>إضافة الفريق وإيقافه وإعادة تفعيله</span></Link>
          )}
          <div className="org-op is-soon" aria-disabled="true"><i className="ti ti-droplet" /><strong>طلبات الدم</strong><span>قريبًا</span></div>
          <div className="org-op is-soon" aria-disabled="true"><i className="ti ti-speakerphone" /><strong>الحملات</strong><span>قريبًا</span></div>
        </div>
      </>}
    </OrgShell>
  );
}
