/*
 * ⚠️ طبقة وهمية (Mock) للسبرنت 2 — استبدل جسم كل دالة بـ apiRequest(...) من ../api.
 * الأخطاء المرمية بنفس شكل apiRequest: error.status و error.data.{code, errors, reason}.
 *
 * للمعاينة بدون باك:
 *   ?as=admin | rep | staff           الدور (يُحفظ في sessionStorage)
 *   ?scn=empty | network | org_suspended | account_suspended | pending
 */
const wait = (ms = 450) => new Promise((r) => setTimeout(r, ms));
const fail = (status, code, extra = {}) => {
  const e = new Error(code || "error");
  e.status = status;
  e.data = { code, ...extra };
  return e;
};
function mockCfg() {
  const q = new URLSearchParams(window.location.search);
  if (q.has("as")) sessionStorage.setItem("mock_as", q.get("as"));
  if (q.has("scn")) q.get("scn") ? sessionStorage.setItem("mock_scn", q.get("scn")) : sessionStorage.removeItem("mock_scn");
  return { as: sessionStorage.getItem("mock_as") || "rep", scn: sessionStorage.getItem("mock_scn") || "" };
}
const link = () => `${window.location.origin}/activate?token=${Math.random().toString(36).slice(2, 14)}`;

const db = {
  banks: [
    { id: 1, name: "بنك الأمل للدم", status: "active", region: "نابلس", email: "info@amal-bank.ps", phone: "+970590000000", representative: { id: 10, name: "سارة أحمد" } },
    { id: 2, name: "بنك الشفاء للدم", status: "active", region: "رام الله والبيرة", email: "info@shifa.ps", phone: "+970590000001", representative: null },
    { id: 3, name: "بنك النور للدم", status: "suspended", region: "الخليل", email: "info@noor.ps", phone: "+970590000002", representative: { id: 11, name: "خالد يوسف" } },
  ],
  staff: [
    { id: 10, name: "سارة أحمد", email: "sara@amal-bank.ps", phone: "+970591111111", role: "rep_bank", status: "active" },
    { id: 20, name: "ليلى حسن", email: "laila@amal.ps", phone: "+970592222222", role: "staff_bank", status: "active" },
    { id: 21, name: "محمد علي", email: "mo@amal.ps", phone: "+970593333333", role: "staff_bank", status: "pending" },
    { id: 22, name: "رنا سالم", email: "rana@amal.ps", phone: "+970594444444", role: "staff_bank", status: "suspended" },
  ],
};
const TAKEN = ["info@amal-bank.ps", "laila@amal.ps"]; // لتجربة 409

// GET /auth/me  (أو الموجود عندك getCurrentUser) — يجب أن يرجع الدور والمؤسسة
export async function fetchSession() {
  await wait(300);
  const { as, scn } = mockCfg();
  if (scn === "network") throw fail(0);
  if (scn === "pending") throw fail(403, "PENDING_ACCOUNT");
  const role = { admin: "system_admin", rep: "rep_bank", staff: "staff_bank" }[as];
  const isAdmin = as === "admin";
  return {
    id: as === "rep" ? 10 : as === "staff" ? 20 : 1,
    name: isAdmin ? "مدير النظام" : as === "rep" ? "سارة أحمد" : "ليلى حسن",
    email: "user@hayat.ps", role,
    status: scn === "account_suspended" ? "suspended" : "active",
    bank: isAdmin ? null : { ...db.banks[0], status: scn === "org_suspended" ? "suspended" : "active", suspension_reason: "قيد المراجعة من إدارة حياة" },
  };
}

// GET /admin/banks
export async function listBanks() {
  await wait();
  const { scn } = mockCfg();
  if (scn === "network") throw fail(0);
  return scn === "empty" ? [] : db.banks.map((b) => ({ ...b }));
}

// GET /admin/banks/{id}
export async function getBank(id) {
  await wait();
  if (mockCfg().scn === "network") throw fail(0);
  const b = db.banks.find((x) => x.id === Number(id));
  if (!b) throw fail(404, "NOT_FOUND");
  return { ...b };
}

// POST /admin/banks  { bank:{name,email,phone,region}, representative:{name,email,phone} }
export async function createBankWithRep({ bank, representative }) {
  await wait(700);
  if (mockCfg().scn === "network") throw fail(0);
  const errors = {};
  if (TAKEN.includes(bank.email)) throw fail(409, "EMAIL_TAKEN", { field: "email" });
  if (TAKEN.includes(representative.email)) throw fail(409, "EMAIL_TAKEN", { field: "rep_email" });
  if (Object.keys(errors).length) throw fail(422, "VALIDATION_FAILED", { errors });
  const id = Date.now();
  db.banks.push({ id, ...bank, status: "active", representative: { id: id + 1, name: representative.name } });
  return { bank_id: id, activation_url: link() };
}

// POST /admin/banks/{id}/representative  ⚠️ غير موجود في عقد الـAPI — اتفق عليه مع الباك (Story 2.2 "أو بعده")
export async function addRepresentative(bankId, rep) {
  await wait(600);
  if (TAKEN.includes(rep.email)) throw fail(409, "EMAIL_TAKEN", { field: "rep_email" });
  const b = db.banks.find((x) => x.id === Number(bankId));
  if (!b) throw fail(404, "NOT_FOUND");
  b.representative = { id: Date.now(), name: rep.name };
  return { activation_url: link() };
}

// PATCH /admin/banks/{id}/status  { status: "active" | "suspended" }
export async function setBankStatus(id, status) {
  await wait(500);
  const b = db.banks.find((x) => x.id === id);
  if (!b) throw fail(404, "NOT_FOUND");
  b.status = status;
  return b;
}

// GET /org/staff?search=&page=
export async function listStaff({ search = "", page = 1 } = {}) {
  await wait();
  const { scn } = mockCfg();
  if (scn === "network") throw fail(0);
  const all = scn === "empty" ? [] : db.staff.filter((s) => s.name.includes(search.trim()));
  const per = 10;
  return { data: all.slice((page - 1) * per, page * per), meta: { page, per_page: per, last_page: Math.max(1, Math.ceil(all.length / per)), total: all.length } };
}

// POST /org/staff  { name, email, phone } — لا ترسل role ولا blood_bank_id
export async function createStaff(p) {
  await wait(700);
  if (mockCfg().scn === "network") throw fail(0);
  if (TAKEN.includes(p.email)) throw fail(409, "EMAIL_TAKEN", { field: "email" });
  if (p.phone === "+970599999999") throw fail(409, "PHONE_TAKEN", { field: "phone" });
  db.staff.push({ id: Date.now(), ...p, role: "staff_bank", status: "pending" });
  return { activation_url: link() };
}

const find = (id) => { const s = db.staff.find((x) => x.id === id); if (!s) throw fail(404, "NOT_FOUND"); return s; };
// PATCH /org/staff/{id}/suspend
export async function suspendStaff(id) {
  await wait(); const s = find(id);
  if (s.role === "rep_bank") throw fail(422, "CANNOT_SUSPEND_SELF");
  s.status = "suspended"; return s;
}
// PATCH /org/staff/{id}/reactivate  (يعود pending إن لم يكمل التفعيل)
export async function reactivateStaff(id) { await wait(); const s = find(id); s.status = "active"; return s; }
// POST /org/staff/{id}/resend-activation
export async function resendActivation(id) { await wait(); find(id); return { activation_url: link() }; }

// POST /auth/activate  { token, password, password_confirmation }
export async function activateAccount({ token }) {
  await wait(700);
  if (!token || token === "expired") throw fail(410, "ACTIVATION_LINK_INVALID");
  return { ok: true };
}
