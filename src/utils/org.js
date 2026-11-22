import { canonicalCode } from "../constants/org";

export const normalizeEmail = (v = "") => v.trim().toLowerCase();
export function normalizePhone(v = "") {
  let p = v.replace(/[\s\-()]/g, "");
  if (p.startsWith("00")) p = "+" + p.slice(2);
  else if (p.startsWith("0")) p = "+970" + p.slice(1);
  return p;
}
export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
export const isPhone = (v) => /^\+\d{8,15}$/.test(v);

export function classifyError(err) {
  const code = canonicalCode(err?.data?.code);
  const s = err?.status;
  if (!s) return "network";
  if (code === "ACCOUNT_PENDING") return "pending";
  if (code === "ACCOUNT_SUSPENDED") return "account_suspended";
  if (code === "ORG_SUSPENDED") return "org_suspended";
  if (s === 401) return "unauthorized";
  if (s === 403) return "forbidden";
  if (s === 404) return "not_found";
  if (s === 422) return "validation";
  if (s === 409) return "conflict";
  return "other";
}

export function clearAuth() {
  ["hayat_token", "hayat_user"].forEach((k) => localStorage.removeItem(k));
  sessionStorage.removeItem("hayat_challenge_id");
}

export function mapFieldErrors(err, keyMap = {}) {
  const out = {};
  Object.entries(err?.data?.errors || {}).forEach(([k, v]) => {
    out[keyMap[k] || k] = [].concat(v)[0];
  });
  return out;
}
