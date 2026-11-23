import { canonicalCode } from "../constants/org";

export function classifyError(err) {
  const code = canonicalCode(err?.data?.code);
  const s = err?.status;
  if (!s) return "network";
  if (code === "ACCOUNT_PENDING" || code === "ACCOUNT_INACTIVE") return "pending";
  if (code === "ACCOUNT_SUSPENDED") return "account_suspended";
  if (code === "ORG_SUSPENDED") return "org_suspended";
  if (s === 401) return "unauthorized";
  if (s === 403) return "forbidden";
  if (s === 404) return "not_found";
  if (s === 422) return "validation";
  if (s === 409) return "conflict";
  return "other";
}

export const emptyAccount = {
  name: "", email: "", phone: "", national_id: "", password: "", password_confirmation: "",
};

export function accountPayload(values) {
  const phone = values.phone.trim().replace(/[\s()-]/g, "")
    .replace(/^(?:\+|00)(?:970|972)(?=[1-9])/, "0");
  return { ...values, name: values.name.trim(), email: values.email.trim(), phone, national_id: values.national_id.trim() };
}

export function clearAuth() {
  ["hayat_token", "hayat_user"].forEach((k) => localStorage.removeItem(k));
  sessionStorage.removeItem("hayat_challenge_id");
}

export function mapFieldErrors(err, keyMap = {}) {
  const out = {};
  Object.entries(err?.data?.errors || {}).forEach(([k, v]) => {
    out[keyMap[k] || k] = [].concat(v).join(" ");
  });
  return out;
}
