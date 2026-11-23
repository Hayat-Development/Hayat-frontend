import { useCallback, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import OrgShell from "../../components/org/OrgShell";
import BankStatusDialog from "../../components/org/BankStatusDialog";
import { EmptyState, ErrorScreen, Pagination, StatusChip, TableSkeleton } from "../../components/org/ui";
import useOrgRequest from "../../hooks/useOrgRequest";
import { listBanks } from "../../services/orgApi";
import { classifyError } from "../../utils/org";

export default function BanksAdminPage() {
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const navigate = useNavigate();
  const request = useCallback((signal) => listBanks({ page, signal, suspended: false }), [page]);
  const { data, loading, error, reload } = useOrgRequest(request);
  const add = <Link to="/admin/banks/new" className="btn btn-primary"><i className="ti ti-plus" />إضافة بنك دم</Link>;

  return (
    <OrgShell title="إدارة بنوك الدم" actions={add}>
      <section className="org-card org-card-table">
        {loading ? <TableSkeleton />
          : error ? <ErrorScreen kind={classifyError(error)} onRetry={reload} />
          : data.data.length === 0 ? <EmptyState title="لا توجد بنوك دم بعد" text="أضف أول بنك دم وممثله الرسمي."
              actionText="إضافة بنك دم" onAction={() => navigate("/admin/banks/new")} />
          : <>
              <table className="org-table">
                <thead><tr><th>المؤسسة</th><th>الممثل الرسمي</th><th>الحالة</th><th>الإجراء</th></tr></thead>
                <tbody>
                  {data.data.map((bank) => (
                    <tr key={bank.id}>
                      <td data-label="المؤسسة"><div className="org-cell"><Link className="org-record-link" to={`/admin/banks/${bank.id}`}>{bank.name}</Link><div className="org-sub">{bank.region}</div></div></td>
                      <td data-label="الممثل الرسمي">{bank.representative?.name || "لم يُعيَّن بعد"}</td>
                      <td data-label="الحالة">
                        <div className="org-cell">
                          <StatusChip status={bank.status} />
                        </div>
                      </td>
                      <td data-label="الإجراء">
                        <button type="button" className="btn btn-outline-danger btn-sm"
                          onClick={() => setSelected(bank)}>إيقاف</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination meta={data.meta} onPage={setPage} />
            </>}
      </section>
      {selected && <BankStatusDialog bank={selected} onCancel={() => setSelected(null)}
        onDone={() => {
          setSelected(null);
          if (page > 1 && data?.data.length === 1) setPage(page - 1);
          else reload();
        }} />}
    </OrgShell>
  );
}
