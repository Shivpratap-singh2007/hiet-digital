import React from 'react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  renderMobileCard?: (item: T) => React.ReactNode;
  emptyState?: React.ReactNode;
  loading?: boolean;
  onRowClick?: (item: T) => void;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  renderMobileCard,
  emptyState,
  loading = false,
  onRowClick,
  className = ''
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-xs text-slate-500 shadow-2xs">
        <div className="inline-block w-6 h-6 border-2 border-slate-200 border-t-[#0f2942] rounded-full animate-spin mb-2" />
        <p>Loading records...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return <>{emptyState}</>;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Desktop Table View */}
      <div className="hidden md:block bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                {columns.map(col => (
                  <th key={col.key} className={`py-3 px-4 ${col.className || ''}`}>
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {data.map(item => {
                const rowKey = keyExtractor(item);
                return (
                  <tr
                    key={rowKey}
                    onClick={() => onRowClick && onRowClick(item)}
                    className={`transition-colors ${
                      onRowClick ? 'cursor-pointer hover:bg-slate-50/80' : 'hover:bg-slate-50/40'
                    }`}
                  >
                    {columns.map(col => (
                      <td key={col.key} className={`py-3.5 px-4 ${col.className || ''}`}>
                        {col.render ? col.render(item) : (item as any)[col.key]}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card / Stacked View */}
      <div className="block md:hidden space-y-2.5">
        {data.map(item => {
          const cardKey = keyExtractor(item);
          if (renderMobileCard) {
            return (
              <div key={cardKey} onClick={() => onRowClick && onRowClick(item)}>
                {renderMobileCard(item)}
              </div>
            );
          }

          return (
            <div
              key={cardKey}
              onClick={() => onRowClick && onRowClick(item)}
              className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-2 text-xs"
            >
              {columns.map(col => (
                <div key={col.key} className="flex items-center justify-between gap-2 border-b border-slate-50 pb-1.5 last:border-b-0 last:pb-0">
                  <span className="font-semibold text-slate-500 text-[11px] uppercase tracking-wider">
                    {col.header}
                  </span>
                  <div className="text-right text-slate-900 font-medium">
                    {col.render ? col.render(item) : (item as any)[col.key]}
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
