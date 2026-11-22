import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import OrgShell from "../../components/org/OrgShell";
import { ConfirmDialog, ErrorScreen, Notice, StatusChip, TableSkeleton } from "../../components/org/ui";
import useBlockingError from "../../hooks/useBlockingError";
import { getBank, setBankStatus } from "../../services/sprint2Api.js";
import { MESSAGES, SUCCESS } from "../../constants/org";

export default function BankDetailsPage() {
  const { bankId } = useParams();
  const [bank, setBank] = useState(null);
  const [netErr, setNetErr] = useState(false);
  const [notice, setNotice] = useState(null);
  const [confirm, setConfirm] = useState(null); // "suspended" | "active"
  const [busy, setBusy] = useState(false);
  const [block, handle] = useBlockingError();

  const load = useCallback(() => {
    setNetErr(false);
    getBank(bankId)
      .then((res) => setBank(res?.data || res))
      .catch((e) => { if (!handle(e)) setNetErr(true); });
  }, [bankId, handle]);
  useEffect(() => { load(); }, [load]);

  async function apply() {
    setBusy(true);
    try {
      await setBankStatus(bank.id, confirm);
      setNotice({ type: "success", text: confirm === "suspended" ? SUCCESS.bankSuspended : SUCCESS.bankActivated });
      setConfirm(null); load();
    } catch (e) { setConfirm(null); if (!handle(e)) setNotice({ type: "error", text: MESSAGES.NETWORK }); }
    finally { setBusy(false); }
  }

  const back = <Link to="/admin/banks" className="btn btn-outline-secondary"><i className="ti ti-arrow-right" />القائمة</Link>;
  if (block) return <OrgShell title="تفاصيل المؤسسة"><ErrorScreen kind={block.kind} backTo="/admin/banks" backText="العودة للقائمة" /></OrgShell>;
  if (netErr) return <OrgShell title="تفاصيل المؤسسة"><ErrorScreen kind="network" onRetry={load} /></OrgShell>;
  if (!bank) return <OrgShell title="تفاصيل المؤسسة"><section className="org-card"><TableSkeleton /></section></OrgShell>;

  return (
    <OrgShell title={bank?.name || "تفاصيل المؤسسة"} actions={back}>
      <Notice type={notice?.type} onClose={() => setNotice(null)}>{notice?.text}</Notice>
      <div className="org-form-two">
        <section className="org-card org-pad">
          <h2 className="org-h2">بيانات المؤسسة</h2>
          <dl className="org-dl">
            <div><dt>الحالة</dt><dd><StatusChip status={bank?.status} /></dd></div>
            <div><dt>البريد</dt><dd dir="ltr" className="org-ltr">{bank?.email}</dd></div>
            <div><dt>الهاتف</dt><dd dir="ltr" className="org-ltr">{bank?.phone}</dd></div>
            <div><dt>المنطقة</dt><dd>{bank?.region}</dd></div>
          </dl>
          <div className="org-form-actions">
            {bank?.status === "active"
              ? <button type="button" className="btn btn-outline-danger" onClick={() => setConfirm("suspended")}>إيقاف المؤسسة</button>
              : <button type="button" className="btn btn-primary" onClick={() => setConfirm("active")}>تفعيل المؤسسة</button>}
          </div>
        </section>
        <section className="org-card org-pad">
          <h2 className="org-h2">الممثل الرسمي</h2>
          {bank?.representative ? <p className="mb-0"><i className="ti ti-user-check" /> {bank.representative.name}</p> : (
            <>
              <div className="org-warn mb-3"><i className="ti ti-alert-triangle" />بنك بلا ممثل لا يُعدّ إعدادًا مكتملًا</div>
              <Link className="btn btn-primary" to={`/admin/banks/${bank?.id}/representative`}>إضافة ممثل</Link>
            </>
          )}
        </section>
      </div>
      {confirm && (
        <ConfirmDialog busy={busy} danger={confirm === "suspended"}
          title={confirm === "suspended" ? `إيقاف ${bank?.name || "المؤسسة"}؟` : `تفعيل ${bank?.name || "المؤسسة"}؟`}
          text={confirm === "suspended" ? "لن يستطيع ممثل المؤسسة ولا موظفوها استخدام عمليات المؤسسة حتى تعيد تفعيلها." : "يعود موظفوها الفعالون للعمل دون تغيير حالات حساباتهم."}
          confirmText={confirm === "suspended" ? "تأكيد الإيقاف" : "تأكيد التفعيل"} onConfirm={apply} onCancel={() => setConfirm(null)} />
      )}
    </OrgShell>
  );
}
