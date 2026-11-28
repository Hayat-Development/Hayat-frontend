
import { useEffect, useState } from "react";

import {
  startDonorEmail,
  verifyDonorEmail,
  resendDonorEmail,
  cancelDonorEmail,
  getDonorProfile,
} from "../../api";

import { mapFieldErrors } from "../../utils/org";

export default function DonorEmailChange({
  profile,
  onProfileUpdate,
  onAuthError,
  disabled = false,
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");

  const [busy, setBusy] = useState("");
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState(null);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [remaining, setRemaining] = useState(0);

  const pendingEmail = profile?.pending_email;

  const locked = disabled || Boolean(busy);

  useEffect(() => {
    function updateTimer() {
      setRemaining(
        Math.max(
          0,
          Math.ceil((cooldownUntil - Date.now()) / 1000)
        )
      );
    }

    updateTimer();

    if (!cooldownUntil) return;

    const timer = setInterval(updateTimer, 1000);

    return () => clearInterval(timer);
  }, [cooldownUntil]);

  function startCooldown(seconds = 60) {
    setRemaining(seconds);
    setCooldownUntil(Date.now() + seconds * 1000);
  }

  function updateCode(value) {
    const normalized = value.replace(
      /[٠-٩۰-۹]/g,
      (digit) =>
        String(
          "٠١٢٣٤٥٦٧٨٩".includes(digit)
            ? "٠١٢٣٤٥٦٧٨٩".indexOf(digit)
            : "۰۱۲۳۴۵۶۷۸۹".indexOf(digit)
        )
    );

    setCode(normalized.replace(/\D/g, "").slice(0, 6));

    setErrors((previous) => ({
      ...previous,
      code: undefined,
    }));
  }

  function handleError(error) {
    if ([401, 403].includes(error.status)) {
      onAuthError(error);
      return;
    }

    if (error.status === 422) {
      setErrors(mapFieldErrors(error));
    }

    if (error.status === 429) {
      const seconds = Number(error.retryAfter);

      startCooldown(
        Number.isFinite(seconds) && seconds > 0
          ? Math.ceil(seconds)
          : 60
      );
    }

    setNotice({
      type: "error",
      text:
        error.message ||
        "تعذر تنفيذ العملية. حاول مرة أخرى.",
    });
  }

  async function execute(action, request, onSuccess) {
    if (locked) return;

    setBusy(action);
    setErrors({});
    setNotice(null);

    try {
      const result = await request();

      onSuccess?.();

      let updatedProfile = result?.data;

      if (updatedProfile?.profile_version == null) {
        const latest = await getDonorProfile();
        updatedProfile = latest.data;
      }

      if (updatedProfile?.profile_version == null) {
        throw new Error(
          "تعذر استلام النسخة المحدثة من الملف."
        );
      }

      onProfileUpdate(updatedProfile);

      setNotice({
        type: "success",
        text: result.message || "تم تنفيذ العملية بنجاح.",
      });
    } catch (error) {
      handleError(error);
    } finally {
      setBusy("");
    }
  }

  function handleStart(event) {
    event.preventDefault();

    if (locked || remaining > 0) return;

    const newEmail = email.trim().toLowerCase();

    const validation = {};

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      validation.email = "أدخل بريدًا إلكترونيًا صحيحًا.";
    } else if (
      newEmail === profile.email?.toLowerCase()
    ) {
      validation.email =
        "البريد الجديد مطابق للبريد الحالي.";
    }

    if (!password) {
      validation.current_password =
        "أدخل كلمة المرور الحالية.";
    }

    if (Object.keys(validation).length) {
      setErrors(validation);
      return;
    }

    execute(
      "start",
      () =>
        startDonorEmail({
          email: newEmail,
          current_password: password,
        }),
      () => {
        setPassword("");
        setEmail("");
        setCode("");
        startCooldown();
      }
    );
  }

  function handleVerify(event) {
    event.preventDefault();

    if (locked) return;

    if (!/^\d{6}$/.test(code)) {
      setErrors({
        code: "أدخل رمز التحقق المكون من 6 أرقام.",
      });
      return;
    }

    execute(
      "verify",
      () => verifyDonorEmail(code),
      () => {
        setCode("");
        setEmail("");
        setPassword("");
      }
    );
  }

  function handleResend() {
    if (locked || remaining > 0) return;

    execute(
      "resend",
      resendDonorEmail,
      () => {
        setCode("");
        startCooldown();
      }
    );
  }

  function handleCancel() {
    if (locked) return;

    execute(
      "cancel",
      cancelDonorEmail,
      () => {
        setCode("");
        setEmail("");
        setPassword("");
      }
    );
  }

  return (
    <section className="donor-panel">
      <div className="donor-panel-header">
        <h2>
          <i className="ti ti-mail" />
          {" "}تغيير البريد الإلكتروني
        </h2>
      </div>

      <div className="donor-panel-body">
        {notice && (
          <div
            className={`donor-alert donor-alert-${notice.type}`}
            role={notice.type === "error" ? "alert" : "status"}
          >
            <i className="ti ti-info-circle" />
            <span>{notice.text}</span>
          </div>
        )}

        {disabled && (
          <div className="donor-alert donor-alert-warning">
            يرجى حفظ تعديلات الملف الشخصي أو إلغائها
            قبل تغيير البريد الإلكتروني.
          </div>
        )}

        <div className="donor-field">
          <label htmlFor="current-email">
            البريد الإلكتروني الحالي
          </label>

          <input
            id="current-email"
            type="email"
            value={profile?.email || ""}
            readOnly
            dir="ltr"
          />
        </div>

        {pendingEmail ? (
          <>
            <div
              className="donor-alert donor-alert-info"
              style={{ marginTop: 20 }}
            >
              <i className="ti ti-mail-check" />

              <div>
                <strong>بانتظار تأكيد البريد الجديد</strong>

                <p dir="ltr">{pendingEmail}</p>

                <p>
                  أدخل رمز التحقق المرسل إلى بريدك الجديد.
                  سيبقى بريدك الحالي معتمدًا حتى اكتمال التحقق.
                </p>
              </div>
            </div>

            <form onSubmit={handleVerify} noValidate>
              <div className="donor-field">
                <label htmlFor="email-code">
                  رمز التحقق
                </label>

                <input
                  id="email-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="000000"
                  dir="ltr"
                  value={code}
                  disabled={locked}
                  aria-invalid={Boolean(errors.code)}
                  onChange={(event) =>
                    updateCode(event.target.value)
                  }
                  style={{
                    textAlign: "center",
                    letterSpacing: "8px",
                    fontSize: "22px",
                  }}
                />

                {errors.code && (
                  <span className="donor-field-error">
                    {errors.code}
                  </span>
                )}

                <span className="donor-field-hint">
                  رمز التحقق صالح لمدة 10 دقائق.
                </span>
              </div>

              <div className="donor-form-actions">
                <button
                  type="submit"
                  className="donor-btn donor-btn-primary"
                  disabled={locked || code.length !== 6}
                >
                  <i className="ti ti-check" />

                  {busy === "verify"
                    ? "جارٍ التحقق..."
                    : "تأكيد البريد الجديد"}
                </button>

                <button
                  type="button"
                  className="donor-btn donor-btn-secondary"
                  disabled={locked || remaining > 0}
                  onClick={handleResend}
                >
                  <i className="ti ti-refresh" />

                  {busy === "resend"
                    ? "جارٍ الإرسال..."
                    : remaining > 0
                      ? `إعادة الإرسال بعد ${remaining} ثانية`
                      : "إعادة إرسال الرمز"}
                </button>

                <button
                  type="button"
                  className="donor-btn donor-btn-secondary"
                  disabled={locked}
                  onClick={handleCancel}
                >
                  <i className="ti ti-x" />

                  {busy === "cancel"
                    ? "جارٍ الإلغاء..."
                    : "إلغاء طلب التغيير"}
                </button>
              </div>
            </form>
          </>
        ) : (
          <form
            onSubmit={handleStart}
            noValidate
            style={{ marginTop: 20 }}
          >
            <div className="donor-form-grid">
              <div className="donor-field">
                <label htmlFor="new-email">
                  البريد الإلكتروني الجديد
                </label>

                <input
                  id="new-email"
                  type="email"
                  dir="ltr"
                  autoComplete="email"
                  placeholder="example@email.com"
                  value={email}
                  disabled={locked}
                  aria-invalid={Boolean(errors.email)}
                  onChange={(event) => {
                    setEmail(event.target.value);

                    setErrors((previous) => ({
                      ...previous,
                      email: undefined,
                    }));
                  }}
                />

                {errors.email && (
                  <span className="donor-field-error">
                    {errors.email}
                  </span>
                )}
              </div>

              <div className="donor-field">
                <label htmlFor="current-password">
                  كلمة المرور الحالية
                </label>

                <input
                  id="current-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  disabled={locked}
                  aria-invalid={
                    Boolean(errors.current_password)
                  }
                  onChange={(event) => {
                    setPassword(event.target.value);

                    setErrors((previous) => ({
                      ...previous,
                      current_password: undefined,
                    }));
                  }}
                />

                {errors.current_password && (
                  <span className="donor-field-error">
                    {errors.current_password}
                  </span>
                )}
              </div>
            </div>

            <div
              className="donor-alert donor-alert-info"
              style={{ marginTop: 20 }}
            >
              <i className="ti ti-shield-check" />

              <span>
                لحماية حسابك، يجب تأكيد كلمة المرور
                الحالية والتحقق من البريد الجديد.
              </span>
            </div>

            <div className="donor-form-actions">
              <button
                type="submit"
                className="donor-btn donor-btn-primary"
                disabled={locked || remaining > 0}
              >
                <i className="ti ti-mail-forward" />

                {busy === "start"
                  ? "جارٍ إرسال الرمز..."
                  : remaining > 0
                    ? `انتظر ${remaining} ثانية`
                    : "إرسال رمز التحقق"}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
