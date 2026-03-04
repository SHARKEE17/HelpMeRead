
import React, { useId } from 'react';
import './DataTable.css';
import { useDataTable } from './useDataTable';
import { DataTableProps } from './types';

export function DataTable<T extends { id?: string | number }>({
    data,
    columns,
    pageSize = 10,
    selectable = false,
    loading = false
}: DataTableProps<T>) {

    const {
        tableData,
        totalPages,
        currentPage,
        setCurrentPage,
        sortConfig,
        handleSort,
        filterText,
        setFilterText,
        selectedIds,
        handleSelectRow,
        totalItems
    } = useDataTable({ data, columns, pageSize });

    const uuid = useId();

    if (loading) {
        return <div className="dt-container dt-status-row">Loading data...</div>;
    }

    if (!data || data.length === 0) {
        return <div className="dt-container dt-status-row">No data available</div>;
    }

    return (
        <div className="dt-container">
            {/* Toolbar */}
            <div className="dt-toolbar">
                <input
                    type="text"
                    className="dt-search"
                    placeholder="Search..."
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    aria-label="Search Table"
                />
                <div style={{ fontSize: '0.85rem', color: '#5f6368' }}>
                    {totalItems} items
                </div>
            </div>

            {/* Table */}
            <div className="dt-table-wrapper">
                <table className="dt-table" role="table">
                    <thead className="dt-thead">
                        <tr role="row">
                            {selectable && (
                                <th className="dt-th dt-cell-select" style={{ width: '40px' }}>
                                    <input type="checkbox" className="dt-checkbox" disabled />
                                </th>
                            )}
                            {columns.map((col, idx) => {
                                const key = (col.id || col.accessor) as string;
                                const isSorted = sortConfig?.key === key;
                                return (
                                    <th
                                        key={idx}
                                        className="dt-th"
                                        onClick={() => col.sortable && handleSort(key)}
                                        style={{ width: col.width, cursor: col.sortable ? 'pointer' : 'default' }}
                                        role="columnheader"
                                        aria-sort={isSorted ? (sortConfig?.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                                        tabIndex={0}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                col.sortable && handleSort(key);
                                            }
                                        }}
                                    >
                                        <div className="dt-th-content">
                                            {col.header}
                                            {col.sortable && (
                                                <span className="dt-sort-icon">
                                                    {isSorted ? (sortConfig?.direction === 'asc' ? '▲' : '▼') : '↕'}
                                                </span>
                                            )}
                                        </div>
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody className="dt-tbody">
                        {tableData.map((row, rIdx) => {
                            const rowId = row.id || rIdx;
                            const isSelected = selectedIds.has(rowId);
                            return (
                                <tr
                                    key={rowId}
                                    className="dt-row"
                                    role="row"
                                    aria-selected={isSelected}
                                >
                                    {selectable && (
                                        <td className="dt-cell dt-cell-select">
                                            <input
                                                type="checkbox"
                                                className="dt-checkbox"
                                                checked={isSelected}
                                                onChange={() => handleSelectRow(rowId)}
                                                aria-label={`Select row ${rowId}`}
                                            />
                                        </td>
                                    )}
                                    {columns.map((col, cIdx) => {
                                        const val = typeof col.accessor === 'function' ? col.accessor(row) : row[col.accessor];
                                        return (
                                            <td
                                                key={cIdx}
                                                className="dt-cell"
                                                data-label={col.header}
                                                role="cell"
                                            >
                                                {col.cell ? col.cell(val, row) : val}
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                        {tableData.length === 0 && (
                            <tr className="dt-row">
                                <td colSpan={columns.length + (selectable ? 1 : 0)} className="dt-status-row">
                                    No results found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="dt-pagination">
                <span>Page {currentPage} of {totalPages}</span>
                <button
                    className="dt-btn"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    aria-label="Previous Page"
                >
                    Prev
                </button>
                <button
                    className="dt-btn"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    aria-label="Next Page"
                >
                    Next
                </button>
            </div>
        </div>
    );
}
