import { useCallback, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import OrgShell from "../../components/org/OrgShell";
import StatusDialog, { ActionDialog } from "../../components/org/StatusDialog";
import { EmptyState, ErrorScreen, Pagination, TableSkeleton } from "../../components/org/ui";
import useOrgRequest from "../../hooks/useOrgRequest";
import {
  deleteBankPermanently, deleteStaffPermanently, deleteUserPermanently,
  listBanks, listStaff, listUsers, setBankStatus, setStaffStatus, setUserStatus,
} from "../../services/orgApi";
import { classifyError } from "../../utils/org";

const categories = {
  banks: { list: listBanks, setStatus: setBankStatus, remove: deleteBankPermanently, label: "المؤسسة" },
  users: { list: listUsers, setStatus: setUserStatus, remove: deleteUserPermanently, label: "المستخدم" },
  staff: { list: listStaff, setStatus: setStaffStatus, remove: deleteStaffPermanently, label: "الموظف" },
};

export default function SuspendedPage({ administration = false }) {
  const [params] = useSearchParams();
  const category = administration ? (params.get("type") === "users" ? "users" : "banks") : "staff";

  return (
    <OrgShell title={administration ? "الموقوفون" : "الموظفون الموقوفون"}>
      {administration && <nav className="org-suspension-tabs" aria-label="نوع السجلات الموقوفة">
        <Link to="/admin/suspended" aria-current={category === "banks" ? "page" : undefined}
          className={category === "banks" ? "is-selected" : ""}>
          <i className="ti ti-building-hospital" aria-hidden="true" /> المؤسسات
        </Link>
        <Link to="/admin/suspended?type=users" aria-current={category === "users" ? "page" : undefined}
          className={category === "users" ? "is-selected" : ""}>
          <i className="ti ti-users" aria-hidden="true" /> المستخدمون
        </Link>
      </nav>}
      <SuspendedList key={category} category={category} />
    </OrgShell>
  );
}

function SuspendedList({ category }) {
  const [page, setPage] = useState(1);
  const [selection, setSelection] = useState(null);
  const { list, setStatus, remove, label } = categories[category];
  const request = useCallback((signal) => list({ page, signal, suspended: true }), [list, page]);
  const { data, loading, error, reload } = useOrgRequest(request);

  function completed() {
    setSelection(null);
    if (page > 1 && data?.data.length === 1) setPage(page - 1);
    else reload();
  }

  async function deleteRecord(id) {
    try {
      return await remove(id);
    } catch (error) {
      if (error.status === 404) {
        throw new Error("السجل غير متاح للحذف. حدّث القائمة وتأكد من تشغيل نسخة الباك المحدثة.", { cause: error });
      }
      throw error;
    }
  }

  return (
    <section className="org-card org-card-table">
      {loading ? <TableSkeleton />
        : error ? <ErrorScreen kind={classifyError(error)} onRetry={reload}
            detail={!error.status && error.message !== "Failed to fetch" ? error.message : undefined} />
        : !data.data.length ? <EmptyState title="لا توجد سجلات موقوفة" />
        : <>
            <table className="org-table">
              <thead><tr><th>{label}</th><th>البريد الإلكتروني</th><th>سبب التوقيف</th><th>الإجراء</th></tr></thead>
              <tbody>
                {data.data.map((record) => (
                  <tr key={record.id}>
                    <td data-label={label}><strong>{record.name}</strong></td>
                    <td data-label="البريد الإلكتروني"><span dir="ltr" className="org-ltr">{record.email}</span></td>
                    <td data-label="سبب التوقيف">{record.suspension_reason || (record.deleted_at ? "من المحذوفات السابقة" : "لم يُسجّل سبب")}</td>
                    <td data-label="الإجراء">
                      <div className="org-actions">
                        <button type="button" className="btn btn-outline-primary btn-sm"
                          onClick={() => setSelection({ record, deleting: false })}>إعادة تفعيل</button>
                        <button type="button" className="btn btn-outline-danger btn-sm"
                          onClick={() => setSelection({ record, deleting: true })}>حذف نهائي</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination meta={data.meta} onPage={setPage} />
          </>}
      {selection?.deleting && <ActionDialog danger title={`حذف ${selection.record.name} نهائيًا؟`}
        text={category === "banks"
          ? "ستفقد المؤسسة بياناتها التشغيلية، وسيُحذف حساب الممثل الرسمي وكل حسابات الموظفين نهائيًا. ستظل التبرعات السابقة محفوظة، ولن تظهر المؤسسة ضمن خيارات التبرع الجديدة."
          : "لا يمكن استرجاع الحساب بعد الحذف النهائي."}
        confirmText="تأكيد الحذف النهائي" save={() => deleteRecord(selection.record.id)}
        onDone={completed} onCancel={() => setSelection(null)} />}
      {selection && !selection.deleting && <StatusDialog title={`إعادة تفعيل ${selection.record.name}؟`}
        text={category === "banks"
          ? "سيظهر السجل في قائمة المؤسسات، ويمكن لأعضاء الفريق الذين حساباتهم نشطة تسجيل الدخول."
          : "سيظهر الحساب في القائمة. إذا لم يؤكد صاحبه البريد بعد، سيحتاج إلى تأكيده عند تسجيل الدخول."}
        status="active" save={() => setStatus(selection.record.id, "active")}
        onDone={completed} onCancel={() => setSelection(null)} />}
    </section>
  );
}
