import { useCallback, useRef, useState } from "react";
import OrgShell from "../../components/org/OrgShell";
import { AccountFields } from "../../components/org/AccountFields";
import StatusDialog from "../../components/org/StatusDialog";
import { EmptyState, ErrorScreen, Notice, Pagination, StatusChip, TableSkeleton } from "../../components/org/ui";
import { useSession } from "../../context/SessionContext";
import useDebounce from "../../hooks/useDebounce";
import useOrgRequest from "../../hooks/useOrgRequest";
import { createStaff, listStaff, listUsers, setStaffStatus, setUserStatus } from "../../services/orgApi";
import { SUCCESS, normalizeRole } from "../../constants/org";
import { getApiErrorMessages } from "../../api";
import { showFlashMessage } from "../../flashMessage";
import { accountPayload, classifyError, emptyAccount, mapFieldErrors } from "../../utils/org";

const roleNames = {
  donor: "متبرع",
  rep_bank: "ممثل مؤسسة",
  staff_bank: "موظف مؤسسة",
  organization_representative: "ممثل مؤسسة",
};

export default function StaffPage({ administration = false }) {
  const session = useSession();
  const [search, setSearch] = useState("");
  const [pageSelection, setPageSelection] = useState({ search: "", page: 1 });
  const [selected, setSelected] = useState(null);
  const [adding, setAdding] = useState(false);
  const query = useDebounce(search.trim());
  const page = pageSelection.search === query ? pageSelection.page : 1;

  const list = administration ? listUsers : listStaff;
  const saveStatus = administration ? setUserStatus : setStaffStatus;
  const request = useCallback((signal) => list({ search: query, page, signal, suspended: false }), [list, query, page]);
  const { data, error, loading, reload } = useOrgRequest(request);
  const searchLabel = administration ? "بحث بالاسم أو البريد أو الهاتف" : "بحث بالاسم أو البريد";
  const title = administration ? "المستخدمون" : `فريق ${session?.bank?.name || "المؤسسة"}`;
  const add = () => setAdding(true);
  const addButton = !administration && <button type="button" className="btn btn-primary" onClick={add}>
    <i className="ti ti-plus" />إضافة موظف
  </button>;

  return (
    <OrgShell title={title} actions={addButton}>
      <div className="org-search">
        <i className="ti ti-search" aria-hidden="true" />
        <input type="search" className="form-control" placeholder={searchLabel} aria-label={searchLabel}
          value={search} onChange={(event) => setSearch(event.target.value)} />
      </div>
      <section className="org-card org-card-table">
        {loading ? <TableSkeleton />
          : error ? <ErrorScreen kind={classifyError(error)} onRetry={reload} />
          : !data.data.length ? <EmptyState
              title={query ? "لا نتائج مطابقة" : administration ? "لا يوجد مستخدمون بعد" : "لا يوجد موظفون بعد"}
              actionText={!administration && !query ? "إضافة موظف" : undefined} onAction={add} />
          : <>
              <table className="org-table">
                <thead><tr><th>الاسم</th><th>بيانات التواصل</th>{administration && <th>الدور</th>}<th>الحالة</th><th>الإجراء</th></tr></thead>
                <tbody>
                  {data.data.map((member) => (
                    <tr key={member.id}>
                      <td data-label="الاسم"><strong>{member.name}</strong></td>
                      <td data-label="بيانات التواصل">
                        <div className="org-cell">
                          <span dir="ltr" className="org-ltr">{member.email}</span>
                          {member.phone && <span dir="ltr" className="org-ltr org-sub">{member.phone}</span>}
                        </div>
                      </td>
                      {administration && <td data-label="الدور">{roleNames[normalizeRole(member.role)] || member.role}</td>}
                      <td data-label="الحالة">
                        <div className="org-cell">
                          <StatusChip status={member.status} />
                        </div>
                      </td>
                      <td data-label="الإجراء">
                        <button type="button" className="btn btn-outline-danger btn-sm"
                          onClick={() => setSelected(member)}>إيقاف</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination meta={data.meta} onPage={(nextPage) => setPageSelection({ search: query, page: nextPage })} />
            </>}
      </section>
      {selected && <StatusDialog title={`إيقاف ${selected.name}؟`}
        text="سيُمنع تسجيل الدخول إلى هذا الحساب حتى إعادة تفعيله."
        status="suspended" save={(status, reason) => saveStatus(selected.id, status, reason)}
        success={administration ? "تم إيقاف المستخدم." : SUCCESS.staffSuspended}
        onCancel={() => setSelected(null)} onDone={() => {
          setSelected(null);
          if (page > 1 && data?.data.length === 1) setPageSelection({ search: query, page: page - 1 });
          else reload();
        }} />}
      {adding && <StaffFormDialog onClose={() => setAdding(false)}
        onCreated={() => { setAdding(false); setPageSelection({ search: query, page: 1 }); reload(); }} />}
    </OrgShell>
  );
}

function StaffFormDialog({ onClose, onCreated }) {
  const [fields, setFields] = useState(emptyAccount);
  const [errors, setErrors] = useState({});
  const [banner, setBanner] = useState("");
  const [saving, setSaving] = useState(false);
  const submitting = useRef(false);

  function update(name, value) {
    setFields((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  }

  async function submit(event) {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setSaving(true);
    setErrors({});
    setBanner("");

    try {
      const result = await createStaff(accountPayload(fields));
      showFlashMessage(result.message || SUCCESS.staffAdded);
      onCreated();
    } catch (error) {
      const validationErrors = mapFieldErrors(error);
      setErrors(validationErrors);
      if (!Object.keys(validationErrors).length) setBanner(getApiErrorMessages(error).join(" "));
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  }

  return (
    <div className="org-overlay" onKeyDown={(event) => { if (event.key === "Escape" && !saving) onClose(); }}>
      <form className="org-modal org-modal-form" role="dialog" aria-modal="true"
        aria-labelledby="staff-form-title" onSubmit={submit} noValidate>
        <h2 id="staff-form-title">إضافة موظف</h2>
        <Notice type="error">{banner}</Notice>
        <fieldset disabled={saving}>
          <AccountFields prefix="staff" values={fields} errors={errors} onChange={update} autoFocus />
        </fieldset>
        <div className="org-modal-actions">
          <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={saving}>إلغاء</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "جاري الحفظ…" : "حفظ الحساب"}</button>
        </div>
      </form>
    </div>
  );
}
