import { useAuth } from '../auth/AuthContext';

const SettingsPage = () => {
  const { user } = useAuth();
  const roleLabel = user?.role?.slug === 'sales_rep' ? 'Sales representative' : 'Sales manager';

  const handlePlaceholderSubmit = event => {
    event.preventDefault();
    window.alert('Password changes are not implemented yet.');
  };

  return (
    <div className="page-stack">
      <h1 className="page-heading">Settings</h1>
      <section className="page-card">
        <h2>Profile</h2>
        <p>Name: {user?.name}</p>
        <p>Email: {user?.email}</p>
        <p>Role: {roleLabel}</p>
      </section>
      <section className="page-card">
        <h2>Change password <small>(placeholder)</small></h2>
        <p>This form is not wired yet but shows what the flow will look like.</p>
        <form className="settings-form" onSubmit={handlePlaceholderSubmit}>
          <label>
            Current password
            <input type="password" className="input" disabled placeholder="Not available" />
          </label>
          <label>
            New password
            <input type="password" className="input" disabled placeholder="Not available" />
          </label>
          <button type="submit" className="btn btn-primary" disabled>
            Update password
          </button>
        </form>
      </section>
      <section className="page-card">
        <h2>Notification preferences</h2>
        <label className="settings-toggle">
          <input type="checkbox" disabled />
          Email alerts for overdue visits
        </label>
        <label className="settings-toggle">
          <input type="checkbox" disabled />
          Weekly digest
        </label>
      </section>
    </div>
  );
};

export default SettingsPage;
