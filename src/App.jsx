
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
import FlashMessage from "./components/org/FlashMessage";
import BanksAdminPage from "./pages/org/BanksAdminPage";
import BankFormPage from "./pages/org/BankFormPage";
import BankDetailsPage from "./pages/org/BankDetailsPage";
import SettingsPage from "./pages/org/SettingsPage";
import OrgDashboardPage from "./pages/org/OrgDashboardPage";
import StaffPage from "./pages/org/StaffPage";
import SuspendedPage from "./pages/org/SuspendedPage";


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
      "/admin/users": "إدارة المستخدمين",
      "/admin/suspended": "الموقوفون",
      "/org/staff/suspended": "الموظفون الموقوفون",
      "/admin/banks": "إدارة بنوك الدم",
      "/admin/banks/new": "إضافة بنك دم",
      "/org": "لوحة المؤسسة",
      "/org/staff": "إدارة الموظفين",
      "/settings": "الإعدادات",
    };

    document.title = `حياة | ${titles[pathname] || (pathname.startsWith("/admin/banks/") ? "تفاصيل المؤسسة" : "الصفحة غير موجودة")}`;
  }, [pathname]);

  return null;
}

function App() {
  return (
    <BrowserRouter>
      <PageTitle />
      <FlashMessage />
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/activate" element={<Navigate to="/login" replace />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
        </Route>
        <Route element={<RoleRoute allow={[ROLES.ADMIN]} />}>
          <Route path="/admin/banks" element={<BanksAdminPage />} />
          <Route path="/admin/banks/new" element={<BankFormPage />} />
          <Route path="/admin/banks/:bankId" element={<BankDetailsPage />} />
          <Route path="/admin/users" element={<StaffPage key="users" administration />} />
          <Route path="/admin/suspended" element={<SuspendedPage administration />} />
          <Route path="/admin/trash" element={<Navigate to="/admin/suspended" replace />} />
          <Route path="/admin/dashboard" element={<Navigate to="/admin/banks" replace />} />
          <Route path="/admin/blood-banks" element={<Navigate to="/admin/banks" replace />} />
          <Route path="/admin/blood-banks/create" element={<Navigate to="/admin/banks/new" replace />} />
        </Route>
        <Route element={<RoleRoute allow={[ROLES.REP, ROLES.STAFF]} />}>
          <Route path="/org" element={<OrgDashboardPage />} />
          <Route path="/institution/dashboard" element={<Navigate to="/org" replace />} />
          <Route path="/institution/profile" element={<Navigate to="/org" replace />} />
        </Route>
        <Route element={<RoleRoute allow={[ROLES.ADMIN, ROLES.REP, ROLES.STAFF]} />}>
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
        <Route element={<RoleRoute allow={[ROLES.REP]} />}>
          <Route path="/org/staff" element={<StaffPage key="staff" />} />
          <Route path="/org/staff/suspended" element={<SuspendedPage />} />
          <Route path="/institution/employees" element={<Navigate to="/org/staff" replace />} />
        </Route>
        <Route path="*" element={<ErrorScreen full kind="not_found" backTo="/" backText="العودة للرئيسية" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
