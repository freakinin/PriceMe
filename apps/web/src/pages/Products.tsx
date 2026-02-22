import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BulkActionToolbar } from '@/components/BulkActionToolbar';
import { useProductsPageState } from '@/hooks/useProductsPageState';
import { ProductsToolbar } from '@/components/products/ProductsToolbar';
import { ProductsFilterChips } from '@/components/products/ProductsFilterChips';
import { ProductsTableView } from '@/components/products/ProductsTableView';
import { ProductsGridView } from '@/components/products/ProductsGridView';
import { ProductsDialogs } from '@/components/products/ProductsDialogs';
import { type ProductStatus } from '@/hooks/useProducts';
import { useToast } from '@/components/ui/use-toast';

export default function Products() {
  const state = useProductsPageState();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'table' | 'grid'>('table');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});

  if (state.isLoading) {
    return (
      <div className="p-6 space-y-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-destructive">{state.error}</p>
          <Button onClick={() => state.productsQueryRefetch()} variant="outline" className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <ProductsToolbar
        products={state.products}
        categories={state.categories}
        globalFilter={state.globalFilter}
        setGlobalFilter={state.setGlobalFilter}
        globalPricingMethod={state.globalPricingMethod}
        handleGlobalMethodChange={state.handleGlobalMethodChange}
        activeFilters={state.activeFilters}
        selectedFilterColumn={state.selectedFilterColumn}
        setSelectedFilterColumn={state.setSelectedFilterColumn}
        filterOperator={state.filterOperator}
        setFilterOperator={state.setFilterOperator}
        filterValue={state.filterValue}
        setFilterValue={state.setFilterValue}
        addFilter={state.addFilter}
        handleExport={state.handleExport}
        getCalculationTypeDescription={state.getCalculationTypeDescription}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onNavigateNew={() => navigate('/products/add')}
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={(id, visible) => setColumnVisibility(prev => ({ ...prev, [id]: visible }))}
      />

      <ProductsFilterChips
        activeFilters={state.activeFilters}
        removeFilter={state.removeFilter}
        clearAllFilters={state.clearAllFilters}
      />

      {state.products.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No products yet</h3>
          <p className="text-muted-foreground mb-4">Get started by creating your first product</p>
          <Button onClick={() => navigate('/products/add')}>
            <Plus className="h-4 w-4 mr-1" /> New
          </Button>
        </div>
      ) : activeTab === 'table' ? (
        <ProductsTableView
          filteredProducts={state.filteredProducts}
          products={state.products}
          productPricingMethods={state.productPricingMethods}
          productPricingValues={state.productPricingValues}
          productCategoryIds={state.productCategoryIds}
          setProductCategoryIds={state.setProductCategoryIds}
          globalPricingMethod={state.globalPricingMethod}
          categories={state.categories}
          handleSaveField={state.handleSaveField}
          handleSavePricingValue={state.handleSavePricingValue}
          handleDeleteClick={state.handleDeleteClick}
          setEditingProductId={state.setEditingProductId}
          updatingProductId={state.updatingProductId}
          updatingCategoryProductId={state.updatingCategoryProductId}
          setUpdatingCategoryProductId={state.setUpdatingCategoryProductId}
          handleVariationsOpen={state.handleVariationsOpen}
          updateProduct={state.updateProduct}
          formatCurrencyValue={state.formatCurrencyValue}
          formatPercentage={state.formatPercentage}
          getCalculatedMetrics={state.getCalculatedMetrics}
          clearAllFilters={state.clearAllFilters}
          onSelectionChange={setSelectedIds}
          columnVisibility={columnVisibility}
          onColumnVisibilityChange={(id, visible) => setColumnVisibility(prev => ({ ...prev, [id]: visible }))}
        />
      ) : (
        <ProductsGridView
          filteredProducts={state.filteredProducts}
          products={state.products}
          productPricingMethods={state.productPricingMethods}
          productPricingValues={state.productPricingValues}
          productCategoryIds={state.productCategoryIds}
          setProductCategoryIds={state.setProductCategoryIds}
          globalPricingMethod={state.globalPricingMethod}
          categories={state.categories}
          handleSaveField={state.handleSaveField}
          handleDeleteClick={state.handleDeleteClick}
          setEditingProductId={state.setEditingProductId}
          updatingProductId={state.updatingProductId}
          updatingCategoryProductId={state.updatingCategoryProductId}
          setUpdatingCategoryProductId={state.setUpdatingCategoryProductId}
          handleVariationsOpen={state.handleVariationsOpen}
          updateProduct={state.updateProduct}
          formatCurrencyValue={state.formatCurrencyValue}
          formatPercentage={state.formatPercentage}
          getCalculatedMetrics={state.getCalculatedMetrics}
          clearAllFilters={state.clearAllFilters}
          onSelectionChange={setSelectedIds}
        />
      )}

      <ProductsDialogs
        settings={state.settings}
        editingProductId={state.editingProductId}
        setEditingProductId={state.setEditingProductId}
        productsQueryRefetch={state.productsQueryRefetch}
        stockWarningOpen={state.stockWarningOpen}
        setStockWarningOpen={state.setStockWarningOpen}
        pendingStatusChange={state.pendingStatusChange}
        setPendingStatusChange={state.setPendingStatusChange}
        stockIssues={state.stockIssues}
        setStockIssues={state.setStockIssues}
        handleSaveField={state.handleSaveField}
        deleteDialogOpen={state.deleteDialogOpen}
        setDeleteDialogOpen={state.setDeleteDialogOpen}
        productToDelete={state.productToDelete}
        setProductToDelete={state.setProductToDelete}
        handleDeleteProduct={state.handleDeleteProduct}
        bulkDeleteDialogOpen={state.bulkDeleteDialogOpen}
        setBulkDeleteDialogOpen={state.setBulkDeleteDialogOpen}
        variationsModalOpen={state.variationsModalOpen}
        setVariationsModalOpen={state.setVariationsModalOpen}
        selectedProductForVariations={state.selectedProductForVariations}
        setSelectedProductForVariations={state.setSelectedProductForVariations}
        updatingProductId={state.updatingProductId}
        setUpdatingProductId={state.setUpdatingProductId}
        updateProduct={state.updateProduct}
        bulkSelectedCount={selectedIds.length}
        onConfirmBulkDelete={async () => {
          try {
            await state.handleBulkDelete(selectedIds);
            setSelectedIds([]);
            toast({ variant: 'success', title: 'Success', description: 'Products deleted successfully' });
          } catch (e: any) {
            toast({ variant: 'destructive', title: 'Error', description: e.message });
          }
        }}
      />

      <BulkActionToolbar
        selectedCount={selectedIds.length}
        onClearSelection={() => setSelectedIds([])}
        entityName="Products"
        onDelete={async () => {
          state.setBulkDeleteDialogOpen(true);
        }}
        onUpdateStatus={async status => {
          try {
            await state.handleBulkStatus(selectedIds, status as ProductStatus);
            setSelectedIds([]);
            toast({ variant: 'success', title: 'Success', description: `Products status updated to ${status}` });
          } catch (e: any) {
            toast({ variant: 'destructive', title: 'Error', description: e.message });
          }
        }}
        onUpdateCategory={async categoryId => {
          try {
            await state.handleBulkCategory(selectedIds, categoryId);
            setSelectedIds([]);
            toast({ variant: 'success', title: 'Success', description: 'Products category updated' });
          } catch (e: any) {
            toast({ variant: 'destructive', title: 'Error', description: e.message });
          }
        }}
        categories={state.categories}
      />

    </div>
  );
}
