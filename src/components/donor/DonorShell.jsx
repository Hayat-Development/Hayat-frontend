
import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { clearAuth } from "../../utils/org";
import { logoutUser } from "../../api";
import { ActionDialog } from "../org/StatusDialog";

const links = [
  {
    to: "/dashboard",
    icon: "ti-layout-dashboard",
    text: "نظرة عامة",
  },
  {
    to: "/donor/eligibility",
    icon: "ti-heart-check",
    text: "التوفر والأهلية الأولية",
  },
  {
    to: "/donor/profile",
    icon: "ti-user-circle",
    text: "الملف الشخصي",
  },
];

export default function DonorShell({
  title,
  actions,
  children,
}) {
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [confirmingLogout, setConfirmingLogout] =
    useState(false);

  async function logout() {
    try {
      await logoutUser();
    } catch {
      // Clear the local session even if the server is unavailable.
    }

    clearAuth();

    return {
      message: "تم تسجيل الخروج بنجاح.",
    };
  }

  return (
    <div className="org-app donor-app" dir="rtl">
      <aside className={`org-side${open ? " is-open" : ""}`}>
        <div className="org-side-head">
          <span className="org-brand">
            <img
              src="/assets/img/hayat-logo-symbol.png"
              alt=""
              width="26"
              height="32"
            />
            حياة
          </span>

          <button
            type="button"
            className="org-burger"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-controls="donor-navigation"
            aria-label={open ? "إغلاق القائمة" : "فتح القائمة"}
          >
            <i
              className={`ti ${open ? "ti-x" : "ti-menu-2"}`}
              aria-hidden="true"
            />
          </button>
        </div>

        <nav
          id="donor-navigation"
          className="org-nav"
          aria-label="التنقل الرئيسي"
        >
          <div className="donor-nav-label">
            مساحة المتبرع
          </div>

          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end
              className="org-nav-item"
              onClick={() => setOpen(false)}
            >
              <i
                className={`ti ${link.icon}`}
                aria-hidden="true"
              />
              {link.text}
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          className="org-nav-item org-logout"
          onClick={() => {
            setOpen(false);
            setConfirmingLogout(true);
          }}
        >
          <i className="ti ti-logout" aria-hidden="true" />
          خروج
        </button>
      </aside>

      <main className="org-main" id="main-content">
        <header className="org-head">
          <h1>{title}</h1>
          {actions}
        </header>

        {children}
      </main>

      {confirmingLogout && (
        <ActionDialog
          title="تسجيل الخروج"
          text="هل تريد تسجيل الخروج من منصة حياة؟"
          confirmText="تأكيد تسجيل الخروج"
          save={logout}
          onDone={() => navigate("/login", { replace: true })}
          onCancel={() => setConfirmingLogout(false)}
        />
      )}
    </div>
  );
}
