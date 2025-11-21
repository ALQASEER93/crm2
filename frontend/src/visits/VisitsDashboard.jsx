import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { apiFetch } from '../api/client';
import { DEFAULT_AVAILABLE_FILTERS, useVisitsFilters } from './VisitsFilterContext';
import VisitsFilters from './VisitsFilters';
import VisitsSummaryCards from './VisitsSummaryCards';
import VisitsTable from './VisitsTable';
import NewVisitForm from './NewVisitForm';

const PAGE_SIZE_OPTIONS = [25, 50, 100];
const DEFAULT_PAGE_SIZE = PAGE_SIZE_OPTIONS[0];
const FILTER_COLLECTION_LIMIT = 500;

const extractCollection = payload => {
  if (!payload) {
    return [];
  }

  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload.data)) {
    return payload.data;
  }

  if (Array.isArray(payload.rows)) {
    return payload.rows;
  }

  if (Array.isArray(payload.items)) {
    return payload.items;
  }

  return [];
};

const buildQueryString = (filters, options = {}) => {
  const params = new URLSearchParams();
  if (filters.startDate) {
    params.append('dateFrom', filters.startDate);
  }
  if (filters.endDate) {
    params.append('dateTo', filters.endDate);
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
  if (filters.territoryId) {
    params.append('territoryId', filters.territoryId);
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

const mapFiltersToDisplay = (filters, availableFilters) => {
  const appliedFilters = [];

  if (filters.startDate || filters.endDate) {
    const start = filters.startDate ? filters.startDate : 'Any';
    const end = filters.endDate ? filters.endDate : 'Any';
    appliedFilters.push(`Date: ${start} – ${end}`);
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

  if (filters.territoryId) {
    const territoryName =
      availableFilters.territories.find(territory => String(territory.id) === String(filters.territoryId))?.name ||
      filters.territoryId;
    appliedFilters.push(`Territory: ${territoryName}`);
  }

  if (appliedFilters.length === 0) {
    appliedFilters.push('None');
  }

  return appliedFilters;
};

const VisitsDashboard = () => {
  const { user, token } = useAuth();
  const userRole = user?.role?.slug;
  const { filters, availableFilters, setAvailableFilters } = useVisitsFilters();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [sort, setSort] = useState({ field: 'visitDate', direction: 'desc' });

  const [visits, setVisits] = useState([]);
  const [totalVisitsCount, setTotalVisitsCount] = useState(0);
  const [visitsLoading, setVisitsLoading] = useState(false);
  const [visitsError, setVisitsError] = useState(null);

  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState(null);

  const [exporting, setExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState(null);

  const [referenceLoading, setReferenceLoading] = useState(false);
  const [referenceError, setReferenceError] = useState(null);

  const [showNewVisit, setShowNewVisit] = useState(false);

  const mergeAvailableFilters = useCallback(
    (options = {}) => {
      if (!options || typeof options !== 'object') {
        return;
      }

      setAvailableFilters(prev => ({
        reps: options.reps ?? prev.reps ?? DEFAULT_AVAILABLE_FILTERS.reps,
        hcps: options.hcps ?? prev.hcps ?? DEFAULT_AVAILABLE_FILTERS.hcps,
        statuses: options.statuses ?? prev.statuses ?? DEFAULT_AVAILABLE_FILTERS.statuses,
        territories: options.territories ?? prev.territories ?? DEFAULT_AVAILABLE_FILTERS.territories,
      }));
    },
    [setAvailableFilters],
  );

  useEffect(() => {
    setPage(1);
  }, [
    filters.startDate,
    filters.endDate,
    filters.hcpId,
    filters.territoryId,
    JSON.stringify(filters.repIds),
    JSON.stringify(filters.statuses),
  ]);

  const filtersQueryString = useMemo(() => buildQueryString(filters), [filters]);
  const visitsQueryString = useMemo(
    () =>
      buildQueryString(filters, {
        page,
        pageSize,
        sort,
      }),
    [filters, page, pageSize, sort],
  );

  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);
    setSummaryError(null);

    if (!token) {
      setSummary(null);
      setSummaryLoading(false);
      return;
    }

    try {
      const { data: payload } = await apiFetch(`/api/visits/summary?${filtersQueryString}`, {
        token,
      });
      setSummary(payload?.data ?? payload);
    } catch (error) {
      setSummaryError(error.message);
    } finally {
      setSummaryLoading(false);
    }
  }, [filtersQueryString, token]);

  const fetchVisits = useCallback(async () => {
    setVisitsLoading(true);
    setVisitsError(null);

    if (!token) {
      setVisits([]);
      setTotalVisitsCount(0);
      setVisitsLoading(false);
      return;
    }

    try {
      const { data: payload } = await apiFetch(`/api/visits?${visitsQueryString}`, {
        token,
      });
      const rows = Array.isArray(payload?.data) ? payload.data : payload?.visits || [];
      setVisits(rows);
      const totalFromPayload =
        payload?.meta?.total ??
        payload?.pagination?.total ??
        payload?.total ??
        (Array.isArray(payload?.data) ? payload.data.length : 0);
      setTotalVisitsCount(totalFromPayload);

      const filterOptions =
        payload?.meta?.availableFilters || payload?.availableFilters || payload?.filters || null;
      if (filterOptions) {
        mergeAvailableFilters(filterOptions);
      }
    } catch (error) {
      setVisitsError(error.message);
      setVisits([]);
      setTotalVisitsCount(0);
    } finally {
      setVisitsLoading(false);
    }
  }, [mergeAvailableFilters, token, visitsQueryString]);

  const fetchReferenceData = useCallback(async () => {
    if (!token) {
      mergeAvailableFilters(DEFAULT_AVAILABLE_FILTERS);
      setReferenceLoading(false);
      setReferenceError(null);
      return;
    }

    setReferenceLoading(true);
    setReferenceError(null);

    try {
      const endpoints = [
        { key: 'reps', path: `/api/sales-reps?page=1&pageSize=${FILTER_COLLECTION_LIMIT}` },
        { key: 'hcps', path: `/api/hcps?page=1&pageSize=${FILTER_COLLECTION_LIMIT}` },
        { key: 'territories', path: `/api/territories?page=1&pageSize=${FILTER_COLLECTION_LIMIT}` },
      ];

      const responses = await Promise.allSettled(
        endpoints.map(endpoint => apiFetch(endpoint.path, { token })),
      );

      const nextOptions = {};
      let partialError = null;

      responses.forEach((result, index) => {
        const { key } = endpoints[index];
        if (result.status === 'fulfilled') {
          nextOptions[key] = extractCollection(result.value.data);
        } else if (!partialError) {
          const reason = result.reason;
          partialError =
            (reason && reason.message) || (typeof reason === 'string' ? reason : null) || 'Unable to load filter data.';
        }
      });

      if (Object.keys(nextOptions).length) {
        mergeAvailableFilters(nextOptions);
      }

      setReferenceError(partialError || null);
    } catch (error) {
      setReferenceError(error.message);
    } finally {
      setReferenceLoading(false);
    }
  }, [mergeAvailableFilters, token]);

  useEffect(() => {
    fetchReferenceData();
  }, [fetchReferenceData]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    fetchVisits();
  }, [fetchVisits]);

  const handleSortChange = useCallback(columnKey => {
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
  }, []);

  const handlePageChange = useCallback(newPage => {
    setPage(newPage);
  }, []);

  const handlePageSizeChange = useCallback(size => {
    setPageSize(size);
    setPage(1);
  }, []);

  const appliedFilters = useMemo(
    () => mapFiltersToDisplay(filters, availableFilters),
    [availableFilters, filters],
  );

  const handleExport = useCallback(async () => {
    setExportMessage(null);
    setExporting(true);

    try {
      const { data: blob, response } = await apiFetch(
        `/api/visits/export?${buildQueryString(filters, { sort })}`,
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
        `visits-export-${Date.now()}.csv`;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setExportMessage({ type: 'success', text: 'Export started. Your download should begin shortly.' });
    } catch (error) {
      setExportMessage({ type: 'error', text: error.message || 'Failed to export visits.' });
    } finally {
      setExporting(false);
    }
  }, [filters, sort, token]);

  const handleVisitCreated = useCallback(() => {
    fetchVisits();
    fetchSummary();
  }, [fetchVisits, fetchSummary]);

  const canCreateVisit = ['sales_rep', 'medical-sales-rep', 'salesman'].includes(userRole);

  return (
    <div style={{ padding: '24px', fontFamily: 'Arial, sans-serif', color: '#1f2933' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '28px' }}>Visits Dashboard</h1>
          <p style={{ margin: '4px 0 0', color: '#52606d' }}>
            {user?.role?.slug
              ? `Signed in as ${user.role.slug.replace('_', ' ')}${user?.name ? ` · ${user.name}` : ''}`
              : user?.name || ''}
          </p>
        </div>
        {canCreateVisit && (
          <button
            type="button"
            onClick={() => setShowNewVisit(true)}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid #2563eb',
              backgroundColor: '#2563eb',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            New visit
          </button>
        )}
      </header>

      <VisitsFilters
        isLoading={visitsLoading && visits.length === 0}
        referenceLoading={referenceLoading}
        referenceError={referenceError}
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
        onExport={userRole === 'sales_manager' ? handleExport : null}
        exporting={exporting}
      />

      {showNewVisit && (
        <NewVisitForm
          token={token}
          onClose={() => setShowNewVisit(false)}
          onCreated={handleVisitCreated}
        />
      )}
    </div>
  );
};

export default VisitsDashboard;
