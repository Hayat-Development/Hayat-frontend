import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { classifyError, clearAuth } from "../utils/org";

export default function useBlockingError() {
  const navigate = useNavigate();
  const [block, setBlock] = useState(null);

  const handle = useCallback((err) => {
    const kind = classifyError(err);
    if (kind === "unauthorized") { clearAuth(); navigate("/login", { replace: true }); return true; }
    if (kind === "pending") { navigate("/activate", { replace: true }); return true; }
    if (["forbidden", "not_found", "account_suspended", "org_suspended"].includes(kind)) {
      setBlock({ kind, reason: err?.data?.reason });
      return true;
    }
    return false;
  }, [navigate]);

  return [block, handle];
}
