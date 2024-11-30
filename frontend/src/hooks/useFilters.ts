import { useState, useEffect } from 'react';
import { Filter, FilterCondition } from '../components/common/FilterBuilder';

interface UseFiltersProps {
  storageKey: string;
  onFilterApply?: (conditions: FilterCondition[]) => void;
}

export const useFilters = ({ storageKey, onFilterApply }: UseFiltersProps) => {
  const [savedFilters, setSavedFilters] = useState<Filter[]>([]);
  const [activeFilter, setActiveFilter] = useState<Filter | null>(null);

  // Load saved filters from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(`filters_${storageKey}`);
    if (stored) {
      setSavedFilters(JSON.parse(stored));
    }
  }, [storageKey]);

  // Save filters to localStorage
  const saveFilter = (filter: Filter) => {
    const newFilters = [...savedFilters, filter];
    setSavedFilters(newFilters);
    localStorage.setItem(`filters_${storageKey}`, JSON.stringify(newFilters));
  };

  // Load a specific filter
  const loadFilter = (filter: Filter) => {
    setActiveFilter(filter);
    if (onFilterApply) {
      onFilterApply(filter.conditions);
    }
  };

  // Delete a saved filter
  const deleteFilter = (filterId: string) => {
    const newFilters = savedFilters.filter((f) => f.id !== filterId);
    setSavedFilters(newFilters);
    localStorage.setItem(`filters_${storageKey}`, JSON.stringify(newFilters));
    if (activeFilter?.id === filterId) {
      setActiveFilter(null);
    }
  };

  // Apply filter conditions
  const applyFilter = (conditions: FilterCondition[]) => {
    if (onFilterApply) {
      onFilterApply(conditions);
    }
  };

  // Clear active filter
  const clearFilter = () => {
    setActiveFilter(null);
    if (onFilterApply) {
      onFilterApply([]);
    }
  };

  return {
    savedFilters,
    activeFilter,
    saveFilter,
    loadFilter,
    deleteFilter,
    applyFilter,
    clearFilter,
  };
};
