import { useCallback, useState } from "react";
import { Link, useParams } from "react-router-dom";
import OrgShell from "../../components/org/OrgShell";
import BankStatusDialog from "../../components/org/BankStatusDialog";
import { ErrorScreen, StatusChip, TableSkeleton } from "../../components/org/ui";
import useOrgRequest from "../../hooks/useOrgRequest";
import { getBank } from "../../services/orgApi";
import { classifyError } from "../../utils/org";

export default function BankDetailsPage() {
  const { bankId } = useParams();
  const [confirm, setConfirm] = useState(false);
  const request = useCallback((signal) => getBank(bankId, signal), [bankId]);
  const { data: bank, loading, error, reload } = useOrgRequest(request);
  const back = <Link to="/admin/banks" className="btn btn-outline-secondary"><i className="ti ti-arrow-right" />القائمة</Link>;
  const kind = error && classifyError(error);

  return (
    <OrgShell title={bank?.name || "تفاصيل المؤسسة"} actions={back}>
      {loading ? <section className="org-card"><TableSkeleton /></section>
        : error ? <ErrorScreen kind={kind} backTo="/admin/banks" backText="العودة للقائمة"
            onRetry={kind === "not_found" ? undefined : reload} />
        : <div className="org-form-two">
            <section className="org-card org-pad">
              <h2 className="org-h2">بيانات المؤسسة</h2>
              <dl className="org-dl">
                <div><dt>الحالة</dt><dd><StatusChip status={bank.status} /></dd></div>
                {bank.suspension_reason && <div><dt>سبب التوقيف</dt><dd>{bank.suspension_reason}</dd></div>}
                <div><dt>البريد</dt><dd dir="ltr" className="org-ltr">{bank.email}</dd></div>
                <div><dt>الهاتف</dt><dd dir="ltr" className="org-ltr">{bank.phone}</dd></div>
                <div><dt>المنطقة</dt><dd>{bank.region}</dd></div>
                {bank.address && <div><dt>العنوان</dt><dd>{bank.address}</dd></div>}
              </dl>
              <div className="org-form-actions">
                {bank.status === "suspended"
                  ? <Link className="btn btn-outline-secondary" to="/admin/suspended">إدارة المؤسسات الموقوفة</Link>
                  : <button type="button" className="btn btn-outline-danger" onClick={() => setConfirm(true)}>إيقاف المؤسسة</button>}
              </div>
            </section>
            <section className="org-card org-pad">
              <h2 className="org-h2">الممثل الرسمي</h2>
              {bank.representative ? <p className="mb-0"><i className="ti ti-user-check" /> {bank.representative.name}</p>
                : <div className="org-warn"><i className="ti ti-alert-triangle" />لم يُعيّن ممثل لهذه المؤسسة.</div>}
            </section>
          </div>}
      {confirm && bank && <BankStatusDialog bank={bank} onCancel={() => setConfirm(false)}
        onDone={() => { setConfirm(false); reload(); }} />}
    </OrgShell>
  );
}
