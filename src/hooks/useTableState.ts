import { useCallback, useState } from "react";

import { DEFAULT_PAGE_SIZE } from "@/constants";

export interface TableState {
  page: number;
  pageSize: number;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  /** Call whenever a filter changes so the user is never left on an out-of-range page. */
  resetPage: () => void;
}

/** Shared paging state for every list screen, so paging behaves identically everywhere. */
export function useTableState(initialPageSize: number = DEFAULT_PAGE_SIZE): TableState {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState<number>(initialPageSize);

  const setPageSize = useCallback((next: number) => {
    setPageSizeState(next);
    setPage(1);
  }, []);

  const resetPage = useCallback(() => setPage(1), []);

  return { page, pageSize, setPage, setPageSize, resetPage };
}
