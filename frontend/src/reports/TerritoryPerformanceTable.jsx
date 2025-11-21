import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { apiFetch } from '../api/client';

const TerritoryPerformanceTable = ({ from, to }) => {
  const { token } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token || !from || !to) {
      setRows([]);
      return;
    }

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ from, to });
        const { data } = await apiFetch(`/api/reports/territory-performance?${params.toString()}`, {
          token,
        });
        setRows(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || 'Unable to load territory performance.');
        setRows([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token, from, to]);

  return (
    <section className="page-card">
      <h2>Territory performance</h2>
      <p>Visits, coverage and commercial value per territory.</p>

      {error && <div className="table-card__empty">Unable to load territory performance: {error}</div>}
      {loading && !error && <div className="table-card__empty">Loading territory performance…</div>}

      {!loading && !error && rows.length === 0 && (
        <div className="table-card__empty">No territory data for selected period.</div>
      )}

      {!loading && !error && rows.length > 0 && (
        <div className="table-card__table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Territory</th>
                <th>Total visits</th>
                <th>Completed</th>
                <th>Unique accounts</th>
                <th>Total order (JOD)</th>
                <th>Avg order (JOD)</th>
                <th>Avg rating</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.territoryId}>
                  <td>{row.territoryName || '—'}</td>
                  <td>{row.totalVisits}</td>
                  <td>{row.completedVisits}</td>
                  <td>{row.uniqueAccounts}</td>
                  <td>{row.totalOrderValueJOD}</td>
                  <td>{row.avgOrderValueJOD}</td>
                  <td>{row.avgRating}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default TerritoryPerformanceTable;

