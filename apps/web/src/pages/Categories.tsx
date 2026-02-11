import { useState, useMemo, useEffect } from 'react';
import { Plus, Search, ArrowUpDown, ArrowUp, ArrowDown, Edit, Trash2 } from 'lucide-react';
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    flexRender,
    type ColumnDef,
    type SortingState,
    type ColumnFiltersState,
    type VisibilityState,
} from '@tanstack/react-table';
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { createPortal } from 'react-dom';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useCategories, type Category } from '@/hooks/useCategories';


// Assuming Textarea component might not exist in ui folder based on list_dir, will use standard textarea with Tailwind classes
// Actually I should check if Textarea exists. It wasn't in the list_dir output earlier.
// I'll use standard textarea or Input for description.

export default function Categories() {
    const { categories, isLoading, createCategory, updateCategory, deleteCategory } = useCategories();
    const { toast } = useToast();

    const [globalFilter, setGlobalFilter] = useState('');
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility] = useState<VisibilityState>({});

    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [deleteConfirmCategory, setDeleteConfirmCategory] = useState<Category | null>(null);

    // Form state
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const resetForm = () => {
        setFormData({ name: '', description: '' });
        setEditingCategory(null);
        setIsAddDialogOpen(false);
        setIsSubmitting(false);
    };

    const handleEdit = (category: Category) => {
        setEditingCategory(category);
        setFormData({ name: category.name, description: category.description || '' });
        setIsAddDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) return;

        setIsSubmitting(true);
        try {
            if (editingCategory) {
                await updateCategory({ id: editingCategory.id, data: formData });
                toast({
                    title: "Success",
                    description: "Category updated successfully",
                    variant: "success",
                });
            } else {
                await createCategory(formData);
                toast({
                    title: "Success",
                    description: "Category created successfully",
                    variant: "success",
                });
            }
            resetForm();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to save category",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Header Actions Portal
    const [headerContainer, setHeaderContainer] = useState<HTMLElement | null>(null);
    useEffect(() => {
        setHeaderContainer(document.getElementById('header-actions'));
    }, []);

    const handleDelete = (category: Category) => {
        setDeleteConfirmCategory(category);
    };

    const confirmDelete = async () => {
        if (!deleteConfirmCategory) return;
        try {
            await deleteCategory(deleteConfirmCategory.id);
            toast({
                title: "Success",
                description: "Category deleted successfully",
                variant: "success",
            });
            setDeleteConfirmCategory(null);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to delete category",
                variant: "destructive",
            });
        }
    };

    const columns = useMemo<ColumnDef<Category>[]>(
        () => [
            {
                accessorKey: 'name',
                header: ({ column }) => {
                    return (
                        <div
                            className="flex items-center justify-start cursor-pointer hover:text-foreground text-muted-foreground gap-2 w-full"
                            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                        >
                            Name
                            {column.getIsSorted() === 'asc' ? <ArrowUp className="h-3 w-3" /> : column.getIsSorted() === 'desc' ? <ArrowDown className="h-3 w-3" /> : <ArrowUpDown className="h-3 w-3 opacity-50" />}
                        </div>
                    );
                },
                cell: ({ row }) => <div className="font-medium">{row.getValue('name')}</div>,
            },
            {
                accessorKey: 'description',
                header: 'Description',
                cell: ({ row }) => <div className="text-muted-foreground truncate max-w-[300px]">{row.getValue('description') || '-'}</div>,
            },
            {
                accessorKey: 'product_count',
                header: 'Products',
                cell: ({ row }) => <div className="text-left pl-2">{row.original.product_count || 0}</div>,
            },
            {
                accessorKey: 'created_at',
                header: 'Created',
                cell: ({ row }) => <div>{new Date(row.getValue('created_at')).toLocaleDateString()}</div>,
            },
            {
                id: 'actions',
                cell: ({ row }) => {
                    const category = row.original;
                    return (
                        <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(category)}>
                                <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(category)} className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    );
                },
            },
        ],
        []
    );

    const table = useReactTable({
        data: categories,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        globalFilterFn: (row, _columnId, filterValue) => {
            const item = row.original;
            const term = String(filterValue).toLowerCase();
            return (
                item.name.toLowerCase().includes(term) ||
                (item.description || '').toLowerCase().includes(term)
            );
        },
        state: {
            sorting,
            globalFilter,
            columnFilters,
            columnVisibility,
        },
    });

    return (
        <div className="p-6 space-y-6">
            {headerContainer && createPortal(
                <Button onClick={() => setIsAddDialogOpen(true)}>
                    <Plus className="mr-1 h-4 w-4" /> Add Category
                </Button>,
                headerContainer
            )}

            <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search categories..."
                        value={globalFilter ?? ""}
                        onChange={(event) => setGlobalFilter(event.target.value)}
                        className="pl-8"
                    />
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell colSpan={columns.length}><Skeleton className="h-10 w-full" /></TableCell>
                                </TableRow>
                            ))
                        ) : table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    No categories found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Add/Edit Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); else setIsAddDialogOpen(true); }}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{editingCategory ? 'Edit Category' : 'Add Category'}</DialogTitle>
                        <DialogDescription>
                            {editingCategory ? 'Update category details.' : 'Create a new category for your products.'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. Furniture, Electronics"
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="description">Description</Label>
                                <textarea
                                    id="description"
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Optional description"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
                            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteConfirmCategory !== null} onOpenChange={(open) => { if (!open) setDeleteConfirmCategory(null); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Category</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <strong>{deleteConfirmCategory?.name}</strong>?
                            This action cannot be undone.
                            {/* Note: Backend prevents deletion if products are assigned, handle UI feedback for that */}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteConfirmCategory(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
