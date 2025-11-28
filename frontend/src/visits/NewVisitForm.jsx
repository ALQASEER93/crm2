import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { apiFetch } from '../api/client';

const PURPOSE_OPTIONS = [
  { value: 'promotion', label: 'Promotion' },
  { value: 'order_followup', label: 'Order / Follow-up' },
  { value: 'collection', label: 'Collection' },
  { value: 'problem_solving', label: 'Problem solving' },
  { value: 'training', label: 'Training' },
  { value: 'other', label: 'Other' },
];

const CHANNEL_OPTIONS = [
  { value: 'in_person', label: 'In person' },
  { value: 'phone', label: 'Phone' },
  { value: 'online', label: 'Online' },
];

const STATUS_OPTIONS = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const PRODUCT_TEMPLATES = [
  'Irongene',
  'Maxigene Serum C',
  'Whitening',
  'Procystor',
  'Proctonor',
  'Debogene 15',
  'Debogene 50',
  'Intimate wash',
  'Thermoboost',
  'Benuro',
];

const modalBackdropStyle = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(15,23,42,0.45)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 50,
};

const modalStyle = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  maxWidth: '960px',
  width: '100%',
  maxHeight: '90vh',
  overflowY: 'auto',
  boxShadow: '0 10px 40px rgba(15,23,42,0.35)',
  padding: '24px',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
};

const sectionStyle = {
  borderRadius: '8px',
  border: '1px solid #e5e7eb',
  padding: '16px',
  marginBottom: '8px',
};

const fieldGroupStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: '12px',
};

const labelStyle = {
  fontSize: '13px',
  fontWeight: 600,
  color: '#4b5563',
  display: 'block',
  marginBottom: '4px',
};

const inputStyle = {
  width: '100%',
  padding: '6px 8px',
  borderRadius: '4px',
  border: '1px solid #d1d5db',
  fontSize: '13px',
};

const textareaStyle = {
  ...inputStyle,
  minHeight: '70px',
};

const buttonPrimary = {
  padding: '8px 14px',
  borderRadius: '4px',
  border: '1px solid #2563eb',
  backgroundColor: '#2563eb',
  color: '#fff',
  fontWeight: 600,
  cursor: 'pointer',
};

const buttonSecondary = {
  padding: '8px 14px',
  borderRadius: '4px',
  border: '1px solid #d1d5db',
  backgroundColor: '#fff',
  color: '#374151',
  cursor: 'pointer',
};

const NewVisitForm = ({ token, onClose, onCreated }) => {
  const { user } = useAuth();
  const userRole = user?.role?.slug;
  const canUseTimer = ['sales_rep', 'medical-sales-rep', 'salesman'].includes(userRole);

  const [accountType, setAccountType] = useState('hcp');
  const [accountId, setAccountId] = useState('');
  const [hcpOptions, setHcpOptions] = useState([]);
  const [pharmacyOptions, setPharmacyOptions] = useState([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [visitDate, setVisitDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [visitPurpose, setVisitPurpose] = useState('promotion');
  const [visitChannel, setVisitChannel] = useState('in_person');
  const [status, setStatus] = useState('completed');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [products, setProducts] = useState([]);
  const [notes, setNotes] = useState('');
  const [commitmentText, setCommitmentText] = useState('');
  const [nextVisitDate, setNextVisitDate] = useState('');
  const [orderValueJOD, setOrderValueJOD] = useState('');
  const [rating, setRating] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [startLocation, setStartLocation] = useState(null);
  const [endLocation, setEndLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);

  const captureLocation = type => {
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported in this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      pos => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        };

        if (type === 'start') {
          setStartLocation(coords);
        } else if (type === 'end') {
          setEndLocation(coords);
        }
      },
      err => {
        setLocationError(err.message || 'Unable to capture location.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  };
  const [timerStart, setTimerStart] = useState(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const loadAccounts = useCallback(async () => {
    if (!token) return;
    setAccountsLoading(true);
    try {
      const [hcpsRes, pharmaciesRes] = await Promise.all([
        apiFetch('/api/hcps?page=1&pageSize=500', { token }),
        apiFetch('/api/pharmacies?page=1&pageSize=500', { token }),
      ]);
      const hcps = Array.isArray(hcpsRes.data?.data) ? hcpsRes.data.data : [];
      const pharmacies = Array.isArray(pharmaciesRes.data?.data) ? pharmaciesRes.data.data : [];
      setHcpOptions(hcps);
      setPharmacyOptions(pharmacies);
    } catch (err) {
      setError(err.message);
    } finally {
      setAccountsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const currentAccountOptions = useMemo(
    () => (accountType === 'hcp' ? hcpOptions : pharmacyOptions),
    [accountType, hcpOptions, pharmacyOptions],
  );

  const handleAddProduct = () => {
    setProducts(prev => [
      ...prev,
      { name: '', quantity: '', unit: '', notes: '' },
    ]);
  };

  const handleProductChange = (index, field, value) => {
    setProducts(prev =>
      prev.map((product, i) =>
        i === index ? { ...product, [field]: value } : product,
      ),
    );
  };

  const handleRemoveProduct = index => {
    setProducts(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async event => {
    event.preventDefault();
    if (!token) return;

    setSubmitting(true);
    setError(null);

    const numericDuration = Number.parseInt(durationMinutes, 10);
    const numericOrderValue = orderValueJOD === '' ? null : Number(orderValueJOD);
    const numericRating = rating === '' ? null : Number.parseInt(rating, 10);

    const cleanProducts = products
      .map(product => ({
        name: product.name?.trim() || '',
        quantity: product.quantity === '' ? null : Number(product.quantity),
        unit: product.unit?.trim() || null,
        notes: product.notes?.trim() || null,
      }))
      .filter(product => product.name || product.quantity != null || product.unit || product.notes);

    const body = {
      visitDate,
      accountType,
      accountId: accountId ? Number(accountId) : null,
      visitPurpose,
      visitChannel,
      status,
      durationMinutes: Number.isNaN(numericDuration) ? 0 : numericDuration,
      products: cleanProducts.length ? cleanProducts : [],
      notes: notes.trim() || null,
      commitmentText: commitmentText.trim() || null,
      nextVisitDate: nextVisitDate || null,
      orderValueJOD: numericOrderValue,
      rating: numericRating,
      startLocation: startLocation
        ? {
            lat: startLocation.lat,
            lng: startLocation.lng,
            accuracy: startLocation.accuracy,
          }
        : null,
      endLocation: endLocation
        ? {
            lat: endLocation.lat,
            lng: endLocation.lng,
            accuracy: endLocation.accuracy,
          }
        : null,
    };

    try {
      await apiFetch('/api/visits', {
        method: 'POST',
        token,
        body,
      });
      if (onCreated) {
        onCreated();
      }
      onClose();
    } catch (err) {
      const apiMessage =
        (err?.payload && err.payload.message) ||
        err?.message ||
        'Unable to save visit.';
      const details =
        Array.isArray(err?.payload?.errors) && err.payload.errors.length
          ? ` (${err.payload.errors[0]})`
          : '';
      setError(`${apiMessage}${details}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={modalBackdropStyle} role="dialog" aria-modal="true">
      <div style={modalStyle}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px' }}>New visit</h2>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280' }}>
              Log a real visit linked to an HCP or pharmacy.
            </p>
          </div>
          <button type="button" style={buttonSecondary} onClick={onClose} disabled={submitting}>
            Cancel
          </button>
        </header>

        {error && (
          <div
            style={{
              marginTop: '8px',
              padding: '8px 12px',
              borderRadius: '6px',
              backgroundColor: '#fef2f2',
              color: '#b91c1c',
              fontSize: '13px',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <section style={sectionStyle}>
            <h3 style={{ margin: '0 0 8px', fontSize: '15px' }}>Account</h3>
            <div style={fieldGroupStyle}>
              <div>
                <label style={labelStyle} htmlFor="accountType">
                  Account type
                </label>
                <select
                  id="accountType"
                  style={inputStyle}
                  value={accountType}
                  onChange={event => {
                    setAccountType(event.target.value);
                    setAccountId('');
                  }}
                >
                  <option value="hcp">HCP (doctor / clinic)</option>
                  <option value="pharmacy">Pharmacy</option>
                </select>
              </div>
              <div>
                <label style={labelStyle} htmlFor="accountId">
                  Account
                </label>
                <select
                  id="accountId"
                  style={inputStyle}
                  value={accountId}
                  onChange={event => setAccountId(event.target.value)}
                  disabled={accountsLoading}
                >
                  <option value="">Select account</option>
                  {currentAccountOptions.map(account => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                      {account.specialty ? ` — ${account.specialty}` : ''}
                      {account.areaTag ? ` — ${account.areaTag}` : account.area ? ` — ${account.area}` : ''}
                      {account.city ? ` — ${account.city}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section style={sectionStyle}>
            <h3 style={{ margin: '0 0 8px', fontSize: '15px' }}>Visit details</h3>
            <div style={fieldGroupStyle}>
              <div>
                <label style={labelStyle} htmlFor="visitDate">
                  Visit date
                </label>
                <input
                  id="visitDate"
                  type="date"
                  style={inputStyle}
                  value={visitDate}
                  onChange={event => setVisitDate(event.target.value)}
                />
              </div>
              <div>
                <label style={labelStyle} htmlFor="visitPurpose">
                  Purpose
                </label>
                <select
                  id="visitPurpose"
                  style={inputStyle}
                  value={visitPurpose}
                  onChange={event => setVisitPurpose(event.target.value)}
                >
                  {PURPOSE_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle} htmlFor="visitChannel">
                  Channel
                </label>
                <select
                  id="visitChannel"
                  style={inputStyle}
                  value={visitChannel}
                  onChange={event => setVisitChannel(event.target.value)}
                >
                  {CHANNEL_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle} htmlFor="status">
                  Status
                </label>
                <select
                  id="status"
                  style={inputStyle}
                  value={status}
                  onChange={event => setStatus(event.target.value)}
                >
                  {STATUS_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle} htmlFor="durationMinutes">
                  Duration (minutes)
                </label>
                <input
                  id="durationMinutes"
                  type="number"
                  min="0"
                  style={inputStyle}
                  value={durationMinutes}
                  onChange={event => setDurationMinutes(event.target.value)}
                />
              </div>
              {canUseTimer && (
                <div>
                  <label style={labelStyle}>
                    Visit timer
                  </label>
                  {!isTimerRunning ? (
                    <button
                      type="button"
                      style={buttonSecondary}
                      onClick={() => {
                        setTimerStart(new Date());
                        setIsTimerRunning(true);
                        captureLocation('start');
                      }}
                      disabled={submitting}
                    >
                      Start visit
                    </button>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>Visit in progress…</span>
                      <button
                        type="button"
                        style={buttonSecondary}
                        onClick={() => {
                          if (!timerStart) {
                            setIsTimerRunning(false);
                            return;
                          }
                          const diffMs = Date.now() - timerStart.getTime();
                          let minutes = Math.round(diffMs / 60000);
                          if (minutes < 1) minutes = 1;
                          setDurationMinutes(String(minutes));
                          setIsTimerRunning(false);
                          setTimerStart(null);
                          captureLocation('end');
                        }}
                        disabled={submitting}
                      >
                        End visit
                      </button>
                    </div>
                  )}
                </div>
              )}
              {startLocation && (
                <div style={{ fontSize: '12px', color: '#047857' }}>Start location captured ✓</div>
              )}
              {endLocation && (
                <div style={{ fontSize: '12px', color: '#047857' }}>End location captured ✓</div>
              )}
              {locationError && (
                <div style={{ fontSize: '12px', color: '#b91c1c' }}>{locationError}</div>
              )}
            </div>
          </section>

          <section style={sectionStyle}>
            <h3 style={{ margin: '0 0 8px', fontSize: '15px' }}>Products</h3>
            {products.length === 0 && (
              <p style={{ fontSize: '13px', color: '#6b7280' }}>No products added for this visit yet.</p>
            )}
            {products.map((product, index) => (
              <div
                key={index}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(160px, 1.5fr) repeat(3, minmax(100px, 1fr)) auto',
                  gap: '8px',
                  marginBottom: '8px',
                  alignItems: 'center',
                }}
              >
                <select
                  style={inputStyle}
                  value={product.name}
                  onChange={event => handleProductChange(index, 'name', event.target.value)}
                >
                  <option value="">Product name</option>
                  {PRODUCT_TEMPLATES.map(name => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="0"
                  placeholder="Qty"
                  style={inputStyle}
                  value={product.quantity}
                  onChange={event => handleProductChange(index, 'quantity', event.target.value)}
                />
                <input
                  type="text"
                  placeholder="Unit"
                  style={inputStyle}
                  value={product.unit}
                  onChange={event => handleProductChange(index, 'unit', event.target.value)}
                />
                <input
                  type="text"
                  placeholder="Notes"
                  style={inputStyle}
                  value={product.notes}
                  onChange={event => handleProductChange(index, 'notes', event.target.value)}
                />
                <button
                  type="button"
                  style={{ ...buttonSecondary, padding: '4px 8px' }}
                  onClick={() => handleRemoveProduct(index)}
                >
                  Remove
                </button>
              </div>
            ))}
            <button type="button" style={{ ...buttonSecondary, marginTop: '4px' }} onClick={handleAddProduct}>
              Add product
            </button>
          </section>

          <section style={sectionStyle}>
            <h3 style={{ margin: '0 0 8px', fontSize: '15px' }}>Outcome</h3>
            <div style={fieldGroupStyle}>
              <div>
                <label style={labelStyle} htmlFor="orderValueJOD">
                  Order value (JOD)
                </label>
                <input
                  id="orderValueJOD"
                  type="number"
                  min="0"
                  step="0.01"
                  style={inputStyle}
                  value={orderValueJOD}
                  onChange={event => setOrderValueJOD(event.target.value)}
                />
              </div>
              <div>
                <label style={labelStyle} htmlFor="nextVisitDate">
                  Next visit date
                </label>
                <input
                  id="nextVisitDate"
                  type="date"
                  style={inputStyle}
                  value={nextVisitDate}
                  onChange={event => setNextVisitDate(event.target.value)}
                />
              </div>
              <div>
                <label style={labelStyle}>Rating</label>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  {[1, 2, 3, 4, 5].map(value => (
                    <label key={value} style={{ fontSize: '13px', color: '#4b5563' }}>
                      <input
                        type="radio"
                        name="rating"
                        value={value}
                        checked={String(rating) === String(value)}
                        onChange={event => setRating(event.target.value)}
                        style={{ marginRight: '4px' }}
                      />
                      {value}
                    </label>
                  ))}
                  <button
                    type="button"
                    style={{ ...buttonSecondary, padding: '4px 8px', fontSize: '11px' }}
                    onClick={() => setRating('')}
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
            <div style={{ marginTop: '8px' }}>
              <label style={labelStyle} htmlFor="commitmentText">
                Commitment / agreement
              </label>
              <textarea
                id="commitmentText"
                style={textareaStyle}
                value={commitmentText}
                onChange={event => setCommitmentText(event.target.value)}
              />
            </div>
          </section>

          <section style={sectionStyle}>
            <h3 style={{ margin: '0 0 8px', fontSize: '15px' }}>Notes</h3>
            <textarea
              style={textareaStyle}
              value={notes}
              onChange={event => setNotes(event.target.value)}
              placeholder="Any additional notes about this visit"
            />
          </section>

          <footer style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
            <button type="button" style={buttonSecondary} onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" style={buttonPrimary} disabled={submitting}>
              {submitting ? 'Saving…' : 'Save visit'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default NewVisitForm;
