import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { apiFetch } from '../api/client';

const ProductPerformanceTable = ({ from, to }) => {
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
        const { data } = await apiFetch(`/api/reports/product-performance?${params.toString()}`, {
          token,
        });
        setRows(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || 'Unable to load product performance.');
        setRows([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token, from, to]);

  return (
    <section className="page-card">
      <h2>Product performance</h2>
      <p>Based on products recorded in visits.</p>

      {error && <div className="table-card__empty">Unable to load product performance: {error}</div>}
      {loading && !error && <div className="table-card__empty">Loading product performance…</div>}

      {!loading && !error && rows.length === 0 && (
        <div className="table-card__empty">No product data for selected period.</div>
      )}

      {!loading && !error && rows.length > 0 && (
        <div className="table-card__table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Visits count</th>
                <th>Total quantity</th>
                <th>Avg quantity / visit</th>
                <th>Total order (JOD)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.productName}>
                  <td>{row.productName}</td>
                  <td>{row.visitsCount}</td>
                  <td>{row.totalQuantity}</td>
                  <td>{row.avgQuantityPerVisit}</td>
                  <td>{row.totalOrderValueJOD}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default ProductPerformanceTable;

