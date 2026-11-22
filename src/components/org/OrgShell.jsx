import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useSession } from "../../context/SessionContext";
import { ROLES, normalizeRole } from "../../constants/org";
import { clearAuth } from "../../utils/org";
import { logoutUser } from "../../api";
import { ErrorScreen } from "./ui";

export default function OrgShell({ title, actions, children }) {
  const s = useSession() || {};
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const userRole = normalizeRole(s?.role);
  const suspended = userRole !== ROLES.ADMIN && s?.bank?.status === "suspended";

  async function logout() {
    try { await logoutUser(); } catch {}
    clearAuth();
    navigate("/login", { replace: true });
  }

  const links = userRole === ROLES.ADMIN
    ? [{ to: "/admin/banks", icon: "ti-building-hospital", text: "بنوك الدم" }]
    : suspended ? [] : [
        { to: "/org", icon: "ti-layout-dashboard", text: "اللوحة", end: true },
        { soon: true, icon: "ti-droplet", text: "الطلبات" },
        ...(userRole === ROLES.REP ? [{ to: "/org/staff", icon: "ti-users", text: "إدارة الموظفين" }] : []),
      ];

  if (!suspended) links.push({ to: "/settings", icon: "ti-settings", text: "الإعدادات" });

  return (
    <div className="org-app">
      <aside className={`org-side${open ? " is-open" : ""}`}>
        <div className="org-side-head">
          <span className="org-brand"><img src="/assets/img/hayat-logo-symbol.png" alt="" width="26" height="32" />حياة</span>
          <button type="button" className="org-burger" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="القائمة">
            <i className={`ti ${open ? "ti-x" : "ti-menu-2"}`} />
          </button>
        </div>
        <nav className="org-nav" aria-label="التنقل الرئيسي">
          {links.map((l) => l.soon
            ? <span key={l.text} className="org-nav-item is-soon" aria-disabled="true"><i className={`ti ${l.icon}`} />{l.text}<small>قريبًا</small></span>
            : <NavLink key={l.to} to={l.to} end={l.end} className="org-nav-item" onClick={() => setOpen(false)}><i className={`ti ${l.icon}`} />{l.text}</NavLink>)}
        </nav>
        <button type="button" className="org-nav-item org-logout" onClick={logout}><i className="ti ti-logout" />خروج</button>
      </aside>
      <main className="org-main" id="main-content">
        {suspended
          ? <ErrorScreen kind="org_suspended" reason={s?.bank?.suspension_reason} />
          : <>
              <header className="org-head"><h1>{title}</h1>{actions}</header>
              {children}
            </>}
      </main>
    </div>
  );
}
