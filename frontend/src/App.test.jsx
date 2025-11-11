import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import App from './App.jsx';

vi.mock('./auth/AuthContext.jsx', async importOriginal => {
  const actual = await importOriginal();
  const mockUserContext = {
    user: null,
    role: 'sales_manager',
    token: null,
    login: vi.fn(),
    logout: vi.fn(),
    setRole: vi.fn(),
  };

  return {
    ...actual,
    AuthProvider: ({ children }) => <div data-testid="auth-provider">{children}</div>,
    useAuth: () => mockUserContext,
  };
});

vi.mock('./visits/VisitsDashboard.jsx', () => ({
  default: () => <div>Visits Dashboard</div>,
}));

vi.mock('./visits/VisitsFilterContext.jsx', () => ({
  VisitsFilterProvider: ({ children }) => (
    <div data-testid="visits-filter-provider">{children}</div>
  ),
}));

describe('App', () => {
  it('renders the login screen when no user is authenticated', () => {
    render(<App />);

    expect(screen.getByText(/CRM Sign in/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });
});
