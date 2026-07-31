import { useCallback, useState } from "react";

/** Selection state shared by every table that offers bulk actions. */
export function useRowSelection() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggle = useCallback((id: string, checked: boolean) => {
    setSelectedIds((current) =>
      checked ? [...new Set([...current, id])] : current.filter((value) => value !== id),
    );
  }, []);

  const toggleAll = useCallback((ids: string[], checked: boolean) => {
    setSelectedIds((current) =>
      checked
        ? [...new Set([...current, ...ids])]
        : current.filter((value) => !ids.includes(value)),
    );
  }, []);

  const clear = useCallback(() => setSelectedIds([]), []);

  return { selectedIds, toggle, toggleAll, clear, count: selectedIds.length };
}
