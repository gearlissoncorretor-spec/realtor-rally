import { useState, useMemo, useCallback } from 'react';

interface UsePaginationOptions {
  storageKey?: string;
  defaultPageSize?: number;
}

export function usePagination<T>(items: T[], options: UsePaginationOptions = {}) {
  const { storageKey, defaultPageSize = 25 } = options;

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(() => {
    if (storageKey) {
      try {
        const stored = localStorage.getItem(`pagination_${storageKey}`);
        if (stored) return Number(stored);
      } catch { /* ignore */ }
    }
    return defaultPageSize;
  });

  // Reset to page 1 when items change significantly
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, safePage, pageSize]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1);
    if (storageKey) {
      try { localStorage.setItem(`pagination_${storageKey}`, String(size)); } catch { /* ignore */ }
    }
  }, [storageKey]);

  // Reset page when items length changes (e.g., filter change)
  const resetPage = useCallback(() => setCurrentPage(1), []);

  return {
    paginatedItems,
    currentPage: safePage,
    pageSize,
    totalItems: items.length,
    totalPages,
    handlePageChange,
    handlePageSizeChange,
    resetPage,
  };
}
