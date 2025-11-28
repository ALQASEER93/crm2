import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { apiFetch } from '../api/client';

const ReportsOverview = ({ from, to }) => {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token || !from || !to) {
      setData(null);
      return;
    }

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ from, to });
        const { data: payload } = await apiFetch(`/api/reports/overview?${params.toString()}`, {
          token,
        });
        setData(payload || null);
      } catch (err) {
        setError(err.message || 'Unable to load overview.');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token, from, to]);

  if (error) {
    return <div className="page-card">Unable to load overview: {error}</div>;
  }

  if (loading && !data) {
    return <div className="page-card">Loading overview…</div>;
  }

  if (!data) {
    return <div className="page-card">No data for selected period.</div>;
  }

  const { totals = {}, accounts = {}, orders = {}, quality = {} } = data;

  return (
    <div className="page-grid">
      <section className="page-card">
        <h2>Visits</h2>
        <p>Total visits: {totals.totalVisits ?? 0}</p>
        <p>Completed: {totals.completedVisits ?? 0}</p>
        <p>Scheduled: {totals.scheduledVisits ?? 0}</p>
        <p>Cancelled: {totals.cancelledVisits ?? 0}</p>
      </section>
      <section className="page-card">
        <h2>Accounts</h2>
        <p>Unique accounts: {accounts.uniqueAccounts ?? 0}</p>
        <p>HCPs: {accounts.hcpCount ?? 0}</p>
        <p>Pharmacies: {accounts.pharmacyCount ?? 0}</p>
      </section>
      <section className="page-card">
        <h2>Orders (JOD)</h2>
        <p>Total order value: {orders.totalOrderValueJOD ?? 0}</p>
        <p>Avg order value: {orders.avgOrderValueJOD ?? 0}</p>
      </section>
      <section className="page-card">
        <h2>Quality</h2>
        <p>Average rating: {quality.avgRating ?? 0}</p>
      </section>
    </div>
  );
};

export default ReportsOverview;

