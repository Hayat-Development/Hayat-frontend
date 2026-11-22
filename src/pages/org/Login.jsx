
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser, getApiErrorMessages } from "../../api";
import { MESSAGES, ROLES, canonicalCode, roleHome } from "../../constants/org";

function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const DEMO_PASSWORD = "Demo12345!";
  function fillDonor() { setIdentifier("ahmad@hayat.demo"); setPassword(DEMO_PASSWORD); setError(""); }
  function enterDemo(key, role) {
    sessionStorage.setItem("mock_as", key);
    sessionStorage.removeItem("mock_scn");
    navigate(roleHome(role));
  }


  
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
    navigate(roleHome(user.role), { replace: true });

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

    const code = canonicalCode(error.data?.code);
    if (code === "ACCOUNT_PENDING") { navigate("/activate"); return; }
    if (MESSAGES[code] && ["ACCOUNT_SUSPENDED", "ORG_SUSPENDED", "INVALID_CREDENTIALS"].includes(code)) {
      setError(code === "ORG_SUSPENDED" && error.data?.reason ? `${MESSAGES[code]} السبب: ${error.data.reason}` : MESSAGES[code]);
      return;
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
  <div role="alert" className="org-notice org-notice-error"><i className="ti ti-alert-circle" aria-hidden="true" /><span>{error}</span></div>
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

                      <div className="demo-tour">
                        <strong>خذ جولة في حياة</strong>
                        <div className="demo-tour-grid">
                          <button type="button" onClick={fillDonor}><i className="ti ti-heart-handshake" aria-hidden="true"></i>متبرع</button>
                          <button type="button" onClick={() => enterDemo("rep", ROLES.REP)}><i className="ti ti-building-hospital" aria-hidden="true"></i>ممثل المؤسسة</button>
                          <button type="button" onClick={() => enterDemo("staff", ROLES.STAFF)}><i className="ti ti-users" aria-hidden="true"></i>موظف بنك دم</button>
                          <button type="button" onClick={() => enterDemo("admin", ROLES.ADMIN)}><i className="ti ti-shield-check" aria-hidden="true"></i>مدير النظام</button>
                        </div>
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
