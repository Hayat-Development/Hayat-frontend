
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  resetPassword,
  readResetLinkParameters,
  getApiErrorMessages,
} from "../api";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const redirectTimer = useRef(null);

  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const { token, email } = readResetLinkParameters();
  const invalidLink = !token || !email;

  useEffect(() => {
    return () => {
      if (redirectTimer.current) {
        clearTimeout(redirectTimer.current);
      }
    };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();

    if (loading || success || invalidLink) return;

    setError("");

    if (
      password.length < 8 ||
      !/[A-Z]/.test(password) ||
      !/[a-z]/.test(password) ||
      !/[0-9]/.test(password)
    ) {
      setError(
        "كلمة المرور يجب أن تحتوي على 8 أحرف على الأقل، وحرف كبير وصغير ورقم."
      );
      return;
    }

    if (password !== confirmation) {
      setError("كلمتا المرور غير متطابقتين.");
      return;
    }

    setLoading(true);

    try {
      const result = await resetPassword(
        password,
        confirmation
      );

      setSuccess(
        result.message ||
          "تم تغيير كلمة المرور بنجاح."
      );

      setPassword("");
      setConfirmation("");

      redirectTimer.current = setTimeout(() => {
        navigate("/login", { replace: true });
      }, 2000);
    } catch (err) {
      setError(
        getApiErrorMessages(err).join(" - ") ||
          "تعذر تغيير كلمة المرور."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="page"
      dir="rtl"
      data-bs-theme="light"
    >
      <main id="main-content">
        <section className="auth-section public-auth">
          <div className="container-xl auth-container">
            <div className="row g-0 flex-fill auth-split">

              <div className="col-12 col-lg-6 d-flex flex-column justify-content-center auth-form-column">
                <div className="container-tight">
                  <div className="card card-md auth-card">
                    <div className="card-body">

                      <h1 className="auth-title text-center mb-2">
                        بداية جديدة لحسابك
                      </h1>

                      <p className="text-secondary mb-4 text-center">
                        اختر كلمة مرور جديدة من 8 أحرف
                        على الأقل، تحتوي على حرف كبير
                        وحرف صغير ورقم.
                      </p>

                      {invalidLink && (
                        <div
                          className="alert alert-danger"
                          role="alert"
                        >
                          رابط استعادة كلمة المرور غير مكتمل.
                          يرجى طلب رابط جديد.
                        </div>
                      )}

                      {error && (
                        <div
                          className="alert alert-danger"
                          role="alert"
                        >
                          {error}
                        </div>
                      )}

                      {success && (
                        <div
                          className="alert alert-success"
                          role="status"
                        >
                          {success}
                          <div className="mt-2">
                            جاري تحويلك إلى تسجيل الدخول...
                          </div>
                        </div>
                      )}

                      {!success && !invalidLink && (
                        <form
                          id="reset-form"
                          onSubmit={handleSubmit}
                        >
                          <div className="mb-3">
                            <label
                              className="form-label"
                              htmlFor="password"
                            >
                              كلمة المرور الجديدة
                            </label>

                            <div className="password-field">
                              <input
                                className="form-control"
                                type={
                                  showPassword
                                    ? "text"
                                    : "password"
                                }
                                name="password"
                                id="password"
                                placeholder="8 أحرف على الأقل"
                                required
                                autoComplete="new-password"
                                value={password}
                                onChange={(e) =>
                                  setPassword(e.target.value)
                                }
                                disabled={loading}
                              />

                              <button
                                type="button"
                                className="password-toggle"
                                onClick={() =>
                                  setShowPassword(!showPassword)
                                }
                                aria-label={
                                  showPassword
                                    ? "إخفاء كلمة المرور"
                                    : "إظهار كلمة المرور"
                                }
                                aria-pressed={showPassword}
                              >
                                <i
                                  className={
                                    showPassword
                                      ? "ti ti-eye-off"
                                      : "ti ti-eye"
                                  }
                                  aria-hidden="true"
                                />
                              </button>
                            </div>
                          </div>

                          <div className="mb-3">
                            <label
                              className="form-label"
                              htmlFor="confirmPassword"
                            >
                              تأكيد كلمة المرور
                            </label>

                            <div className="password-field">
                              <input
                                className="form-control"
                                type={
                                  showConfirmation
                                    ? "text"
                                    : "password"
                                }
                                name="confirmPassword"
                                id="confirmPassword"
                                placeholder="أعد كلمة المرور"
                                required
                                autoComplete="new-password"
                                value={confirmation}
                                onChange={(e) =>
                                  setConfirmation(e.target.value)
                                }
                                disabled={loading}
                              />

                              <button
                                type="button"
                                className="password-toggle"
                                onClick={() =>
                                  setShowConfirmation(
                                    !showConfirmation
                                  )
                                }
                                aria-label={
                                  showConfirmation
                                    ? "إخفاء كلمة المرور"
                                    : "إظهار كلمة المرور"
                                }
                                aria-pressed={showConfirmation}
                              >
                                <i
                                  className={
                                    showConfirmation
                                      ? "ti ti-eye-off"
                                      : "ti ti-eye"
                                  }
                                  aria-hidden="true"
                                />
                              </button>
                            </div>
                          </div>

                          <button
                            type="submit"
                            className="btn btn-primary w-100"
                            disabled={loading}
                          >
                            {loading
                              ? "جاري حفظ كلمة المرور..."
                              : "حفظ كلمة المرور"}
                          </button>
                        </form>
                      )}

                      <div className="auth-footer">
                        <Link to="/login">
                          العودة إلى تسجيل الدخول
                        </Link>
                      </div>

                    </div>
                  </div>
                </div>
              </div>

              <aside
                className="col-lg-6 d-none d-lg-block public-auth-cover"
                aria-label="عن حياة"
              >
                <div className="public-auth-cover-inner">

                  <div className="cover-lockup">
                    <img
                      src="/assets/img/hayat-logo-symbol.png"
                      width="32"
                      height="40"
                      alt="شعار حياة المعتمد"
                    />
                    <span>حياة تجمعنا على العطاء</span>
                  </div>

                  <figure className="cover-photo">
                    <picture>
                      <source
                        type="image/webp"
                        srcSet="/assets/img/backgrounds/community-hands-640.webp"
                      />
                      <img
                        src="/assets/img/backgrounds/community-hands-640.jpg"
                        alt=""
                        width="640"
                        height="533"
                        loading="lazy"
                        decoding="async"
                      />
                    </picture>
                  </figure>

                  <h2>بداية جديدة، ونفس الأثر.</h2>

                  <p>
                    بعد حفظ كلمة المرور، بتقدر ترجع
                    لحسابك وتتابع نداءاتك وسجل تبرعاتك
                    في منصة حياة.
                  </p>

                  <div className="cover-caption">
                    <i
                      className="ti ti-stethoscope"
                      aria-hidden="true"
                    />{" "}
                    حياة تنسّق التبرع ولا تتخذ قرارات
                    طبية. الفحوصات والقرار الطبي النهائي
                    لدى المختصين.
                  </div>

                </div>
              </aside>

            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
