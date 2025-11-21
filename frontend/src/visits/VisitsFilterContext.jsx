import { createContext, useContext, useMemo, useRef, useState } from 'react';

export const DEFAULT_AVAILABLE_FILTERS = Object.freeze({
  reps: [],
  hcps: [],
  territories: [],
  statuses: ['scheduled', 'completed', 'cancelled'],
});

const VisitsFilterContext = createContext(undefined);

export const VisitsFilterProvider = ({ initialFilters, initialAvailableFilters = DEFAULT_AVAILABLE_FILTERS, children }) => {
  const initialRef = useRef(initialFilters);
  const [filters, setFilters] = useState(initialFilters);
  const [availableFilters, setAvailableFilters] = useState(initialAvailableFilters);

  const value = useMemo(() => {
    const updateFilter = (key, value) => {
      setFilters(prev => ({ ...prev, [key]: value }));
    };

    const resetFilters = () => {
      setFilters({ ...initialRef.current });
    };

    return {
      filters,
      setFilters,
      updateFilter,
      resetFilters,
      availableFilters,
      setAvailableFilters,
    };
  }, [filters, availableFilters]);

  return (
    <VisitsFilterContext.Provider value={value}>
      {children}
    </VisitsFilterContext.Provider>
  );
};

export const useVisitsFilters = () => {
  const context = useContext(VisitsFilterContext);
  if (!context) {
    throw new Error('useVisitsFilters must be used within a VisitsFilterProvider');
  }
  return context;
};
