/**
 * DataTable component - Generic table with consistent styling
 */

import { ReactNode } from 'react';

interface Column<T> {
    key: string;
    header: string;
    render: (item: T) => ReactNode;
    className?: string;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    keyExtractor: (item: T) => string;
    emptyMessage?: string;
    rowClassName?: (item: T) => string;
}

export function DataTable<T>({
    columns,
    data,
    keyExtractor,
    emptyMessage = 'No hay datos',
    rowClassName,
}: DataTableProps<T>) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600">
                    <tr>
                        {columns.map((col) => (
                            <th
                                key={col.key}
                                className={`px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 ${col.className || ''}`}
                            >
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y dark:divide-gray-700">
                    {data.length === 0 ? (
                        <tr>
                            <td
                                colSpan={columns.length}
                                className="text-center py-12 text-gray-500 dark:text-gray-400"
                            >
                                {emptyMessage}
                            </td>
                        </tr>
                    ) : (
                        data.map((item) => (
                            <tr
                                key={keyExtractor(item)}
                                className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 ${rowClassName?.(item) || ''}`}
                            >
                                {columns.map((col) => (
                                    <td key={col.key} className={`px-4 py-4 ${col.className || ''}`}>
                                        {col.render(item)}
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
