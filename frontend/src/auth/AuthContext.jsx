import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { apiFetch } from '../api/client';

const storageKey = 'crm.activeUser';

const defaultState = {
  user: null,
  token: null,
};

const AuthContext = createContext(undefined);

function parseStoredState() {
  if (typeof window === 'undefined') {
    return defaultState;
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return defaultState;
    }

    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return {
        user: parsed.user ?? null,
        token: parsed.token ?? null,
      };
    }
  } catch (error) {
    console.warn('Unable to read stored auth state', error);
  }

  return defaultState;
}

export const AuthProvider = ({ children }) => {
  const isMountedRef = useRef(false);
  const [authState, setAuthState] = useState(() => parseStoredState());
  const { user, token } = authState;

  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      return;
    }

    try {
      if (user && token) {
        window.localStorage.setItem(storageKey, JSON.stringify({ user, token }));
      } else {
        window.localStorage.removeItem(storageKey);
      }
    } catch (error) {
      console.warn('Unable to persist auth state', error);
    }
  }, [user, token]);

  const login = useMemo(
    () => async ({ email, password }) => {
      const { data: result, response } = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: { email, password },
      });

      const tokenFromHeader = response.headers.get('X-Auth-Token');
      setAuthState({
        user: result,
        token: tokenFromHeader,
      });

      return result;
    },
    [],
  );

  const logout = useMemo(
    () => () => {
      setAuthState(defaultState);
    },
    [],
  );

  const value = useMemo(
    () => ({
      user,
      token,
      login,
      logout,
    }),
    [user, token, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
