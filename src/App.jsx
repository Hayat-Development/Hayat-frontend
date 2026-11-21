
import { useEffect } from "react";

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardPage from "./pages/DashboardPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import BloodBanksPage from "./pages/admin/BloodBanksPage";
import CreateBloodBankPage from "./pages/admin/CreateBloodBankPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import InstitutionDashboardPage from "./pages/institution/InstitutionDashboardPage";
import EmployeesPage from "./pages/institution/EmployeesPage";
import InstitutionProfilePage from "./pages/institution/InstitutionProfilePage";
import "./App.css";


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
      "/admin/blood-banks": "إدارة بنوك الدم",
      "/admin/blood-banks/create": "إضافة بنك دم",
      "/institution/dashboard": "لوحة المؤسسة",
      "/institution/employees": "إدارة الموظفين",
      "/institution/profile": "الملف المؤسسي",
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
<Route element={<ProtectedRoute allowedRoles={["system_admin"]} />}>
  <Route path="/admin/blood-banks" element={<BloodBanksPage />} />
  <Route path="/admin/blood-banks/create" element={<CreateBloodBankPage />} />
  <Route path="/admin/users" element={<AdminUsersPage />} />
  <Route path="/admin/dashboard" element={<Navigate to="/admin/blood-banks" replace />} />
</Route>
<Route element={<ProtectedRoute allowedRoles={["bank_rep", "bank_staff"]} />}>
  <Route path="/institution/dashboard" element={<InstitutionDashboardPage />} />
  <Route path="/institution/profile" element={<InstitutionProfilePage />} />
</Route>
<Route element={<ProtectedRoute allowedRoles={["bank_rep"]} />}>
  <Route path="/institution/employees" element={<EmployeesPage />} />
</Route>
<Route path="*" element={<h1>الصفحة غير موجودة</h1>} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
