import VisitsDashboard from '../visits/VisitsDashboard';
import { VisitsFilterProvider } from '../visits/VisitsFilterContext';
import VisitsErrorBoundary from '../visits/VisitsErrorBoundary';

const DEFAULT_FILTERS = {
  startDate: '',
  endDate: '',
  repIds: [],
  hcpId: '',
  statuses: [],
  territoryId: '',
};

const VisitsPage = () => {
  return (
    <VisitsFilterProvider initialFilters={{ ...DEFAULT_FILTERS }}>
      <VisitsErrorBoundary>
        <VisitsDashboard />
      </VisitsErrorBoundary>
    </VisitsFilterProvider>
  );
};

export default VisitsPage;
