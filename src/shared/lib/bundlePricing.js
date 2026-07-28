// Bundle-aware pricing - display-side mirror of the backend's
// app/solutions/grooming/bundle_pricing.py. The BACKEND is authoritative
// (multi-book recomputes prices from the catalog and applies bundles
// server-side); this mirror exists so the wizard can show the same total
// and savings the server will charge, before booking.

function countBy(ids) {
  const m = {};
  ids.forEach(id => { m[id] = (m[id] || 0) + 1; });
  return m;
}

function fits(pool, items) {
  return Object.entries(items).every(([id, n]) => (pool[id] || 0) >= n);
}

/**
 * serviceIds: selected service ids (occurrences = quantity)
 * priceByService: {id: catalogPrice}
 * bundles: [{id, name, bundle_price, items: [{service_id}] }] - the
 *          /service-bundles response shape.
 */
export function computeBundlePricing(serviceIds, priceByService, bundles) {
  const pool = countBy(serviceIds);
  const undiscountedTotal = serviceIds.reduce((s, id) => s + (priceByService[id] || 0), 0);

  const candidates = (bundles || [])
    .map(b => {
      const itemIds = (b.items || []).map(i => i.service_id).filter(Boolean);
      const memberTotal = itemIds.reduce((s, id) => s + (priceByService[id] || 0), 0);
      const bundlePrice = Number(b.bundle_price || 0);
      return {
        bundleId: b.id, name: b.name, itemIds,
        items: countBy(itemIds), bundlePrice,
        savings: Math.round((memberTotal - bundlePrice) * 100) / 100,
      };
    })
    .filter(c => c.itemIds.length > 0 && c.savings > 0)
    .sort((a, b) => b.savings - a.savings || String(a.name).localeCompare(String(b.name)));

  const applied = [];
  candidates.forEach(c => {
    while (fits(pool, c.items)) {
      Object.entries(c.items).forEach(([id, n]) => { pool[id] -= n; });
      applied.push(c);
      if (!fits(pool, c.items)) break;
    }
  });

  const bundledTotal = applied.reduce((s, c) => s + c.bundlePrice, 0);
  const looseTotal = Object.entries(pool)
    .reduce((s, [id, n]) => s + n * (priceByService[id] || 0), 0);
  const total = Math.round((bundledTotal + looseTotal) * 100) / 100;

  return {
    appliedBundles: applied.map(c => ({
      bundleId: c.bundleId, name: c.name,
      bundlePrice: c.bundlePrice, savings: c.savings,
    })),
    total,
    undiscountedTotal: Math.round(undiscountedTotal * 100) / 100,
    savings: Math.round((undiscountedTotal - total) * 100) / 100,
  };
}

/**
 * Bundles worth suggesting: they OVERLAP the current selection but are not
 * fully covered yet (so not auto-applied), and completing them would save
 * money. Sorted by how close the selection already is.
 */
export function recommendBundles(serviceIds, priceByService, bundles) {
  const selected = new Set(serviceIds);
  const { appliedBundles } = computeBundlePricing(serviceIds, priceByService, bundles);
  const appliedIds = new Set(appliedBundles.map(b => b.bundleId));

  return (bundles || [])
    .map(b => {
      const itemIds = [...new Set((b.items || []).map(i => i.service_id).filter(Boolean))];
      const overlap = itemIds.filter(id => selected.has(id));
      const missing = itemIds.filter(id => !selected.has(id));
      const memberTotal = itemIds.reduce((s, id) => s + (priceByService[id] || 0), 0);
      const savings = Math.round((memberTotal - Number(b.bundle_price || 0)) * 100) / 100;
      return { bundle: b, itemIds, overlap, missing, savings };
    })
    .filter(r =>
      !appliedIds.has(r.bundle.id)
      && r.overlap.length > 0
      && r.missing.length > 0
      && r.savings > 0)
    .sort((a, b) => a.missing.length - b.missing.length || b.savings - a.savings);
}
