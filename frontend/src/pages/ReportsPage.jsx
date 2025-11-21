import { useMemo, useState } from 'react';
import ReportsOverview from '../reports/ReportsOverview';
import RepPerformanceTable from '../reports/RepPerformanceTable';
import ProductPerformanceTable from '../reports/ProductPerformanceTable';
import TerritoryPerformanceTable from '../reports/TerritoryPerformanceTable';

const toDate = date => date.toISOString().slice(0, 10);

const getRangeForPreset = preset => {
  const now = new Date();

  if (preset === 'week') {
    const dayOfWeek = now.getDay(); // 0-6, Sunday=0
    const diffToMonday = (dayOfWeek + 6) % 7;
    const start = new Date(now);
    start.setDate(start.getDate() - diffToMonday);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { from: toDate(start), to: toDate(end) };
  }

  if (preset === 'quarter') {
    const q = Math.floor(now.getMonth() / 3);
    const startMonth = q * 3;
    const start = new Date(now.getFullYear(), startMonth, 1);
    const end = new Date(now.getFullYear(), startMonth + 3, 0);
    return { from: toDate(start), to: toDate(end) };
  }

  // default: this month
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { from: toDate(start), to: toDate(end) };
};

const ReportsPage = () => {
  const defaultRange = useMemo(() => getRangeForPreset('month'), []);
  const [from, setFrom] = useState(defaultRange.from);
  const [to, setTo] = useState(defaultRange.to);
  const [appliedRange, setAppliedRange] = useState(defaultRange);

  const handleApplyRange = event => {
    event.preventDefault();
    setAppliedRange({ from, to });
  };

  const handlePreset = preset => {
    const range = getRangeForPreset(preset);
    setFrom(range.from);
    setTo(range.to);
    setAppliedRange(range);
  };

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <h1 className="page-heading">Reports</h1>
          <p className="page-subtitle">
            Analytics for visits, representatives, products and territories.
          </p>
        </div>
        <form className="page-filters" onSubmit={handleApplyRange}>
          <label>
            <span>From</span>
            <input
              type="date"
              className="input"
              value={from}
              onChange={event => setFrom(event.target.value)}
            />
          </label>
          <label>
            <span>To</span>
            <input
              type="date"
              className="input"
              value={to}
              onChange={event => setTo(event.target.value)}
            />
          </label>
          <button type="submit" className="btn btn-secondary">
            Apply
          </button>
        </form>
      </div>

      <div className="page-filters" style={{ marginBottom: '16px', gap: '8px' }}>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => handlePreset('week')}
        >
          This week
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => handlePreset('month')}
        >
          This month
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => handlePreset('quarter')}
        >
          This quarter
        </button>
      </div>

      <ReportsOverview from={appliedRange.from} to={appliedRange.to} />

      <RepPerformanceTable from={appliedRange.from} to={appliedRange.to} />

      <ProductPerformanceTable from={appliedRange.from} to={appliedRange.to} />

      <TerritoryPerformanceTable from={appliedRange.from} to={appliedRange.to} />
    </div>
  );
};

export default ReportsPage;

