import { apiRequest, getCurrentUser } from "../api.js";

function normalizeBank(bank) {
  return { ...bank, representative: bank.users?.[0] ?? null };
}

async function list(path, { page = 1, search = "", suspended, signal } = {}) {
  const params = new URLSearchParams({ page });
  if (search) params.set("search", search);
  if (suspended !== undefined) params.set("suspended", suspended ? "1" : "0");
  const { data } = await apiRequest(`${path}?${params}`, { signal });
  if (suspended !== undefined && data.data.some((record) => Boolean(record.deleted_at || record.status === "suspended") !== suspended)) {
    throw new Error("النسخة المتصلة من الباك لا تدعم قوائم الموقوفين. تأكد من تشغيل النسخة المحدثة.");
  }
  return {
    data: data.data,
    meta: { page: data.current_page, per_page: data.per_page, last_page: data.last_page },
  };
}

export async function fetchSession(signal) {
  const user = await getCurrentUser({ signal });
  return { ...user, bank: user.blood_bank };
}

export async function listBanks(options) {
  const { data, meta } = await list("/banks", options);
  return { data: data.map(normalizeBank), meta };
}

export async function getBank(id, signal) {
  // The API only exposes bank records through its paginated list.
  for (let page = 1; ; page += 1) {
    const { data, meta } = await listBanks({ page, signal });
    const bank = data.find((entry) => String(entry.id) === String(id));
    if (bank) return bank;
    if (page >= meta.last_page) break;
  }
  throw Object.assign(new Error("المؤسسة المطلوبة غير موجودة."), { status: 404 });
}

function write(path, method, payload) {
  return apiRequest(path, { method, body: JSON.stringify(payload) });
}

function setStatus(path, status, reason) {
  return write(path, "PATCH", { status, ...(status === "suspended" && { reason }) });
}

export const createBank = (payload) => write("/banks", "POST", payload);
export const setBankStatus = (id, status, reason) => setStatus(`/banks/${id}/status`, status, reason);
export const listStaff = (options) => list("/org/staff", options);
export const createStaff = (payload) => write("/org/staff", "POST", payload);
export const setStaffStatus = (id, status, reason) => setStatus(`/org/staff/${id}/status`, status, reason);
export const listUsers = (options) => list("/admin/users", options);
export const setUserStatus = (id, status, reason) => setStatus(`/admin/users/${id}/status`, status, reason);

export const deleteBankPermanently = (id) => write(`/banks/${id}/permanent`, "DELETE");
export const deleteUserPermanently = (id) => write(`/admin/users/${id}/permanent`, "DELETE");
export const deleteStaffPermanently = (id) => write(`/org/staff/${id}/permanent`, "DELETE");
