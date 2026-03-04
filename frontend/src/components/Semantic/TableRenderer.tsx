import React from 'react';
import { Block } from '../../types/semantic';

interface TableRendererProps {
    block: Block;
}

export const TableRenderer: React.FC<TableRendererProps> = ({ block }) => {
    // Determine input type: simple generic array (legacy) or new TableData
    const content = block.content;
    const isStructured = !Array.isArray(content) && (content as any).rows;

    if (!content) return null;

    if (!isStructured) {
        // Fallback for legacy array of arrays (if any old data exists)
        // ... (existing helper logic or just return null to force re-process)
        return null;
    }

    const tableData = content as any; // Cast to TableData (we know it is)
    const { caption, columns, rows, raw_html } = tableData;

    // Complex tables (multi-level headers, colspan/rowspan): render preserved HTML directly.
    // This is the same approach used by AWS Textract, Azure Doc Intelligence, and Adobe PDF Extract —
    // complex table structure cannot be faithfully represented in a flat columns/rows model.
    if (raw_html) {
        return (
            <div className="overflow-x-auto my-8">
                {caption && (
                    <p className="text-sm text-gray-500 italic mb-3 text-center">{caption}</p>
                )}
                <div
                    className="reader-table-complex"
                    dangerouslySetInnerHTML={{ __html: raw_html }}
                />
            </div>
        );
    }

    // Helper: Check if string is numeric (for right alignment)
    const isNumeric = (str: string) => {
        if (!str) return false;
        const clean = str.trim().replace(/[%,$]/g, '');
        return !isNaN(parseFloat(clean)) && isFinite(Number(clean));
    };

    return (
        <div className="overflow-x-auto my-8">
            <table className="reader-table">
                {caption && <caption className="text-left text-sm text-gray-500 italic mb-2">{caption}</caption>}

                {columns && columns.length > 0 && (
                    <thead>
                        <tr>
                            {/* First column is usually the Label/Row Header */}
                            <th className="reader-th">
                                {columns[0]?.label || ''}
                            </th>
                            {/* Other columns */}
                            {columns.slice(1).map((col: any) => (
                                <th key={col.id} className="reader-th" style={{ textAlign: 'right' }}>
                                    {col.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                )}

                <tbody>
                    {rows.map((row: any) => (
                        <tr key={row.id}>
                            <td className="reader-td" style={{
                                paddingLeft: row.level > 0 ? `${row.level * 16 + 10}px` : '10px'
                            }}>
                                {row.label}
                            </td>
                            {row.values.map((val: string, idx: number) => (
                                <td key={idx} className="reader-td" style={{
                                    textAlign: isNumeric(val) ? 'right' : 'left'
                                }}>
                                    {val}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
