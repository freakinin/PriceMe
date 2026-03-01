import { useState, useEffect, useMemo } from 'react';
import {
  Plus, Search, Edit, Trash2, AlertTriangle,
  Package, Table2, LayoutGrid, ArrowUpDown, ArrowUp, ArrowDown,
} from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type RowSelectionState,
} from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import { BulkActionToolbar } from '@/components/BulkActionToolbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { useSuppliers, type Supplier } from '@/hooks/useSuppliers';
import EditSupplierDialog from '@/components/EditSupplierDialog';
import { SuppliersCardView } from '@/components/suppliers/SuppliersCardView';

const formatDate = (dateString?: string) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
  });
};

export default function Suppliers() {
  const { toast } = useToast();
  const { setOpen: setSidebarOpen } = useSidebar();
  const { suppliers, isLoading, deleteSupplier, bulkDeleteSuppliers } = useSuppliers();

  const [activeTab, setActiveTab] = useState<'table' | 'grid'>('table');
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [deleteConfirmSupplier, setDeleteConfirmSupplier] = useState<Supplier | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, []);

  const confirmDelete = async () => {
    if (!deleteConfirmSupplier) return;
    setIsDeleting(true);
    try {
      await deleteSupplier(deleteConfirmSupplier.id);
      toast({ variant: 'success', title: 'Deleted', description: `${deleteConfirmSupplier.name} removed.` });
      setDeleteConfirmSupplier(null);
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete supplier.' });
    } finally {
      setIsDeleting(false);
    }
  };

  // Client-side search filter
  const filteredSuppliers = useMemo(() => {
    if (!globalFilter.trim()) return suppliers;
    const q = globalFilter.toLowerCase();
    return suppliers.filter((s) =>
      s.name.toLowerCase().includes(q) ||
      (s.email ?? '').toLowerCase().includes(q) ||
      (s.phone ?? '').toLowerCase().includes(q) ||
      (s.link ?? '').toLowerCase().includes(q)
    );
  }, [suppliers, globalFilter]);

  const columns: ColumnDef<Supplier>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="translate-y-[2px]"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-[2px]"
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40,
    },
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => column.toggleSorting()}>
          Name
          {column.getIsSorted() === 'asc' ? <ArrowUp className="ml-1 h-3.5 w-3.5" /> :
           column.getIsSorted() === 'desc' ? <ArrowDown className="ml-1 h-3.5 w-3.5" /> :
           <ArrowUpDown className="ml-1 h-3.5 w-3.5 opacity-40" />}
        </Button>
      ),
      cell: ({ row }) => (
        <span className="font-medium">{row.original.name}</span>
      ),
    },
    {
      accessorKey: 'link',
      header: 'Website',
      cell: ({ row }) => {
        const link = row.original.link;
        if (!link) return <span className="text-muted-foreground">—</span>;
        return (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline truncate block max-w-[180px]"
          >
            {link.replace(/^https?:\/\//, '')}
          </a>
        );
      },
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ row }) => {
        const phone = row.original.phone;
        if (!phone) return <span className="text-muted-foreground">—</span>;
        return (
          <a href={`tel:${phone}`} className="text-sm hover:underline">
            {phone}
          </a>
        );
      },
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => {
        const email = row.original.email;
        if (!email) return <span className="text-muted-foreground">—</span>;
        return (
          <a href={`mailto:${email}`} className="text-sm text-primary hover:underline truncate block max-w-[160px]">
            {email}
          </a>
        );
      },
    },
    {
      accessorKey: 'material_count',
      header: ({ column }) => (
        <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => column.toggleSorting()}>
          Materials
          {column.getIsSorted() === 'asc' ? <ArrowUp className="ml-1 h-3.5 w-3.5" /> :
           column.getIsSorted() === 'desc' ? <ArrowDown className="ml-1 h-3.5 w-3.5" /> :
           <ArrowUpDown className="ml-1 h-3.5 w-3.5 opacity-40" />}
        </Button>
      ),
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs">
          <Package className="h-3 w-3 mr-1" />
          {row.original.material_count ?? 0}
        </Badge>
      ),
    },
    {
      accessorKey: 'created_at',
      header: ({ column }) => (
        <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => column.toggleSorting()}>
          Created
          {column.getIsSorted() === 'asc' ? <ArrowUp className="ml-1 h-3.5 w-3.5" /> :
           column.getIsSorted() === 'desc' ? <ArrowDown className="ml-1 h-3.5 w-3.5" /> :
           <ArrowUpDown className="ml-1 h-3.5 w-3.5 opacity-40" />}
        </Button>
      ),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{formatDate(row.original.created_at)}</span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-0.5">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => setEditingSupplier(row.original)}
                >
                  <Edit className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit supplier</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setDeleteConfirmSupplier(row.original)}
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete supplier</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: filteredSuppliers,
    columns,
    state: { sorting, rowSelection },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableRowSelection: true,
  });

  return (
    <div className="flex flex-col h-full p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Suppliers</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {suppliers.length} supplier{suppliers.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Supplier
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search suppliers..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <div className="flex items-center border rounded-md">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={activeTab === 'table' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-9 w-9 rounded-r-none"
                  onClick={() => setActiveTab('table')}
                >
                  <Table2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Table view</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={activeTab === 'grid' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-9 w-9 rounded-l-none border-l"
                  onClick={() => setActiveTab('grid')}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Grid view</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : activeTab === 'grid' ? (
        <SuppliersCardView
          suppliers={filteredSuppliers}
          onEdit={setEditingSupplier}
          onDelete={setDeleteConfirmSupplier}
          formatDate={formatDate}
        />
      ) : (
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground">
                    {globalFilter ? 'No suppliers match your search.' : 'No suppliers yet. Add your first one!'}
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} className="hover:bg-muted/50">
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add / Edit dialog */}
      <EditSupplierDialog
        supplier={editingSupplier}
        open={editingSupplier !== null || isAddDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setEditingSupplier(null);
            setIsAddDialogOpen(false);
          }
        }}
        onSuccess={() => {
          setEditingSupplier(null);
          setIsAddDialogOpen(false);
        }}
      />

      {/* Bulk delete confirm */}
      <Dialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete {Object.keys(rowSelection).length} Supplier{Object.keys(rowSelection).length !== 1 ? 's' : ''}
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {Object.keys(rowSelection).length} supplier{Object.keys(rowSelection).length !== 1 ? 's' : ''}? This action cannot be undone. Any linked materials will lose their supplier association.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDeleteDialogOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={async () => {
                try {
                  const ids = table.getSelectedRowModel().flatRows.map((row) => row.original.id);
                  await bulkDeleteSuppliers(ids);
                  setRowSelection({});
                  setBulkDeleteDialogOpen(false);
                  toast({ variant: 'success', title: 'Deleted', description: `${ids.length} supplier${ids.length !== 1 ? 's' : ''} removed.` });
                } catch {
                  toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete suppliers.' });
                }
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Single delete confirm */}
      <Dialog open={!!deleteConfirmSupplier} onOpenChange={(open) => !open && setDeleteConfirmSupplier(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Supplier</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deleteConfirmSupplier?.name}</strong>?
              {(deleteConfirmSupplier?.material_count ?? 0) > 0 && (
                <span className="block mt-1 text-amber-600">
                  This supplier is linked to {deleteConfirmSupplier?.material_count} material(s). Those materials will lose the supplier link but won't be deleted.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmSupplier(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BulkActionToolbar
        selectedCount={Object.keys(rowSelection).length}
        onClearSelection={() => setRowSelection({})}
        entityName="Suppliers"
        onDelete={() => setBulkDeleteDialogOpen(true)}
      />
    </div>
  );
}
