import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useVisitsFilters } from './VisitsFilterContext';
import VisitsFilters from './VisitsFilters';
import VisitsSummaryCards from './VisitsSummaryCards';
import VisitsTable from './VisitsTable';

const PAGE_SIZE_OPTIONS = [25, 50, 100];
const DEFAULT_PAGE_SIZE = PAGE_SIZE_OPTIONS[0];

const DEFAULT_AVAILABLE_FILTERS = {
  reps: [],
  hcps: [],
  statuses: ['scheduled', 'in_progress', 'completed', 'cancelled'],
  territories: [],
};

const buildQueryString = (filters, options = {}) => {
  const params = new URLSearchParams();
  if (filters.startDate) {
    params.append('startDate', filters.startDate);
  }
  if (filters.endDate) {
    params.append('endDate', filters.endDate);
  }
  if (Array.isArray(filters.repIds)) {
    filters.repIds.filter(Boolean).forEach(repId => params.append('repId', repId));
  }
  if (filters.hcpId) {
    params.append('hcpId', filters.hcpId);
  }
  if (Array.isArray(filters.statuses)) {
    filters.statuses.filter(Boolean).forEach(status => params.append('status', status));
  }
  if (filters.territory) {
    params.append('territory', filters.territory);
  }

  if (options.page) {
    params.append('page', String(options.page));
  }
  if (options.pageSize) {
    params.append('pageSize', String(options.pageSize));
  }
  if (options.sort && options.sort.field) {
    params.append('sortBy', options.sort.field);
    params.append('sortDirection', options.sort.direction || 'asc');
  }

  return params.toString();
};

const getErrorMessage = async response => {
  try {
    const payload = await response.json();
    if (payload && typeof payload.message === 'string') {
      return payload.message;
    }
  } catch (error) {
    // Ignore JSON parsing issues and fall back to default message.
  }
  return `${response.status} ${response.statusText}`;
};

const mapFiltersToDisplay = (filters, availableFilters) => {
  const appliedFilters = [];

  if (filters.startDate || filters.endDate) {
    const start = filters.startDate ? filters.startDate : 'Any';
    const end = filters.endDate ? filters.endDate : 'Any';
    appliedFilters.push(`Date: ${start} → ${end}`);
  }

  if (Array.isArray(filters.repIds) && filters.repIds.length > 0) {
    const repNames = filters.repIds
      .map(repId => availableFilters.reps.find(rep => String(rep.id) === String(repId))?.name || repId)
      .join(', ');
    appliedFilters.push(`Rep: ${repNames}`);
  }

  if (filters.hcpId) {
    const hcpName = availableFilters.hcps.find(hcp => String(hcp.id) === String(filters.hcpId))?.name || filters.hcpId;
    appliedFilters.push(`HCP: ${hcpName}`);
  }

  if (Array.isArray(filters.statuses) && filters.statuses.length > 0) {
    const statusLabels = filters.statuses.map(status => status.replace(/_/g, ' ')).join(', ');
    appliedFilters.push(`Status: ${statusLabels}`);
  }

  if (filters.territory) {
    const territoryName = availableFilters.territories.find(territory => String(territory.id) === String(filters.territory))?.name || filters.territory;
    appliedFilters.push(`Territory: ${territoryName}`);
  }

  if (appliedFilters.length === 0) {
    appliedFilters.push('None');
  }

  return appliedFilters;
};

const VisitsDashboard = () => {
  const { user, role, token, logout } = useAuth();
  const { filters, setFilters } = useVisitsFilters();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [sort, setSort] = useState({ field: 'visitDate', direction: 'desc' });

  const [visits, setVisits] = useState([]);
  const [totalVisitsCount, setTotalVisitsCount] = useState(0);
  const [visitsLoading, setVisitsLoading] = useState(false);
  const [visitsError, setVisitsError] = useState(null);

  const [availableFilters, setAvailableFilters] = useState(DEFAULT_AVAILABLE_FILTERS);

  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState(null);

  const [exporting, setExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState(null);

  const authHeaders = useMemo(() => {
    if (token) {
      return {
        Authorization: `Bearer ${token}`,
      };
    }
    return {};
  }, [token]);

  useEffect(() => {
    if (role === 'sales_rep' && user?.id) {
      const repId = String(user.id);
      if (!Array.isArray(filters.repIds) || filters.repIds.length !== 1 || filters.repIds[0] !== repId) {
        setFilters(prev => ({ ...prev, repIds: [repId] }));
      }
    }
  }, [filters.repIds, role, setFilters, user]);

  useEffect(() => {
    setPage(1);
  }, [filters.startDate, filters.endDate, filters.hcpId, filters.territory, JSON.stringify(filters.repIds), JSON.stringify(filters.statuses)]);

  const filtersQueryString = useMemo(() => buildQueryString(filters), [filters]);
  const visitsQueryString = useMemo(
    () =>
      buildQueryString(filters, {
        page,
        pageSize,
        sort,
      }),
    [filters, page, pageSize, sort]
  );

  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);
    setSummaryError(null);
    try {
      const response = await fetch(`/api/visits/summary?${filtersQueryString}`, {
        headers: authHeaders,
      });
      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }
      const payload = await response.json();
      setSummary(payload);
    } catch (error) {
      setSummaryError(error.message);
    } finally {
      setSummaryLoading(false);
    }
  }, [authHeaders, filtersQueryString]);

  const fetchVisits = useCallback(async () => {
    setVisitsLoading(true);
    setVisitsError(null);
    try {
      const response = await fetch(`/api/visits?${visitsQueryString}`, {
        headers: authHeaders,
      });
      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }
      const payload = await response.json();
      setVisits(Array.isArray(payload.data) ? payload.data : payload.visits || []);
      const totalFromPayload =
        payload?.meta?.total ?? payload?.pagination?.total ?? payload?.total ?? (Array.isArray(payload.data) ? payload.data.length : 0);
      setTotalVisitsCount(totalFromPayload);

      const filterOptions =
        payload?.meta?.availableFilters ||
        payload?.availableFilters ||
        payload?.filters ||
        {};
      setAvailableFilters(prev => ({
        reps: filterOptions.reps ?? prev.reps ?? DEFAULT_AVAILABLE_FILTERS.reps,
        hcps: filterOptions.hcps ?? prev.hcps ?? DEFAULT_AVAILABLE_FILTERS.hcps,
        statuses: filterOptions.statuses ?? prev.statuses ?? DEFAULT_AVAILABLE_FILTERS.statuses,
        territories: filterOptions.territories ?? prev.territories ?? DEFAULT_AVAILABLE_FILTERS.territories,
      }));
    } catch (error) {
      setVisitsError(error.message);
      setVisits([]);
      setTotalVisitsCount(0);
    } finally {
      setVisitsLoading(false);
    }
  }, [authHeaders, visitsQueryString]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    fetchVisits();
  }, [fetchVisits]);

  const handleSortChange = useCallback(
    columnKey => {
      setSort(prev => {
        if (prev.field === columnKey) {
          return {
            field: columnKey,
            direction: prev.direction === 'asc' ? 'desc' : 'asc',
          };
        }
        return {
          field: columnKey,
          direction: 'asc',
        };
      });
    },
    []
  );

  const handlePageChange = useCallback(newPage => {
    setPage(newPage);
  }, []);

  const handlePageSizeChange = useCallback(size => {
    setPageSize(size);
    setPage(1);
  }, []);

  const appliedFilters = useMemo(
    () => mapFiltersToDisplay(filters, availableFilters),
    [availableFilters, filters]
  );

  const handleExport = useCallback(async () => {
    setExportMessage(null);
    setExporting(true);
    try {
      const response = await fetch(`/api/visits/export?${buildQueryString(filters, { sort })}`, {
        headers: authHeaders,
      });
      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const filename = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || `visits-export-${Date.now()}.csv`;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setExportMessage({ type: 'success', text: 'Export started. Your download should begin shortly.' });
    } catch (error) {
      setExportMessage({ type: 'error', text: error.message });
    } finally {
      setExporting(false);
    }
  }, [authHeaders, filters, sort]);

  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);

  return (
    <div style={{ padding: '24px', fontFamily: 'Arial, sans-serif', color: '#1f2933' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '28px' }}>Visits Dashboard</h1>
          <p style={{ margin: '4px 0 0', color: '#52606d' }}>
            {role ? `Signed in as ${role.replace('_', ' ')}${user?.name ? ` • ${user.name}` : ''}` : user?.name || ''}
          </p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          style={{
            backgroundColor: '#ef4e4e',
            border: 'none',
            color: '#fff',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Sign out
        </button>
      </header>

      <VisitsFilters
        availableFilters={availableFilters}
        isLoading={visitsLoading && visits.length === 0}
      />

      <VisitsSummaryCards summary={summary} isLoading={summaryLoading} error={summaryError} />

      {exportMessage && (
        <div
          style={{
            marginBottom: '12px',
            padding: '12px 16px',
            borderRadius: '4px',
            backgroundColor: exportMessage.type === 'error' ? '#fde8e8' : '#def7ec',
            color: exportMessage.type === 'error' ? '#b83232' : '#046c4e',
          }}
        >
          {exportMessage.text}
        </div>
      )}

      <VisitsTable
        visits={visits}
        isLoading={visitsLoading}
        error={visitsError}
        page={page}
        pageSize={pageSize}
        total={totalVisitsCount}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        sort={sort}
        onSortChange={handleSortChange}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        appliedFilters={appliedFilters}
        onExport={handleExport}
        exporting={exporting}
      />
    </div>
  );
};

export default VisitsDashboard;

