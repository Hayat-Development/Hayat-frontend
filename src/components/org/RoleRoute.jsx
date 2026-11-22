import { useCallback, useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { fetchSession } from "../../services/sprint2Api";
import { SessionContext } from "../../context/SessionContext";
import { roleHome } from "../../constants/org";
import { classifyError, clearAuth } from "../../utils/org";
import { ErrorScreen, TableSkeleton } from "./ui";

export default function RoleRoute({ allow }) {
  const navigate = useNavigate();
  const [state, setState] = useState({ status: "loading" });

  const load = useCallback(() => {
    setState({ status: "loading" });
    fetchSession()
      .then((session) => setState({ status: "ok", session }))
      .catch((err) => {
        const kind = classifyError(err);
        if (kind === "unauthorized") { clearAuth(); navigate("/login", { replace: true }); }
        else if (kind === "pending") navigate("/activate", { replace: true });
        else setState({ status: "error", kind, reason: err?.data?.reason });
      });
  }, [navigate]);
  useEffect(load, [load]);

  if (state.status === "loading") return <div className="org-full"><div className="org-state"><TableSkeleton rows={3} /></div></div>;
  if (state.status === "error") return <ErrorScreen full kind={state.kind} reason={state.reason} onRetry={state.kind === "network" ? load : undefined} backTo="/login" backText="العودة لتسجيل الدخول" />;

  const { session } = state;
  if (session.status === "suspended") return <ErrorScreen full kind="account_suspended" backTo="/login" backText="العودة لتسجيل الدخول" />;
  if (!allow.includes(session.role)) {
    const isStaff = session.role === "staff_bank";
    return <ErrorScreen full kind="forbidden" backTo={roleHome(session.role)} detail={isStaff ? "إدارة الموظفين متاحة للممثل الرسمي فقط." : undefined} />;
  }
  return <SessionContext.Provider value={session}><Outlet /></SessionContext.Provider>;
}
