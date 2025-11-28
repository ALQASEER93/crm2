import { useCallback, useMemo } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useVisitsFilters } from './VisitsFilterContext';
import './VisitsFilters.css';

const STATIC_STATUS_OPTIONS = [
  { value: 'scheduled', label: 'Scheduled' },
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

const VisitsFilters = ({ isLoading, referenceLoading, referenceError }) => {
  const { filters, updateFilter, resetFilters, availableFilters } = useVisitsFilters();
  const { user } = useAuth();
  const userRole = user?.role?.slug;

  const normalizedFilters = useMemo(
    () => ({
      startDate: filters?.startDate || '',
      endDate: filters?.endDate || '',
      repIds: Array.isArray(filters?.repIds) ? filters.repIds : [],
      hcpId: filters?.hcpId || '',
      statuses: Array.isArray(filters?.statuses) ? filters.statuses : [],
      territoryId: filters?.territoryId || '',
    }),
    [filters],
  );

  const repOptions = useMemo(
    () => (Array.isArray(availableFilters?.reps) ? availableFilters.reps : []),
    [availableFilters?.reps],
  );
  const hcpOptions = useMemo(
    () => (Array.isArray(availableFilters?.hcps) ? availableFilters.hcps : []),
    [availableFilters?.hcps],
  );
  const territoryOptions = useMemo(
    () => (Array.isArray(availableFilters?.territories) ? availableFilters.territories : []),
    [availableFilters?.territories],
  );
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
    [updateFilter],
  );

  const handlePresetClick = useCallback(
    preset => {
      const range = getPresetRange(preset);
      updateFilter('startDate', range.start);
      updateFilter('endDate', range.end);
    },
    [updateFilter],
  );

  const handleStatusToggle = useCallback(
    status => {
      const currentStatuses = Array.isArray(normalizedFilters.statuses) ? normalizedFilters.statuses : [];
      updateFilter(
        'statuses',
        currentStatuses.includes(status)
          ? currentStatuses.filter(item => item !== status)
          : [...currentStatuses, status],
      );
    },
    [normalizedFilters.statuses, updateFilter],
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
      updateFilter('territoryId', event.target.value);
    },
    [updateFilter],
  );

  const disableRepSelection = userRole === 'sales_rep';

  return (
    <section className="visits-filters" aria-label="Visits filters">
      {referenceError && <div className="visits-filters__alert">{referenceError}</div>}
      {!referenceError && referenceLoading && (
        <div className="visits-filters__loading">Loading filter options…</div>
      )}
      <div className="visits-filters__section">
        <span className="visits-filters__label">Date range</span>
        <div className="visits-filters__inputs">
          <input
            type="date"
            value={normalizedFilters.startDate}
            onChange={handleDateChange('startDate')}
            disabled={isLoading}
          />
    <input
      type="date"
      value={normalizedFilters.endDate}
      onChange={handleDateChange('endDate')}
      disabled={isLoading}
    />
        </div>
        <div className="visits-filters__presets">
          <button type="button" onClick={() => handlePresetClick('week')} disabled={isLoading}>
            This week
          </button>
          <button type="button" onClick={() => handlePresetClick('month')} disabled={isLoading}>
            This month
          </button>
          <button type="button" onClick={() => handlePresetClick('quarter')} disabled={isLoading}>
            This quarter
          </button>
        </div>
      </div>

      <div className="visits-filters__section">
      <span className="visits-filters__label">Representative</span>
      <select
        multiple
        value={normalizedFilters.repIds}
        onChange={handleRepChange}
        disabled={disableRepSelection || isLoading || referenceLoading}
        className="visits-filters__multiselect"
      >
        {repOptions.map(rep => (
            <option key={rep.id} value={rep.id}>
              {rep.name}
            </option>
          ))}
        </select>
        {disableRepSelection && (
          <small className="visits-filters__notice">
            Your role limits results to your assigned accounts.
          </small>
        )}
      </div>

      <div className="visits-filters__section">
        <span className="visits-filters__label">HCP</span>
        <select
          value={normalizedFilters.hcpId || ''}
          onChange={handleHcpChange}
          disabled={isLoading || referenceLoading}
          className="input"
        >
          <option value="">All HCPs</option>
          {hcpOptions.map(hcp => (
            <option key={hcp.id} value={hcp.id}>
              {hcp.name}
            </option>
          ))}
        </select>
      </div>

      <div className="visits-filters__section">
        <span className="visits-filters__label">Status</span>
        <div className="visits-filters__status">
          {statusOptions.map(status => (
            <label key={status.value}>
              <input
                type="checkbox"
                checked={normalizedFilters.statuses.includes(status.value)}
                onChange={() => handleStatusToggle(status.value)}
                disabled={isLoading}
              />
              {status.label}
            </label>
          ))}
        </div>
      </div>

      <div className="visits-filters__section">
        <span className="visits-filters__label">Territory</span>
        <select
          value={normalizedFilters.territoryId || ''}
          onChange={handleTerritoryChange}
          disabled={isLoading || referenceLoading}
          className="input"
        >
          <option value="">All territories</option>
          {territoryOptions.map(territory => (
            <option key={territory.id} value={territory.id}>
              {territory.name}
            </option>
          ))}
        </select>
      </div>

      <div className="visits-filters__section">
        <span className="visits-filters__label">Quick actions</span>
        <div className="visits-filters__footer">
          <button type="button" onClick={resetFilters} disabled={isLoading} className="btn btn-secondary">
            Reset filters
          </button>
        </div>
      </div>
    </section>
  );
};

export default VisitsFilters;

