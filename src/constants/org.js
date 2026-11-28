export const ROLES = {
  ADMIN: "system_admin",
  REP: "rep_bank",
  STAFF: "staff_bank",
  BANK_REP: "bank_rep",
  BANK_STAFF: "bank_staff",
  DONOR: "donor",
};

export function normalizeRole(role) {
  if (role === "bank_rep") return "rep_bank";
  if (role === "bank_staff") return "staff_bank";
  if (role === "admin") return "system_admin";
  return role;
}

export function roleHome(role) {
  const r = normalizeRole(role);
  if (r === ROLES.ADMIN) return "/admin/banks";
  if (r === ROLES.REP || r === ROLES.STAFF) return "/org";
  return "/dashboard";
}

const ALIASES = {
  VALIDATION: ["VALIDATION_FAILED", "FAILED_VALIDATION"],
  EMAIL_TAKEN: ["EMAIL_TAKEN", "TAKEN_EMAIL"],
  PHONE_TAKEN: ["PHONE_TAKEN", "TAKEN_PHONE"],
  ROLE_FORBIDDEN: ["ROLE_FORBIDDEN", "FORBIDDEN_ROLE"],
  ACCOUNT_PENDING: ["PENDING_ACCOUNT", "ACCOUNT_PENDING"],
  ACCOUNT_SUSPENDED: ["SUSPENDED_ACCOUNT", "ACCOUNT_SUSPENDED"],
  ORG_SUSPENDED: ["SUSPENDED_ORG", "ORG_SUSPENDED", "ORGANIZATION_SUSPENDED"],
  NOT_FOUND: ["NOT_FOUND", "FOUND_NOT"],
  INVALID_CREDENTIALS: ["CREDENTIALS_INVALID", "INVALID_CREDENTIALS"],
  SELF_SUSPEND: ["CANNOT_SUSPEND_SELF", "SELF_SUSPEND_CANNOT", "SUSPEND_SELF_CANNOT"],
  LAST_REP: ["LAST_REP_PROTECTED", "PROTECTED_LAST_REP"],
};
const LOOKUP = Object.fromEntries(
  Object.entries(ALIASES).flatMap(([k, list]) => list.map((c) => [c, k]))
);
export const canonicalCode = (code) => LOOKUP[code] || code || "";

export const MESSAGES = {
  VALIDATION: "أكمل الحقول المطلوبة، مع تحديد كل حقل.",
  EMAIL_TAKEN: "هذا البريد مستخدم، استخدم بيانات أخرى.",
  PHONE_TAKEN: "هذا الهاتف مستخدم، استخدم بيانات أخرى.",
  ROLE_FORBIDDEN: "لا تملك صلاحية تنفيذ هذا الإجراء.",
  ACCOUNT_PENDING: "حسابك بحاجة إلى تفعيل، ننقلك الآن لإكماله.",
  ACCOUNT_SUSPENDED: "حسابك موقوف، تواصل مع الممثل الرسمي.",
  ORG_SUSPENDED: "مؤسستك موقوفة حاليًا، تواصل مع إدارة حياة.",
  NOT_FOUND: "السجل المطلوب غير موجود.",
  SELF_SUSPEND: "لا يمكن إيقاف حسابك أو الممثل الأخير للمؤسسة.",
  LAST_REP: "لا يمكن إيقاف حسابك أو الممثل الأخير للمؤسسة.",
  INVALID_CREDENTIALS: "البريد الالكتروني أو كلمة المرور غير صحيحة.",
  NETWORK: "تعذّر الاتصال. ما أدخلته بقي في النموذج.",
};

export const SUCCESS = {
  bankCreated: "تم إنشاء بنك الدم بنجاح",
  repAdded: "تمت إضافة الممثل الرسمي",
  staffAdded: "تمت إضافة الموظف",
  staffSuspended: "تم إيقاف الموظف",
  staffReactivated: "تمت إعادة تفعيل الموظف",
  linkResent: "تم إرسال رابط التفعيل من جديد",
  bankSuspended: "تم إيقاف المؤسسة",
  bankActivated: "تمت إعادة تفعيل المؤسسة",
};

export const REGIONS = [
  "نابلس", "رام الله والبيرة", "الخليل", "القدس", "بيت لحم", "جنين",
  "طولكرم", "قلقيلية", "سلفيت", "طوباس", "أريحا والأغوار", "غزة",
];
