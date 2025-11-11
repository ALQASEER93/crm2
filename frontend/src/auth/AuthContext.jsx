import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

const storageKey = 'crm.activeUser';

const defaultState = {
  user: null,
  role: null,
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
        role: parsed.role ?? null,
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
  const { user, role, token } = authState;

  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      return;
    }

    try {
      if (user) {
        window.localStorage.setItem(
          storageKey,
          JSON.stringify({ user, role, token })
        );
      } else {
        window.localStorage.removeItem(storageKey);
      }
    } catch (error) {
      console.warn('Unable to persist auth state', error);
    }
  }, [user, role, token]);

  const login = useMemo(() => async ({ email, password, role: nextRole }) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      let message = 'Unable to sign in. Please check your credentials and try again.';
      try {
        const payload = await response.json();
        if (payload && typeof payload.message === 'string') {
          message = payload.message;
        }
      } catch (error) {
        // Swallow JSON parse errors and keep default message.
      }
      throw new Error(message);
    }

    const result = await response.json();
    const tokenFromHeader = response.headers.get('X-Auth-Token');

    setAuthState({
      user: result,
      role: nextRole || null,
      token: tokenFromHeader,
    });

    return result;
  }, []);

  const logout = useMemo(
    () => () => {
      setAuthState(defaultState);
    },
    []
  );

  const setRole = useMemo(
    () => nextRole => {
      setAuthState(prev => ({ ...prev, role: nextRole }));
    },
    []
  );

  const value = useMemo(
    () => ({
      user,
      role,
      token,
      login,
      logout,
      setRole,
    }),
    [user, role, token, login, logout, setRole]
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

