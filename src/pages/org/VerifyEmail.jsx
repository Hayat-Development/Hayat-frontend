import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { verifyEmail, resendVerificationCode, updateVerificationEmail, getApiErrorMessages } from "../../api";
import { Field, Notice, TextInput } from "../../components/org/ui";
import { showFlashMessage } from "../../flashMessage";

export default function VerifyEmail() {
  const navigate = useNavigate();
  const redirect = useRef(null);
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [editingEmail, setEditingEmail] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [codeError, setCodeError] = useState("");
  const [operation, setOperation] = useState(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => () => clearTimeout(redirect.current), []);
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (operation) return;
    setError("");
    setCodeError("");
    setOperation("verify");
    try {
      const result = await verifyEmail(code);
      sessionStorage.removeItem("hayat_challenge_id");
      showFlashMessage(result.message || "تم تأكيد البريد الإلكتروني بنجاح.", 2000);
      redirect.current = setTimeout(() => navigate("/login", { replace: true }), 2100);
    } catch (requestError) {
      const messages = requestError.data?.errors?.code;
      if (messages) setCodeError([].concat(messages).join(" "));
      else setError(getApiErrorMessages(requestError).join(" "));
      setOperation(null);
    }
  }

  async function handleResend() {
    if (operation || cooldown > 0) return;
    setError("");
    setOperation("resend");
    try {
      const result = await resendVerificationCode();
      showFlashMessage(result.message || "تم إرسال رمز تحقق جديد.");
      setCode("");
      setCodeError("");
      setCooldown(60);
    } catch (requestError) {
      setError(getApiErrorMessages(requestError).join(" "));
      if (requestError.status === 429) setCooldown(60);
    } finally {
      setOperation(null);
    }
  }

  async function handleEmailUpdate(event) {
    event.preventDefault();
    if (operation || cooldown > 0) return;
    setError("");
    setEmailError("");
    setOperation("email");
    try {
      const result = await updateVerificationEmail(email);
      setMaskedEmail(result.data.email);
      setEditingEmail(false);
      setEmail("");
      setCode("");
      setCodeError("");
      setCooldown(60);
      showFlashMessage(result.message || "تم تعديل البريد وإرسال رمز تحقق جديد.");
    } catch (requestError) {
      const messages = requestError.data?.errors?.email;
      if (messages) setEmailError([].concat(messages).join(" "));
      else if (requestError.status === 429) {
        setCooldown(requestError.retryAfter || 60);
        setError("انتظر قليلًا قبل إعادة محاولة تعديل البريد.");
      } else setError(getApiErrorMessages(requestError).join(" "));
    } finally {
      setOperation(null);
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

                    {maskedEmail && <p className="text-center" dir="ltr">{maskedEmail}</p>}
                    <Notice type="error">{error}</Notice>

                    {editingEmail ? (
                      <form onSubmit={handleEmailUpdate} noValidate>
                        <Field id="verification-email" label="البريد الإلكتروني الجديد" required error={emailError}>
                          <TextInput id="verification-email" type="email" autoComplete="email" ltr required
                            value={email} error={emailError} disabled={Boolean(operation)} autoFocus
                            onChange={(event) => { setEmail(event.target.value); setEmailError(""); }} />
                        </Field>
                        <button type="submit" className="btn btn-primary w-100" disabled={Boolean(operation) || cooldown > 0}>
                          {operation === "email" ? "جاري تعديل البريد…" : cooldown > 0 ? `المحاولة بعد ${cooldown} ثانية` : "حفظ البريد وإرسال رمز جديد"}
                        </button>
                      </form>
                    ) : (
                      <form onSubmit={handleSubmit} noValidate>
                        <Field id="code" label="رمز التحقق" required error={codeError}>
                          <input id="code" name="code" type="text" inputMode="numeric" dir="ltr"
                            className={`form-control otp-input${codeError ? " is-invalid" : ""}`}
                            aria-invalid={Boolean(codeError)} aria-describedby={codeError ? "code-err" : undefined}
                            maxLength={6} placeholder="000000" autoComplete="one-time-code" required
                            disabled={Boolean(operation)} value={code}
                            onChange={(event) => { setCode(event.target.value); setCodeError(""); }} />
                        </Field>
                        <button className="btn btn-primary w-100" type="submit" disabled={Boolean(operation)}>
                          {operation === "verify" ? "جاري التحقق…" : "تأكيد الحساب"}
                        </button>
                      </form>
                    )}

                    <div className="auth-footer d-flex flex-column align-items-center gap-2">
                      {!editingEmail && <button type="button" className="btn btn-outline-secondary" onClick={handleResend}
                        disabled={Boolean(operation) || cooldown > 0}>
                        {operation === "resend" ? "جاري إعادة الإرسال…" : cooldown > 0 ? `إعادة الإرسال بعد ${cooldown} ثانية` : "إعادة إرسال الرمز"}
                      </button>}
                      <button type="button" className="btn btn-link" disabled={Boolean(operation)} onClick={() => {
                        setEditingEmail(!editingEmail);
                        setEmailError("");
                        setError("");
                      }}>{editingEmail ? "العودة إلى رمز التحقق" : "أدخلت بريدًا خاطئًا؟ تعديل البريد"}</button>
                      <Link to="/login">العودة إلى تسجيل الدخول</Link>
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
