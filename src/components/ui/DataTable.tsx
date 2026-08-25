import type { ReactNode } from 'react';
import Skeleton from './Skeleton';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  /** Fraction for the desktop grid-template-columns, e.g. '1.1fr'. */
  width?: string;
  align?: 'left' | 'right';
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  loadingRows?: number;
  empty?: ReactNode;
  /** Renders one row as a mobile Card below `lg`. */
  mobileCard: (row: T) => ReactNode;
}

/**
 * The responsive table primitive: a real `<table>` at `lg+` (inside a
 * rounded-panel shell with its own overflow-x-auto wrapper so the page
 * never scrolls horizontally), and a stacked Card list below `lg` via the
 * `mobileCard` render prop. Used by orders, products, offers, low stock.
 */
const DataTable = <T,>({ columns, rows, rowKey, onRowClick, loading, loadingRows = 5, empty, mobileCard }: DataTableProps<T>) => {
  if (loading) {
    return (
      <div className="space-y-2.5">
        {Array.from({ length: loadingRows }).map((_, i) => (
          <Skeleton key={i} preset="row" />
        ))}
      </div>
    );
  }

  if (rows.length === 0 && empty) {
    return <>{empty}</>;
  }

  const gridTemplate = columns.map((c) => c.width ?? '1fr').join(' ');

  return (
    <>
      {/* Mobile: card list */}
      <div className="space-y-3 lg:hidden">
        {rows.map((row, i) => (
          <div
            key={rowKey(row)}
            onClick={() => onRowClick?.(row)}
            className={`animate-up ${onRowClick ? 'cursor-pointer' : ''}`}
            style={{ animationDelay: `${Math.min(i, 10) * 40}ms` }}
          >
            {mobileCard(row)}
          </div>
        ))}
      </div>

      {/* Desktop: real table */}
      <div className="hidden overflow-hidden rounded-panel border border-line lg:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-soft2" style={{ display: 'grid', gridTemplateColumns: gridTemplate }}>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    scope="col"
                    className={`px-6 py-3.5 font-mono text-[10.5px] font-extrabold text-muted ${col.align === 'right' ? 'text-right' : ''}`}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={rowKey(row)}
                  onClick={() => onRowClick?.(row)}
                  className={`border-t border-line t-fast hover:bg-soft2 ${onRowClick ? 'cursor-pointer' : ''}`}
                  style={{ display: 'grid', gridTemplateColumns: gridTemplate }}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={`px-6 py-4 text-[12.5px] ${col.align === 'right' ? 'text-right' : ''}`}>
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default DataTable;
