import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import EditProductPane from '@/components/EditProductPane';
import { ProductVariationsModal } from '@/components/products/ProductVariationsModal';
import { useToast } from '@/components/ui/use-toast';
import { getCurrencySymbol } from '@/utils/currency';
import { type ProductsPageState, formatNumberDisplay } from '@/hooks/useProductsPageState';

type Props = Pick<ProductsPageState,
  | 'settings'
  | 'editingProductId'
  | 'setEditingProductId'
  | 'productsQueryRefetch'
  | 'stockWarningOpen'
  | 'setStockWarningOpen'
  | 'pendingStatusChange'
  | 'setPendingStatusChange'
  | 'stockIssues'
  | 'setStockIssues'
  | 'handleSaveField'
  | 'deleteDialogOpen'
  | 'setDeleteDialogOpen'
  | 'productToDelete'
  | 'setProductToDelete'
  | 'handleDeleteProduct'
  | 'bulkDeleteDialogOpen'
  | 'setBulkDeleteDialogOpen'
  | 'variationsModalOpen'
  | 'setVariationsModalOpen'
  | 'selectedProductForVariations'
  | 'setSelectedProductForVariations'
  | 'updatingProductId'
  | 'setUpdatingProductId'
  | 'updateProduct'
> & {
  bulkSelectedCount: number;
  onConfirmBulkDelete: () => Promise<void>;
};

export function ProductsDialogs({
  settings,
  editingProductId,
  setEditingProductId,
  productsQueryRefetch,
  stockWarningOpen,
  setStockWarningOpen,
  pendingStatusChange,
  setPendingStatusChange,
  stockIssues,
  setStockIssues,
  handleSaveField,
  deleteDialogOpen,
  setDeleteDialogOpen,
  productToDelete,
  setProductToDelete,
  handleDeleteProduct,
  bulkDeleteDialogOpen,
  setBulkDeleteDialogOpen,
  variationsModalOpen,
  setVariationsModalOpen,
  selectedProductForVariations,
  setSelectedProductForVariations,
  updatingProductId,
  setUpdatingProductId,
  onConfirmBulkDelete,
  updateProduct,
  bulkSelectedCount,
}: Props) {
  const { toast } = useToast();

  return (
    <>
      {/* Edit Product Pane */}
      <EditProductPane
        productId={editingProductId}
        open={editingProductId !== null}
        onOpenChange={open => { if (!open) setEditingProductId(null); }}
        onSuccess={() => { setEditingProductId(null); productsQueryRefetch(); }}
      />

      {/* Stock Warning Dialog */}
      <Dialog open={stockWarningOpen} onOpenChange={setStockWarningOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Insufficient Stock Warning
            </DialogTitle>
            <DialogDescription>
              Some materials don't have enough stock to complete this batch. Stock will be reduced to negative values if you proceed.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            {stockIssues.map((issue, i) => (
              <div key={i} className="border rounded-lg p-3 bg-yellow-50 dark:bg-yellow-900/20">
                <div className="font-medium text-sm">{issue.material} ({issue.unit})</div>
                <div className="text-sm text-muted-foreground mt-1 space-y-1">
                  <div>Current Stock: <span className="font-medium">{formatNumberDisplay(issue.currentStock)}</span></div>
                  <div>Required: <span className="font-medium">{formatNumberDisplay(issue.required)}</span></div>
                  <div className="text-red-600 dark:text-red-400 font-medium">
                    Shortfall: {formatNumberDisplay(issue.shortfall)}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setStockWarningOpen(false); setPendingStatusChange(null); setStockIssues([]); }}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (pendingStatusChange) {
                  setStockWarningOpen(false);
                  await handleSaveField(pendingStatusChange.productId, 'status', pendingStatusChange.newStatus, true);
                  setPendingStatusChange(null);
                  setStockIssues([]);
                }
              }}
            >
              Proceed Anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Product
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{productToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteDialogOpen(false); setProductToDelete(null); }}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteProduct}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Dialog */}
      <Dialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete {bulkSelectedCount} Products
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {bulkSelectedCount} products? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDeleteDialogOpen(false)}>Cancel</Button>
            {/* Actual delete is triggered by the parent via onConfirmBulkDelete */}
            <Button variant="destructive" onClick={async () => {
              setBulkDeleteDialogOpen(false);
              await onConfirmBulkDelete();
            }}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product Variations Modal */}
      {selectedProductForVariations && (
        <ProductVariationsModal
          open={variationsModalOpen}
          onOpenChange={open => { setVariationsModalOpen(open); if (!open) setSelectedProductForVariations(null); }}
          variants={selectedProductForVariations.variants || []}
          onSave={async updatedVariants => {
            const pid = selectedProductForVariations.id;
            try {
              setUpdatingProductId(pid);
              await updateProduct({ id: pid, data: { variants: updatedVariants } });
              toast({ title: 'Success', description: 'Variations updated successfully', variant: 'success' });
            } catch {
              toast({ variant: 'destructive', title: 'Error', description: 'Failed to update variants' });
            } finally {
              setUpdatingProductId(null);
            }
          }}
          currency={getCurrencySymbol(settings.currency)}
          baseCost={selectedProductForVariations.product_cost ?? 0}
          basePrice={selectedProductForVariations.target_price ?? 0}
        />
      )}
    </>
  );
}
