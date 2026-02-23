import { useEffect, useState, useMemo } from 'react';
import { useProducts, type Product, type PricingMethod, type ProductStatus } from './useProducts';
import { useCategories } from './useCategories';
import { useProductPricing } from './useProductPricing';
import { useSettings } from './useSettings';
import { usePlatformFees } from './usePlatformFees';
import { useToast } from '@/components/ui/use-toast';
import { useSidebar } from '@/components/ui/sidebar';
import { formatCurrency } from '@/utils/currency';
import api from '@/lib/api';
import { calculateNetProfitWithFees, type PlatformFeeConfig, type FeeBreakdown } from '@/utils/profitCalculations';

export type { FeeBreakdown };

export type ActiveFilter = { column: string; operator: string; value: string };

export const FILTER_FUNCTIONS: Record<string, (value: string, filter: string) => boolean> = {
  contains: (v, f) => v.toLowerCase().includes(f.toLowerCase()),
  equals: (v, f) => v.toLowerCase() === f.toLowerCase(),
  notContains: (v, f) => !v.toLowerCase().includes(f.toLowerCase()),
  startsWith: (v, f) => v.toLowerCase().startsWith(f.toLowerCase()),
  endsWith: (v, f) => v.toLowerCase().endsWith(f.toLowerCase()),
};

export const OPERATOR_LABELS: Record<string, string> = {
  contains: 'contains',
  equals: 'equals',
  notContains: 'not contains',
  startsWith: 'starts with',
  endsWith: 'ends with',
};

export type StockIssue = {
  material: string;
  currentStock: number;
  required: number;
  shortfall: number;
  unit: string;
};

export function formatNumberDisplay(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return '-';
  const num = typeof val === 'number' ? val : parseFloat(val as string);
  if (isNaN(num)) return String(val);
  return num % 1 === 0 ? num.toString() : num.toString().replace(/\.?0+$/, '');
}

export function useProductsPageState() {
  const { settings } = useSettings();
  const { toast } = useToast();
  const { setOpen: setSidebarOpen } = useSidebar();

  const {
    products,
    isLoading,
    error,
    updateProduct,
    deleteProduct,
    bulkDeleteProducts,
    bulkUpdateStatus,
    bulkUpdateCategory,
    checkStockLevels,
    refetch: productsQueryRefetch,
  } = useProducts();

  const { categories } = useCategories();

  const {
    calculatePriceFromMethod,
    calculateProfitFromPrice,
    calculateValueFromMethod,
    getCalculationTypeDescription,
  } = useProductPricing();

  // --- Pricing state ---
  const [productPricingMethods, setProductPricingMethods] = useState<Record<number, PricingMethod>>({});
  const [productPricingValues, setProductPricingValues] = useState<Record<number, number>>({});
  const [productCategoryIds, setProductCategoryIds] = useState<Record<number, number | null>>({});
  const [globalPricingMethod, setGlobalPricingMethod] = useState<PricingMethod>('price');

  // --- Fee-aware mode ---
  const { profiles } = usePlatformFees();
  const [feeAwareMode, setFeeAwareMode] = useState(false);
  const [selectedPlatformProfileId, setSelectedPlatformProfileId] = useState<number | null>(null);

  // Resolve the active fee profile (user-selected or settings default or first available)
  const activeFeeProfile = useMemo(() => {
    if (!feeAwareMode || profiles.length === 0) return null;
    if (selectedPlatformProfileId) return profiles.find(p => p.id === selectedPlatformProfileId) ?? null;
    const settingsDefault = settings.default_platform_profile_id;
    if (settingsDefault) return profiles.find(p => p.id === settingsDefault) ?? null;
    return profiles.find(p => p.is_default) ?? profiles[0] ?? null;
  }, [feeAwareMode, profiles, selectedPlatformProfileId, settings.default_platform_profile_id]);

  // Auto-select the default platform profile when entering fee mode
  const toggleFeeMode = () => {
    if (!feeAwareMode && profiles.length > 0 && selectedPlatformProfileId === null) {
      const defProfile = profiles.find(p => p.is_default) ?? profiles[0];
      if (defProfile) setSelectedPlatformProfileId(defProfile.id);
    }
    setFeeAwareMode(v => !v);
  };

  const getFeeAwareMetrics = (product: Product): FeeBreakdown | null => {
    if (!activeFeeProfile) return null;
    const method = productPricingMethods[product.id] || globalPricingMethod || product.pricing_method || 'price';
    const pricingValue = productPricingValues[product.id] ?? product.pricing_value ?? (product.target_price || 0);
    let price = product.target_price || 0;
    if (method && pricingValue !== null && pricingValue !== undefined) {
      price = calculatePriceFromMethod(method, pricingValue, product.product_cost);
    }
    const feeConfig: PlatformFeeConfig = {
      listing_fee_usd: activeFeeProfile.listing_fee_usd,
      transaction_fee_pct: activeFeeProfile.transaction_fee_pct,
      payment_processing_pct: activeFeeProfile.payment_processing_pct,
      payment_processing_flat: activeFeeProfile.payment_processing_flat,
      offsite_ads_enabled: activeFeeProfile.offsite_ads_enabled,
      offsite_ads_pct: activeFeeProfile.offsite_ads_pct,
      currency_conversion_pct: activeFeeProfile.currency_conversion_pct,
      vat_on_fees_pct: activeFeeProfile.vat_on_fees_pct,
      fees_apply_to_shipping: activeFeeProfile.fees_apply_to_shipping,
    };
    const shippingCost = product.shipping_cost ?? 0;
    const incomeTaxPct = settings.tax_percentage ?? 0;
    return calculateNetProfitWithFees(price, product.product_cost, shippingCost, feeConfig, incomeTaxPct);
  };

  // --- Filter state ---
  const [globalFilter, setGlobalFilter] = useState('');
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [selectedFilterColumn, setSelectedFilterColumn] = useState('');
  const [filterOperator, setFilterOperator] = useState('contains');
  const [filterValue, setFilterValue] = useState('');

  // --- Dialog / UI state ---
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [stockWarningOpen, setStockWarningOpen] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<{ productId: number; newStatus: ProductStatus } | null>(null);
  const [stockIssues, setStockIssues] = useState<StockIssue[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<{ id: number; name: string } | null>(null);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [variationsModalOpen, setVariationsModalOpen] = useState(false);
  const [selectedProductForVariations, setSelectedProductForVariations] = useState<Product | null>(null);
  const [updatingProductId, setUpdatingProductId] = useState<number | null>(null);
  const [updatingCategoryProductId, setUpdatingCategoryProductId] = useState<number | null>(null);

  useEffect(() => {
    setSidebarOpen(false);
  }, []);

  useEffect(() => {
    if (products.length === 0) return;

    const firstMethod = products[0]?.pricing_method;
    if (firstMethod && products.every(p => p.pricing_method === firstMethod)) {
      setGlobalPricingMethod(firstMethod);
    } else if (!firstMethod) {
      setGlobalPricingMethod('price');
    }

    setProductPricingMethods(prev => {
      const updated = { ...prev };
      products.forEach(p => { if (!updated[p.id]) updated[p.id] = p.pricing_method || 'price'; });
      return updated;
    });

    setProductPricingValues(prev => {
      const updated = { ...prev };
      products.forEach(p => {
        if (p.pricing_value !== null && p.pricing_value !== undefined && !(p.id in updated)) {
          updated[p.id] = p.pricing_value;
        } else if (!(p.id in updated) && p.target_price && p.product_cost > 0) {
          updated[p.id] = calculateValueFromMethod(p.pricing_method || 'price', p.target_price, p.product_cost);
        }
      });
      return updated;
    });

    setProductCategoryIds(prev => {
      const updated = { ...prev };
      products.forEach(p => { updated[p.id] = p.category_id; });
      return updated;
    });
  }, [products, calculateValueFromMethod]);

  // --- Formatters ---
  const formatCurrencyValue = (value: string | number | null | undefined) =>
    formatCurrency(value, settings?.currency || 'USD');

  const formatPercentage = (value: string | number | null | undefined) => {
    if (value === null || value === undefined) return '-';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (typeof num !== 'number' || isNaN(num)) return '-';
    return `${num.toFixed(2)}%`;
  };

  // --- Computed metrics ---
  const getCalculatedMetrics = (product: Product) => {
    const method = productPricingMethods[product.id] || globalPricingMethod || product.pricing_method || 'price';
    const pricingValue = productPricingValues[product.id] ?? product.pricing_value ?? (product.target_price || 0);
    let price = product.target_price || 0;
    if (method && pricingValue !== null && pricingValue !== undefined) {
      price = calculatePriceFromMethod(method, pricingValue, product.product_cost);
    }
    const metrics = calculateProfitFromPrice(price, product.product_cost);
    return { price, profit: metrics.profit, margin: metrics.margin, markup: metrics.markup };
  };

  // --- Filtered products (used by grid view; table view uses TanStack sorting on top) ---
  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (globalFilter) {
      const search = globalFilter.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(search) || (p.sku || '').toLowerCase().includes(search)
      );
    }

    activeFilters.forEach(({ column, operator, value }) => {
      if (!value) return;
      const fn = FILTER_FUNCTIONS[operator];
      if (!fn) return;
      result = result.filter(product => {
        let fieldValue = '';
        if (column === 'name') fieldValue = product.name || '';
        else if (column === 'sku') fieldValue = product.sku || '';
        else if (column === 'status') fieldValue = product.status || '';
        else if (column === 'category') {
          fieldValue = categories.find(c => c.id === product.category_id)?.name || product.category || '';
        }
        return fn(fieldValue, value);
      });
    });

    return result;
  }, [products, globalFilter, activeFilters, categories]);

  // --- Handlers ---
  const handleGlobalMethodChange = (method: PricingMethod) => {
    setGlobalPricingMethod(method);
    products.forEach(product => {
      setProductPricingMethods(prev => ({ ...prev, [product.id]: method }));
      if (product.target_price && product.product_cost > 0) {
        const newValue = calculateValueFromMethod(method, product.target_price, product.product_cost);
        setProductPricingValues(prev => ({ ...prev, [product.id]: newValue }));
      }
    });
  };

  const handleSaveField = async (productId: number, field: string, value: string | number, skipStockCheck = false) => {
    try {
      const product = products.find(p => p.id === productId);
      if (!product) return;

      if (!skipStockCheck && field === 'status' && value === 'on_sale' && product.status !== 'on_sale') {
        const issues = await checkStockLevels(productId, product.batch_size);
        if (issues.length > 0) {
          setStockIssues(issues);
          setPendingStatusChange({ productId, newStatus: value as ProductStatus });
          setStockWarningOpen(true);
          return;
        }
      }

      await updateProduct({
        id: productId,
        data: { [field]: (field === 'sku' && value === '') ? undefined : value },
      });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to save changes' });
    }
  };

  const handleSavePricingValue = async (productId: number, method: PricingMethod, value: number) => {
    try {
      const product = products.find(p => p.id === productId);
      if (!product) return;
      setProductPricingValues(prev => ({ ...prev, [productId]: value }));
      const calculatedPrice = calculatePriceFromMethod(method, value, product.product_cost);
      await updateProduct({ id: productId, data: { pricing_method: method, pricing_value: value, target_price: calculatedPrice } });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to save pricing' });
    }
  };

  const handleDeleteClick = (productId: number, productName: string) => {
    setProductToDelete({ id: productId, name: productName });
    setDeleteDialogOpen(true);
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    try {
      await deleteProduct(productToDelete.id);
      toast({ variant: 'success', title: 'Success', description: 'Product deleted successfully' });
      productsQueryRefetch();
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to delete product' });
    }
  };

  const handleBulkDelete = async (ids: number[]) => {
    await bulkDeleteProducts(ids);
  };

  const handleBulkStatus = async (ids: number[], status: ProductStatus) => {
    await bulkUpdateStatus({ ids, status });
  };

  const handleBulkCategory = async (ids: number[], categoryId: number | null) => {
    setProductCategoryIds(prev => {
      const updated = { ...prev };
      ids.forEach(id => { updated[id] = categoryId; });
      return updated;
    });
    await bulkUpdateCategory({ ids, category_id: categoryId });
  };

  const handleVariationsOpen = async (product: Product) => {
    try {
      const res = await api.get(`/products/${product.id}`);
      if (res.data.status === 'success') {
        setSelectedProductForVariations({ ...product, ...res.data.data });
        setVariationsModalOpen(true);
      }
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load product details' });
    }
  };

  const handleExport = async () => {
    try {
      const response = await api.get('/export/products', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Products_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to export products' });
    }
  };

  const addFilter = () => {
    if (!selectedFilterColumn || !filterValue) return;
    setActiveFilters(prev => [
      ...prev.filter(f => f.column !== selectedFilterColumn),
      { column: selectedFilterColumn, operator: filterOperator, value: filterValue },
    ]);
    setSelectedFilterColumn('');
    setFilterValue('');
    setFilterOperator('contains');
  };

  const removeFilter = (column: string) =>
    setActiveFilters(prev => prev.filter(f => f.column !== column));

  const clearAllFilters = () => {
    setActiveFilters([]);
    setSelectedFilterColumn('');
    setFilterValue('');
    setFilterOperator('contains');
    setGlobalFilter('');
  };

  return {
    // Raw data
    products,
    isLoading,
    error,
    productsQueryRefetch,
    categories,
    settings,
    updateProduct,

    // Pricing state
    productPricingMethods,
    setProductPricingMethods,
    productPricingValues,
    setProductPricingValues,
    productCategoryIds,
    setProductCategoryIds,
    globalPricingMethod,

    // Filter state
    globalFilter,
    setGlobalFilter,
    activeFilters,
    selectedFilterColumn,
    setSelectedFilterColumn,
    filterOperator,
    setFilterOperator,
    filterValue,
    setFilterValue,
    filteredProducts,

    // Dialog state
    editingProductId,
    setEditingProductId,
    stockWarningOpen,
    setStockWarningOpen,
    pendingStatusChange,
    setPendingStatusChange,
    stockIssues,
    setStockIssues,
    deleteDialogOpen,
    setDeleteDialogOpen,
    productToDelete,
    setProductToDelete,
    bulkDeleteDialogOpen,
    setBulkDeleteDialogOpen,
    variationsModalOpen,
    setVariationsModalOpen,
    selectedProductForVariations,
    setSelectedProductForVariations,
    updatingProductId,
    setUpdatingProductId,
    updatingCategoryProductId,
    setUpdatingCategoryProductId,

    // Handlers
    handleGlobalMethodChange,
    handleSaveField,
    handleSavePricingValue,
    handleDeleteClick,
    handleDeleteProduct,
    handleBulkDelete,
    handleBulkStatus,
    handleBulkCategory,
    handleVariationsOpen,
    handleExport,
    addFilter,
    removeFilter,
    clearAllFilters,

    // Computed
    getCalculatedMetrics,
    formatCurrencyValue,
    formatPercentage,
    getCalculationTypeDescription,

    // Fee-aware mode
    feeAwareMode,
    toggleFeeMode,
    selectedPlatformProfileId,
    setSelectedPlatformProfileId,
    activeFeeProfile,
    platformProfiles: profiles,
    getFeeAwareMetrics,
  };
}

export type ProductsPageState = ReturnType<typeof useProductsPageState>;
