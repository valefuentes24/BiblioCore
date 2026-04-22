import { useCallback, useEffect, useMemo, useState } from "react";
import { getLoansByUser } from "../services/api";

function readUserId() {
  try {
    const u = JSON.parse(localStorage.getItem("user") || "null");
    return u?.id ?? null;
  } catch {
    return null;
  }
}

export function useUserLoans() {
  const [loans, setLoans] = useState([]);
  const [userId, setUserId] = useState(readUserId);

  useEffect(() => {
    setUserId(readUserId());
  }, []);

  const refresh = useCallback(async () => {
    if (!userId) {
      setLoans([]);
      return;
    }
    try {
      const res = await getLoansByUser(userId);
      setLoans(Array.isArray(res.data) ? res.data : []);
    } catch (_e) {
      setLoans([]);
    }
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const activeByBookId = useMemo(() => {
    const m = {};
    for (const l of loans) {
      if (l.status === "active") m[String(l.bookId)] = l;
    }
    return m;
  }, [loans]);

  return { loans, activeByBookId, refresh, userId };
}
