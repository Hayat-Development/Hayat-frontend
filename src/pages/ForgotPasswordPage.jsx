
import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword, getApiErrorMessages } from "../api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const result = await forgotPassword(email.trim());
      setMessage(
        result.message ||
          "إذا كان البريد مسجلًا، ستصلك تعليمات استعادة كلمة المرور."
      );
    } catch (err) {
      setError(getApiErrorMessages(err).join(" - "));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page" dir="rtl" data-bs-theme="light">
      <main id="main-content">
        <section className="auth-section public-auth">
          <div className="container-xl auth-container">
            <div className="row g-0 flex-fill auth-split">

              <div className="col-12 col-lg-6 d-flex flex-column justify-content-center auth-form-column">
                <div className="container-tight">
                  <div className="card card-md auth-card">
                    <div className="card-body">

                      <h1 className="auth-title text-center mb-2">
                        نسيت كلمة المرور؟
                      </h1>

                      <p className="text-secondary mb-4 text-center">
                        أدخل بريدك الالكتروني لاستعادة حسابك.
                      </p>

                      <div className="verification-icon">
                        <i
                          className="ti ti-lock-open"
                          aria-hidden="true"
                        />
                      </div>

                      {error && (
                        <div className="alert alert-danger" role="alert">
                          {error}
                        </div>
                      )}

                      {!message ? (
                        <form
                          id="forgot-form"
                          onSubmit={handleSubmit}
                        >
                          <div className="mb-3">
                            <label
                              className="form-label"
                              htmlFor="email"
                            >
                              البريد الإلكتروني
                            </label>

                            <input
                              className="form-control"
                              type="email"
                              name="email"
                              id="email"
                              placeholder="name@example.com"
                              required
                              value={email}
                              onChange={(e) =>
                                setEmail(e.target.value)
                              }
                              disabled={loading}
                            />
                          </div>

                          <button
                            type="submit"
                            className="btn btn-primary w-100"
                            disabled={loading}
                          >
                            {loading
                              ? "جاري الإرسال..."
                              : "متابعة"}
                          </button>
                        </form>
                      ) : (
                        <div
                          id="forgot-done"
                          className="alert alert-success"
                          role="status"
                        >
                          {message}
                        </div>
                      )}

                      <div className="auth-footer">
                        <Link to="/login">
                          <i
                            className="ti ti-arrow-right"
                            aria-hidden="true"
                          />{" "}
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
                      alt="شعار حياة"
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
                      />
                    </picture>
                  </figure>

                  <h2>ارجع لحسابك، وكمّل عطاك.</h2>

                  <p>
                    استعد الوصول إلى حسابك في حياة
                    لمواصلة المساهمة في إنقاذ الأرواح.
                  </p>

                  <div className="cover-caption">
                    <i
                      className="ti ti-stethoscope"
                      aria-hidden="true"
                    />{" "}
                    حياة تنسّق التبرع ولا تتخذ قرارات طبية.
                    الفحوصات والقرار الطبي النهائي لدى المختصين.
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
