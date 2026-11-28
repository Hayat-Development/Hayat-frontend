import { useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { fetchSession } from "../../services/orgApi";
import { SessionContext } from "../../context/SessionContext";
import { normalizeRole, roleHome } from "../../constants/org";
import useOrgRequest from "../../hooks/useOrgRequest";
import { classifyError, clearAuth } from "../../utils/org";
import { ErrorScreen, TableSkeleton } from "./ui";

export default function RoleRoute({
  allow,
  redirectUnauthorizedRole = false,
}) {
  const { data: session, error, loading, reload } = useOrgRequest(fetchSession);
  const kind = error && classifyError(error);

  useEffect(() => {
    if (kind === "unauthorized" || kind === "pending") clearAuth();
  }, [kind]);

  if (loading) return <div className="org-full"><div className="org-state"><TableSkeleton rows={3} /></div></div>;
  if (kind === "unauthorized" || kind === "pending") return <Navigate to="/login" replace />;
  if (error) return <ErrorScreen full kind={kind} reason={error.data?.reason}
    onRetry={kind === "network" ? reload : undefined} backTo="/login" backText="العودة لتسجيل الدخول" />;

  const role = normalizeRole(session.role);
  if (!allow.includes(role) && redirectUnauthorizedRole) {
    const destination = roleHome(role);

    if (destination !== "/dashboard") {
      return <Navigate to={destination} replace />;
    }
  }
  if (!allow.includes(role)) {
    return <ErrorScreen full kind="forbidden" backTo={roleHome(role)}
      detail={role === "staff_bank" ? "إدارة الموظفين متاحة للممثل الرسمي فقط." : undefined} />;
  }
  return <SessionContext.Provider value={session}><Outlet /></SessionContext.Provider>;
}
