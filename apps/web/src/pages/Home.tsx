import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  ShoppingCart,
  Plus,
  TrendingUp,
  DollarSign,
  ArrowRight,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  Box,
  BrainCircuit,
  X,
  GripVertical,
  Eye,
  EyeOff,
  LayoutDashboard,
  RotateCcw,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import api from '@/lib/api';
import { useCoach } from '@/hooks/useCoach';
import { useSettings } from '@/hooks/useSettings';
import { formatCurrency } from '@/utils/currency';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { LowStockAlerts } from '@/components/dashboard/LowStockAlerts';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { GrowthChart } from '@/components/dashboard/GrowthChart';
import { CoachHealthWidget } from '@/components/dashboard/CoachHealthWidget';
import { CoachInsightWidget } from '@/components/dashboard/CoachInsightWidget';
import { SalesSummaryWidget } from '@/components/dashboard/SalesSummaryWidget';
import { useSales } from '@/hooks/useSales';
import { Skeleton } from '@/components/ui/skeleton';
import { useCategories } from '@/hooks/useCategories';
import { cn } from '@/lib/utils';

// ── Donut chart helpers ────────────────────────────────────────────────────
function polarToCartesian(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function donutSlicePath(cx: number, cy: number, outerR: number, innerR: number, startDeg: number, endDeg: number) {
  const end = Math.min(endDeg, startDeg + 359.99);
  const o1 = polarToCartesian(cx, cy, outerR, startDeg);
  const o2 = polarToCartesian(cx, cy, outerR, end);
  const i1 = polarToCartesian(cx, cy, innerR, end);
  const i2 = polarToCartesian(cx, cy, innerR, startDeg);
  const large = end - startDeg > 180 ? 1 : 0;
  return `M ${o1.x} ${o1.y} A ${outerR} ${outerR} 0 ${large} 1 ${o2.x} ${o2.y} L ${i1.x} ${i1.y} A ${innerR} ${innerR} 0 ${large} 0 ${i2.x} ${i2.y} Z`;
}

interface DonutSlice { label: string; value: number; color: string; }

function DonutChart({ slices, emptyText = 'No data' }: { slices: DonutSlice[]; emptyText?: string }) {
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  if (total === 0) return <p className="text-center py-6 text-sm text-muted-foreground">{emptyText}</p>;

  const cx = 50, cy = 50, outerR = 44, innerR = 28;
  let angle = -90;
  const paths = slices.filter(s => s.value > 0).map(s => {
    const sweep = (s.value / total) * 360;
    const path = donutSlicePath(cx, cy, outerR, innerR, angle, angle + sweep);
    angle += sweep;
    return { ...s, path };
  });

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 100 100" className="w-[88px] h-[88px] shrink-0">
        {paths.map((p, i) => (
          <path key={i} d={p.path} fill={p.color} className="transition-opacity hover:opacity-75" />
        ))}
      </svg>
      <div className="flex-1 space-y-2 min-w-0">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
              <span className="text-xs text-muted-foreground truncate">{s.label}</span>
            </div>
            <span className="text-xs font-bold tabular-nums shrink-0" style={{ color: s.color }}>{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

// ── Layout persistence ────────────────────────────────────────────────────
type StatCardId = 'total_products' | 'potential_revenue' | 'potential_profit' | 'total_cost';
type LeftWidgetId = 'recent_sales' | 'coach_insight' | 'recent_activity';
type SidebarWidgetId = 'product_status' | 'quick_actions' | 'top_categories' | 'low_stock';
type CoachWidgetId = 'coach_health' | 'growth_chart';
type WidgetId = StatCardId | LeftWidgetId | SidebarWidgetId | CoachWidgetId;

interface DashboardLayout {
  statOrder: StatCardId[];
  coachOrder: CoachWidgetId[];
  leftOrder: LeftWidgetId[];
  sidebarOrder: SidebarWidgetId[];
  hidden: WidgetId[];
}

const LAYOUT_KEY = 'priceme_dashboard_layout_v1';

const DEFAULT_LAYOUT: DashboardLayout = {
  statOrder: ['total_products', 'potential_revenue', 'potential_profit', 'total_cost'],
  coachOrder: ['coach_health', 'growth_chart'],
  leftOrder: ['recent_sales', 'coach_insight', 'recent_activity'],
  sidebarOrder: ['product_status', 'quick_actions', 'top_categories', 'low_stock'],
  hidden: [],
};

function loadLayout(): DashboardLayout {
  try {
    const raw = localStorage.getItem(LAYOUT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DashboardLayout;
      // Merge with defaults so new widgets added later are always included
      const allValidIds = [
        ...DEFAULT_LAYOUT.statOrder,
        ...DEFAULT_LAYOUT.coachOrder,
        ...DEFAULT_LAYOUT.leftOrder,
        ...DEFAULT_LAYOUT.sidebarOrder,
      ];
      return {
        statOrder: DEFAULT_LAYOUT.statOrder.slice().sort((a, b) =>
          (parsed.statOrder.indexOf(a) + 1 || 99) - (parsed.statOrder.indexOf(b) + 1 || 99)
        ),
        coachOrder: DEFAULT_LAYOUT.coachOrder.slice().sort((a, b) =>
          ((parsed.coachOrder ?? []).indexOf(a) + 1 || 99) - ((parsed.coachOrder ?? []).indexOf(b) + 1 || 99)
        ),
        leftOrder: DEFAULT_LAYOUT.leftOrder.slice().sort((a, b) =>
          (parsed.leftOrder.indexOf(a) + 1 || 99) - (parsed.leftOrder.indexOf(b) + 1 || 99)
        ),
        sidebarOrder: DEFAULT_LAYOUT.sidebarOrder.slice().sort((a, b) =>
          (parsed.sidebarOrder.indexOf(a) + 1 || 99) - (parsed.sidebarOrder.indexOf(b) + 1 || 99)
        ),
        hidden: (parsed.hidden || []).filter((id): id is WidgetId =>
          allValidIds.includes(id as WidgetId)
        ),
      };
    }
  } catch {}
  return DEFAULT_LAYOUT;
}
// ─────────────────────────────────────────────────────────────────────────────

// ── SortableWidget wrapper ────────────────────────────────────────────────
function SortableWidget({
  id,
  isEditing,
  isHidden,
  onToggle,
  children,
}: {
  id: string;
  isEditing: boolean;
  isHidden: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: !isEditing,
  });

  if (!isEditing && isHidden) return null;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'relative',
        isDragging && 'z-50 opacity-50 scale-[1.01] shadow-xl',
        isEditing && isHidden && 'opacity-40',
      )}
    >
      {/* Edit-mode ring */}
      {isEditing && (
        <div className={cn(
          'absolute inset-0 rounded-xl ring-2 pointer-events-none z-10 transition-colors',
          isHidden ? 'ring-dashed ring-border/50' : 'ring-primary/25',
        )} />
      )}
      {/* Edit-mode controls */}
      {isEditing && (
        <div className="absolute top-2 right-2 z-20 flex items-center gap-1">
          <button
            type="button"
            onClick={onToggle}
            className="h-6 w-6 rounded-md bg-background/95 backdrop-blur border border-border flex items-center justify-center hover:bg-muted transition-colors shadow-sm"
            title={isHidden ? 'Show' : 'Hide'}
          >
            {isHidden
              ? <EyeOff className="h-3 w-3 text-muted-foreground" />
              : <Eye className="h-3 w-3 text-foreground" />}
          </button>
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="h-6 w-6 rounded-md bg-background/95 backdrop-blur border border-border flex items-center justify-center cursor-grab active:cursor-grabbing hover:bg-muted transition-colors shadow-sm"
            title="Drag to reorder"
          >
            <GripVertical className="h-3 w-3 text-muted-foreground" />
          </button>
        </div>
      )}
      {children}
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

type ProductStatus = 'draft' | 'in_progress' | 'on_sale' | 'inactive';

// ── Date filter ────────────────────────────────────────────────────────────
type DatePreset = '7d' | '30d' | '3m' | '1y' | 'all';
const DATE_PRESET_LABELS: Record<DatePreset, string> = { '7d': '7d', '30d': '30d', '3m': '3m', '1y': '1y', all: 'All' };
function getDateFrom(preset: DatePreset): Date | null {
  const now = new Date();
  switch (preset) {
    case '7d':  { const d = new Date(now); d.setDate(d.getDate() - 7);   return d; }
    case '30d': { const d = new Date(now); d.setDate(d.getDate() - 30);  return d; }
    case '3m':  { const d = new Date(now); d.setMonth(d.getMonth() - 3); return d; }
    case '1y':  { const d = new Date(now); d.setFullYear(d.getFullYear() - 1); return d; }
    default: return null;
  }
}
// ─────────────────────────────────────────────────────────────────────────────

interface Product {
  id: number;
  name: string;
  sku: string | null;
  status: ProductStatus | null;
  batch_size: number;
  target_price: number | null;
  product_cost: number;
  profit: number | null;
  profit_margin: number | null;
  category_id?: number | null;
  created_at: string;
  updated_at: string;
}

export default function Home() {
  const { isAuthenticated, user } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAfterTax, setShowAfterTax] = useState(false);
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const { categories } = useCategories();
  const { profile, isProfileLoading, healthScore, isHealthScoreLoading, insights, isInsightsLoading } = useCoach();
  const { sales, isLoading: isSalesLoading, fetchSales } = useSales();
  const [nudgeDismissed, setNudgeDismissed] = useState(
    () => localStorage.getItem('cravio_coach_nudge_dismissed') === '1'
  );
  const showCoachNudge = !isProfileLoading && !profile && !nudgeDismissed;

  // ── Layout state ──────────────────────────────────────────────────────────
  const [layout, setLayout] = useState<DashboardLayout>(loadLayout);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout));
  }, [layout]);

  const isHidden = useCallback((id: WidgetId) => layout.hidden.includes(id), [layout.hidden]);

  const toggleHidden = useCallback((id: WidgetId) => {
    setLayout(prev => ({
      ...prev,
      hidden: prev.hidden.includes(id)
        ? prev.hidden.filter(h => h !== id)
        : [...prev.hidden, id],
    }));
  }, []);

  const resetLayout = useCallback(() => {
    setLayout(DEFAULT_LAYOUT);
  }, []);

  // ── DnD sensors ──────────────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleStatDragEnd = useCallback((e: DragEndEvent) => {
    const { active, over } = e;
    if (over && active.id !== over.id) {
      setLayout(prev => ({
        ...prev,
        statOrder: arrayMove(prev.statOrder, prev.statOrder.indexOf(String(active.id) as StatCardId), prev.statOrder.indexOf(String(over.id) as StatCardId)),
      }));
    }
  }, []);

  const handleCoachDragEnd = useCallback((e: DragEndEvent) => {
    const { active, over } = e;
    if (over && active.id !== over.id) {
      setLayout(prev => ({
        ...prev,
        coachOrder: arrayMove(prev.coachOrder, prev.coachOrder.indexOf(String(active.id) as CoachWidgetId), prev.coachOrder.indexOf(String(over.id) as CoachWidgetId)),
      }));
    }
  }, []);

  const handleLeftDragEnd = useCallback((e: DragEndEvent) => {
    const { active, over } = e;
    if (over && active.id !== over.id) {
      setLayout(prev => ({
        ...prev,
        leftOrder: arrayMove(prev.leftOrder, prev.leftOrder.indexOf(String(active.id) as LeftWidgetId), prev.leftOrder.indexOf(String(over.id) as LeftWidgetId)),
      }));
    }
  }, []);

  const handleSidebarDragEnd = useCallback((e: DragEndEvent) => {
    const { active, over } = e;
    if (over && active.id !== over.id) {
      setLayout(prev => ({
        ...prev,
        sidebarOrder: arrayMove(prev.sidebarOrder, prev.sidebarOrder.indexOf(String(active.id) as SidebarWidgetId), prev.sidebarOrder.indexOf(String(over.id) as SidebarWidgetId)),
      }));
    }
  }, []);
  // ─────────────────────────────────────────────────────────────────────────

  const handleNudgeDismiss = () => {
    localStorage.setItem('cravio_coach_nudge_dismissed', '1');
    setNudgeDismissed(true);
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchProducts();
      fetchSales();
    }
  }, [isAuthenticated, fetchSales]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/products');
      if (response.data.status === 'success') setProducts(response.data.data || []);
    } catch (error: any) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const analytics = useMemo(() => {
    const totalProducts = products.length;
    const onSaleProducts = products.filter(p => p.status === 'on_sale');
    const draftProducts = products.filter(p => p.status === 'draft');
    const inProgressProducts = products.filter(p => p.status === 'in_progress');
    const unpricedProducts = products.filter(p => p.target_price === null || p.target_price === 0);
    const pricedProducts = products.filter(p => p.target_price !== null && p.target_price > 0);

    const totalPotentialRevenue = products.reduce((sum, p) => sum + (p.target_price ?? 0) * (p.batch_size || 1), 0);
    const totalCost = products.reduce((sum, p) => sum + (typeof p.product_cost === 'number' ? p.product_cost : 0) * (p.batch_size || 1), 0);
    const totalPotentialProfit = totalPotentialRevenue - totalCost;

    const productsWithMargin = products.filter(p => p.profit_margin !== null);
    const averageMargin = productsWithMargin.length > 0
      ? productsWithMargin.reduce((sum, p) => sum + (p.profit_margin || 0), 0) / productsWithMargin.length
      : 0;

    const categoryStats = products.reduce((acc, p) => {
      const name = categories.find(c => c.id === p.category_id)?.name || 'Uncategorized';
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const sortedCategories = Object.entries(categoryStats).sort(([, a], [, b]) => b - a).slice(0, 5);

    return {
      totalProducts, onSaleProducts: onSaleProducts.length, draftProducts: draftProducts.length,
      inProgressProducts: inProgressProducts.length, unpricedProducts: unpricedProducts.length,
      pricedProducts: pricedProducts.length, totalPotentialRevenue, totalCost,
      totalPotentialProfit, averageMargin, productsWithMarginCount: productsWithMargin.length, sortedCategories,
    };
  }, [products, categories]);

  // ── Date-filtered product subsets (for chart + activity only) ────────────
  const chartProducts = useMemo(() => {
    const from = getDateFrom(datePreset);
    if (!from) return products;
    return products.filter(p => p.created_at && new Date(p.created_at) >= from);
  }, [products, datePreset]);

  const activityProducts = useMemo(() => {
    const from = getDateFrom(datePreset);
    if (!from) return products;
    return products.filter(p => p.updated_at && new Date(p.updated_at) >= from);
  }, [products, datePreset]);
  // ─────────────────────────────────────────────────────────────────────────

  const formatCurrencyValue = (value: number | null | undefined) =>
    value == null ? '-' : formatCurrency(value, settings.currency);

  const formatPercentage = (value: number | null | undefined) =>
    value == null ? '-' : `${value.toFixed(1)}%`;

  const taxRate = settings.tax_percentage || 0;
  const afterTaxPotentialProfit = analytics.totalPotentialProfit - Math.max(0, analytics.totalPotentialProfit) * (taxRate / 100);

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-36 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>
    );
  }

  const firstName = user?.name?.split(' ')[0] || user?.email?.split('@')[0] || '';
  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  // ── Stat card renderer ────────────────────────────────────────────────────
  const renderStatCard = (id: StatCardId) => {
    switch (id) {
      case 'total_products':
        return (
          <StatsCard
            title="Total Products"
            value={analytics.totalProducts}
            description={analytics.unpricedProducts > 0
              ? `${analytics.onSaleProducts} on sale · ${analytics.unpricedProducts} unpriced`
              : `${analytics.onSaleProducts} currently on sale`}
            icon={Package}
            variant="info"
          />
        );
      case 'potential_revenue':
        return (
          <StatsCard
            title="Potential Revenue"
            value={formatCurrencyValue(analytics.totalPotentialRevenue)}
            description={`${analytics.pricedProducts} of ${analytics.totalProducts} products priced`}
            icon={DollarSign}
            variant="success"
          />
        );
      case 'potential_profit':
        return (
          <StatsCard
            title={showAfterTax ? 'After-Tax Profit' : 'Potential Profit'}
            value={formatCurrencyValue(showAfterTax ? afterTaxPotentialProfit : analytics.totalPotentialProfit)}
            description={`Avg margin: ${formatPercentage(analytics.averageMargin)} across ${analytics.productsWithMarginCount} products`}
            icon={TrendingUp}
            variant={(showAfterTax ? afterTaxPotentialProfit : analytics.totalPotentialProfit) >= 0 ? 'purple' : 'danger'}
          />
        );
      case 'total_cost':
        return (
          <StatsCard
            title="Total Cost"
            value={formatCurrencyValue(analytics.totalCost)}
            description={`Across all ${analytics.totalProducts} products`}
            icon={ShoppingCart}
            variant="orange"
          />
        );
    }
  };

  // ── Left widget renderer ──────────────────────────────────────────────────
  const renderLeftWidget = (id: LeftWidgetId) => {
    switch (id) {
      case 'recent_sales':
        return (
          <SalesSummaryWidget
            sales={sales}
            isLoading={isSalesLoading}
            settings={settings}
            onNavigate={() => navigate('/on-sale')}
          />
        );
      case 'coach_insight':
        return (
          <CoachInsightWidget
            insights={insights}
            isLoading={isInsightsLoading}
            hasProfile={!!profile}
            onNavigate={() => navigate('/coach')}
          />
        );
      case 'recent_activity': return <RecentActivity products={activityProducts} loading={loading} />;
    }
  };

  // ── Coach widget renderer ─────────────────────────────────────────────────
  const renderCoachWidget = (id: CoachWidgetId) => {
    switch (id) {
      case 'coach_health':
        return (
          <CoachHealthWidget
            healthScore={healthScore}
            isLoading={isHealthScoreLoading}
            hasProfile={!!profile}
            onNavigate={() => navigate('/coach')}
          />
        );
      case 'growth_chart':
        return <GrowthChart products={chartProducts} />;
    }
  };

  // ── Sidebar widget renderer ───────────────────────────────────────────────
  const renderSidebarWidget = (id: SidebarWidgetId) => {
    switch (id) {
      case 'product_status':
        return (
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-foreground">Product Status</CardTitle>
              <CardDescription className="text-xs">Distribution across your catalog</CardDescription>
            </CardHeader>
            <CardContent>
              <DonutChart
                slices={[
                  { label: 'Draft',       value: analytics.draftProducts,     color: '#a1a1aa' },
                  { label: 'In Progress', value: analytics.inProgressProducts, color: '#f59e0b' },
                  { label: 'On Sale',     value: analytics.onSaleProducts,     color: '#10b981' },
                ]}
                emptyText="No products yet"
              />
            </CardContent>
          </Card>
        );
      case 'quick_actions':
        return (
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-foreground">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { label: 'Add New Product', description: 'Set costs & target price', icon: Plus, onClick: () => navigate('/products/add'), accent: 'hover:border-primary/40 hover:bg-primary/5', iconBg: 'bg-primary/10 text-primary' },
                { label: 'Manage Materials', description: 'Track your inventory', icon: Box, onClick: () => navigate('/materials'), accent: 'hover:border-sky-300 hover:bg-sky-50', iconBg: 'bg-sky-100 text-sky-600' },
                { label: 'View On Sale', description: 'Active listings', icon: Sparkles, onClick: () => navigate('/products?status=on_sale'), accent: 'hover:border-emerald-300 hover:bg-emerald-50', iconBg: 'bg-emerald-100 text-emerald-600' },
              ].map(({ label, description, icon: Icon, onClick, accent, iconBg }) => (
                <button
                  key={label}
                  onClick={onClick}
                  className={cn('w-full flex items-center gap-3 p-3 rounded-lg border border-border text-left transition-all duration-150 group', accent)}
                >
                  <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center shrink-0', iconBg)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground leading-none mb-0.5">{label}</p>
                    <p className="text-xs text-muted-foreground">{description}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0" />
                </button>
              ))}
            </CardContent>
          </Card>
        );
      case 'top_categories':
        return (
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-foreground">Top Categories</CardTitle>
              <CardDescription className="text-xs">By product volume</CardDescription>
            </CardHeader>
            <CardContent>
              <DonutChart
                slices={analytics.sortedCategories.map(([name, count], i) => ({
                  label: name,
                  value: count,
                  color: ['#c2410c', '#38bdf8', '#34d399', '#fdba74', '#a08060'][i] ?? '#a08060',
                }))}
                emptyText="No categories yet"
              />
            </CardContent>
          </Card>
        );
      case 'low_stock':
        return <LowStockAlerts />;
    }
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">

      {/* ── Welcome Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="font-display text-3xl font-semibold leading-tight tracking-tight text-foreground">
            {firstName ? `Good to see you, ${firstName}.` : 'Welcome back.'}
          </h2>
          <p className="text-muted-foreground mt-1.5 text-sm">
            Here's a snapshot of your pricing studio.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Date filter pill group */}
          <div className="flex items-center border border-border rounded-lg overflow-hidden">
            {(Object.keys(DATE_PRESET_LABELS) as DatePreset[]).map(preset => (
              <button
                key={preset}
                type="button"
                onClick={() => setDatePreset(preset)}
                className={cn(
                  'px-2.5 h-8 text-xs font-medium transition-colors',
                  preset !== 'all' && 'border-r border-border',
                  datePreset === preset
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted',
                )}
              >
                {DATE_PRESET_LABELS[preset]}
              </button>
            ))}
          </div>

          {taxRate > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAfterTax(v => !v)}
                    className="flex items-center gap-2 h-8 text-xs"
                  >
                    {showAfterTax
                      ? <ToggleRight className="h-3.5 w-3.5 text-primary" />
                      : <ToggleLeft className="h-3.5 w-3.5 text-muted-foreground" />}
                    {showAfterTax ? 'After Tax' : 'Pre-Tax'}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[220px]">
                  <p className="text-xs">
                    {showAfterTax
                      ? `Showing profit after ${taxRate}% income tax`
                      : `Toggle to see profit after ${taxRate}% income tax`}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Edit Layout button */}
          {isEditing ? (
            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={resetLayout}
                className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1.5"
              >
                <RotateCcw className="h-3 w-3" />
                Reset
              </Button>
              <Button
                size="sm"
                onClick={() => setIsEditing(false)}
                className="h-8 text-xs"
              >
                Done
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="h-8 text-xs gap-1.5"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              Edit Layout
            </Button>
          )}

          <div className="bg-muted/70 border border-border px-3 py-1.5 rounded-full text-xs text-muted-foreground">
            {currentDate}
          </div>
        </div>
      </div>

      {/* ── Edit mode banner ── */}
      {isEditing && (
        <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5 text-sm">
          <LayoutDashboard className="h-4 w-4 text-primary shrink-0" />
          <span className="text-foreground">
            Drag cards to reorder · click <Eye className="h-3.5 w-3.5 inline mx-0.5 align-middle" /> to show or <EyeOff className="h-3.5 w-3.5 inline mx-0.5 align-middle" /> to hide
          </span>
        </div>
      )}

      {/* ── Coach profile nudge ── */}
      {showCoachNudge && (
        <div className="flex items-center gap-3 rounded-xl border border-brand-500/25 bg-brand-100 px-4 py-3 text-brand-900 animate-in fade-in duration-300">
          <div className="h-8 w-8 rounded-lg bg-brand-500/15 flex items-center justify-center flex-shrink-0">
            <BrainCircuit className="h-4 w-4 text-brand-700" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium leading-snug">Get AI pricing insights built for your craft</p>
            <p className="text-xs text-brand-700/70 mt-0.5">Set up your Coach profile — takes 60 seconds.</p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="text-brand-700 hover:text-brand-900 hover:bg-brand-500/10 text-xs h-7 px-3 flex-shrink-0"
            onClick={() => navigate('/onboarding')}
          >
            Set up now
            <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Button>
          <button
            type="button"
            onClick={handleNudgeDismiss}
            className="text-brand-700/50 hover:text-brand-700 transition-colors flex-shrink-0 ml-1"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── Stats Grid ── */}
      {analytics.totalProducts === 0 && !isEditing ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="h-16 w-16 rounded-2xl bg-brand-100 flex items-center justify-center">
            <Package className="h-8 w-8 text-brand-700" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-1">No products yet</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Add your first product to start tracking costs, setting prices, and watching your margins.
            </p>
          </div>
          <Button onClick={() => navigate('/products/add')} className="mt-2">
            <Plus className="h-4 w-4 mr-2" />
            Add First Product
          </Button>
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleStatDragEnd}>
            <SortableContext items={layout.statOrder} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" data-tour="tour-stats-grid">
                {layout.statOrder.map(id => (
                  <SortableWidget
                    key={id}
                    id={id}
                    isEditing={isEditing}
                    isHidden={isHidden(id)}
                    onToggle={() => toggleHidden(id)}
                  >
                    {renderStatCard(id)}
                  </SortableWidget>
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {/* Coach cards row */}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleCoachDragEnd}>
            <SortableContext items={layout.coachOrder} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-1 md:grid-cols-[5fr_8fr] gap-4">
                {layout.coachOrder.map(id => (
                  <SortableWidget
                    key={id}
                    id={id}
                    isEditing={isEditing}
                    isHidden={isHidden(id)}
                    onToggle={() => toggleHidden(id)}
                  >
                    {renderCoachWidget(id)}
                  </SortableWidget>
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {/* Main content grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

            {/* Left column */}
            <div className="xl:col-span-2">
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleLeftDragEnd}>
                <SortableContext items={layout.leftOrder} strategy={verticalListSortingStrategy}>
                  <div className="space-y-6">
                    {layout.leftOrder.map(id => (
                      <SortableWidget
                        key={id}
                        id={id}
                        isEditing={isEditing}
                        isHidden={isHidden(id)}
                        onToggle={() => toggleHidden(id)}
                      >
                        {renderLeftWidget(id)}
                      </SortableWidget>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>

            {/* Right sidebar */}
            <div>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSidebarDragEnd}>
                <SortableContext items={layout.sidebarOrder} strategy={verticalListSortingStrategy}>
                  <div className="space-y-6">
                    {layout.sidebarOrder.map(id => (
                      <SortableWidget
                        key={id}
                        id={id}
                        isEditing={isEditing}
                        isHidden={isHidden(id)}
                        onToggle={() => toggleHidden(id)}
                      >
                        {renderSidebarWidget(id)}
                      </SortableWidget>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>

          </div>
        </>
      )}

    </div>
  );
}
