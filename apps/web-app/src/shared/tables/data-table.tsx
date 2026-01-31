import * as React from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconChevronUp,
  IconLayoutColumns,
  IconPlus,
} from "@tabler/icons-react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type Row,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";

import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Label } from "@/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { Tabs, TabsContent } from "@/shared/ui/tabs";

// Create a separate component for the drag handle
// function DragHandle({ id }: { id: number }) {
//   const { attributes, listeners } = useSortable({
//     id,
//   });
//
//   return (
//     <Button
//       {...attributes}
//       {...listeners}
//       variant="ghost"
//       size="icon"
//       className="text-muted-foreground size-7 hover:bg-transparent"
//     >
//       <IconGripVertical className="text-muted-foreground size-3" />
//       <span className="sr-only">Drag to reorder</span>
//     </Button>
//   );
// }

export function DataTable<
  T extends { id: string | number },
>({
  columns,
  data: initialData,
  addLabel,
  onAdd,
  addButtonDisabled,
  enablePagination = false,
  enableColumnCustomization = false,
  enableRowSelection = false,
  enableSorting = false,
  pagination: controlledPagination,
  onPaginationChange,
  sorting: controlledSorting,
  onSortingChange,
  pageCount: controlledPageCount,
}: {
  columns: ColumnDef<T>[];
  data: T[];
  addLabel?: string;
  onAdd?: () => void;
  addButtonDisabled?: boolean;
  enablePagination?: boolean;
  enableColumnCustomization?: boolean;
  enableRowSelection?: boolean;
  enableSorting?: boolean;
  pagination?: { pageIndex: number; pageSize: number };
  onPaginationChange?: (pagination: {
    pageIndex: number;
    pageSize: number;
  }) => void;
  sorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;
  pageCount?: number;
}) {
  const [data, setData] = React.useState(() => initialData);

  // Update data when initialData changes
  React.useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const [rowSelection, setRowSelection] = React.useState(
    {}
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] =
    React.useState<ColumnFiltersState>([]);
  const [internalSorting, setInternalSorting] =
    React.useState<SortingState>([]);
  const sorting = controlledSorting ?? internalSorting;
  const [
    uncontrolledPagination,
    setUncontrolledPagination,
  ] = React.useState({
    pageIndex: 0,
    pageSize: enablePagination
      ? 10
      : Number.MAX_SAFE_INTEGER,
  });
  const pagination =
    controlledPagination ?? uncontrolledPagination;
  const pageCount =
    controlledPageCount ??
    (Math.ceil(data.length / pagination.pageSize) || 1);
  const sortableId = React.useId();
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  );

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () =>
      data?.map(
        (row) => (row as { id: string | number }).id
      ) || [],
    [data]
  );

  // Wrap setPagination to always call with the value, not updater
  const wrappedSetPagination = React.useCallback(
    (updaterOrValue: unknown) => {
      if (onPaginationChange) {
        if (typeof updaterOrValue === "function") {
          // updater function
          onPaginationChange(
            (
              updaterOrValue as (old: {
                pageIndex: number;
                pageSize: number;
              }) => { pageIndex: number; pageSize: number }
            )(pagination)
          );
        } else {
          onPaginationChange(
            updaterOrValue as {
              pageIndex: number;
              pageSize: number;
            }
          );
        }
      } else {
        setUncontrolledPagination(
          updaterOrValue as {
            pageIndex: number;
            pageSize: number;
          }
        );
      }
    },
    [onPaginationChange, pagination]
  );

  // Wrap setSorting to always call with the value, not updater
  const wrappedSetSorting = React.useCallback(
    (updaterOrValue: unknown) => {
      if (onSortingChange) {
        if (typeof updaterOrValue === "function") {
          onSortingChange(
            (
              updaterOrValue as (
                old: SortingState
              ) => SortingState
            )(sorting)
          );
        } else {
          onSortingChange(updaterOrValue as SortingState);
        }
      } else {
        setInternalSorting(updaterOrValue as SortingState);
      }
    },
    [onSortingChange, sorting]
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row: T) => row.id.toString(),
    enableRowSelection: enableRowSelection,
    onRowSelectionChange: setRowSelection,
    onSortingChange: wrappedSetSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: wrappedSetPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    pageCount,
    manualPagination: !!controlledPagination,
    manualSorting: enableSorting && !!controlledSorting,
  });

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setData((data) => {
        const oldIndex = dataIds.indexOf(active.id);
        const newIndex = dataIds.indexOf(over.id);
        return arrayMove(data, oldIndex, newIndex);
      });
    }
  }

  return (
    <Tabs
      defaultValue="outline"
      className="w-full flex-col justify-start gap-2"
    >
      <div className="flex items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-2">
          {enableColumnCustomization && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="outline" size="sm" />
                  }
                >
                  <IconLayoutColumns />
                  <span className="hidden lg:inline">
                    Customize Columns
                  </span>
                  <span className="lg:hidden">Columns</span>
                  <IconChevronDown />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56"
                >
                  {table
                    .getAllColumns()
                    .filter(
                      (column) =>
                        typeof column.accessorFn !==
                          "undefined" && column.getCanHide()
                    )
                    .map((column) => {
                      return (
                        <DropdownMenuCheckboxItem
                          key={column.id}
                          className="capitalize"
                          checked={column.getIsVisible()}
                          onCheckedChange={(value) => {
                            column.toggleVisibility(
                              !!value
                            );
                          }}
                        >
                          {
                            column.columnDef
                              .header as string
                          }
                        </DropdownMenuCheckboxItem>
                      );
                    })}
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
        {onAdd && (
          <Button
            variant="outline"
            size="sm"
            onClick={onAdd}
            {...(addButtonDisabled !== undefined && {
              disabled: addButtonDisabled,
            })}
          >
            <IconPlus />
            <span className="hidden lg:inline">
              {addLabel ?? "Add"}
            </span>
          </Button>
        )}
      </div>
      <TabsContent
        value="outline"
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        <Card className="overflow-hidden py-0">
          <CardContent className="p-0">
            <DndContext
              collisionDetection={closestCenter}
              modifiers={[restrictToVerticalAxis]}
              onDragEnd={handleDragEnd}
              sensors={sensors}
              id={sortableId}
            >
              <Table>
                <TableHeader className="bg-muted sticky top-0 z-10">
                  {table
                    .getHeaderGroups()
                    .map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map(
                          (header) => {
                            const isSorted =
                              header.column.getIsSorted();
                            const canSort =
                              header.column.getCanSort();

                            return (
                              <TableHead
                                key={header.id}
                                colSpan={header.colSpan}
                                className={
                                  canSort
                                    ? "cursor-pointer select-none hover:bg-muted/50"
                                    : ""
                                }
                                onClick={header.column.getToggleSortingHandler()}
                              >
                                {header.isPlaceholder ? null : (
                                  <div className="flex items-center gap-1">
                                    {flexRender(
                                      header.column
                                        .columnDef.header,
                                      header.getContext()
                                    )}
                                    {canSort && (
                                      <div className="flex flex-col -space-y-1">
                                        <IconChevronUp
                                          className={`h-3 w-3 transition-opacity ${
                                            isSorted ===
                                            "asc"
                                              ? "opacity-100"
                                              : "opacity-30"
                                          }`}
                                        />
                                        <IconChevronDown
                                          className={`h-3 w-3 transition-opacity ${
                                            isSorted ===
                                            "desc"
                                              ? "opacity-100"
                                              : "opacity-30"
                                          }`}
                                        />
                                      </div>
                                    )}
                                  </div>
                                )}
                              </TableHead>
                            );
                          }
                        )}
                      </TableRow>
                    ))}
                </TableHeader>
                <TableBody className="**:data-[slot=table-cell]:first:w-8">
                  {table.getRowModel().rows?.length ? (
                    <SortableContext
                      items={dataIds}
                      strategy={verticalListSortingStrategy}
                    >
                      {table
                        .getRowModel()
                        .rows.map((row) => (
                          <DraggableRow
                            key={row.id}
                            row={row}
                          />
                        ))}
                    </SortableContext>
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-24 text-center"
                      >
                        {onAdd ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={onAdd}
                            {...(addButtonDisabled !==
                              undefined && {
                              disabled: addButtonDisabled,
                            })}
                          >
                            <IconPlus />
                            <span className="hidden lg:inline">
                              {addLabel ?? "Add"}
                            </span>
                          </Button>
                        ) : (
                          "No results."
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </DndContext>
          </CardContent>
        </Card>
        <div className="flex items-center justify-between px-4">
          <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
            {table.options.enableRowSelection && (
              <>
                {
                  table.getFilteredSelectedRowModel().rows
                    .length
                }{" "}
                of {table.getFilteredRowModel().rows.length}{" "}
                row(s) selected.
              </>
            )}
          </div>
          {enablePagination && (
            <div className="flex w-full items-center gap-8 lg:w-fit">
              <div className="hidden items-center gap-2 lg:flex">
                <Label
                  htmlFor="rows-per-page"
                  className="text-sm font-medium"
                >
                  Rows per page
                </Label>
                <Select
                  value={`${table.getState().pagination.pageSize}`}
                  onValueChange={(value) => {
                    if (value)
                      table.setPageSize(Number(value));
                  }}
                >
                  <SelectTrigger
                    size="sm"
                    className="w-20"
                    id="rows-per-page"
                  >
                    <SelectValue>
                      {table.getState().pagination.pageSize}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent side="top">
                    {[10, 20, 30, 40, 50].map(
                      (pageSize) => (
                        <SelectItem
                          key={pageSize}
                          value={`${pageSize}`}
                        >
                          {pageSize}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>

              {enablePagination && (
                <>
                  <div className="flex w-fit items-center justify-center text-sm font-medium">
                    Page{" "}
                    {table.getState().pagination.pageIndex +
                      1}{" "}
                    of {table.getPageCount()}
                  </div>
                  <div className="ml-auto flex items-center gap-2 lg:ml-0">
                    <Button
                      variant="outline"
                      className="hidden h-8 w-8 p-0 lg:flex"
                      onClick={() => {
                        table.setPageIndex(0);
                      }}
                      disabled={!table.getCanPreviousPage()}
                    >
                      <span className="sr-only">
                        Go to first page
                      </span>
                      <IconChevronsLeft />
                    </Button>
                    <Button
                      variant="outline"
                      className="size-8"
                      size="icon"
                      onClick={() => {
                        table.previousPage();
                      }}
                      disabled={!table.getCanPreviousPage()}
                    >
                      <span className="sr-only">
                        Go to previous page
                      </span>
                      <IconChevronLeft />
                    </Button>
                    <Button
                      variant="outline"
                      className="size-8"
                      size="icon"
                      onClick={() => {
                        table.nextPage();
                      }}
                      disabled={!table.getCanNextPage()}
                    >
                      <span className="sr-only">
                        Go to next page
                      </span>
                      <IconChevronRight />
                    </Button>
                    <Button
                      variant="outline"
                      className="hidden size-8 lg:flex"
                      size="icon"
                      onClick={() => {
                        table.setPageIndex(
                          table.getPageCount() - 1
                        );
                      }}
                      disabled={!table.getCanNextPage()}
                    >
                      <span className="sr-only">
                        Go to last page
                      </span>
                      <IconChevronsRight />
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </TabsContent>
      <TabsContent
        value="past-performance"
        className="flex flex-col px-4 lg:px-6"
      >
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
      <TabsContent
        value="key-personnel"
        className="flex flex-col px-4 lg:px-6"
      >
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
      <TabsContent
        value="focus-documents"
        className="flex flex-col px-4 lg:px-6"
      >
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
    </Tabs>
  );
}

function DraggableRow<T extends { id: string | number }>({
  row,
}: {
  row: Row<T>;
}) {
  const { transform, transition, setNodeRef, isDragging } =
    useSortable({
      id: row.original.id,
    });

  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(
            cell.column.columnDef.cell,
            cell.getContext()
          )}
        </TableCell>
      ))}
    </TableRow>
  );
}
