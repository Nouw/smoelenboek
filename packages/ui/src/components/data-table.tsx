'use client';

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table';

import { cn } from '../lib/utils';

type DataTableColumnMeta = {
  cellClassName?: string;
  headerClassName?: string;
};

export type DataTableColumnDef<TData, TValue = unknown> = ColumnDef<
  TData,
  TValue
> & { meta?: DataTableColumnMeta };

export type DataTablePresentation = 'scroll' | 'stacked' | 'compact';

type DataTableProps<TData> = {
  caption: string;
  columns: DataTableColumnDef<TData>[];
  data: TData[];
  getRowId: (row: TData, index: number) => string;
  presentation: DataTablePresentation;
  className?: string;
  containerClassName?: string;
};

const presentationClasses: Record<
  DataTablePresentation,
  {
    container: string;
    table: string;
    head: string;
    headerRow: string;
    headerCell: string;
    body: string;
    row: string;
    cell: string;
  }
> = {
  scroll: {
    container: 'overflow-x-auto',
    table: 'w-full text-left text-sm',
    head: 'border-b text-xs text-muted-foreground',
    headerRow: '',
    headerCell: 'pb-3 font-medium',
    body: 'divide-y',
    row: '',
    cell: 'py-3',
  },
  stacked: {
    container: 'overflow-hidden rounded-xl border',
    table: 'block w-full text-left text-sm md:table',
    head: 'hidden bg-muted/40 text-xs font-medium uppercase text-muted-foreground md:table-header-group',
    headerRow: 'md:table-row',
    headerCell: 'px-4 py-3 font-medium',
    body: 'block md:table-row-group',
    row: 'grid gap-2 border-t px-4 py-4 first:border-t-0 md:table-row md:border-t',
    cell: 'block px-0 py-0 md:table-cell md:px-4 md:py-4',
  },
  compact: {
    container: '',
    table: 'w-full table-fixed text-left text-sm',
    head: 'sr-only',
    headerRow: '',
    headerCell: '',
    body: 'divide-y',
    row: '',
    cell: 'py-3',
  },
};

export function DataTable<TData>({
  caption,
  columns,
  data,
  getRowId,
  presentation,
  className,
  containerClassName,
}: DataTableProps<TData>) {
  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    getRowId,
  });
  const styles = presentationClasses[presentation];

  return (
    <div className={cn(styles.container, containerClassName)}>
      <table className={cn(styles.table, className)}>
        <caption className="sr-only">{caption}</caption>
        <thead className={styles.head}>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr className={styles.headerRow} key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  className={cn(
                    styles.headerCell,
                    (header.column.columnDef.meta as DataTableColumnMeta)
                      ?.headerClassName,
                  )}
                  key={header.id}
                  scope="col"
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className={styles.body}>
          {table.getRowModel().rows.map((row) => (
            <tr className={styles.row} key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td
                  className={cn(
                    styles.cell,
                    (cell.column.columnDef.meta as DataTableColumnMeta)
                      ?.cellClassName,
                  )}
                  key={cell.id}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
