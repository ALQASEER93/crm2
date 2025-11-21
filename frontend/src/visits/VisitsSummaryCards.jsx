import PropTypes from 'prop-types';

const CARD_CONFIG = [
  {
    key: 'totalVisits',
    label: 'Total Visits',
    emphasisColor: '#3f83f8',
  },
  {
    key: 'completedVisits',
    label: 'Completed Visits',
    emphasisColor: '#0e9f6e',
  },
  {
    key: 'scheduledVisits',
    label: 'Scheduled Visits',
    emphasisColor: '#f6ad55',
  },
  {
    key: 'cancelledVisits',
    label: 'Cancelled Visits',
    emphasisColor: '#c53030',
  },
];

const getDeltaForCard = (summary, key) => {
  const deltaKey = `${key}Delta`;
  if (summary && typeof summary[deltaKey] === 'number') {
    return summary[deltaKey];
  }
  return undefined;
};

const formatValue = (value, formatter) => {
  if (formatter) {
    return formatter(value);
  }
  if (value == null) {
    return '—';
  }
  return value.toLocaleString();
};

const VisitsSummaryCards = ({ summary, isLoading, error }) => {
  if (error) {
    return (
      <div
        style={{
          marginBottom: '24px',
          padding: '16px',
          borderRadius: '8px',
          backgroundColor: '#fde8e8',
          color: '#b83232',
        }}
      >
        Unable to load summary metrics: {error}
      </div>
    );
  }

  return (
    <section
      aria-label="Visits summary metrics"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px',
      }}
    >
      {CARD_CONFIG.map(card => {
        const value = summary ? summary[card.key] : undefined;
        const delta = summary ? getDeltaForCard(summary, card.key) : undefined;
        const formatter = card.formatter;
        const displayValue = isLoading ? '…' : formatValue(value, formatter);
        const deltaDisplay =
          typeof delta === 'number'
            ? `${delta > 0 ? '+' : ''}${delta.toFixed(1)}% WoW`
            : summary?.weekOverWeek && typeof summary.weekOverWeek === 'object'
            ? summary.weekOverWeek[card.key]
            : undefined;

        return (
          <article
            key={card.key}
            style={{
              borderRadius: '8px',
              border: '1px solid #d9e2ec',
              padding: '16px',
              backgroundColor: '#ffffff',
              boxShadow: '0 1px 2px rgba(15, 23, 42, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <span style={{ color: '#52606d', fontSize: '14px', fontWeight: 600 }}>{card.label}</span>
            <strong style={{ fontSize: '28px', color: card.emphasisColor, minHeight: '36px' }}>{displayValue}</strong>
            <span style={{ color: '#9aa5b1', fontSize: '12px' }}>
              {isLoading
                ? 'Refreshing metrics…'
                : deltaDisplay || 'Week-over-week change pending'}
            </span>
          </article>
        );
      })}
    </section>
  );
};

export default VisitsSummaryCards;


