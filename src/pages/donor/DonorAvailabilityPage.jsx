
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  getDonorProfile,
  saveDonorPreferences,
} from "../../api";

import {
  clearAuth,
  classifyError,
  mapFieldErrors,
} from "../../utils/org";

import { ErrorScreen } from "../../components/org/ui";
import DonorShell from "../../components/donor/DonorShell";

import "../../styles/donor.css";

const preferences = [
  {
    key: "is_available",
    title: "التوفر للتبرع",
    description:
      "حدد ما إذا كنت ترغب حاليًا في استقبال طلبات التبرع بالدم.",
    icon: "ti-heart-check",
  },
  {
    key: "visible_to_banks",
    title: "الظهور لبنوك الدم",
    description:
      "السماح لبنوك الدم بالعثور على بياناتك لأغراض التنسيق.",
    icon: "ti-eye",
  },
  {
    key: "notify_enabled",
    title: "الإشعارات",
    description:
      "حدد تفضيلك لاستقبال إشعارات منصة حياة.",
    icon: "ti-bell",
  },
];

function createDraft(profile) {
  return {
    is_available: profile.is_available === true,
    visible_to_banks: profile.visible_to_banks === true,
    notify_enabled: profile.notify_enabled === true,
  };
}

function formatDate(value) {
  if (!value) return "غير محدد";

  const date = new Date(`${value.slice(0, 10)}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "غير محدد";
  }

  return date.toLocaleDateString("ar-PS", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function PreferenceSwitch({
  item,
  checked,
  disabled,
  error,
  onChange,
}) {
  return (
    <div className="donor-preference">
      <div>
        <h3>
          <label htmlFor={item.key}>
            <i
              className={`ti ${item.icon}`}
              aria-hidden="true"
            />
            {" "}{item.title}
          </label>
        </h3>

        <p id={`${item.key}-description`}>
          {item.description}
        </p>

        {error && (
          <span
            className="donor-field-error"
            id={`${item.key}-error`}
            role="alert"
          >
            {error}
          </span>
        )}
      </div>

      <input
        id={item.key}
        type="checkbox"
        role="switch"
        className="donor-switch"
        checked={checked}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={
          `${item.key}-description` +
          (error ? ` ${item.key}-error` : "")
        }
        onChange={(event) =>
          onChange(item.key, event.target.checked)
        }
      />
    </div>
  );
}

export default function DonorAvailabilityPage() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [draft, setDraft] = useState({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState(null);
  const [conflict, setConflict] = useState(null);
  const [requestId, setRequestId] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      setLoading(true);
      setLoadError(null);

      try {
        const result = await getDonorProfile();

        if (!active) return;

        if (result.data?.profile_version == null) {
          throw new Error("بيانات الملف غير مكتملة.");
        }

        setProfile(result.data);
        setDraft(createDraft(result.data));
        setConflict(null);
        setErrors({});
      } catch (error) {
        if (!active) return;

        if (error.status === 401) {
          clearAuth();
          navigate("/login", { replace: true });
          return;
        }

        setLoadError(error);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, [navigate, requestId]);

  const dirty =
    profile &&
    preferences.some(
      ({ key }) => draft[key] !== profile[key]
    );

  function updatePreference(key, value) {
    setDraft((previous) => ({
      ...previous,
      [key]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [key]: undefined,
    }));

    setNotice(null);
  }

  function resetPreferences() {
    setDraft(createDraft(profile));
    setNotice(null);
    setErrors({});
  }

  function handleAuthError(error) {
    if (error.status === 401) {
      clearAuth();
      navigate("/login", { replace: true });
      return true;
    }

    const kind = classifyError(error);

    if (
      ["account_suspended", "pending", "forbidden"]
        .includes(kind)
    ) {
      setLoadError(error);
      return true;
    }

    return false;
  }

  async function refreshConflict(changes) {
    setConflict({
      changes,
      latest: null,
    });

    try {
      const result = await getDonorProfile();

      if (result.data?.profile_version == null) {
        throw new Error("بيانات الملف غير مكتملة.");
      }

      setConflict({
        changes,
        latest: result.data,
      });

      setNotice({
        type: "warning",
        text:
          "تغيرت بيانات حسابك أثناء التعديل. " +
          "راجع القيم الحالية قبل إعادة الحفظ.",
      });
    } catch (error) {
      if (handleAuthError(error)) return;

      setNotice({
        type: "error",
        text: "تعذر جلب النسخة الجديدة. حاول مرة أخرى.",
      });
    }
  }

  function resolveConflict(keepChanges) {
    if (!conflict?.latest) return;

    const latest = conflict.latest;

    setProfile(latest);

    setDraft({
      ...createDraft(latest),
      ...(keepChanges ? conflict.changes : {}),
    });

    setConflict(null);
    setErrors({});

    setNotice({
      type: "info",
      text: keepChanges
        ? "راجع تعديلاتك واضغط حفظ عند الانتهاء."
        : "تم استرجاع التفضيلات الحالية.",
    });
  }

  async function handleSave(event) {
    event.preventDefault();

    if (saving || conflict || !dirty) return;

    setSaving(true);
    setErrors({});
    setNotice(null);

    const changes = {};

    preferences.forEach(({ key }) => {
      if (draft[key] !== profile[key]) {
        changes[key] = draft[key];
      }
    });

    try {
      const result = await saveDonorPreferences({
        profile_version: profile.profile_version,
        ...changes,
      });

      if (result.data?.profile_version == null) {
        throw new Error("تعذر استلام الملف المحدث.");
      }

      setProfile(result.data);
      setDraft(createDraft(result.data));

      setNotice({
        type: "success",
        text:
          result.message ||
          "تم حفظ تفضيلات التبرع بنجاح.",
      });
    } catch (error) {
      if (handleAuthError(error)) return;

      if (
        error.status === 409 ||
        error.data?.code === "STALE_PROFILE"
      ) {
        await refreshConflict(changes);
        return;
      }

      if (error.status === 422) {
        const fieldErrors = mapFieldErrors(error);

        setErrors(fieldErrors);

        const first = Object.keys(fieldErrors)[0];

        requestAnimationFrame(() => {
          document.getElementById(first)?.focus();
        });
      }

      setNotice({
        type: "error",
        text:
          error.message ||
          "تعذر حفظ التفضيلات. حاول مرة أخرى.",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <DonorShell title="التوفر والأهلية الأولية">
        <div
          role="status"
          aria-label="جارٍ تحميل بيانات التوفر"
        >
          <div className="donor-grid">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="donor-skeleton"
                style={{ height: 150 }}
              />
            ))}
          </div>

          <div
            className="donor-skeleton"
            style={{ height: 280 }}
          />
        </div>
      </DonorShell>
    );
  }

  if (loadError) {
    const kind = classifyError(loadError);

    if (
      ["account_suspended", "pending", "forbidden"]
        .includes(kind)
    ) {
      return (
        <ErrorScreen
          full
          kind={kind}
          reason={loadError.data?.reason}
          backTo="/login"
          backText="العودة لتسجيل الدخول"
        />
      );
    }

    return (
      <DonorShell title="التوفر والأهلية الأولية">
        <div
          className="donor-alert donor-alert-error"
          role="alert"
        >
          <i className="ti ti-alert-circle" />
          تعذر تحميل بيانات التوفر والأهلية.
        </div>

        <button
          type="button"
          className="donor-btn donor-btn-primary"
          onClick={() => setRequestId((id) => id + 1)}
        >
          <i className="ti ti-refresh" />
          إعادة المحاولة
        </button>
      </DonorShell>
    );
  }

  const waiting = profile?.waiting;
  const blocked = waiting?.is_blocked;
  const remainingDays = waiting?.remaining_days;

  return (
    <DonorShell title="التوفر والأهلية الأولية">
      <section className="donor-welcome">
        <h2>إدارة توفرك للتبرع</h2>

        <p>
          تحكم في تفضيلات التبرع والظهور للمؤسسات،
          وتابع فترة الانتظار منذ آخر تبرع.
        </p>
      </section>

      {notice && (
        <div
          className={`donor-alert donor-alert-${notice.type}`}
          role={notice.type === "error" ? "alert" : "status"}
        >
          <i className="ti ti-info-circle" />
          <span>{notice.text}</span>
        </div>
      )}

      {conflict && (
        <section className="donor-panel">
          <div className="donor-panel-header">
            <h2>مراجعة التفضيلات الحالية</h2>
          </div>

          <div className="donor-panel-body">
            {conflict.latest ? (
              <>
                {preferences.map(({ key, title }) => (
                  <div
                    key={key}
                    className="donor-preference"
                  >
                    <h3>{title}</h3>

                    <strong>
                      {conflict.latest[key]
                        ? "مفعّل"
                        : "متوقف"}
                    </strong>
                  </div>
                ))}

                <div className="donor-form-actions">
                  <button
                    type="button"
                    className="donor-btn donor-btn-primary"
                    disabled={saving}
                    onClick={() => resolveConflict(true)}
                  >
                    الاحتفاظ بتعديلاتي
                  </button>

                  <button
                    type="button"
                    className="donor-btn donor-btn-secondary"
                    disabled={saving}
                    onClick={() => resolveConflict(false)}
                  >
                    اعتماد القيم الحالية
                  </button>
                </div>
              </>
            ) : (
              <button
                type="button"
                className="donor-btn donor-btn-secondary"
                disabled={saving}
                onClick={async () => {
                  setSaving(true);

                  try {
                    await refreshConflict(conflict.changes);
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                إعادة جلب البيانات
              </button>
            )}
          </div>
        </section>
      )}

      <section className="donor-panel">
        <div className="donor-panel-header">
          <h2>تفضيلات التبرع</h2>
        </div>

        <div className="donor-panel-body">
          <form onSubmit={handleSave}>
            {preferences.map((item) => (
              <PreferenceSwitch
                key={item.key}
                item={item}
                checked={draft[item.key] === true}
                disabled={saving || Boolean(conflict)}
                error={errors[item.key]}
                onChange={updatePreference}
              />
            ))}

            {!draft.is_available && (
              <div
                className="donor-alert donor-alert-info"
                style={{ marginTop: 20 }}
              >
                <i className="ti ti-info-circle" />

                <span>
                  اخترت أنك غير متاح للتبرع حاليًا.
                  يمكنك تغيير هذا التفضيل في أي وقت.
                </span>
              </div>
            )}

            <div className="donor-form-actions">
              <button
                type="submit"
                className="donor-btn donor-btn-primary"
                disabled={saving || Boolean(conflict) || !dirty}
              >
                <i className="ti ti-check" />

                {saving
                  ? "جارٍ الحفظ..."
                  : "حفظ التفضيلات"}
              </button>

              <button
                type="button"
                className="donor-btn donor-btn-secondary"
                disabled={saving || Boolean(conflict) || !dirty}
                onClick={resetPreferences}
              >
                إلغاء التعديلات
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className="donor-panel">
        <div className="donor-panel-header">
          <h2>فترة الانتظار والأهلية الأولية</h2>
        </div>

        <div className="donor-panel-body">
          <div
            className={`donor-alert donor-alert-${
              blocked === true
                ? "warning"
                : blocked === false
                  ? "success"
                  : "info"
            }`}
          >
            <i
              className={`ti ${
                blocked === true
                  ? "ti-clock"
                  : blocked === false
                    ? "ti-circle-check"
                    : "ti-info-circle"
              }`}
            />

            <div>
              <strong>
                {blocked === true
                  ? "أنت ضمن فترة الانتظار"
                  : blocked === false
                    ? "لا يوجد منع زمني حالي"
                    : "حالة الانتظار غير محددة"}
              </strong>

              <p>
                {blocked === true
                  ? "تابع الموعد المحدد لانتهاء فترة الانتظار."
                  : blocked === false
                    ? "لا يوجد منع زمني وفق البيانات المسجلة."
                    : "راجع تاريخ آخر تبرع في ملفك الشخصي."}
              </p>
            </div>
          </div>

          <div className="donor-form-grid">
            <div className="donor-stat donor-stat-blue">
              <div className="donor-stat-icon">
                <i className="ti ti-calendar" />
              </div>

              <div className="donor-stat-label">
                تاريخ آخر تبرع
              </div>

              <div className="donor-stat-value">
                {formatDate(
                  waiting?.last_donation_date ??
                    profile.last_donation_date
                )}
              </div>
            </div>

            <div className="donor-stat donor-stat-green">
              <div className="donor-stat-icon">
                <i className="ti ti-calendar-check" />
              </div>

              <div className="donor-stat-label">
                موعد انتهاء فترة الانتظار
              </div>

              <div className="donor-stat-value">
                {formatDate(waiting?.next_allowed_date)}
              </div>
            </div>

            <div className="donor-stat donor-stat-yellow">
              <div className="donor-stat-icon">
                <i className="ti ti-clock" />
              </div>

              <div className="donor-stat-label">
                الأيام المتبقية
              </div>

              <div className="donor-stat-value">
                {remainingDays == null
                  ? "غير محددة"
                  : `${remainingDays} يوم`}
              </div>
            </div>

            <div className="donor-stat donor-stat-red">
              <div className="donor-stat-icon">
                <i className="ti ti-droplet" />
              </div>

              <div className="donor-stat-label">
                فصيلة الدم
              </div>

              <div className="donor-stat-value">
                {profile.blood_type ? (
                  <span className="donor-blood-type">
                    {profile.blood_type}
                  </span>
                ) : (
                  "غير معروفة"
                )}
              </div>
            </div>
          </div>

          <div className="donor-form-actions">
            <Link
              to="/donor/profile"
              className="donor-btn donor-btn-secondary"
            >
              <i className="ti ti-edit" />
              تعديل تاريخ آخر تبرع
            </Link>
          </div>
        </div>
      </section>

      <div className="donor-medical-note">
        <i className="ti ti-stethoscope" />

        {" "}
        حالة التوفر وفترة الانتظار مؤشرات للتنسيق الأولي،
        ولا تعني الموافقة الطبية على التبرع.
        الأهلية النهائية والفحوصات مسؤولية المؤسسة المختصة.
      </div>
    </DonorShell>
  );
}
