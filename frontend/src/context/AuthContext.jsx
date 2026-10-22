import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

// 안전성 확보조치 기준 제6조 — 개인정보취급자가 일정 시간 업무처리를 하지 않으면 자동으로 접속을 차단한다.
export const IDLE_LIMIT_MS = 30 * 60 * 1000;
const ACTIVITY_KEY = 'admin_last_activity';
const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart'];

const readLastActivity = () => {
  try { return Number(localStorage.getItem(ACTIVITY_KEY)) || Date.now(); } catch { return Date.now(); }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('admin_user')); }
    catch { return null; }
  });

  const login = (userData, token) => {
    localStorage.setItem('admin_token', token);
    localStorage.setItem('admin_user', JSON.stringify(userData));
    localStorage.setItem(ACTIVITY_KEY, String(Date.now()));
    setUser(userData);
  };

  const logout = useCallback(() => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    localStorage.removeItem(ACTIVITY_KEY);
    setUser(null);
  }, []);

  useEffect(() => {
    if (!user) return undefined;
    let last = 0;
    const touch = () => {
      const now = Date.now();
      if (now - last < 15000) return;
      last = now;
      try { localStorage.setItem(ACTIVITY_KEY, String(now)); } catch { /* 저장 불가 환경은 무시 */ }
    };
    const check = () => {
      if (Date.now() - readLastActivity() > IDLE_LIMIT_MS) {
        logout();
        window.location.href = '/login?reason=idle';
        return false;
      }
      return true;
    };
    // 먼저 검사해야 한다 — 새로고침·재방문 시 활동을 먼저 기록하면 오래 방치된 세션이 새것처럼 보인다.
    if (!check()) return undefined;
    touch();
    ACTIVITY_EVENTS.forEach(e => window.addEventListener(e, touch, { passive: true }));
    const timer = setInterval(check, 30000);
    return () => {
      ACTIVITY_EVENTS.forEach(e => window.removeEventListener(e, touch));
      clearInterval(timer);
    };
  }, [user, logout]);

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
