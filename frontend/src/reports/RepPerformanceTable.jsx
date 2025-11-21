import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { apiFetch } from '../api/client';

const RepPerformanceTable = ({ from, to }) => {
  const { token, user } = useAuth();
  const userRole = user?.role?.slug;
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [exportMessage, setExportMessage] = useState(null);

  const canExport = useMemo(() => userRole === 'sales_manager', [userRole]);

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
        const { data } = await apiFetch(`/api/reports/rep-performance?${params.toString()}`, {
          token,
        });
        setRows(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || 'Unable to load representative performance.');
        setRows([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token, from, to]);

  const handleExport = async () => {
    if (!token || !canExport) return;
    setExportMessage(null);
    try {
      const params = new URLSearchParams({ from, to });
      const { data: blob, response } = await apiFetch(
        `/api/reports/rep-performance/export?${params.toString()}`,
        {
          token,
          responseType: 'blob',
          headers: { Accept: 'text/csv' },
        },
      );

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const filename =
        response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') ||
        `rep-performance-${from || ''}-${to || ''}.csv`;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setExportMessage({ type: 'success', text: 'Export started. Your download should begin shortly.' });
    } catch (err) {
      setExportMessage({ type: 'error', text: err.message || 'Unable to export CSV.' });
    }
  };

  return (
    <section className="page-card">
      <div
        className="table-card__header"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <div>
          <h2>Rep performance</h2>
          <p>Visits, order value and quality per representative.</p>
        </div>
        {canExport && rows.length > 0 && (
          <button type="button" className="btn btn-secondary" onClick={handleExport}>
            Export CSV
          </button>
        )}
      </div>

      {exportMessage && (
        <div
          style={{
            marginBottom: '8px',
            padding: '8px 12px',
            borderRadius: '4px',
            backgroundColor: exportMessage.type === 'error' ? '#fde8e8' : '#def7ec',
            color: exportMessage.type === 'error' ? '#b83232' : '#046c4e',
            fontSize: '13px',
          }}
        >
          {exportMessage.text}
        </div>
      )}

      {error && <div className="table-card__empty">Unable to load rep performance: {error}</div>}
      {loading && !error && <div className="table-card__empty">Loading rep performance…</div>}

      {!loading && !error && rows.length === 0 && (
        <div className="table-card__empty">No data for selected period.</div>
      )}

      {!loading && !error && rows.length > 0 && (
        <div className="table-card__table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Representative</th>
                <th>Territories</th>
                <th>Total visits</th>
                <th>Completed</th>
                <th>Scheduled</th>
                <th>Cancelled</th>
                <th>Unique accounts</th>
                <th>Total order (JOD)</th>
                <th>Avg order (JOD)</th>
                <th>Avg rating</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.repId}>
                  <td>
                    <div>{row.repName || '—'}</div>
                    <div className="text-muted">{row.repEmail || ''}</div>
                  </td>
                  <td>{Array.isArray(row.territoryNames) ? row.territoryNames.join(', ') : ''}</td>
                  <td>{row.totalVisits}</td>
                  <td>{row.completedVisits}</td>
                  <td>{row.scheduledVisits}</td>
                  <td>{row.cancelledVisits}</td>
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

export default RepPerformanceTable;

