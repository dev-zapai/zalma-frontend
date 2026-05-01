import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { formatPrice, getCurrencySymbol } from '@/lib/currency';
import DownloadReceipt from '@/components/DownloadReceipt';

/**
 * ReceiptViewPage - HTML mirror of ServiceReceiptPDF.
 *
 * Every section, field, and label here matches the PDF component
 * (src/components/ServiceReceiptPDF.jsx) so the on-screen view and
 * the downloaded PDF are visually consistent. If you add a field to
 * the PDF, add it here too.
 */
export default function ReceiptViewPage() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const [appt, setAppt] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [currency, setCurrency] = useState('AUD');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/g/appointments/${appointmentId}`),
      api.get('/tenant/me'),
    ]).then(([apptRes, tenantRes]) => {
      setAppt(apptRes.data);
      setTenant(tenantRes.data);
      setCurrency(tenantRes.data?.settings?.currency || 'AUD');
    }).catch(e => console.error(e))
      .finally(() => setLoading(false));
  }, [appointmentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const receipt = appt?.receipt;
  if (!receipt) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-400">No receipt found for this appointment</p>
        <Button variant="outline" onClick={() => navigate(-1)} className="mt-4">Go Back</Button>
      </div>
    );
  }

  const config = tenant?.settings?.receipt_config || {};
  const apptServices = appt.services_list || [];
  const sym = getCurrencySymbol(receipt.currency || currency);
  const fmt = (v) => `${sym}${(parseFloat(v) || 0).toFixed(2)}`;

  const showLogo = config.show_logo !== false && tenant?.logo_url;
  const tagline = config.tagline || tenant?.description || '';
  const footerText = config.footer_text || `Thank you for choosing ${tenant?.name || 'us'}!`;
  const addressParts = [tenant?.address, tenant?.city, tenant?.state, tenant?.country].filter(Boolean);

  const receiptDate = receipt.created_at
    ? format(parseISO(receipt.created_at), 'dd MMM yyyy, h:mm a')
    : format(new Date(), 'dd MMM yyyy');

  const paymentMethodDisplay = {
    cash: 'Cash', card: 'Credit / Debit Card', upi: 'UPI', bank_transfer: 'Bank Transfer',
    online: 'Online Payment', other: 'Other',
  }[receipt.payment_method] || receipt.payment_method || '-';

  // Groomer names — from per-service staff, fallback to appointment-level staff
  const staffNames = [...new Set(
    apptServices.map(s => s.staff_name).filter(Boolean)
  )];
  if (staffNames.length === 0 && appt.staff?.full_name) {
    staffNames.push(appt.staff.full_name);
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header - hidden when printing */}
      <div className="flex items-center justify-between print:hidden">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
        </Button>
        <DownloadReceipt
          receipt={receipt}
          appointment={appt}
          apptServices={apptServices}
          tenant={tenant}
          currency={currency}
        />
      </div>

      {/* Receipt card - mirrors ServiceReceiptPDF section by section */}
      <Card className="rounded-xl border-slate-200/60 max-w-2xl mx-auto print:border-0 print:shadow-none print:max-w-full">
        <CardContent className="p-8 print:p-0">

          {/* ── HEADER (salon info) ── matches PDF headerBand */}
          <div className="flex items-start gap-4 pb-4 mb-4 border-b-2 border-primary">
            {showLogo && (
              <img src={tenant.logo_url} alt={tenant.name} className="w-14 h-14 rounded-md object-contain" />
            )}
            <div className="flex-1">
              <h1 className="text-xl font-bold text-slate-900">{tenant?.name || 'Salon'}</h1>
              {tagline && <p className="text-xs text-slate-500 mt-0.5">{tagline}</p>}
              <p className="text-xs text-slate-500 mt-1">
                {[tenant?.phone, tenant?.email].filter(Boolean).join('  ·  ')}
              </p>
              {addressParts.length > 0 && (
                <p className="text-xs text-slate-500">{addressParts.join(', ')}</p>
              )}
              {config.abn && <p className="text-xs text-slate-500">ABN: {config.abn}</p>}
            </div>
          </div>

          {/* ── RECEIPT META ── matches PDF receiptBar */}
          <div className="flex justify-between bg-slate-50 rounded-md p-3 mb-4 text-sm">
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">Receipt #</p>
              <p className="font-bold text-slate-900 mt-0.5">{receipt.receipt_number || '-'}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">Date</p>
              <p className="font-bold text-slate-900 mt-0.5">{receiptDate}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">Payment Method</p>
              <p className="font-bold text-slate-900 mt-0.5">{paymentMethodDisplay}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">Status</p>
              <p className={`font-bold mt-0.5 ${receipt.payment_status === 'paid' ? 'text-green-600' : 'text-amber-600'}`}>
                {receipt.payment_status?.toUpperCase() || 'PENDING'}
              </p>
            </div>
          </div>

          {/* ── CLIENT & PET & SERVICE DATE ── matches PDF clientPetRow */}
          <div className="flex justify-between mb-4 pb-3 border-b border-slate-200 text-sm">
            <div className="flex-1">
              <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">Client</p>
              <p className="font-bold text-slate-900 mt-0.5">{appt.client?.full_name || '-'}</p>
              {appt.client?.phone && <p className="text-xs text-slate-500">{appt.client.phone}</p>}
              {appt.client?.email && <p className="text-xs text-slate-500">{appt.client.email}</p>}
            </div>
            {appt.pet && (
              <div className="flex-1">
                <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">Pet</p>
                <p className="font-bold text-slate-900 mt-0.5">{appt.pet.name}</p>
                <p className="text-xs text-slate-500">
                  {[appt.pet.species, appt.pet.breed].filter(Boolean).join(' · ')}
                </p>
                {appt.pet.weight && <p className="text-xs text-slate-500">Weight: {appt.pet.weight} kg</p>}
              </div>
            )}
            <div className="flex-1">
              <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">Service Date</p>
              <p className="font-bold text-slate-900 mt-0.5">
                {appt.start_time ? format(parseISO(appt.start_time), 'dd MMM yyyy') : '-'}
              </p>
              <p className="text-xs text-slate-500">
                {appt.start_time ? format(parseISO(appt.start_time), 'h:mm a') : ''}
                {appt.end_time ? ` – ${format(parseISO(appt.end_time), 'h:mm a')}` : ''}
              </p>
            </div>
          </div>

          {/* ── GROOMER ── matches PDF staffBar */}
          {staffNames.length > 0 && (
            <div className="bg-blue-50 rounded-md px-3 py-2 mb-4 flex items-center gap-2">
              <span className="text-xs text-blue-500 font-semibold">{staffNames.length > 1 ? 'Groomers:' : 'Groomer:'}</span>
              <span className="text-sm font-bold text-blue-800">{staffNames.join(', ')}</span>
            </div>
          )}

          {/* ── SERVICES TABLE ── matches PDF table */}
          <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">Services Performed</p>
          <div className="border border-slate-200 rounded-md mb-4 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-100 text-left">
                  <th className="py-2 px-3 text-[10px] text-slate-500 uppercase font-bold w-[5%]">#</th>
                  <th className="py-2 px-3 text-[10px] text-slate-500 uppercase font-bold w-[40%]">Service</th>
                  <th className="py-2 px-3 text-[10px] text-slate-500 uppercase font-bold w-[15%]">Duration</th>
                  <th className="py-2 px-3 text-[10px] text-slate-500 uppercase font-bold w-[15%]">Unit Price</th>
                  <th className="py-2 px-3 text-[10px] text-slate-500 uppercase font-bold w-[10%]">Qty</th>
                  <th className="py-2 px-3 text-[10px] text-slate-500 uppercase font-bold w-[15%] text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {apptServices.map((item, idx) => (
                  <tr key={item.id || idx} className="border-t border-slate-100">
                    <td className="py-2 px-3 text-slate-600">{idx + 1}</td>
                    <td className="py-2 px-3">
                      <span className="text-slate-800">{item.name}</span>
                      {item.staff_name && <span className="block text-[10px] text-slate-400">by {item.staff_name}</span>}
                    </td>
                    <td className="py-2 px-3 text-slate-600">{item.duration_minutes ? `${item.duration_minutes} min` : '-'}</td>
                    <td className="py-2 px-3 text-slate-600">{fmt(item.unit_price)}</td>
                    <td className="py-2 px-3 text-slate-600">{item.quantity}</td>
                    <td className="py-2 px-3 text-right font-bold text-slate-900">{fmt(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── TOTALS ── matches PDF totalsBox */}
          <div className="ml-auto w-1/2 mb-6">
            <div className="flex justify-between py-1 text-sm">
              <span className="text-slate-500">Subtotal</span>
              <span className="text-slate-700">{fmt(receipt.subtotal)}</span>
            </div>
            {parseFloat(receipt.tax_rate) > 0 && (
              <div className="flex justify-between py-1 text-sm">
                <span className="text-slate-500">Tax ({receipt.tax_rate}%)</span>
                <span className="text-slate-700">{fmt(receipt.tax_amount)}</span>
              </div>
            )}
            {parseFloat(receipt.discount_amount) > 0 && (
              <div className="flex justify-between py-1 text-sm">
                <span className="text-green-600">Discount</span>
                <span className="text-green-600">- {fmt(receipt.discount_amount)}</span>
              </div>
            )}
            <div className="flex justify-between py-2 mt-1 border-t border-slate-900 text-base">
              <span className="font-bold text-slate-900">TOTAL</span>
              <span className="font-bold text-primary">{fmt(receipt.total)}</span>
            </div>
          </div>

          {/* ── PAYMENT ── matches PDF paymentBox */}
          <div className="bg-green-50 rounded-md px-3 py-2 mb-6 flex items-center gap-2 text-sm">
            <span className="text-xs text-green-700 font-semibold">Paid by:</span>
            <span className="font-bold text-green-800">{paymentMethodDisplay}</span>
            {receipt.notes && (
              <span className="text-xs text-green-600 ml-3">Note: {receipt.notes}</span>
            )}
          </div>

          {/* ── FOOTER ── matches PDF footer */}
          <div className="border-t border-slate-200 pt-4 text-center space-y-1">
            <p className="text-sm font-bold text-slate-900">{footerText}</p>
            {config.next_visit_message && <p className="text-xs text-primary">{config.next_visit_message}</p>}
            {config.social_handles && <p className="text-[11px] text-slate-400">{config.social_handles}</p>}
            {config.terms && <p className="text-[10px] text-slate-300 leading-relaxed mt-2">{config.terms}</p>}
            <div className="flex justify-between mt-3 text-[10px] text-slate-400">
              <span>Receipt #{receipt.receipt_number}</span>
              <span>Generated: {format(new Date(), 'dd MMM yyyy')}</span>
              <span>{tenant?.name}</span>
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
