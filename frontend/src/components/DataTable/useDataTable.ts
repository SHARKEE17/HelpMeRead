
import { useState, useMemo, useCallback } from 'react';
import { ColumnDef, SortConfig, SortDirection } from './types';

interface UseDataTableProps<T> {
    data: T[];
    columns: ColumnDef<T>[];
    pageSize?: number;
}

export function useDataTable<T>({ data, columns, pageSize = 10 }: UseDataTableProps<T>) {
    const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
    const [filterText, setFilterText] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedIds, setSelectedIds] = useState<Set<number | string>>(new Set());

    // 1. Filtering
    const filteredData = useMemo(() => {
        if (!filterText) return data;

        const lowerFilter = filterText.toLowerCase();

        return data.filter(row => {
            return columns.some(col => {
                const value = typeof col.accessor === 'function'
                    ? col.accessor(row)
                    : row[col.accessor];
                return String(value).toLowerCase().includes(lowerFilter);
            });
        });
    }, [data, filterText, columns]);

    // 2. Sorting
    const sortedData = useMemo(() => {
        if (!sortConfig || !sortConfig.direction) return filteredData;

        return [...filteredData].sort((a, b) => {
            const col = columns.find(c => (c.id || c.accessor) === sortConfig.key);
            if (!col) return 0;

            const aVal = typeof col.accessor === 'function' ? col.accessor(a) : a[col.accessor];
            const bVal = typeof col.accessor === 'function' ? col.accessor(b) : b[col.accessor];

            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filteredData, sortConfig, columns]);

    // 3. Pagination
    const totalPages = Math.ceil(sortedData.length / pageSize);
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return sortedData.slice(start, start + pageSize);
    }, [sortedData, currentPage, pageSize]);

    // Handlers
    const handleSort = (key: string) => {
        let direction: SortDirection = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            // Assume data has 'id' property. If not, user needs to implement logic.
            // Using index as fallback if no id.
            const newSelected = new Set(paginatedData.map((_, i) => i)); // Logic ideally needs unique ID
            setSelectedIds(newSelected);
        } else {
            setSelectedIds(new Set());
        }
    };

    const handleSelectRow = (id: number | string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    return {
        tableData: paginatedData,
        totalPages,
        currentPage,
        setCurrentPage,
        sortConfig,
        handleSort,
        filterText,
        setFilterText,
        selectedIds,
        handleSelectRow,
        handleSelectAll,
        totalItems: sortedData.length
    };
}
