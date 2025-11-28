import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { apiFetch } from '../api/client';
import DetailDrawer from '../components/DetailDrawer';
import './EntityListPage.css';

const PAGE_SIZE_OPTIONS = [10, 25, 50];
const DATA_PAGE_SIZE = 5000;

const HcpsPage = () => {
  const { token } = useAuth();
  const [allItems, setAllItems] = useState([]);
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [areaTagFilter, setAreaTagFilter] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('');
  const [segmentFilter, setSegmentFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  const distinctAreaTags = useMemo(() => {
    const values = new Set();
    allItems.forEach(item => {
      if (item.areaTag) {
        values.add(item.areaTag);
      }
    });
    return Array.from(values).sort();
  }, [allItems]);

  const distinctSpecialties = useMemo(() => {
    const values = new Set();
    allItems.forEach(item => {
      if (item.specialty) {
        values.add(item.specialty);
      }
    });
    return Array.from(values).sort();
  }, [allItems]);

  const distinctSegments = useMemo(() => {
    const values = new Set();
    allItems.forEach(item => {
      if (item.segment) {
        values.add(item.segment);
      }
    });
    return Array.from(values).sort();
  }, [allItems]);

  const fetchHcps = useCallback(async () => {
    if (!token) {
      setAllItems([]);
      setItems([]);
      setTotal(0);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: '1',
        pageSize: String(DATA_PAGE_SIZE),
      });
      if (search.trim()) {
        params.set('search', search.trim());
      }
      const { data } = await apiFetch(`/api/hcps?${params.toString()}`, { token });
      const rows = Array.isArray(data?.data) ? data.data : [];
      setAllItems(rows);
      setTotal(rows.length);
      setPage(1);
    } catch (err) {
      setError(err.message);
      setAllItems([]);
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [token, search]);

  useEffect(() => {
    fetchHcps();
  }, [fetchHcps]);

  useEffect(() => {
    const filtered = allItems.filter(item => {
      if (areaTagFilter && item.areaTag !== areaTagFilter) {
        return false;
      }
      if (specialtyFilter && item.specialty !== specialtyFilter) {
        return false;
      }
      if (segmentFilter && item.segment !== segmentFilter) {
        return false;
      }
      return true;
    });
    setItems(filtered);
    setTotal(filtered.length);
    setPage(1);
  }, [allItems, areaTagFilter, specialtyFilter, segmentFilter]);

  const pagedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return items.slice(start, end);
  }, [items, page, pageSize]);

  return (
    <div className="entity-page">
      <div className="entity-toolbar">
        <div>
          <h1 className="page-heading">Healthcare professionals</h1>
          <p className="page-subtitle">Manage key contacts and territories.</p>
        </div>
        <div className="entity-search">
          <input
            type="search"
            className="input"
            placeholder="Search by name or specialty"
            value={search}
            onChange={event => {
              setSearch(event.target.value);
            }}
          />
        </div>
      </div>

      <div className="entity-filters">
        <select
          className="input"
          value={areaTagFilter}
          onChange={event => setAreaTagFilter(event.target.value)}
        >
          <option value="">All area tags</option>
          {distinctAreaTags.map(value => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <select
          className="input"
          value={specialtyFilter}
          onChange={event => setSpecialtyFilter(event.target.value)}
        >
          <option value="">All specialties</option>
          {distinctSpecialties.map(value => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <select
          className="input"
          value={segmentFilter}
          onChange={event => setSegmentFilter(event.target.value)}
        >
          <option value="">All segments</option>
          {distinctSegments.map(value => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </div>

      <section className="table-card entity-table">
        {error && <div className="entity-empty">Unable to load HCPs: {error}</div>}
        {!error && loading && <div className="entity-empty">Loading HCPs…</div>}
        {!error && !loading && items.length === 0 && <div className="entity-empty">No HCPs found.</div>}
        {!error && !loading && items.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Specialty</th>
                <th>Area Tag</th>
                <th>Segment</th>
                <th>City</th>
                <th>Phone</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              {pagedItems.map(item => (
                <tr key={item.id} onClick={() => setSelected(item)}>
                  <td>{item.name}</td>
                  <td>{item.specialty || '—'}</td>
                  <td>{item.areaTag || '—'}</td>
                  <td>{item.segment || '—'}</td>
                  <td>{item.city || '—'}</td>
                  <td>{item.phone || '—'}</td>
                  <td>{item.email || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="entity-pagination">
          <span>
            Page {page} of {totalPages}
          </span>
          <div>
            Rows
            <select
              value={pageSize}
              onChange={event => {
                setPageSize(Number(event.target.value));
                setPage(1);
              }}
            >
              {PAGE_SIZE_OPTIONS.map(size => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
          <div>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setPage(prev => Math.max(1, prev - 1))}
              disabled={page === 1}
            >
              Prev
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
              disabled={page >= totalPages}
            >
              Next
            </button>
          </div>
        </div>
      </section>

      <DetailDrawer
        title={selected?.name || ''}
        isOpen={Boolean(selected)}
        onClose={() => setSelected(null)}
      >
        {selected && (
          <div className="detail-grid">
            <p>
              <strong>Specialty:</strong> {selected.specialty || '—'}
            </p>
            <p>
              <strong>Area Tag:</strong> {selected.areaTag || '—'}
            </p>
            <p>
              <strong>Segment:</strong> {selected.segment || '—'}
            </p>
            <p>
              <strong>City:</strong> {selected.city || '—'}
            </p>
            <p>
              <strong>Area:</strong> {selected.area || '—'}
            </p>
            <p>
              <strong>Phone:</strong> {selected.phone || '—'}
            </p>
            <p>
              <strong>Mobile:</strong> {selected.mobile || '—'}
            </p>
            <p>
              <strong>Email:</strong> {selected.email || '—'}
            </p>
          </div>
        )}
      </DetailDrawer>
    </div>
  );
};

export default HcpsPage;
