import { useMemo } from 'react';

const COLUMN_CONFIG = [
  {
    key: 'visitDate',
    label: 'Visit Date',
    sortable: true,
    accessor: row => row.visitDate || row.date || row.startTime || null,
    formatter: value => (value ? new Date(value).toLocaleString() : '—'),
  },
  {
    key: 'account',
    label: 'Account',
    sortable: true,
    accessor: row => {
      if (row.account && typeof row.account === 'object') {
        const type = row.account.type === 'pharmacy' ? '[Pharmacy]' : '[HCP]';
        return `${type} ${row.account.name || ''}`.trim();
      }
      if (row.hcp && typeof row.hcp === 'object') {
        return `[HCP] ${row.hcp.name || ''}`.trim();
      }
      if (row.pharmacy && typeof row.pharmacy === 'object') {
        return `[Pharmacy] ${row.pharmacy.name || ''}`.trim();
      }
      return row.accountName || '—';
    },
    formatter: value => (value && typeof value !== 'object' ? value : '—'),
  },
  {
    key: 'representative',
    label: 'Representative',
    sortable: true,
    accessor: row => {
      if (row.rep && typeof row.rep === 'object') {
        return row.rep.name || row.rep.email || '—';
      }
      return row.repName || row.representative || row.repEmail || row.rep || '—';
    },
    formatter: value => (value && typeof value !== 'object' ? value : '—'),
  },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    accessor: row => row.status,
    formatter: value => (value ? value.replace(/_/g, ' ') : '—'),
  },
  {
    key: 'visitPurpose',
    label: 'Purpose',
    sortable: true,
    accessor: row => row.visitPurpose || row.purpose || null,
    formatter: value => {
      if (!value) return '—';
      return value
        .replace(/_/g, ' ')
        .replace(/\b\w/g, ch => ch.toUpperCase());
    },
  },
  {
    key: 'visitChannel',
    label: 'Channel',
    sortable: true,
    accessor: row => row.visitChannel || row.channel || null,
    formatter: value => {
      if (!value) return '—';
      if (value === 'in_person') return 'In person';
      return value.charAt(0).toUpperCase() + value.slice(1);
    },
  },
  {
    key: 'durationMinutes',
    label: 'Duration',
    sortable: true,
    accessor: row => row.durationMinutes ?? row.duration ?? row.visitDurationMinutes,
    formatter: value => (value != null ? `${value} min` : '—'),
  },
  {
    key: 'orderValueJOD',
    label: 'Order (JOD)',
    sortable: true,
    accessor: row => row.orderValueJOD ?? row.orderValue ?? null,
    formatter: value => {
      if (value == null || value === '') return '—';
      const num = Number(value);
      if (!Number.isFinite(num)) return '—';
      return `${num.toFixed(2)} JD`;
    },
  },
  {
    key: 'rating',
    label: 'Rating',
    sortable: true,
    accessor: row => row.rating ?? null,
    formatter: value => (value != null ? String(value) : '—'),
  },
];

const tableContainerStyle = {
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  border: '1px solid #d9e2ec',
  boxShadow: '0 1px 2px rgba(15, 23, 42, 0.08)',
  overflow: 'hidden',
};

const headerCellStyle = {
  textAlign: 'left',
  fontWeight: 600,
  fontSize: '14px',
  padding: '12px 16px',
  color: '#334155',
  borderBottom: '1px solid #d9e2ec',
  cursor: 'pointer',
  userSelect: 'none',
};

const bodyCellStyle = {
  padding: '12px 16px',
  borderBottom: '1px solid #f1f5f9',
  fontSize: '14px',
  color: '#1f2933',
};

const footerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '12px',
  padding: '12px 16px',
  backgroundColor: '#f7fafc',
};

const buttonStyle = {
  padding: '8px 12px',
  borderRadius: '4px',
  border: '1px solid #cbd2d9',
  backgroundColor: '#fff',
  cursor: 'pointer',
};

const VisitsTable = ({
  visits,
  isLoading,
  error,
  page,
  pageSize,
  total,
  pageSizeOptions,
  sort,
  onSortChange,
  onPageChange,
  onPageSizeChange,
  appliedFilters,
  onExport,
  exporting,
}) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const renderSortLabel = columnKey => {
    if (sort.field !== columnKey) {
      return '▲';
    }
    return sort.direction === 'asc' ? '▲' : '▼';
  };

  const handlePrevious = () => {
    if (page > 1) {
      onPageChange(page - 1);
    }
  };

  const handleNext = () => {
    if (page < totalPages) {
      onPageChange(page + 1);
    }
  };

  const rangeLabel = useMemo(() => {
    if (total === 0) {
      return 'No results';
    }
    const start = (page - 1) * pageSize + 1;
    const end = Math.min(total, start + pageSize - 1);
    return `Showing ${start}-${end} of ${total}`;
  }, [page, pageSize, total]);

  return (
    <section aria-label="Visits results" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: '20px', color: '#1f2933' }}>Visits</h2>
        {onExport && (
          <button
            type="button"
            onClick={onExport}
            disabled={exporting || isLoading}
            style={{
              ...buttonStyle,
              backgroundColor: exporting ? '#cbd2d9' : '#2563eb',
              border: '1px solid #2563eb',
              color: '#fff',
              fontWeight: 600,
            }}
          >
            {exporting ? 'Preparing export…' : 'Export CSV'}
          </button>
        )}
      </div>

      <div style={tableContainerStyle}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {COLUMN_CONFIG.map(column => (
                <th
                  key={column.key}
                  style={headerCellStyle}
                  onClick={column.sortable ? () => onSortChange(column.key) : undefined}
                >
                  <span>{column.label}</span>
                  {column.sortable && (
                    <span style={{ marginLeft: '8px', color: '#9aa5b1' }}>{renderSortLabel(column.key)}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={COLUMN_CONFIG.length} style={{ ...bodyCellStyle, textAlign: 'center', color: '#52606d' }}>
                  Loading visits…
                </td>
              </tr>
            )}
            {!isLoading && error && (
              <tr>
                <td colSpan={COLUMN_CONFIG.length} style={{ ...bodyCellStyle, textAlign: 'center', color: '#b83232' }}>
                  {error}
                </td>
              </tr>
            )}
            {!isLoading && !error && visits.length === 0 && (
              <tr>
                <td colSpan={COLUMN_CONFIG.length} style={{ ...bodyCellStyle, textAlign: 'center', color: '#52606d' }}>
                  No visits match the current filters.
                </td>
              </tr>
            )}
            {!isLoading &&
              !error &&
              visits.map(visit => (
                <tr key={visit.id || visit.visitId}>
                  {COLUMN_CONFIG.map(column => {
                    const rawValue = column.accessor ? column.accessor(visit) : visit[column.key];
                    const safeValue = rawValue && typeof rawValue === 'object' ? '—' : rawValue;
                    const displayValue = column.formatter ? column.formatter(safeValue) : safeValue ?? '—';
                    return (
                      <td key={column.key} style={bodyCellStyle}>
                        {displayValue}
                      </td>
                    );
                  })}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div style={footerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '14px', color: '#52606d' }}>Rows per page</span>
          <select
            value={pageSize}
            onChange={event => onPageSizeChange(Number(event.target.value))}
            style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd2d9' }}
          >
            {pageSizeOptions.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button type="button" onClick={handlePrevious} disabled={page <= 1} style={buttonStyle}>
            Previous
          </button>
          <span style={{ fontSize: '14px', color: '#52606d' }}>
            Page {page} of {totalPages}
          </span>
          <button type="button" onClick={handleNext} disabled={page >= totalPages} style={buttonStyle}>
            Next
          </button>
        </div>

        <div style={{ fontSize: '14px', color: '#52606d', flex: 1, textAlign: 'right' }}>{rangeLabel}</div>
      </div>

      <div
        style={{
          padding: '12px 16px',
          borderRadius: '8px',
          backgroundColor: '#f1f5f9',
          color: '#334155',
          fontSize: '13px',
        }}
      >
        <strong>Applied filters:</strong> {appliedFilters.join(' · ')}
      </div>
    </section>
  );
};

export default VisitsTable;

