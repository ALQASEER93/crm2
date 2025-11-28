import { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { apiFetch } from '../api/client';

const USER_TYPES = [
  { value: 'admin', label: 'Admin' },
  { value: 'manager', label: 'Manager' },
  { value: 'medical_rep', label: 'Medical rep' },
  { value: 'sales_rep', label: 'Sales rep' },
];

const roleLabel = slug => {
  if (slug === 'sales_manager') return 'Manager';
  if (slug === 'sales_rep') return 'Sales rep';
  return slug || 'User';
};

const statusLabel = isActive => (isActive ? 'Active' : 'Inactive');

const AdminUsersPage = () => {
  const { user, token } = useAuth();
  const roleSlug = user?.role?.slug;
  const isAdmin = roleSlug === 'sales_manager' || roleSlug === 'admin';

  const [users, setUsers] = useState([]);
  const [territories, setTerritories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    userType: 'sales_rep',
    territoryId: '',
    isActive: true,
  });
  const [formError, setFormError] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersRes, territoriesRes] = await Promise.all([
        apiFetch('/api/admin/users', { token }),
        apiFetch('/api/territories?page=1&pageSize=500', { token }),
      ]);
      setUsers(Array.isArray(usersRes.data?.data) ? usersRes.data.data : usersRes.data);
      const territoryRows = territoriesRes.data?.data || territoriesRes.data || [];
      setTerritories(Array.isArray(territoryRows) ? territoryRows : []);
    } catch (err) {
      setError(err.message || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreate = () => {
    setFormMode('create');
    setEditingUser(null);
    setForm({
      name: '',
      email: '',
      password: '',
      userType: 'sales_rep',
      territoryId: '',
      isActive: true,
    });
    setFormError(null);
  };

  const openEdit = userRow => {
    setFormMode('edit');
    setEditingUser(userRow);
    setForm({
      name: userRow.name || '',
      email: userRow.email || '',
      password: '',
      userType:
        userRow.salesRep?.repType === 'medical_rep'
          ? 'medical_rep'
          : userRow.role?.slug === 'sales_manager'
          ? 'manager'
          : 'sales_rep',
      territoryId: userRow.salesRep?.territoryId || '',
      isActive: userRow.isActive !== false,
    });
    setFormError(null);
  };

  const handleSubmit = async event => {
    event.preventDefault();
    setSaving(true);
    setFormError(null);

    const payload = {
      name: form.name,
      email: form.email,
      userType: form.userType,
      territoryId: form.territoryId || null,
    };

    if (form.password) {
      payload.password = form.password;
    }
    if (formMode === 'edit') {
      payload.isActive = form.isActive;
    }

    try {
      if (formMode === 'create') {
        await apiFetch('/api/admin/users', {
          method: 'POST',
          token,
          body: payload,
        });
      } else if (editingUser) {
        await apiFetch(`/api/admin/users/${editingUser.id}`, {
          method: 'PATCH',
          token,
          body: payload,
        });
      }
      await loadData();
      openCreate();
    } catch (err) {
      const apiMessage =
        (err?.payload && err.payload.message) ||
        err?.message ||
        'Failed to save user.';
      const details =
        Array.isArray(err?.payload?.errors) && err.payload.errors.length
          ? ` (${err.payload.errors[0]})`
          : '';
      setFormError(`${apiMessage}${details}`);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async userRow => {
    try {
      await apiFetch(`/api/admin/users/${userRow.id}`, {
        method: 'PATCH',
        token,
        body: { isActive: !userRow.isActive },
      });
      await loadData();
    } catch (err) {
      setError(err.message || 'Unable to toggle user status.');
    }
  };

  const userRoleLabel = userRow => {
    if (userRow.salesRep?.repType === 'medical_rep') return 'Medical rep';
    if (userRow.role?.slug === 'sales_manager') return 'Manager';
    if (userRow.role?.slug === 'sales_rep') return 'Sales rep';
    return 'User';
  };

  const formTitle = formMode === 'create' ? 'Create user' : 'Edit user';

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div style={{ padding: '24px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px' }}>Admin users</h1>
          <p style={{ margin: '4px 0 0', color: '#52606d' }}>
            Manage users, roles, and territories.
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          New user
        </button>
      </header>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '12px' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', alignItems: 'start' }}>
        <div className="card">
          <div className="card__body">
            {loading ? (
              <p>Loading users…</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Territory</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td>{u.name}</td>
                      <td>{u.email}</td>
                      <td>{userRoleLabel(u)}</td>
                      <td>{u.salesRep?.territoryName || '—'}</td>
                      <td>{statusLabel(u.isActive)}</td>
                      <td style={{ display: 'flex', gap: '8px' }}>
                        <button type="button" className="btn btn-secondary" onClick={() => openEdit(u)}>
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => toggleActive(u)}
                        >
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', color: '#52606d' }}>
                        No users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card__body">
            <h3 style={{ marginTop: 0 }}>{formTitle}</h3>
            {formError && (
              <div className="alert alert-danger" style={{ marginBottom: '8px' }}>
                {formError}
              </div>
            )}
            <form onSubmit={handleSubmit} className="form">
              <label className="form__label">
                Name
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </label>
              <label className="form__label">
                Email
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </label>
              <label className="form__label">
                Password {formMode === 'edit' ? '(leave blank to keep current)' : ''}
                <input
                  type="password"
                  value={form.password}
                  onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))}
                  minLength={formMode === 'create' ? 6 : undefined}
                  required={formMode === 'create'}
                />
              </label>
              <label className="form__label">
                User type
                <select
                  value={form.userType}
                  onChange={e => setForm(prev => ({ ...prev, userType: e.target.value }))}
                >
                  {USER_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </label>

              {(form.userType === 'medical_rep' || form.userType === 'sales_rep') && (
                <label className="form__label">
                  Territory
                  <select
                    value={form.territoryId}
                    onChange={e => setForm(prev => ({ ...prev, territoryId: e.target.value }))}
                  >
                    <option value="">(optional)</option>
                    {territories.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {formMode === 'edit' && (
                <label className="form__label">
                  Status
                  <select
                    value={form.isActive ? 'active' : 'inactive'}
                    onChange={e => setForm(prev => ({ ...prev, isActive: e.target.value === 'active' }))}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </label>
              )}

              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : 'Save'}
                </button>
                {formMode === 'edit' && (
                  <button type="button" className="btn btn-secondary" onClick={openCreate}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUsersPage;
