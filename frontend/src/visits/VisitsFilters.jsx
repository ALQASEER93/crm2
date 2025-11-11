import { useCallback, useMemo } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useVisitsFilters } from './VisitsFilterContext';

const STATIC_STATUS_OPTIONS = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const formatDate = date => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getPresetRange = preset => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  switch (preset) {
    case 'week': {
      const dayOfWeek = today.getDay();
      const diffToMonday = (dayOfWeek + 6) % 7;
      const start = new Date(today);
      start.setDate(today.getDate() - diffToMonday);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return { start: formatDate(start), end: formatDate(end) };
    }
    case 'month': {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return { start: formatDate(start), end: formatDate(end) };
    }
    case 'quarter': {
      const currentQuarter = Math.floor(today.getMonth() / 3);
      const startMonth = currentQuarter * 3;
      const start = new Date(today.getFullYear(), startMonth, 1);
      const end = new Date(today.getFullYear(), startMonth + 3, 0);
      return { start: formatDate(start), end: formatDate(end) };
    }
    default:
      return { start: '', end: '' };
  }
};

const Section = ({ title, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '180px' }}>
    <span style={{ fontWeight: 600, color: '#52606d', fontSize: '14px' }}>{title}</span>
    {children}
  </div>
);

const VisitsFilters = ({ availableFilters, isLoading }) => {
  const { filters, updateFilter, resetFilters } = useVisitsFilters();
  const { role, user, setRole } = useAuth();

  const repOptions = useMemo(() => availableFilters?.reps ?? [], [availableFilters?.reps]);
  const hcpOptions = useMemo(() => availableFilters?.hcps ?? [], [availableFilters?.hcps]);
  const territoryOptions = useMemo(() => availableFilters?.territories ?? [], [availableFilters?.territories]);
  const statusOptions = useMemo(() => {
    if (Array.isArray(availableFilters?.statuses) && availableFilters.statuses.length > 0) {
      return availableFilters.statuses.map(status => ({
        value: status,
        label: status.replace(/_/g, ' '),
      }));
    }
    return STATIC_STATUS_OPTIONS;
  }, [availableFilters?.statuses]);

  const handleDateChange = useCallback(
    key => event => {
      updateFilter(key, event.target.value);
    },
    [updateFilter]
  );

  const handlePresetClick = useCallback(
    preset => {
      const range = getPresetRange(preset);
      updateFilter('startDate', range.start);
      updateFilter('endDate', range.end);
    },
    [updateFilter]
  );

  const handleStatusToggle = useCallback(
    status => {
      updateFilter(
        'statuses',
        filters.statuses.includes(status)
          ? filters.statuses.filter(item => item !== status)
          : [...filters.statuses, status]
      );
    },
    [filters.statuses, updateFilter]
  );

  const handleRepChange = useCallback(
    event => {
      const selected = Array.from(event.target.selectedOptions).map(option => option.value);
      updateFilter('repIds', selected);
    },
    [updateFilter]
  );

  const handleHcpChange = useCallback(
    event => {
      updateFilter('hcpId', event.target.value);
    },
    [updateFilter]
  );

  const handleTerritoryChange = useCallback(
    event => {
      updateFilter('territory', event.target.value);
    },
    [updateFilter]
  );

  const handleRoleChange = useCallback(
    event => {
      const nextRole = event.target.value;
      setRole(nextRole);
    },
    [setRole]
  );

  const disableRepSelection = role === 'sales_rep' && user?.id;

  return (
    <section
      aria-label="Visits filters"
      style={{
        display: 'flex',
        gap: '24px',
        flexWrap: 'wrap',
        backgroundColor: '#f7fafc',
        padding: '16px',
        borderRadius: '8px',
        marginBottom: '24px',
      }}
    >
      <Section title="Date range">
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="date"
            value={filters.startDate || ''}
            onChange={handleDateChange('startDate')}
            disabled={isLoading}
            style={{ padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd2d9' }}
          />
          <input
            type="date"
            value={filters.endDate || ''}
            onChange={handleDateChange('endDate')}
            disabled={isLoading}
            style={{ padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd2d9' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => handlePresetClick('week')}
            style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd2d9', backgroundColor: '#fff', cursor: 'pointer' }}
            disabled={isLoading}
          >
            This week
          </button>
          <button
            type="button"
            onClick={() => handlePresetClick('month')}
            style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd2d9', backgroundColor: '#fff', cursor: 'pointer' }}
            disabled={isLoading}
          >
            This month
          </button>
          <button
            type="button"
            onClick={() => handlePresetClick('quarter')}
            style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd2d9', backgroundColor: '#fff', cursor: 'pointer' }}
            disabled={isLoading}
          >
            This quarter
          </button>
        </div>
      </Section>

      <Section title="Representative">
        <select
          multiple
          value={filters.repIds}
          onChange={handleRepChange}
          disabled={disableRepSelection || isLoading}
          style={{ minHeight: '96px', padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd2d9' }}
        >
          {repOptions.map(rep => (
            <option key={rep.id} value={rep.id}>
              {rep.name}
            </option>
          ))}
        </select>
        {disableRepSelection && (
          <small style={{ color: '#9aa5b1' }}>Your role limits results to your assigned accounts.</small>
        )}
      </Section>

      <Section title="HCP">
        <select
          value={filters.hcpId || ''}
          onChange={handleHcpChange}
          disabled={isLoading}
          style={{ padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd2d9' }}
        >
          <option value="">All HCPs</option>
          {hcpOptions.map(hcp => (
            <option key={hcp.id} value={hcp.id}>
              {hcp.name}
            </option>
          ))}
        </select>
      </Section>

      <Section title="Status">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {statusOptions.map(status => (
            <label key={status.value} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#1f2933' }}>
              <input
                type="checkbox"
                checked={filters.statuses.includes(status.value)}
                onChange={() => handleStatusToggle(status.value)}
                disabled={isLoading}
              />
              {status.label}
            </label>
          ))}
        </div>
      </Section>

      <Section title="Territory">
        <select
          value={filters.territory || ''}
          onChange={handleTerritoryChange}
          disabled={isLoading}
          style={{ padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd2d9' }}
        >
          <option value="">All territories</option>
          {territoryOptions.map(territory => (
            <option key={territory.id} value={territory.id}>
              {territory.name}
            </option>
          ))}
        </select>
      </Section>

      <Section title="Role context">
        <select
          value={role || ''}
          onChange={handleRoleChange}
          style={{ padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd2d9' }}
        >
          <option value="">Select role</option>
          <option value="sales_manager">Sales manager</option>
          <option value="sales_rep">Sales representative</option>
        </select>
        <button
          type="button"
          onClick={resetFilters}
          disabled={isLoading}
          style={{
            marginTop: 'auto',
            padding: '6px 8px',
            borderRadius: '4px',
            border: '1px solid #cbd2d9',
            backgroundColor: '#fff',
            cursor: 'pointer',
          }}
        >
          Reset filters
        </button>
      </Section>
    </section>
  );
};

export default VisitsFilters;

