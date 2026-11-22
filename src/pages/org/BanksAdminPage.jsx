import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import OrgShell from "../../components/org/OrgShell";
import { ActivationLinkBox, ConfirmDialog, EmptyState, ErrorScreen, Notice, StatusChip, TableSkeleton } from "../../components/org/ui";
import useBlockingError from "../../hooks/useBlockingError";
import { getAdminBanks, setBankStatus } from "../../api.js";
import { MESSAGES, SUCCESS } from "../../constants/org";

export default function BanksAdminPage() {
  const [banks, setBanks] = useState(null);
  const [netErr, setNetErr] = useState(false);
  const loc = useLocation();
  const [notice, setNotice] = useState(loc.state?.notice ? { type: "success", text: loc.state.notice } : null);
  const [linkUrl, setLinkUrl] = useState(loc.state?.link || "");
  const [confirm, setConfirm] = useState(null); // { bank, next }
  const [busy, setBusy] = useState(false);
  const [block, handle] = useBlockingError();
  const navigate = useNavigate();

  const load = useCallback(() => {
    setBanks(null); setNetErr(false);
    getAdminBanks()
      .then((res) => {
        const list = Array.isArray(res) ? res : (res?.data || res?.banks || []);
        setBanks(list);
      })
      .catch((e) => {
        if (!handle(e)) setNetErr(true);
      });
  }, [handle]);
  useEffect(load, [load]);

  async function applyStatus() {
    setBusy(true);
    try {
      await setBankStatus(confirm.bank.id, confirm.next);
      setNotice({ type: "success", text: confirm.next === "suspended" ? SUCCESS.bankSuspended : SUCCESS.bankActivated });
      setConfirm(null); load();
    } catch (e) {
      setConfirm(null);
      if (!handle(e)) setNotice({ type: "error", text: MESSAGES.NETWORK });
    } finally { setBusy(false); }
  }

  const add = <Link to="/admin/banks/new" className="btn btn-primary"><i className="ti ti-plus" />إضافة بنك دم</Link>;
  if (block) return <OrgShell title="إدارة بنوك الدم"><ErrorScreen kind={block.kind} backTo="/admin/banks" /></OrgShell>;

  const bankList = Array.isArray(banks) ? banks : (banks?.data || []);

  return (
    <OrgShell title="إدارة بنوك الدم" actions={add}>
      <Notice type={notice?.type} onClose={() => setNotice(null)}>{notice?.text}</Notice>
      {linkUrl && <div className="org-card org-pad mb-3"><ActivationLinkBox url={linkUrl} /></div>}
      <section className="org-card">
        {netErr ? <ErrorScreen kind="network" onRetry={load} />
          : !banks ? <TableSkeleton />
          : bankList.length === 0 ? <EmptyState title="لا توجد بنوك دم بعد" text="أضف أول بنك دم وممثله الرسمي." actionText="إضافة بنك دم" onAction={() => navigate("/admin/banks/new")} />
          : (
            <table className="org-table">
              <thead><tr><th>المؤسسة</th><th>الممثل الرسمي</th><th>الحالة</th><th>الإجراء</th></tr></thead>
              <tbody>
                {bankList.map((b) => (
                  <tr key={b.id}>
                    <td data-label="المؤسسة"><strong>{b.name}</strong><div className="org-sub">{b.region}</div></td>
                    <td data-label="الممثل الرسمي">{b.representative?.name || <span className="org-sub">لم يُعيَّن بعد</span>}</td>
                    <td data-label="الحالة">
                      <StatusChip status={b.status === "suspended" ? "suspended" : b.representative ? "active" : "no_rep"} />
                      {b.status === "active" && !b.representative && <div className="org-warn"><i className="ti ti-alert-triangle" />بنك بلا ممثل لا يُعدّ إعدادًا مكتملًا</div>}
                    </td>
                    <td data-label="الإجراء" className="org-actions">
                      <Link className="btn btn-outline-secondary btn-sm" to={`/admin/banks/${b.id}`}>عرض</Link>
                      {!b.representative && <Link className="btn btn-primary btn-sm" to={`/admin/banks/${b.id}/representative`}>إضافة ممثل</Link>}
                      {b.status === "active" && <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => setConfirm({ bank: b, next: "suspended" })}>إيقاف</button>}
                      {b.status === "suspended" && <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setConfirm({ bank: b, next: "active" })}>تفعيل</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </section>
      {confirm && (
        <ConfirmDialog
          danger={confirm.next === "suspended"} busy={busy}
          title={confirm.next === "suspended" ? `إيقاف ${confirm.bank.name}؟` : `تفعيل ${confirm.bank.name}؟`}
          text={confirm.next === "suspended" ? "لن يستطيع ممثل المؤسسة ولا موظفوها استخدام عمليات المؤسسة حتى تعيد تفعيلها." : "يعود موظفوها الفعالون للعمل دون تغيير حالات حساباتهم."}
          confirmText={confirm.next === "suspended" ? "تأكيد الإيقاف" : "تأكيد التفعيل"}
          onConfirm={applyStatus} onCancel={() => setConfirm(null)}
        />
      )}
    </OrgShell>
  );
}
