import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { VisitsFilterProvider } from './visits/VisitsFilterContext';
import VisitsDashboard from './visits/VisitsDashboard';

const DEFAULT_FILTERS = {
  startDate: '',
  endDate: '',
  repIds: [],
  hcpId: '',
  statuses: [],
  territory: '',
};

const container = document.getElementById('root');

if (!container) {
  throw new Error('Root container #root not found');
}

const App = () => (
  <AuthProvider>
    <AuthGate />
  </AuthProvider>
);

const AuthGate = () => {
  const { user } = useAuth();
  const initialFilters = useMemo(() => ({ ...DEFAULT_FILTERS }), []);

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <VisitsFilterProvider initialFilters={initialFilters}>
      <VisitsDashboard />
    </VisitsFilterProvider>
  );
};

const LoginScreen = () => {
  const { login, role, setRole } = useAuth();
  const [formState, setFormState] = useState({
    email: '',
    password: '',
    role: role || 'sales_manager',
  });
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setFormState(prev => ({ ...prev, role: role || prev.role }));
  }, [role]);

  const handleChange = event => {
    const { name, value } = event.target;
    setFormState(prev => ({ ...prev, [name]: value }));
    if (name === 'role') {
      setRole(value);
    }
  };

  const handleSubmit = async event => {
    event.preventDefault();
    setError(null);

    if (!formState.role) {
      setError('Please choose a role to continue.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login({
        email: formState.email,
        password: formState.password,
        role: formState.role,
      });
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f0f4f8 0%, #d9e2ec 100%)',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: '360px',
          padding: '32px',
          borderRadius: '12px',
          backgroundColor: '#ffffff',
          boxShadow: '0 20px 40px rgba(15, 23, 42, 0.12)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', color: '#1f2933' }}>CRM Sign in</h1>
          <p style={{ margin: '8px 0 0', fontSize: '14px', color: '#52606d' }}>
            Use your field ops credentials to open the Visits dashboard.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            style={{
              backgroundColor: '#fde8e8',
              color: '#b83232',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '14px',
            }}
          >
            {error}
          </div>
        )}

        <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px', color: '#334155' }}>
          Email
          <input
            type="email"
            name="email"
            value={formState.email}
            onChange={handleChange}
            required
            placeholder="you@example.com"
            style={{
              padding: '10px 12px',
              borderRadius: '6px',
              border: '1px solid #cbd2d9',
              fontSize: '14px',
            }}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px', color: '#334155' }}>
          Password
          <input
            type="password"
            name="password"
            value={formState.password}
            onChange={handleChange}
            required
            placeholder="Enter your password"
            style={{
              padding: '10px 12px',
              borderRadius: '6px',
              border: '1px solid #cbd2d9',
              fontSize: '14px',
            }}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px', color: '#334155' }}>
          Role
          <select
            name="role"
            value={formState.role}
            onChange={handleChange}
            style={{
              padding: '10px 12px',
              borderRadius: '6px',
              border: '1px solid #cbd2d9',
              fontSize: '14px',
            }}
          >
            <option value="sales_manager">Sales manager</option>
            <option value="sales_rep">Sales representative</option>
          </select>
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            marginTop: '8px',
            padding: '12px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: isSubmitting ? '#9aa5b1' : '#2563eb',
            color: '#ffffff',
            fontSize: '16px',
            fontWeight: 600,
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s ease',
          }}
        >
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
};

createRoot(container).render(<App />);

