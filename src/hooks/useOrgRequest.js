import { useEffect, useState } from "react";

export default function useOrgRequest(request) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    request(controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) setResult({ request, attempt, data });
      },
      (error) => {
        if (!controller.signal.aborted) setResult({ request, attempt, error });
      },
    );
    return () => controller.abort();
  }, [request, attempt]);

  const current = result?.request === request && result.attempt === attempt ? result : null;
  return { ...current, loading: !current, reload: () => setAttempt((value) => value + 1) };
}
