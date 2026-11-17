
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser, getApiErrorMessages } from "../api";

function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);


  
async function handleSubmit(event) {
  event.preventDefault();

  if (loading) return;

  setError("");

  if (!identifier.trim() || !password) {
    setError("يرجى إدخال البريد الإلكتروني أو الهاتف وكلمة المرور.");
    return;
  }

  setLoading(true);

  try {
    const result = await loginUser(identifier, password);

    const user = result.data.user;

    // توجيه مؤقت لحين تجهيز لوحات التحكم
    if (user.dashboard_key === "donor") {
      navigate("/dashboard", { replace: true });
    } else {
      navigate("/dashboard", { replace: true });
    }

  } catch (error) {
    if (
      error.status === 403 &&
      error.data?.code === "EMAIL_NOT_VERIFIED"
    ) {
      const challengeId = error.data?.data?.challenge_id;

      if (challengeId) {
        sessionStorage.setItem(
          "hayat_challenge_id",
          challengeId
        );

        navigate("/verify-email");
        return;
      }
    }

    setError(
  error.status === 401
    ? "البريد الإلكتروني أو رقم الهاتف أو كلمة المرور غير صحيحة."
    : getApiErrorMessages(error).join(" - ")
);
  } finally {
    setLoading(false);
  }
}



  return (
    <div className="page">
      <main id="main-content">
        <section className="auth-section public-auth">
          <div className="container-xl auth-container">
            <div className="row g-0 flex-fill auth-split">
              <div className="col-12 col-lg-6 d-flex flex-column justify-content-center auth-form-column">
                <div className="container-tight">
                  <div className="card card-md auth-card">
                    <div className="card-body">
                      <div className="login-eyebrow">
                        <i className="ti ti-heart-handshake" aria-hidden="true"></i>{" "}
                        حسابك في حياة
                      </div>

                      <h1 className="auth-title mb-2">أهلًا بعودتك</h1>

                      <p className="text-secondary mb-4">
                        خطوة بسيطة، وبترجع تكمّل أثر عطائك.
                      </p>

                      {error && (
  <div
    role="alert"
    style={{
      backgroundColor: "#ffe0e0",
      color: "#b00020",
      padding: "15px",
      marginBottom: "50px",
      border: "2px solid red",
      borderRadius: "8px",
    }}
  >
    {error}
  </div>
)}

                      <form onSubmit={handleSubmit} noValidate>
                        <div className="mb-3">
                          <label className="form-label" htmlFor="identifier">
                            البريد الإلكتروني أو رقم الهاتف
                          </label>

                          <input
                            className="form-control"
                            type="text"
                            name="identifier"
                            id="identifier"
                            placeholder="name@example.com"
                            dir="ltr"
                            autoComplete="username"
                            required
                            value={identifier}
                            onChange={(event) =>
                              setIdentifier(event.target.value)
                            }
                          />
                        </div>

                        <div className="mb-3">
                          <label className="form-label" htmlFor="password">
                            كلمة المرور
                          </label>

                          <div className="password-field">
                            <input
                              className="form-control"
                              type={showPassword ? "text" : "password"}
                              name="password"
                              id="password"
                              placeholder="أدخل كلمة المرور"
                              autoComplete="current-password"
                              required
                              value={password}
                              onChange={(event) =>
                                setPassword(event.target.value)
                              }
                            />

                            <button
                              type="button"
                              className="password-toggle"
                              onClick={() => setShowPassword(!showPassword)}
                              aria-label={
                                showPassword
                                  ? "إخفاء كلمة المرور"
                                  : "إظهار كلمة المرور"
                              }
                            >
                              <i
                                className={
                                  showPassword ? "ti ti-eye-off" : "ti ti-eye"
                                }
                                aria-hidden="true"
                              ></i>
                            </button>
                          </div>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            margin: "-4px 0 20px",
                          }}
                        >
                          <a
                            className="text-link"
                            style={{ fontSize: ".8rem" }}
                            href="/forgot-password"
                          >
                            نسيت كلمة المرور؟
                          </a>
                        </div>

                        <button
                          type="submit"
                          className="btn btn-primary w-100"
                          disabled={loading}
                        >
                         {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
                          <i
                            className="ti ti-arrow-left"
                            aria-hidden="true"
                          ></i>
                        </button>
                      </form>

                      <div className="auth-footer">
                        أول مرة معنا؟{" "}
                        <a href="/register">أنشئ حساب متبرع</a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <aside
                className="col-lg-6 d-none d-lg-block public-auth-cover"
                aria-label="عن تجربة حياة"
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
                        srcSet="/assets/img/backgrounds/donation-arm-640.webp"
                      />
                      <img
                        src="/assets/img/backgrounds/donation-arm-640.jpg"
                        alt=""
                        width="640"
                        height="533"
                        loading="lazy"
                        decoding="async"
                      />
                    </picture>
                  </figure>

                  <h2>كل استجابة، فرصة حياة.</h2>

                  <p>
                    من أول نداء إلى توثيق التبرع، حياة تقرّب المسافة بين اللي
                    بحتاج واللي بقدر يساعد.
                  </p>

                  <div className="cover-caption">
                    <i className="ti ti-stethoscope" aria-hidden="true"></i>{" "}
                    حياة تنسّق التبرع ولا تتخذ قرارات طبية. الفحوصات والقرار
                    الطبي النهائي لدى المختصين.
                  </div>
                </div>
              </aside>
            </div>

            <p className="text-secondary text-center small mt-4 mb-0 auth-form-note">
              منصة حياة · معًا لإنقاذ الأرواح   
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Login;
