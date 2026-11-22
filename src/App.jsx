
import { useEffect } from "react";

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import Login from "./pages/org/Login";
import Register from "./pages/org/Register";
import VerifyEmail from "./pages/org/VerifyEmail";
import ProtectedRoute from "./components/org/ProtectedRoute";
import DashboardPage from "./pages/org/DashboardPage";
import ForgotPasswordPage from "./pages/org/ForgotPasswordPage";
import ResetPasswordPage from "./pages/org/ResetPasswordPage";
import "./App.css";
import "./styles/org.css";
import { ErrorScreen } from "./components/org/ui";
import RoleRoute from "./components/org/RoleRoute";
import { ROLES } from "./constants/org";
import ActivatePage from "./pages/org/ActivatePage";
import BanksAdminPage from "./pages/org/BanksAdminPage";
import BankFormPage from "./pages/org/BankFormPage";
import BankDetailsPage from "./pages/org/BankDetailsPage";
import SettingsPage from "./pages/org/SettingsPage";
import OrgDashboardPage from "./pages/org/OrgDashboardPage";
import StaffPage from "./pages/org/StaffPage";


function PageTitle() {
  const { pathname } = useLocation();

  useEffect(() => {
    const titles = {
      "/login": "تسجيل الدخول",
      "/register": "إنشاء حساب",
      "/verify-email": "تأكيد البريد الإلكتروني",
      "/dashboard": "لوحة التحكم",
      "/forgot-password": "استعادة كلمة المرور",
      "/reset-password": "تعيين كلمة مرور جديدة",
      "/activate": "تفعيل الحساب",
      "/admin/banks": "إدارة بنوك الدم",
      "/admin/banks/new": "إضافة بنك دم",
      "/org": "لوحة المؤسسة",
      "/org/staff": "إدارة الموظفين",
      "/settings": "الإعدادات",
    };

    document.title = `حياة | ${titles[pathname] || "الصفحة غير موجودة"}`;
  }, [pathname]);

  return null;
}

function App() {
  return (
    <BrowserRouter>
    <PageTitle />
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route element={<ProtectedRoute />}>
          <Route
            path="/dashboard"
            element={<DashboardPage />}
          />
        </Route>
        <Route
          element={<ForgotPasswordPage />}
          path="/forgot-password"
        />
        <Route
  path="/reset-password"
  element={<ResetPasswordPage />}
/>
<Route path="/activate" element={<ActivatePage />} />

        {/* السبرنت 2 — الحماية الفعلية عند الباك، والـ RoleRoute لتجربة الواجهة */}
        <Route element={<RoleRoute allow={[ROLES.ADMIN]} />}>
          <Route path="/admin/banks" element={<BanksAdminPage />} />
          <Route path="/admin/banks/new" element={<BankFormPage />} />
          <Route path="/admin/banks/:bankId" element={<BankDetailsPage />} />
          <Route path="/admin/banks/:bankId/representative" element={<BankFormPage />} />
        </Route>
        <Route element={<RoleRoute allow={[ROLES.REP, ROLES.STAFF]} />}>
          <Route path="/org" element={<OrgDashboardPage />} />
        </Route>
        <Route element={<RoleRoute allow={[ROLES.ADMIN, ROLES.REP, ROLES.STAFF]} />}>
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
        <Route element={<RoleRoute allow={[ROLES.REP]} />}>
          <Route path="/org/staff" element={<StaffPage />} />
        </Route>
<Route path="*" element={<ErrorScreen full kind="not_found" backTo="/" backText="العودة للرئيسية" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
