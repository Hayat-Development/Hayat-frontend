export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "/api/v1" : "https://hayat-backend-lh8k.onrender.com/api/v1")
)
  .replace(/^\[|\]$/g, "")
  .trim().replace(/\/$/, "");


export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem("hayat_token");

  const publicPaths = [
    "/auth/register",
    "/auth/login",
    "/auth/email",
    "/auth/email/verify",
    "/auth/email/resend",
    "/auth/forgot-password",
    "/auth/reset-password",
  ];

  const needsToken = token && !publicPaths.includes(path);

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(needsToken ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });




    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        const error = new Error(data.message || "حدث خطأ أثناء الاتصال بالخادم");
        error.status = response.status;
        error.retryAfter = Number(response.headers.get("Retry-After"));
        error.data = data;
        throw error;
    }

    return data;
}


export async function registerUser(form) {
    const result = await apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify({
            name: form.fullName,
            email: form.email,
            phone: form.phone,
            national_id: form.nationalId,
            password: form.password,
            password_confirmation: form.confirmPassword,
            blood_type: form.bloodType || null,
            city: form.city,
            area: form.area,
            last_donation_date: form.lastDonation || null,
        }),
    });

    const challengeId = result.data?.challenge_id;

    if (!challengeId) {
        throw new Error("لم يتم استلام رمز جلسة التحقق من الخادم");
    }

    sessionStorage.setItem("hayat_challenge_id", challengeId);

    return result;
}






export function getApiErrorMessages(error) {
    const errors = error.data?.errors;

    if (errors && typeof errors === "object") {
        return Object.values(errors).flat().map(String);
    }

    if (error.message === "Failed to fetch") {
        return ["تعذر الاتصال بالخادم. تحقق من الإنترنت وحاول مجددًا."];
    }

    return [error.message || "حدث خطأ غير متوقع"];
}



export async function verifyEmail(code) {
    const challengeId = sessionStorage.getItem("hayat_challenge_id");

    if (!challengeId) {
        throw new Error("جلسة التحقق غير موجودة. يرجى التسجيل مجددًا.");
    }

    return apiRequest("/auth/email/verify", {
        method: "POST",
        body: JSON.stringify({
            challenge_id: challengeId,
            code: code,
        }),
    });
}

export async function resendVerificationCode() {
    const challengeId = sessionStorage.getItem("hayat_challenge_id");

    if (!challengeId) {
        throw new Error("جلسة التحقق غير موجودة. يرجى التسجيل مجددًا.");
    }

    const result = await apiRequest("/auth/email/resend", {
        method: "POST",
        body: JSON.stringify({
            challenge_id: challengeId,
        }),
    });

    if (result.data?.challenge_id) {
        sessionStorage.setItem(
            "hayat_challenge_id",
            result.data.challenge_id
        );
    }

    return result;
}




export async function loginUser(login, password) {
    const result = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({
            login: login.trim(),
            password: password,
            device_name: "web",
        }),
    });

    const token = result.data?.token;
    const user = result.data?.user;

    if (!token || !user) {
        throw new Error("استجابة تسجيل الدخول غير مكتملة.");
    }

    localStorage.setItem("hayat_token", token);
    localStorage.setItem("hayat_user", JSON.stringify(user));

    return result;
}


export async function getCurrentUser({ signal } = {}) {
    const result = await apiRequest("/auth/me", {
        signal,
    });

    return result.data?.user ?? result.data;
}


export async function logoutUser() {
    await apiRequest("/auth/logout", {
        method: "POST",
    });

    localStorage.removeItem("hayat_token");
    localStorage.removeItem("hayat_user");
    sessionStorage.removeItem("hayat_challenge_id");
}



export async function forgotPassword(email) {
    return apiRequest("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
    });
}

export function readResetLinkParameters() {
    const params = new URLSearchParams(window.location.search);

    return {
        token: params.get("token"),
        email: params.get("email"),
    };
}

export async function resetPassword(password, passwordConfirmation) {
    const { token, email } = readResetLinkParameters();

    return apiRequest("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({
            email,
            token,
            password,
            password_confirmation: passwordConfirmation,
        }),
    });
}

export async function updateVerificationEmail(email) {
    const challengeId = sessionStorage.getItem("hayat_challenge_id");
    if (!challengeId) throw new Error("جلسة التحقق غير موجودة. يرجى تسجيل الدخول مجددًا.");
    const result = await apiRequest("/auth/email", {
        method: "PATCH",
        body: JSON.stringify({ challenge_id: challengeId, email: email.trim() }),
    });
    sessionStorage.setItem("hayat_challenge_id", result.data.challenge_id);
    return result;
}
