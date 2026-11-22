
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getCurrentUser,
  logoutUser,
  getApiErrorMessages,
} from "../../api";

export default function DashboardPage() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    getCurrentUser()
      .then((result) => {
        if (!active) return;

        const currentUser =
          result?.data?.user ?? result?.user ?? result;

        if (!currentUser?.id) {
          throw new Error("استجابة بيانات المستخدم غير مكتملة");
        }

        setUser(currentUser);
        setError("");
      })
      .catch((err) => {
        if (!active) return;

        if (err.status === 401) {
          localStorage.removeItem("hayat_token");
          localStorage.removeItem("hayat_user");
          navigate("/login", { replace: true });
        } else {
          setError(getApiErrorMessages(err).join(" - "));
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [navigate]);

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);
    setError("");

    try {
      await logoutUser();

      localStorage.removeItem("hayat_token");
      localStorage.removeItem("hayat_user");
      sessionStorage.removeItem("hayat_challenge_id");

      navigate("/login", {
        replace: true,
        state: {
          message: "تم تسجيل الخروج بنجاح.",
        },
      });
    } catch (err) {
      if (err.status === 401) {
        localStorage.removeItem("hayat_token");
        localStorage.removeItem("hayat_user");
        sessionStorage.removeItem("hayat_challenge_id");

        navigate("/login", { replace: true });
      } else {
        setError(getApiErrorMessages(err).join(" - "));
        setShowLogoutModal(false);
      }
    } finally {
      setLoggingOut(false);
    }
  }

  if (loading) {
    return (
      <main className="hayat-dashboard-loading" dir="rtl">
        جاري تحميل بيانات المستخدم...
      </main>
    );
  }

  if (!user) {
    return (
      <main className="hayat-dashboard-loading" dir="rtl">
        <p>{error || "تعذر تحميل بيانات المستخدم."}</p>
        <button
          className="btn btn-primary"
          onClick={() => navigate("/login")}
        >
          العودة لتسجيل الدخول
        </button>
      </main>
    );
  }

  return (
    <main className="hayat-dashboard" dir="rtl">
      <div className="hayat-dashboard-card">
        <div className="hayat-dashboard-icon">
          <i className="ti ti-heart-handshake" />
        </div>

        <h1>أهلًا {user.name} 👋</h1>
        <p className="hayat-dashboard-subtitle">
          مرحبًا بك في منصة حياة
        </p>

        <div className="hayat-dashboard-info">
          <p>
            <strong>البريد الإلكتروني:</strong> {user.email}
          </p>
          <p>
            <strong>نوع الحساب:</strong> {user.role}
          </p>
        </div>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        <button
          type="button"
          className="btn btn-danger"
          onClick={() => setShowLogoutModal(true)}
        >
          <i className="ti ti-logout ms-2" />
          تسجيل الخروج
        </button>
      </div>

      {showLogoutModal && (
        <div
          className="hayat-modal-overlay"
          role="presentation"
        >
          <div
            className="hayat-logout-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-modal-title"
          >
            <div className="hayat-modal-icon">
              <i className="ti ti-logout" />
            </div>

            <h2 id="logout-modal-title">
              تسجيل الخروج
            </h2>

            <p>
              هل أنت متأكد أنك تريد تسجيل الخروج من حسابك
              في منصة حياة؟
            </p>

            <div className="hayat-modal-actions">
              <button
                type="button"
                className="btn btn-outline-secondary"
                disabled={loggingOut}
                onClick={() => setShowLogoutModal(false)}
              >
                إلغاء
              </button>

              <button
                type="button"
                className="btn btn-danger"
                disabled={loggingOut}
                onClick={handleLogout}
              >
                {loggingOut
                  ? "جاري تسجيل الخروج..."
                  : "تأكيد تسجيل الخروج"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
