import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import VisitsSummaryCards from '../visits/VisitsSummaryCards';
import { apiFetch } from '../api/client';
import './DashboardPage.css';

const DashboardPage = () => {
  const { token } = useAuth();
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState(null);
  const [recentVisits, setRecentVisits] = useState([]);
  const [recentLoading, setRecentLoading] = useState(false);
  const [recentError, setRecentError] = useState(null);

  const fetchSummary = useCallback(async () => {
    if (!token) {
      setSummary(null);
      return;
    }
    setSummaryLoading(true);
    setSummaryError(null);
    try {
      const { data } = await apiFetch('/api/visits/summary', { token });
      setSummary(data?.data ?? data);
    } catch (error) {
      setSummaryError(error.message);
    } finally {
      setSummaryLoading(false);
    }
  }, [token]);

  const fetchRecentVisits = useCallback(async () => {
    if (!token) {
      setRecentVisits([]);
      return;
    }
    setRecentLoading(true);
    setRecentError(null);
    try {
      const { data } = await apiFetch('/api/visits/latest?pageSize=5', { token });
      setRecentVisits(Array.isArray(data?.data) ? data.data : []);
    } catch (error) {
      setRecentError(error.message);
      setRecentVisits([]);
    } finally {
      setRecentLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchSummary();
    fetchRecentVisits();
  }, [fetchSummary, fetchRecentVisits]);

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <h1 className="page-heading">Dashboard</h1>
          <p className="page-subtitle">Monitor performance across teams and accounts.</p>
        </div>
        <Link to="/visits" className="btn btn-primary">
          Manage visits
        </Link>
      </div>

      <VisitsSummaryCards summary={summary} isLoading={summaryLoading} error={summaryError} />

      <section className="table-card">
        <div className="table-card__header">
          <div>
            <h2>Recent visits</h2>
            <p>Latest calls across all territories.</p>
          </div>
          <Link to="/visits" className="btn btn-secondary">
            View all
          </Link>
        </div>
        {recentError && (
          <div className="table-card__empty">Unable to load latest visits: {recentError}</div>
        )}
        {!recentError && recentVisits.length === 0 && !recentLoading && (
          <div className="table-card__empty">No visits recorded yet.</div>
        )}
        {recentLoading ? (
          <div className="table-card__empty">Loading latest visits…</div>
        ) : (
          recentVisits.length > 0 && (
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Representative</th>
                  <th>HCP</th>
                  <th>Status</th>
                  <th>Duration</th>
                </tr>
              </thead>
              <tbody>
                {recentVisits.map(visit => (
                  <tr key={visit.id}>
                    <td>{new Date(visit.visitDate).toLocaleDateString()}</td>
                    <td>{visit.rep?.name || '—'}</td>
                    <td>{visit.hcp?.name || '—'}</td>
                    <td>
                      <span className="badge">{visit.status.replace(/_/g, ' ')}</span>
                    </td>
                    <td>{visit.durationMinutes} min</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}
      </section>
    </div>
  );
};

export default DashboardPage;
