import React, { createContext, useContext, useMemo, useRef, useState } from 'react';

const VisitsFilterContext = createContext(undefined);

export const VisitsFilterProvider = ({ initialFilters, children }) => {
  const initialRef = useRef(initialFilters);
  const [filters, setFilters] = useState(initialFilters);

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
    };
  }, [filters]);

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

