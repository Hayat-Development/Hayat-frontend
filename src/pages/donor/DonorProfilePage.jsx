
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DonorEmailChange from "../../components/donor/DonorEmailChange";

import {
    getDonorProfile,
    getDonorLocations,
    getDonorBloodTypes,
    saveDonorProfile,
} from "../../api";

import {
    clearAuth,
    classifyError,
    mapFieldErrors,
} from "../../utils/org";

import { ErrorScreen } from "../../components/org/ui";
import DonorShell from "../../components/donor/DonorShell";

import "../../styles/donor.css";

const editableFields = [
    "name",
    "phone",
    "blood_type",
    "city",
    "area",
    "last_donation_date",
];

function createDraft(profile) {
    return Object.fromEntries(
        editableFields.map((key) => [
            key,
            profile[key] ?? "",
        ])
    );
}

function normalizeDigits(value) {
    return String(value).replace(
        /[٠-٩۰-۹]/g,
        (digit) =>
            String(
                "٠١٢٣٤٥٦٧٨٩".includes(digit)
                    ? "٠١٢٣٤٥٦٧٨٩".indexOf(digit)
                    : "۰۱۲۳۴۵۶۷۸۹".indexOf(digit)
            )
    );
}

function Field({ name, label, error, hint, children }) {
    return (
        <div className="donor-field">
            <label htmlFor={name}>{label}</label>

            {children}

            {hint && (
                <span className="donor-field-hint">
                    {hint}
                </span>
            )}

            {error && (
                <span
                    className="donor-field-error"
                    id={`${name}-error`}
                    role="alert"
                >
                    {error}
                </span>
            )}
        </div>
    );
}

export default function DonorProfilePage() {
    const navigate = useNavigate();

    const [profile, setProfile] = useState(null);
    const [draft, setDraft] = useState({});
    const [locations, setLocations] = useState([]);
    const [bloodTypes, setBloodTypes] = useState([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [loadError, setLoadError] = useState(null);
    const [errors, setErrors] = useState({});
    const [notice, setNotice] = useState(null);
    const [conflict, setConflict] = useState(false);
    const [requestId, setRequestId] = useState(0);

    useEffect(() => {
        let active = true;

        async function load() {
            setLoading(true);
            setLoadError(null);

            try {
                const [profileResult, locationsResult, bloodResult] =
                    await Promise.all([
                        getDonorProfile(),
                        getDonorLocations(),
                        getDonorBloodTypes(),
                    ]);

                if (!active) return;

                const data = profileResult.data;

                if (!data || data.profile_version == null) {
                    throw new Error("بيانات الملف غير مكتملة.");
                }

                setProfile(data);
                setDraft(createDraft(data));
                setLocations(locationsResult.data || []);
                setBloodTypes(bloodResult.data || []);
                setConflict(false);
            } catch (err) {
                if (!active) return;

                if (err.status === 401) {
                    clearAuth();
                    navigate("/login", { replace: true });
                    return;
                }

                setLoadError(err);
            } finally {
                if (active) setLoading(false);
            }
        }

        load();

        return () => {
            active = false;
        };
    }, [navigate, requestId]);

    function updateField(name, value) {
        setDraft((previous) => ({
            ...previous,
            [name]: value,
            ...(name === "city" ? { area: "" } : {}),
        }));

        setErrors((previous) => ({
            ...previous,
            [name]: undefined,
            ...(name === "city" ? { area: undefined } : {}),
        }));

        setNotice(null);
    }

    function acceptProfile(data) {
        setProfile(data);
        setDraft(createDraft(data));
        setErrors({});
        setConflict(false);
    }

    function resetForm() {
        setDraft(createDraft(profile));
        setErrors({});
        setNotice(null);
        setConflict(false);
    }

    const selectedCity = locations.find(
        (item) => item.city === draft.city
    );

    const areas = selectedCity?.areas || [];

    const locationChanged =
        draft.city !== (profile?.city ?? "") ||
        draft.area !== (profile?.area ?? "");

    const dirty =
        profile &&
        editableFields.some(
            (key) => draft[key] !== (profile[key] ?? "")
        );

    function validate() {
        const nextErrors = {};

        const name = draft.name.trim();
        const phone = normalizeDigits(draft.phone)
            .replace(/[\s()-]/g, "");

        if (name.length < 2 || name.length > 100) {
            nextErrors.name =
                "يجب أن يتكون الاسم من حرفين إلى 100 حرف.";
        }

        if (
            draft.phone !== (profile.phone ?? "") &&
            !/^059\d{7}$/.test(phone)
        ) {
            nextErrors.phone =
                "أدخل رقم جوال من 10 أرقام يبدأ بـ 059.";
        }

        if (locationChanged) {
            if (!selectedCity) {
                nextErrors.city = "اختر مدينة من القائمة.";
            }

            if (!areas.includes(draft.area)) {
                nextErrors.area = "اختر منطقة صحيحة.";
            }
        }

        return nextErrors;
    }

    function focusFirstError(fieldErrors) {
        const first = Object.keys(fieldErrors)[0];

        if (first) {
            requestAnimationFrame(() => {
                document.getElementById(first)?.focus();
            });
        }
    }

    async function handleSave(event) {
        event.preventDefault();

        if (saving || conflict || !dirty) return;

        setNotice(null);
        setErrors({});

        const validationErrors = validate();

        if (Object.keys(validationErrors).length) {
            setErrors(validationErrors);
            focusFirstError(validationErrors);
            return;
        }

        const normalized = {
            ...draft,
            name: draft.name.trim(),
            phone: normalizeDigits(draft.phone)
                .replace(/[\s()-]/g, ""),
            blood_type: draft.blood_type || null,
            last_donation_date:
                draft.last_donation_date || null,
        };

        const payload = {
            profile_version: profile.profile_version,
        };

        editableFields.forEach((key) => {
            if (key === "blood_type" && profile.blood_type_locked) {
                return;
            }

            if (draft[key] !== (profile[key] ?? "")) {
                payload[key] = normalized[key];
            }
        });

        if (locationChanged) {
            payload.city = normalized.city;
            payload.area = normalized.area;
        }

        if (Object.keys(payload).length === 1) return;

        setSaving(true);

        try {
            const result = await saveDonorProfile(payload);

            acceptProfile(result.data);

            setNotice({
                type: "success",
                text: result.message || "تم حفظ التغييرات بنجاح.",
            });
        } catch (err) {
            const code = err.data?.code;
            const kind = classifyError(err);

            if (err.status === 401) {
                clearAuth();
                navigate("/login", { replace: true });
                return;
            }

            if (
                kind === "account_suspended" ||
                kind === "pending" ||
                kind === "forbidden"
            ) {
                setLoadError(err);
                return;
            }

            if (
                code === "STALE_PROFILE" ||
                code === "BLOOD_TYPE_LOCKED" ||
                err.status === 409
            ) {
                setConflict(true);

                try {
                    const latest = await getDonorProfile();

                    setProfile(latest.data);

                    if (latest.data.blood_type_locked) {
                        setDraft((previous) => ({
                            ...previous,
                            blood_type: latest.data.blood_type ?? "",
                        }));
                    }

                    setNotice({
                        type: "warning",
                        text:
                            "تغيرت بيانات حسابك أثناء التعديل. " +
                            "راجع البيانات الحالية قبل إعادة الحفظ.",
                    });
                } catch (refreshError) {
                    if (refreshError.status === 401) {
                        clearAuth();
                        navigate("/login", { replace: true });
                        return;
                    }

                    setNotice({
                        type: "error",
                        text: "تعذر جلب النسخة الجديدة من الملف.",
                    });
                }

                return;
            }

            if (err.status === 422) {
                const fieldErrors = mapFieldErrors(err);

                setErrors(fieldErrors);
                focusFirstError(fieldErrors);
            }

            setNotice({
                type: "error",
                text: err.message || "تعذر حفظ التغييرات.",
            });
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <DonorShell title="الملف الشخصي">
                <div
                    role="status"
                    aria-label="جارٍ تحميل الملف الشخصي"
                    className="donor-panel"
                >
                    <div className="donor-panel-body donor-form-grid">
                        {Array.from({ length: 8 }, (_, index) => (
                            <div
                                key={index}
                                className="donor-skeleton"
                                style={{ height: 75 }}
                            />
                        ))}
                    </div>
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
            <DonorShell title="الملف الشخصي">
                <div className="donor-alert donor-alert-error">
                    تعذر تحميل بيانات الملف الشخصي.
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

    function fieldProps(name) {
        return {
            id: name,
            name,
            value: draft[name] ?? "",
            onChange: (event) =>
                updateField(name, event.target.value),
            disabled: saving || conflict,
            "aria-invalid": Boolean(errors[name]),
            "aria-describedby": errors[name]
                ? `${name}-error`
                : undefined,
        };
    }

    const institution =
        profile.blood_type_verified_by?.name;

    const bloodSource =
        profile.blood_type_source === "institution"
            ? `موثقة بواسطة ${institution || "مؤسسة مختصة"}`
            : profile.blood_type_source === "self_reported"
                ? "مسجلة بواسطة المتبرع"
                : "غير معروفة";

    return (
        <DonorShell title="الملف الشخصي">
            <section className="donor-welcome">
                <h2>بيانات حسابك</h2>
                <p>
                    حافظ على تحديث بياناتك لتسهيل التواصل
                    مع المؤسسات المختصة.
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
                        <h2>مراجعة البيانات الحالية</h2>
                    </div>

                    <div className="donor-panel-body">
                        <div className="donor-form-grid">
                            {[
                                ["الاسم", "name"],
                                ["الجوال", "phone"],
                                ["فصيلة الدم", "blood_type"],
                                ["المدينة", "city"],
                                ["المنطقة", "area"],
                                ["آخر تبرع", "last_donation_date"],
                            ].map(([label, key]) => (
                                <div key={key}>
                                    <div className="donor-stat-label">
                                        {label}
                                    </div>
                                    <strong>{profile[key] ?? "غير محدد"}</strong>
                                </div>
                            ))}
                        </div>

                        <div className="donor-form-actions">
                            <button
                                type="button"
                                className="donor-btn donor-btn-secondary"
                                onClick={async () => {
                                    try {
                                        const latest = await getDonorProfile();
                                        const data = latest.data;

                                        setProfile(data);

                                        setDraft((previous) => ({
                                            ...previous,
                                            ...(data.blood_type_locked
                                                ? { blood_type: data.blood_type ?? "" }
                                                : {}),
                                        }));

                                        setConflict(false);

                                        setNotice({
                                            type: "info",
                                            text: "راجع تعديلاتك ثم اضغط حفظ يدويًا.",
                                        });
                                    } catch (err) {
                                        if (err.status === 401) {
                                            clearAuth();
                                            navigate("/login", { replace: true });
                                            return;
                                        }

                                        setNotice({
                                            type: "error",
                                            text: "تعذر تحديث الملف.",
                                        });
                                    }
                                }}
                            >
                                الاحتفاظ بتعديلاتي ومراجعتها
                            </button>

                            <button
                                type="button"
                                className="donor-btn donor-btn-secondary"
                                onClick={() => {
                                    setRequestId((id) => id + 1);
                                    setNotice(null);
                                }}
                            >
                                تجاهل تعديلاتي وجلب البيانات
                            </button>
                        </div>
                    </div>
                </section>
            )}

            {profile.pending_email && (
                <div className="donor-alert donor-alert-warning">
                    <i className="ti ti-mail" />
                    <div>
                        يوجد طلب تغيير بريد إلكتروني بانتظار التأكيد:
                        <strong dir="ltr"> {profile.pending_email}</strong>
                    </div>
                </div>
            )}

            <section className="donor-panel">
                <div className="donor-panel-header">
                    <h2>المعلومات الشخصية</h2>
                </div>

                <div className="donor-panel-body">
                    <form onSubmit={handleSave} noValidate>
                        <div className="donor-form-grid">
                            <Field
                                name="name"
                                label="الاسم الكامل"
                                error={errors.name}
                            >
                                <input
                                    {...fieldProps("name")}
                                    type="text"
                                    autoComplete="name"
                                    maxLength={100}
                                />
                            </Field>

                            <Field
                                name="phone"
                                label="رقم الجوال"
                                error={errors.phone}
                            >
                                <input
                                    {...fieldProps("phone")}
                                    type="tel"
                                    dir="ltr"
                                    autoComplete="tel"
                                    placeholder="0591234567"
                                />
                            </Field>

                            <Field
                                name="email"
                                label="البريد الإلكتروني"
                                hint="يتم تغيير البريد من خلال عملية تحقق مستقلة."
                            >
                                <input
                                    id="email"
                                    type="email"
                                    value={profile.email || ""}
                                    readOnly
                                    dir="ltr"
                                />
                            </Field>

                            <Field
                                name="blood_type"
                                label="فصيلة الدم"
                                error={errors.blood_type}
                                hint={bloodSource}
                            >
                                <select
                                    {...fieldProps("blood_type")}
                                    disabled={
                                        saving ||
                                        conflict ||
                                        profile.blood_type_locked
                                    }
                                >
                                   

                                    {bloodTypes.map((item) => (
                                        <option
                                            key={item.value}
                                            value={item.value}
                                        >
                                            {item.label}
                                        </option>
                                    ))}
                                </select>
                            </Field>

                            <Field
                                name="city"
                                label="المدينة"
                                error={errors.city}
                            >
                                <select {...fieldProps("city")}>
                                    <option value="">اختر المدينة</option>

                                    {draft.city && !selectedCity && (
                                        <option value={draft.city}>
                                            {draft.city} (غير مدعومة)
                                        </option>
                                    )}

                                    {locations.map((item) => (
                                        <option
                                            key={item.city}
                                            value={item.city}
                                        >
                                            {item.city}
                                        </option>
                                    ))}
                                </select>
                            </Field>

                            <Field
                                name="area"
                                label="المنطقة"
                                error={errors.area}
                            >
                                <select
                                    {...fieldProps("area")}
                                    disabled={
                                        saving || conflict || !draft.city
                                    }
                                >
                                    <option value="">اختر المنطقة</option>

                                    {draft.area && !areas.includes(draft.area) && (
                                        <option value={draft.area}>
                                            {draft.area} (غير مدعومة)
                                        </option>
                                    )}

                                    {areas.map((area) => (
                                        <option key={area} value={area}>
                                            {area}
                                        </option>
                                    ))}
                                </select>
                            </Field>

                            <Field
                                name="last_donation_date"
                                label="تاريخ آخر تبرع"
                                error={errors.last_donation_date}
                                hint="اترك الحقل فارغًا إذا لم تتبرع سابقًا أو لم تعرف التاريخ."
                            >
                                <input
                                    {...fieldProps("last_donation_date")}
                                    type="date"
                                    dir="ltr"
                                />
                            </Field>
                        </div>

                        {profile.blood_type_locked && (
                            <div
                                className="donor-alert donor-alert-info"
                                style={{ marginTop: 20 }}
                            >
                                <i className="ti ti-lock" />
                                فصيلة الدم موثقة من مؤسسة مختصة،
                                ولا يمكن تعديلها من حساب المتبرع.
                            </div>
                        )}

                        {!draft.blood_type && (
                            <div
                                className="donor-alert donor-alert-info"
                                style={{ marginTop: 20 }}
                            >
                                <i className="ti ti-info-circle" />
                                يمكنك مراجعة مؤسسة مختصة لمعرفة فصيلة دمك.
                            </div>
                        )}

                        {profile.location_supported === false && (
                            <div
                                className="donor-alert donor-alert-warning"
                                style={{ marginTop: 20 }}
                            >
                                <i className="ti ti-map-pin" />
                                موقعك المسجل غير مدعوم حاليًا.
                                يمكنك اختيار مدينة ومنطقة مدعومتين.
                            </div>
                        )}

                        <div className="donor-form-actions">
                            <button
                                type="submit"
                                className="donor-btn donor-btn-primary"
                                disabled={saving || conflict || !dirty}
                            >
                                <i className="ti ti-check" />
                                {saving ? "جارٍ الحفظ..." : "حفظ التغييرات"}
                            </button>

                            <button
                                type="button"
                                className="donor-btn donor-btn-secondary"
                                onClick={resetForm}
                                disabled={saving || conflict || !dirty}
                            >
                                إلغاء التعديلات
                            </button>
                        </div>
                    </form>
                </div>
            </section>

            <DonorEmailChange
                profile={profile}
                disabled={Boolean(dirty || saving || conflict)}
                onProfileUpdate={acceptProfile}
                onAuthError={(error) => {
                    if (error.status === 401) {
                        clearAuth();
                        navigate("/login", { replace: true });
                    } else {
                        setLoadError(error);
                    }
                }}
            />

            <section className="donor-panel">
                <div className="donor-panel-header">
                    <h2>تفضيلات التبرع</h2>
                </div>

                <div className="donor-panel-body">
                    <div className="donor-preference">
                        <h3>التوفر للتبرع</h3>
                        <strong>
                            {profile.is_available ? "متاح" : "غير متاح"}
                        </strong>
                    </div>

                    <div className="donor-preference">
                        <h3>الظهور لبنوك الدم</h3>
                        <strong>
                            {profile.visible_to_banks ? "مفعّل" : "متوقف"}
                        </strong>
                    </div>

                    <div className="donor-preference">
                        <h3>الإشعارات</h3>
                        <strong>
                            {profile.notify_enabled ? "مفعّلة" : "متوقفة"}
                        </strong>
                    </div>

                    <div className="donor-form-actions">
                        <Link
                            to="/donor/eligibility"
                            className="donor-btn donor-btn-secondary"
                        >
                            <i className="ti ti-settings" />
                            إدارة التفضيلات
                        </Link>
                    </div>
                </div>
            </section>
        </DonorShell>
    );
}
