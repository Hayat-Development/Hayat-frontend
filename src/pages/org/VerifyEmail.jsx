

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  verifyEmail,
  resendVerificationCode,
  getApiErrorMessages,
} from "../../api";


export default function VerifyEmail() {
  const navigate = useNavigate();

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
  if (cooldown <= 0) return;

  const timer = setTimeout(() => {
    setCooldown((previous) => Math.max(0, previous - 1));
  }, 1000);

  return () => clearTimeout(timer);
}, [cooldown]);

  async function handleSubmit(e) {
    e.preventDefault();

    if (loading) return;

    if (!/^[0-9]{6}$/.test(code)) {
      setError("رمز التحقق يجب أن يتكون من 6 أرقام.");
      return;
    }

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const result = await verifyEmail(code);

      setMessage(result.message || "تم تأكيد البريد الإلكتروني بنجاح.");

      sessionStorage.removeItem("hayat_challenge_id");

      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 2000);
    } catch (err) {
      setError(getApiErrorMessages(err).join(" - "));
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
  if (resending || loading || cooldown > 0) return;

  setResending(true);
  setMessage("");
  setError("");

  try {
    const result = await resendVerificationCode();

    if (result.data?.challenge_id) {
      sessionStorage.setItem(
        "hayat_challenge_id",
        result.data.challenge_id
      );
    }

    setMessage(
      (result.message || "تم إرسال رمز تحقق جديد.") +
      " يرجى فحص البريد الوارد ومجلد الرسائل غير المرغوب فيها (Spam)."
    );

    setCode("");
    setCooldown(60);
  } catch (err) {
    if (err.status === 429) {
      setError("تم تجاوز الحد المسموح لإعادة الإرسال. يرجى الانتظار قبل المحاولة مجددًا.");
      setCooldown(60);
    } else {
      setError(getApiErrorMessages(err).join(" - "));
    }
  } finally {
    setResending(false);
  }
}

  return (
    <main id="main-content" dir="rtl">
      <section className="auth-section public-auth">
        <div className="container-xl auth-container">
          <div className="row g-0 flex-fill auth-split">

            <div className="col-12 col-lg-6 d-flex flex-column justify-content-center auth-form-column">
              <div className="container-tight">
                <div className="card card-md auth-card">
                  <div className="card-body">

                    <h1 className="auth-title text-center mb-2">
                      خطوة واحدة وبتصير معنا
                    </h1>

                    <p className="text-secondary mb-4 text-center">
                      أدخل رمز التحقق المكوّن من 6 أرقام
                      الذي وصلك عبر البريد الإلكتروني.
                    </p>

                    <div className="verification-icon">
                      <i className="ti ti-mail-check" aria-hidden="true"></i>
                    </div>

                    {message && (
                      <div className="alert alert-success" role="status">
                        {message}
                      </div>
                    )}

                    {error && (
                      <div className="alert alert-danger" role="alert">
                        {error}
                      </div>
                    )}

                    <form onSubmit={handleSubmit} noValidate>
                      <div className="mb-3" style={{ textAlign: "right" }}>
                        <label className="form-label" htmlFor="code">
                          رمز التحقق
                        </label>

                        <input
                          className="form-control otp-input"
                          id="code"
                          name="code"
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]{6}"
                          maxLength={6}
                          placeholder="000000"
                          autoComplete="one-time-code"
                          value={code}
                          onChange={(e) =>
                            setCode(
                              e.target.value.replace(/\D/g, "").slice(0, 6)
                            )
                          }
                          required
                        />
                      </div>

                      <button
                        className="btn btn-primary w-100"
                        type="submit"
                        disabled={loading}
                      >
                        {loading ? "جاري التحقق..." : "تأكيد الحساب"}
                      </button>
                    </form>

                    <div className="auth-footer">

                          <div className="d-flex justify-content-center mt-3">
  <button
    type="button"
    className="btn btn-outline-secondary"
    onClick={handleResend}
    disabled={resending || loading || cooldown > 0}
  >
    {resending
      ? "جاري إعادة الإرسال..."
      : cooldown > 0
      ? `إعادة الإرسال بعد ${cooldown} ثانية`
      : "إعادة إرسال الرمز"}
  </button>
</div>

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
                      decoding="async"
                    />
                  </picture>
                </figure>

                <h2>حسابك إلك، من أول خطوة.</h2>

                <p>
                  أكّد بريدك الإلكتروني لتبدأ رحلتك في حياة،
                  وتساهم في تسهيل الوصول إلى المتبرعين بالدم.
                </p>

                <div className="cover-caption">
                  <i
                    className="ti ti-stethoscope"
                    aria-hidden="true"
                  ></i>{" "}
                  حياة تنسّق التبرع ولا تتخذ قرارات طبية.
                  الفحوصات والقرار الطبي النهائي لدى المختصين.
                </div>

              </div>
            </aside>

          </div>
        </div>
      </section>
    </main>
  );
}
