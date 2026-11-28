
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getDonorProfile } from "../../api";
import { clearAuth, classifyError } from "../../utils/org";
import { ErrorScreen } from "../../components/org/ui";
import DonorShell from "../../components/donor/DonorShell";
import "../../styles/donor.css";

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

function StatCard({
  color,
  icon,
  label,
  value,
  description,
}) {
  return (
    <article className={`donor-stat donor-stat-${color}`}>
      <div className="donor-stat-icon">
        <i className={`ti ${icon}`} aria-hidden="true" />
      </div>

      <div className="donor-stat-label">
        {label}
      </div>

      <div className="donor-stat-value">
        {value}
      </div>

      {description && (
        <div className="donor-stat-description">
          {description}
        </div>
      )}
    </article>
  );
}

function DashboardSkeleton() {
  return (
    <div role="status" aria-label="جارٍ تحميل بيانات المتبرع">
      <div
        className="donor-skeleton"
        style={{
          width: "60%",
          height: 32,
          marginBottom: 12,
        }}
      />

      <div
        className="donor-skeleton"
        style={{
          width: "80%",
          height: 20,
          marginBottom: 24,
        }}
      />

      <div className="donor-grid">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="donor-skeleton"
            style={{ height: 180 }}
          />
        ))}
      </div>

      <div
        className="donor-skeleton"
        style={{ height: 180 }}
      />
    </div>
  );
}

export default function DonorDashboardPage() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [requestId, setRequestId] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      setLoading(true);
      setError(null);

      try {
        const result = await getDonorProfile();

        if (!result?.data) {
          throw new Error("لم يتم استلام بيانات المتبرع.");
        }

        if (active) {
          setProfile(result.data);
        }
      } catch (err) {
        if (!active) return;

        if (err.status === 401) {
          clearAuth();
          navigate("/login", { replace: true });
          return;
        }

        setError(err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, [navigate, requestId]);

  function retry() {
    setRequestId((previous) => previous + 1);
  }

  if (loading) {
    return (
      <DonorShell title="نظرة عامة">
        <DashboardSkeleton />
      </DonorShell>
    );
  }

  if (error) {
    const kind = classifyError(error);

    if (
      kind === "account_suspended" ||
      kind === "pending" ||
      kind === "forbidden"
    ) {
      return (
        <ErrorScreen
          full
          kind={kind}
          reason={error.data?.reason}
          backTo="/login"
          backText="العودة لتسجيل الدخول"
        />
      );
    }

    return (
      <DonorShell title="نظرة عامة">
        <div className="donor-panel">
          <div className="donor-panel-body">
            <div className="donor-alert donor-alert-error" role="alert">
              <i className="ti ti-alert-circle" />

              <div>
                <strong>تعذر تحميل بيانات المتبرع</strong>
                <p>
                  حدث خطأ أثناء جلب بيانات حسابك.
                  يرجى المحاولة مرة أخرى.
                </p>
              </div>
            </div>

            <button
              type="button"
              className="donor-btn donor-btn-primary"
              onClick={retry}
            >
              <i className="ti ti-refresh" />
              إعادة المحاولة
            </button>
          </div>
        </div>
      </DonorShell>
    );
  }

  const waiting = profile?.waiting;

  const bloodType = profile?.blood_type;

  const bloodTypeSource =
    profile?.blood_type_source;

  const institution =
    profile?.blood_type_verified_by?.name;

  let bloodDescription = "لم يتم تسجيل الفصيلة";

  if (bloodTypeSource === "self_reported") {
    bloodDescription = "مسجلة بواسطة المتبرع";
  }

  if (bloodTypeSource === "institution") {
    bloodDescription = institution
      ? `موثقة بواسطة ${institution}`
      : "موثقة بواسطة مؤسسة مختصة";
  }

  const waitingValue =
    waiting?.remaining_days == null
      ? "غير محددة"
      : `${waiting.remaining_days} يوم`;

  const waitingDescription =
    waiting?.is_blocked === true
      ? "أنت ضمن فترة الانتظار"
      : waiting?.is_blocked === false
        ? "لا يوجد منع زمني حالي"
        : "لم تتوفر بيانات فترة الانتظار";

  return (
    <DonorShell title="نظرة عامة">
      <section className="donor-welcome">
        <h2>
          أهلًا بك، {profile?.name || "المتبرع"}
        </h2>

        <p>
          تابع حالة حسابك وتوفرّك للتبرع بالدم،
          وحدّث بياناتك لتسهيل التواصل مع المؤسسات المختصة.
        </p>
      </section>

      {!bloodType && (
        <div
          className="donor-alert donor-alert-info"
          role="status"
        >
          <i className="ti ti-info-circle" />

          <div>
            <strong>لا تعرف فصيلة دمك؟</strong>

            <p>
              يمكنك مراجعة مؤسسة مختصة لإجراء
              فحص فصيلة الدم وتحديدها.
            </p>

            <Link to="/donor/profile">
              مراجعة الملف الشخصي
            </Link>
          </div>
        </div>
      )}

      {profile?.location_supported === false && (
        <div className="donor-alert donor-alert-warning">
          <i className="ti ti-map-pin" />

          <div>
            المنطقة المسجلة في حسابك غير مدعومة
            حاليًا. يمكنك مراجعة بيانات موقعك
            من الملف الشخصي.
          </div>
        </div>
      )}

      <section
        className="donor-grid"
        aria-label="ملخص حساب المتبرع"
      >
        <StatCard
          color="red"
          icon="ti-droplet"
          label="فصيلة الدم"
          value={
            bloodType ? (
              <span className="donor-blood-type">
                {bloodType}
              </span>
            ) : (
              "غير معروفة"
            )
          }
          description={bloodDescription}
        />

        <StatCard
          color="green"
          icon="ti-heart-check"
          label="حالة التوفر"
          value={
            profile?.is_available
              ? "متاح"
              : "غير متاح"
          }
          description="رغبتك الحالية في استقبال طلبات التبرع"
        />

        <StatCard
          color="yellow"
          icon="ti-eye"
          label="الظهور لبنوك الدم"
          value={
            profile?.visible_to_banks
              ? "مفعّل"
              : "متوقف"
          }
          description="إمكانية ظهور بياناتك للمؤسسات"
        />

        <StatCard
          color="blue"
          icon="ti-calendar-time"
          label="فترة الانتظار"
          value={waitingValue}
          description={waitingDescription}
        />
      </section>

      <section className="donor-panel">
        <div className="donor-panel-header">
          <h2>التوفر والأهلية الأولية</h2>
        </div>

        <div className="donor-panel-body">
          <div className="donor-form-grid">
            <div>
              <div className="donor-stat-label">
                تاريخ آخر تبرع
              </div>

              <strong>
                {formatDate(
                  waiting?.last_donation_date ??
                    profile?.last_donation_date
                )}
              </strong>
            </div>

            <div>
              <div className="donor-stat-label">
                موعد انتهاء فترة الانتظار
              </div>

              <strong>
                {formatDate(waiting?.next_allowed_date)}
              </strong>
            </div>
          </div>

          {waiting?.is_blocked === true && (
            <div
              className="donor-alert donor-alert-warning"
              style={{ marginTop: 20 }}
            >
              <i className="ti ti-clock" />

              <span>
                لم تنتهِ فترة الانتظار بعد.
                يمكنك متابعة الموعد المحدد في حسابك.
              </span>
            </div>
          )}

          <div className="donor-form-actions">
            <Link
              to="/donor/eligibility"
              className="donor-btn donor-btn-primary"
            >
              <i className="ti ti-heart-check" />
              إدارة التوفر والأهلية
            </Link>

            <Link
              to="/donor/profile"
              className="donor-btn donor-btn-secondary"
            >
              <i className="ti ti-user-circle" />
              تعديل الملف الشخصي
            </Link>
          </div>
        </div>
      </section>

      <div className="donor-medical-note">
        <i className="ti ti-stethoscope" />

        {" "}
        التوفر والتوقيت للتنسيق الأولي فقط.
        الأهلية النهائية والفحوصات والتوافق الطبي
        مسؤولية المؤسسة المختصة.
      </div>
    </DonorShell>
  );
}
