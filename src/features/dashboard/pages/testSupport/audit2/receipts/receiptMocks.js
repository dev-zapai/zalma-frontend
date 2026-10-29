// Shared jest.mock set for the detail page receipt probes. Call at the top of
// a probe file (jest hoists jest.mock calls inside this function too, because
// babel-jest hoists any call named jest.mock in the module scope only; so we
// keep the calls in each file and only share data here).
export const receiptFixture = (overrides = {}) => ({
  id: 'r1', receipt_number: 'R-0007', subtotal: 80, tax_rate: 10, tax_amount: 8,
  discount_amount: 0, discount_percent: 0, total: 88, currency: 'AUD',
  payment_method: 'cash', payment_status: 'pending', notes: '',
  created_at: '2026-11-02T03:00:00+00:00', ...overrides,
});

export const buttonsText = (root) => [...root.querySelectorAll('button')].map(b => b.textContent.replace(/\s+/g, ' ').trim());

export const grandTotalText = (root) => {
  const d = [...root.querySelectorAll('div')].find(x => x.textContent.startsWith('Grand Total') && x.children.length === 2);
  return d ? d.textContent : null;
};
