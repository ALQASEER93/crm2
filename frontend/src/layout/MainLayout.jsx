import { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import './MainLayout.css';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Visits', path: '/visits' },
  { label: 'HCPs', path: '/hcps' },
  { label: 'Pharmacies', path: '/pharmacies' },
  { label: 'Reports', path: '/reports' },
  { label: 'Settings', path: '/settings' },
];

const MainLayout = () => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleSignOut = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="layout">
      <aside className={`layout__sidebar ${sidebarOpen ? 'layout__sidebar--open' : ''}`}>
        <div className="layout__brand">
          <span>CRM2</span>
        </div>
        <nav className="layout__nav">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `layout__nav-link${isActive ? ' is-active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}

          {/* Admin users link should be visible only for canonical sales_manager/admin */}
          {roleSlug && (roleSlug === 'sales_manager' || roleSlug === 'admin') && (
            <NavLink
              to="/admin/users"
              className={({ isActive }) => `layout__nav-link${isActive ? ' is-active' : ''}`}
            >
              Admin users
            </NavLink>
          )}
        </nav>
      </aside>
      <div className="layout__content">
        <header className="layout__header">
          <button
            type="button"
            className="layout__menu-button"
            onClick={() => setSidebarOpen(prev => !prev)}
            aria-label="Toggle navigation"
          >
            ☰
          </button>
          <div className="layout__header-info">
            <div>
              <span className="layout__header-app">CRM2</span>
              <span className="layout__header-role">
                {user?.role?.slug === 'sales_rep' ? 'Sales Representative' : 'Sales Manager'}
              </span>
            </div>
            <div className="layout__header-user">
              <div className="layout__avatar">{user?.name?.charAt(0).toUpperCase()}</div>
              <div className="layout__user-text">
                <strong>{user?.name}</strong>
                <span>{user?.email}</span>
              </div>
              <button type="button" className="btn btn-secondary layout__signout" onClick={handleSignOut}>
                Sign out
              </button>
            </div>
          </div>
        </header>
        <main className="layout__main">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
