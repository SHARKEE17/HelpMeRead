
export interface ColumnDef<T> {
    accessor: keyof T | ((row: T) => any);
    header: string;
    id?: string; // Optional if accessor is a string
    sortable?: boolean;
    filterable?: boolean;
    width?: string | number;
    cell?: (value: any, row: T) => React.ReactNode;
}

export interface DataTableProps<T> {
    data: T[];
    columns: ColumnDef<T>[];
    pageSize?: number;
    selectable?: boolean;
    onSelectionChange?: (selectedRows: T[]) => void;
    stickyHeader?: boolean;
    virtualize?: boolean; // If true, enables windowing (future enhancement)
    className?: string;
    loading?: boolean;
}

export type SortDirection = 'asc' | 'desc' | null;

export interface SortConfig {
    key: string;
    direction: SortDirection;
}
