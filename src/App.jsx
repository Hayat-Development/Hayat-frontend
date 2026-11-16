
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
<Route path="*" element={<h1>الصفحة غير موجودة</h1>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
