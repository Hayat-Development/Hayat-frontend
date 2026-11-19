import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import LogoutDialog from "./LogoutDialog";

const menuItems = [
  { key: "dashboard", title: "نظرة عامة", icon: "ti-layout-dashboard", path: "/admin/dashboard" },
  { key: "users", title: "المستخدمون", icon: "ti-users", path: "/admin/users" },
  { key: "blood-banks", title: "بنوك الدم", icon: "ti-building-hospital", path: "/admin/blood-banks" },
  { key: "requests", title: "متابعة الطلبات", icon: "ti-clipboard-list", path: "/admin/requests" },
  { key: "donations", title: "سجلات التبرع", icon: "ti-droplet-check", path: "/admin/donations" },
  { key: "points", title: "النقاط والتدقيق", icon: "ti-receipt", path: "/admin/points" },
  { key: "reports", title: "الإشراف الصحي", icon: "ti-report-medical", path: "/admin/health-reports" },
];

export default function AdminLayout({ title, description, activePage, children }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  function logout() {
    localStorage.removeItem("hayat_token");
    localStorage.removeItem("hayat_user");
    sessionStorage.removeItem("hayat_challenge_id");
    navigate("/login", { replace: true, state: { message: "تم تسجيل الخروج بنجاح." } });
  }

  return <div className="page sprint-shell" dir="rtl">
    <header className="sprint-mobile-header"><button type="button" className="mobile-menu-button" aria-label="فتح القائمة" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}><i className="ti ti-menu-2" /></button><img src="/assets/img/hayat-logo-wordmark.png" alt="حياة" /><span>إدارة النظام</span></header>
    {menuOpen && <button className="sidebar-backdrop" aria-label="إغلاق القائمة" onClick={() => setMenuOpen(false)} />}
    <aside className={`navbar navbar-vertical navbar-expand-lg dashboard-sidebar sprint-sidebar ${menuOpen ? "is-open" : ""}`} aria-label="التنقل في إدارة النظام">
      <div className="container-fluid">
        <div className="sidebar-brand-row"><Link to="/admin/dashboard" className="navbar-brand" onClick={() => setMenuOpen(false)}><img src="/assets/img/hayat-logo-wordmark.png" alt="حياة" /></Link><button className="sidebar-close" type="button" aria-label="إغلاق القائمة" onClick={() => setMenuOpen(false)}><i className="ti ti-x" /></button></div>
        <div className="sidebar-label">إدارة النظام</div>
        <ul className="navbar-nav">{menuItems.map((item) => <li className="nav-item" key={item.key}><Link to={item.path} onClick={() => setMenuOpen(false)} className={activePage === item.key ? "nav-link active" : "nav-link"}><span className="nav-link-icon"><i className={`ti ${item.icon}`} /></span><span className="nav-link-title">{item.title}</span></Link></li>)}</ul>
        <div className="sidebar-bottom mt-auto"><p className="small text-secondary">عطاؤك حياة</p><button type="button" className="btn btn-outline-secondary w-100" onClick={() => { setMenuOpen(false); setLogoutOpen(true); }}><i className="ti ti-logout ms-2" />تسجيل الخروج</button></div>
      </div>
    </aside>
    <div className="page-wrapper"><div className="demo-strip">منصة حياة · إدارة النظام</div><header className="navbar app-topbar"><div className="container-xl"><span className="text-secondary small">إدارة النظام</span></div></header><main id="main-content"><div className="page-header"><div className="container-xl"><div className="page-pretitle">حياة / إدارة النظام</div><h1 className="page-title">{title}</h1>{description && <p className="text-secondary mt-2 mb-0">{description}</p>}</div></div><div className="page-body"><div className="container-xl">{children}</div></div></main><footer className="footer footer-transparent mt-auto"><div className="container-xl text-secondary small">© 2026 حياة</div></footer></div>
    <LogoutDialog open={logoutOpen} onCancel={() => setLogoutOpen(false)} onConfirm={logout} />
  </div>;
}
