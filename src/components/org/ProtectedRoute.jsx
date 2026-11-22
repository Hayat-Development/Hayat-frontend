
import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { getCurrentUser } from "../../api";

export default function ProtectedRoute() {
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let active = true;

    async function checkAuth() {
      const token = localStorage.getItem("hayat_token");

      if (!token) {
        localStorage.removeItem("hayat_user");
        if (active) setStatus("unauthorized");
        return;
      }

      try {
        const user = await getCurrentUser();

        if (!active) return;

        localStorage.setItem(
          "hayat_user",
          JSON.stringify(user)
        );

        setStatus("authorized");
      } catch (error) {
        if (!active) return;

        if (error.status === 401 || error.status === 403) {
          localStorage.removeItem("hayat_token");
          localStorage.removeItem("hayat_user");
          setStatus("unauthorized");
        } else {
          setStatus("error");
        }
      }
    }

    checkAuth();

    return () => {
      active = false;
    };
  }, []);

  if (status === "loading") {
    return <p style={{ textAlign: "center", marginTop: 80 }}>
      جاري التحقق من تسجيل الدخول...
    </p>;
  }

  if (status === "error") {
    return (
      <div style={{ textAlign: "center", marginTop: 80 }}>
        <p>تعذر الاتصال بالخادم. حاول تحديث الصفحة.</p>
      </div>
    );
  }

  if (status === "unauthorized") {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
