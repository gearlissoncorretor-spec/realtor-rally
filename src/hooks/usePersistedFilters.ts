import { useState, useCallback, useEffect } from 'react';

interface UsePersistedFiltersOptions<T> {
  key: string;
  defaultValues: T;
}

export function usePersistedFilters<T extends Record<string, any>>({ key, defaultValues }: UsePersistedFiltersOptions<T>) {
  const storageKey = `filters_${key}`;

  const [filters, setFiltersState] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults to handle new fields
        return { ...defaultValues, ...parsed };
      }
    } catch {
      // ignore
    }
    return defaultValues;
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(filters));
    } catch {
      // ignore
    }
  }, [filters, storageKey]);

  const setFilter = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setFiltersState(prev => ({ ...prev, [field]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState(defaultValues);
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
  }, [defaultValues, storageKey]);

  const hasActiveFilters = Object.keys(defaultValues).some(
    k => JSON.stringify(filters[k]) !== JSON.stringify(defaultValues[k])
  );

  return { filters, setFilter, resetFilters, hasActiveFilters };
}
