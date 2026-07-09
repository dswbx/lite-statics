import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { Notice } from "../shared/notice";

interface NoticeContextValue {
  notice: Notice;
  setNotice: (notice: Notice) => void;
  clearNotice: () => void;
}

const NoticeContext = createContext<NoticeContextValue | null>(null);

export function NoticeProvider({ children }: { children: ReactNode }) {
  const [notice, setNoticeState] = useState<Notice>(null);

  const setNotice = useCallback((next: Notice) => setNoticeState(next), []);
  const clearNotice = useCallback(() => setNoticeState(null), []);

  const value = useMemo(() => ({ notice, setNotice, clearNotice }), [notice, setNotice, clearNotice]);

  return <NoticeContext.Provider value={value}>{children}</NoticeContext.Provider>;
}

export function useNotice() {
  const context = useContext(NoticeContext);
  if (!context) throw new Error("useNotice must be used within NoticeProvider");
  return context;
}
