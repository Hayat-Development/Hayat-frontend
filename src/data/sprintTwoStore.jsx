import { createContext, useContext, useMemo, useState } from "react";

const initialBanks = [
  { id: 1, name: "بنك حياة المركزي للدم", city: "غزة", area: "الرمال", phone: "0599001122", email: "info@hayat-bank.ps", address: "شارع الوحدة، مقابل مجمع الشفاء", representative: "محمد أحمد", representativeEmail: "m.ahmad@hayat-bank.ps", status: "active" },
  { id: 2, name: "مركز العطاء للدم", city: "دير البلح", area: "البلد", phone: "0598123456", email: "contact@ataa.ps", address: "شارع صلاح الدين", representative: "أحمد علي", representativeEmail: "a.ali@ataa.ps", status: "active" },
];

const initialEmployees = [
  { id: 1, name: "سارة خالد", email: "sara@hayat-bank.ps", phone: "0599554433", status: "active" },
  { id: 2, name: "عمر سمير", email: "omar@hayat-bank.ps", phone: "0599221100", status: "pending" },
  { id: 3, name: "ليان محمود", email: "layan@hayat-bank.ps", phone: "0599776655", status: "suspended" },
];

const SprintTwoContext = createContext(null);

function readLocal(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; }
}

export function SprintTwoProvider({ children }) {
  const [banks, setBanksState] = useState(() => readLocal("hayat_demo_banks", initialBanks));
  const [employees, setEmployeesState] = useState(() => readLocal("hayat_demo_employees", initialEmployees));
  const persist = (key, setter) => (updater) => setter((current) => {
    const next = typeof updater === "function" ? updater(current) : updater;
    localStorage.setItem(key, JSON.stringify(next));
    return next;
  });
  const value = useMemo(() => ({ banks, employees, setBanks: persist("hayat_demo_banks", setBanksState), setEmployees: persist("hayat_demo_employees", setEmployeesState) }), [banks, employees]);
  return <SprintTwoContext.Provider value={value}>{children}</SprintTwoContext.Provider>;
}

export const useSprintTwoStore = () => useContext(SprintTwoContext);
