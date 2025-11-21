import React from 'react';

class VisitsErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || 'Unexpected error while rendering visits.' };
  }

  componentDidCatch(error, info) {
    // Surface details in the console for debugging without breaking the UI.
    // eslint-disable-next-line no-console
    console.error('Error in Visits dashboard:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: '24px',
            margin: '16px 0',
            borderRadius: '8px',
            border: '1px solid #fecaca',
            backgroundColor: '#fef2f2',
            color: '#b91c1c',
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: '8px', fontSize: '18px' }}>Unable to load visits.</h2>
          <p style={{ margin: 0, fontSize: '14px' }}>
            {this.state.message || 'An unexpected error occurred while rendering the visits dashboard.'}
          </p>
        </div>
      );
    }

    // eslint-disable-next-line react/prop-types
    return this.props.children;
  }
}

export default VisitsErrorBoundary;

