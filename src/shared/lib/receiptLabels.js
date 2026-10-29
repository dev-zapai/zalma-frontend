// Labels the receipt screens and the PDF share (bugs terminal_method_raw_code
// and pending_receipt_says_paid_by, 2026-10-28).

const METHOD_LABELS = {
  cash: 'Cash', card: 'Credit / Debit Card', upi: 'UPI', bank_transfer: 'Bank Transfer',
  online: 'Online Payment', other: 'Other',
};

const BANK_LABELS = { commbank: 'CommBank', anz: 'ANZ', nab: 'NAB', westpac: 'Westpac' };

// A terminal payment is stored as "terminal:<bank>:<terminal id>".
export function paymentMethodLabel(method) {
  if (!method) return '-';
  if (method === 'terminal' || method.startsWith('terminal:')) {
    const [, bank, tid] = method.split(':');
    const parts = [bank && (BANK_LABELS[bank] || bank), tid].filter(Boolean);
    return parts.length ? `EFTPOS terminal (${parts.join(', ')})` : 'EFTPOS terminal';
  }
  return METHOD_LABELS[method] || method;
}

// The words before the method: only a paid receipt says "Paid by".
export function paymentHeading(status) {
  if (status === 'paid') return 'Paid by:';
  if (status === 'partial') return 'Part paid by:';
  return 'Payment pending, to pay by:';
}
