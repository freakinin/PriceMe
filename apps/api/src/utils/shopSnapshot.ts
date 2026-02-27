import { db } from './db.js';
import type { ShopSnapshot, ShopSnapshotProduct } from '@priceme/shared';

export async function getShopSnapshot(userId: number): Promise<ShopSnapshot> {
  const [productsResult, settingsResult, platformResult] = await Promise.all([
    db`
      SELECT
        p.id,
        p.name,
        p.status,
        p.batch_size,
        p.target_price,
        p.pricing_method,
        p.category,
        -- product cost per unit
        COALESCE((SELECT SUM(m.total_cost) FROM materials m WHERE m.product_id = p.id), 0)
        + COALESCE((SELECT SUM(CASE WHEN l.per_unit THEN l.total_cost
                                    ELSE l.total_cost / NULLIF(p.batch_size, 0) END)
                    FROM labor_costs l WHERE l.product_id = p.id), 0)
        + COALESCE((SELECT SUM(CASE WHEN o.per_unit THEN o.total_cost
                                    ELSE o.total_cost / NULLIF(p.batch_size, 0) END)
                    FROM other_costs o WHERE o.product_id = p.id), 0) AS product_cost,
        -- sales last 90 days
        COALESCE((SELECT SUM(s.quantity)
                  FROM sales s
                  WHERE s.product_id = p.id
                    AND s.user_id = ${userId}
                    AND s.sale_date >= NOW() - INTERVAL '90 days'), 0) AS units_sold_90d,
        COALESCE((SELECT SUM(s.quantity * s.unit_price - s.discount_amount)
                  FROM sales s
                  WHERE s.product_id = p.id
                    AND s.user_id = ${userId}
                    AND s.sale_date >= NOW() - INTERVAL '90 days'), 0) AS revenue_90d,
        -- competitor data
        (SELECT COUNT(*)::int
         FROM tracked_products tp
         WHERE tp.linked_product_id = p.id) AS competitor_count,
        (SELECT AVG(tp.current_price)
         FROM tracked_products tp
         WHERE tp.linked_product_id = p.id
           AND tp.current_price IS NOT NULL) AS avg_competitor_price
      FROM products p
      WHERE p.user_id = ${userId}
      ORDER BY revenue_90d DESC
    `,
    db`
      SELECT currency, revenue_goal, labor_hourly_cost, seller_country
      FROM user_settings
      WHERE user_id = ${userId}
    `,
    db`
      SELECT platform, SUM(quantity * unit_price - discount_amount)::numeric AS revenue
      FROM sales
      WHERE user_id = ${userId}
        AND sale_date >= NOW() - INTERVAL '90 days'
        AND platform IS NOT NULL
      GROUP BY platform
      ORDER BY revenue DESC
      LIMIT 5
    `,
  ]);

  const productRows = Array.isArray(productsResult) ? productsResult : productsResult.rows || [];
  const settingsRows = Array.isArray(settingsResult) ? settingsResult : settingsResult.rows || [];
  const platformRows = Array.isArray(platformResult) ? platformResult : platformResult.rows || [];

  const settings = settingsRows[0] ?? {};

  const products: ShopSnapshotProduct[] = productRows.map((p: any) => {
    const cost = Number(p.product_cost ?? 0);
    const price = p.target_price != null ? Number(p.target_price) : null;
    const margin = price != null && price > 0 ? ((price - cost) / price) * 100 : null;

    return {
      id: p.id,
      name: p.name,
      status: p.status,
      batch_size: Number(p.batch_size ?? 1),
      target_price: price,
      product_cost: cost,
      profit_margin: margin != null ? Math.round(margin * 10) / 10 : null,
      pricing_method: p.pricing_method ?? null,
      category: p.category ?? null,
      units_sold_90d: Number(p.units_sold_90d ?? 0),
      revenue_90d: Number(p.revenue_90d ?? 0),
      competitor_count: Number(p.competitor_count ?? 0),
      avg_competitor_price: p.avg_competitor_price != null ? Number(p.avg_competitor_price) : null,
    };
  });

  const active = products.filter((p) => p.status === 'on_sale');
  const margins = active.filter((p) => p.profit_margin != null).map((p) => p.profit_margin as number);
  const avg_margin = margins.length > 0
    ? Math.round(margins.reduce((a, b) => a + b, 0) / margins.length)
    : null;

  const total_revenue_90d = products.reduce((s, p) => s + p.revenue_90d, 0);
  const total_units_90d = products.reduce((s, p) => s + p.units_sold_90d, 0);
  const bestSeller = products.length > 0
    ? products.reduce((best, p) => (p.revenue_90d > (best?.revenue_90d ?? 0) ? p : best), products[0])
    : null;

  return {
    currency: settings.currency ?? 'USD',
    revenue_goal: settings.revenue_goal != null ? Number(settings.revenue_goal) : null,
    labor_hourly_cost: settings.labor_hourly_cost != null ? Number(settings.labor_hourly_cost) : null,
    seller_country: settings.seller_country ?? null,
    products,
    product_count: products.length,
    active_product_count: active.length,
    avg_margin,
    sales_summary: {
      total_revenue_90d,
      total_units_90d,
      best_selling_product_name: bestSeller?.name ?? null,
      platform_breakdown: platformRows.map((p: any) => ({
        platform: p.platform,
        revenue: Number(p.revenue),
      })),
    },
  };
}
