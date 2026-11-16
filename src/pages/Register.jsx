import { useNavigate } from "react-router-dom";
import { registerUser, getApiErrorMessages } from "../api";
import { useState } from "react";

const initialForm = {
    fullName: "",
    nationalId: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    bloodType: "",
    city: "",
    area: "",
    lastDonation: "",
    consent: false,
};

export default function Register() {
    const [form, setForm] = useState(initialForm);
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [message, setMessage] = useState("");
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const updateField = (e) => {
        const { name, value, type, checked } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
        setErrors((prev) => ({ ...prev, [name]: "" }));
        setMessage("");
    };

    const validate = () => {
        const next = {};

        if (
            form.fullName.trim().length < 3 ||
            form.fullName.trim().length > 120
        ) {
            next.fullName = "الاسم يجب أن يكون بين 3 و120 حرفًا";
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
            next.email = "أدخل بريدًا إلكترونيًا صحيحًا";
        if (!/^059\d{7}$/.test(form.phone.trim())) {
            next.phone = "رقم الهاتف يجب أن يبدأ بـ 059 ويتكون من 10 أرقام";
        }

        if (!/^\d{9}$/.test(form.nationalId.trim())) {
            next.nationalId = "رقم الهوية يجب أن يتكون من 9 أرقام";
        }
        if (
            form.password.length < 8 ||
            !/[A-Z]/.test(form.password) ||
            !/[a-z]/.test(form.password) ||
            !/\d/.test(form.password)
        ) {
            next.password =
                "كلمة المرور يجب أن تحتوي على 8 أحرف على الأقل، وحرف كبير وصغير ورقم";
        }
        if (form.confirmPassword !== form.password)
            next.confirmPassword = "كلمتا المرور غير متطابقتين";
        if (
            form.bloodType &&
            form.bloodType !== "unknown" &&
            !["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].includes(form.bloodType)
        ) {
            next.bloodType = "فصيلة الدم غير صالحة";
        }
        if (!form.city.trim()) next.city = "المدينة مطلوبة";
        if (!form.area.trim()) next.area = "المنطقة مطلوبة";

        const today = new Date();
        const localToday = [
            today.getFullYear(),
            String(today.getMonth() + 1).padStart(2, "0"),
            String(today.getDate()).padStart(2, "0"),
        ].join("-");

        if (form.lastDonation && form.lastDonation > localToday)
            next.lastDonation = "تاريخ التبرع لا يمكن أن يكون في المستقبل";

       

        return next;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (loading) return;

        const nextErrors = validate();
        setErrors(nextErrors);

        if (Object.keys(nextErrors).length > 0) {
            setMessage("يرجى تصحيح الحقول الموضحة أدناه.");
            return;
        }

        setLoading(true);
        setMessage("");

        try {
            await registerUser(form);
            navigate("/verify-email");
        } catch (error) {
            setMessage(getApiErrorMessages(error).join(" - "));
        } finally {
            setLoading(false);
        }
    };

    const fieldError = (name) => (
        <span className="field-error" aria-live="polite">
            {errors[name] || ""}
        </span>
    );

    return (
        <div className="page" dir="rtl">
            <main id="main-content">
                <section className="auth-section public-auth">
                    <div className="container-xl auth-container">
                        <div className="row g-0 flex-fill auth-split">
                            <div className="col-12 col-lg-6 d-flex flex-column justify-content-center auth-form-column">
                                <div className="container-tight">
                                    <div className="auth-steps">
                                        <span className="current">١. بيانات الحساب</span>
                                        <span>—</span>
                                        <span>٢. تأكيد البريد</span>
                                        <span>—</span>
                                        <span>٣. ابدأ العطاء</span>
                                    </div>

                                    <div className="card card-md auth-card">
                                        <div className="card-body">
                                            <h1 className="auth-title mb-2">
                                                خطوتك الأولى تصنع الفرق
                                            </h1>
                                            <p className="text-secondary mb-4">
                                                أنشئ حسابًا تجريبيًا لتصلك الطلبات المناسبة في منطقتك.
                                            </p>

                                            {message && (
                                                <div className="form-alert" role="alert">
                                                    {message}
                                                </div>
                                            )}

                                            <form onSubmit={handleSubmit} noValidate>
                                                {[
                                                    ["nationalId", "رقم الهوية", "text", "9 أرقام"],
                                                    ["fullName", "الاسم الرباعي", "text", "مثال: أحمد محمد"],
                                                    ["email", "البريد الإلكتروني", "email", "name@example.com"],
                                                    ["phone", "رقم الهاتف", "tel", "059XXXXXXX"],
                                                ].map(([name, label, type, placeholder]) => (
                                                    <div className="mb-3" key={name}>
                                                        <label className="form-label" htmlFor={name}>
                                                            {label}
                                                        </label>
                                                        <input
                                                            className="form-control"
                                                            id={name}
                                                            name={name}
                                                            type={type}
                                                            value={form[name]}
                                                            onChange={updateField}
                                                            placeholder={placeholder}
                                                            dir={name === "email" || name === "phone" ? "ltr" : undefined}
                                                            autoComplete={
                                                                name === "email" ? "email" :
                                                                    name === "phone" ? "tel" : "name"
                                                            }
                                                        />
                                                        {fieldError(name)}
                                                    </div>
                                                ))}

                                                {[
                                                    ["password", "كلمة المرور", showPassword, setShowPassword],
                                                    ["confirmPassword", "تأكيد كلمة المرور", showConfirm, setShowConfirm],
                                                ].map(([name, label, visible, setVisible]) => (
                                                    <div className="mb-3" key={name}>
                                                        <label className="form-label" htmlFor={name}>
                                                            {label}
                                                        </label>
                                                        <div className="password-field">
                                                            <input
                                                                className="form-control"
                                                                id={name}
                                                                name={name}
                                                                type={visible ? "text" : "password"}
                                                                value={form[name]}
                                                                onChange={updateField}
                                                                placeholder={
                                                                    name === "password"
                                                                        ? "8 أحرف على الأقل"
                                                                        : "أعد كتابة كلمة المرور"
                                                                }
                                                                autoComplete="new-password"
                                                            />
                                                            <button
                                                                type="button"
                                                                className="password-toggle"
                                                                onClick={() => setVisible(!visible)}
                                                                aria-label={visible ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                                                            >
                                                                <i className={`ti ti-eye${visible ? "-off" : ""}`} />
                                                            </button>
                                                        </div>
                                                        {fieldError(name)}
                                                    </div>
                                                ))}

                                                <div className="mb-3">
                                                    <label className="form-label" htmlFor="bloodType">
                                                        فصيلة الدم
                                                    </label>
                                                    <select
                                                        className="form-select"
                                                        id="bloodType"
                                                        name="bloodType"
                                                        value={form.bloodType}
                                                        onChange={updateField}
                                                    >
                                                        <option value="">اختر فصيلة الدم</option>
                                                        <option value="unknown">لا أعرف فصيلة دمي</option>
                                                        {["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"].map((type) => (
                                                            <option key={type} value={type}>{type}</option>
                                                        ))}
                                                    </select>
                                                    {fieldError("bloodType")}
                                                </div>

                                                <div className="row">
                                                    {[
                                                        ["city", "المدينة", "مثال: غزة"],
                                                        ["area", "المنطقة / الحي", "مثال: الرمال"],
                                                    ].map(([name, label, placeholder]) => (
                                                        <div className="col-sm-6 mb-3" key={name}>
                                                            <label className="form-label" htmlFor={name}>
                                                                {label}
                                                            </label>
                                                            <input
                                                                className="form-control"
                                                                id={name}
                                                                name={name}
                                                                value={form[name]}
                                                                onChange={updateField}
                                                                placeholder={placeholder}
                                                            />
                                                            {fieldError(name)}
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="mb-3">
                                                    <label className="form-label" htmlFor="lastDonation">
                                                        آخر تاريخ تبرع{" "}
                                                        <span className="text-secondary fw-normal">
                                                            (اختياري)
                                                        </span>
                                                    </label>
                                                    <input
                                                        className="form-control"
                                                        type="date"
                                                        id="lastDonation"
                                                        name="lastDonation"
                                                        value={form.lastDonation}
                                                        onChange={updateField}
                                                    />
                                                    {fieldError("lastDonation")}
                                                </div>

                                                
                                                {fieldError("consent")}

                                                <button
                                                    type="submit"
                                                    className="btn btn-primary w-100"
                                                    disabled={loading}
                                                >
                                                    {loading ? "جاري إنشاء الحساب..." : "إنشاء الحساب"}
                                                </button>
                                            </form>

                                            <div className="auth-footer">
                                                عندك حساب؟ <a href="/login">تسجيل الدخول</a>
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

                                    <h2>خطوتك الأولى، بداية أثر.</h2>
                                    <p>
                                        بياناتك المعلنة تساعدك تتابع النداءات المناسبة في منطقتك.
                                        اختر الفصيلة «لا أعرف» إذا لم تكن متأكدًا.
                                    </p>
                                    <div className="cover-caption">
                                        <i className="ti ti-stethoscope" aria-hidden="true" />{" "}
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
