import React from 'react';
import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { format, parseISO } from 'date-fns';
import { getCurrencySymbol } from '@/lib/currency';

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica', color: '#1e293b', backgroundColor: '#ffffff' },

  // Header
  headerBand: { flexDirection: 'row', alignItems: 'flex-start', borderBottomWidth: 2, borderBottomColor: '#2563EB', paddingBottom: 14, marginBottom: 14 },
  logo: { width: 54, height: 54, borderRadius: 6, marginRight: 14 },
  salonInfo: { flex: 1 },
  salonName: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: '#1e293b' },
  salonTagline: { fontSize: 9, color: '#64748b', marginTop: 2 },
  salonContact: { fontSize: 8, color: '#64748b', marginTop: 5 },
  salonAddress: { fontSize: 8, color: '#64748b', marginTop: 2 },

  // Receipt info row
  receiptBar: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#f8fafc', borderRadius: 6, padding: 10, marginBottom: 14 },
  receiptLabel: { fontSize: 8, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 },
  receiptValue: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#1e293b', marginTop: 2 },

  // Client & Pet
  clientPetRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14, paddingBottom: 10, borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0' },
  infoBlock: { flex: 1, marginRight: 10 },
  infoLabel: { fontSize: 8, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 },
  infoValue: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#1e293b', marginTop: 2 },
  infoSub: { fontSize: 8, color: '#64748b', marginTop: 1 },

  // Staff bar
  staffBar: { backgroundColor: '#eff6ff', borderRadius: 4, padding: 7, marginBottom: 14, flexDirection: 'row', alignItems: 'center' },
  staffLabel: { fontSize: 8, color: '#3b82f6', marginRight: 6 },
  staffName: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#1e40af' },

  // Section title
  sectionTitle: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#334155', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },

  // Services table
  table: { borderWidth: 0.5, borderColor: '#e2e8f0', borderRadius: 4, marginBottom: 14 },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: '#f1f5f9', paddingVertical: 6, paddingHorizontal: 8, borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0' },
  tableRow: { flexDirection: 'row', paddingVertical: 6, paddingHorizontal: 8, borderBottomWidth: 0.5, borderBottomColor: '#f1f5f9' },
  tableLastRow: { flexDirection: 'row', paddingVertical: 6, paddingHorizontal: 8 },
  tableHeader: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#64748b', textTransform: 'uppercase' },
  tableCell: { fontSize: 9, color: '#334155' },
  col1: { width: '5%' },
  col2: { width: '40%' },
  col3: { width: '15%' },
  col4: { width: '15%' },
  col5: { width: '10%' },
  col6: { width: '15%', textAlign: 'right' },

  // Totals
  totalsBox: { marginLeft: 'auto', width: '45%', marginBottom: 20 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  totalLabel: { fontSize: 9, color: '#64748b' },
  totalValue: { fontSize: 9, color: '#334155' },
  grandTotalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderTopWidth: 1, borderTopColor: '#1e293b', marginTop: 4 },
  grandTotalLabel: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#1e293b' },
  grandTotalValue: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#2563EB' },

  // Payment
  paymentBox: { backgroundColor: '#f0fdf4', borderRadius: 4, padding: 8, marginBottom: 20, flexDirection: 'row', alignItems: 'center' },
  paymentLabel: { fontSize: 8, color: '#166534', marginRight: 6 },
  paymentValue: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#15803d' },

  // Footer
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, borderTopWidth: 0.5, borderTopColor: '#e2e8f0', paddingTop: 10 },
  footerThank: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#1e293b', textAlign: 'center', marginBottom: 4 },
  footerNextVisit: { fontSize: 8, color: '#2563EB', textAlign: 'center', marginBottom: 4 },
  footerSocial: { fontSize: 7, color: '#94a3b8', textAlign: 'center', marginBottom: 3 },
  footerTerms: { fontSize: 7, color: '#cbd5e1', textAlign: 'center', lineHeight: 1.4 },
  footerMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  footerMetaText: { fontSize: 7, color: '#94a3b8' },
});

function formatAmt(amount, symbol) {
  const num = parseFloat(amount) || 0;
  return `${symbol}${num.toFixed(2)}`;
}

export default function ServiceReceiptPDF({ receipt, appointment, apptServices, tenant, currency }) {
  const config = tenant?.settings?.receipt_config || {};
  const showLogo = config.show_logo !== false && tenant?.logo_url;
  const tagline = config.tagline || tenant?.description || '';
  const footerText = config.footer_text || `Thank you for choosing ${tenant?.name || 'us'}!`;
  const nextVisitMsg = config.next_visit_message || '';
  const socialHandles = config.social_handles || '';
  const terms = config.terms || '';

  // Prefer the receipt's stored currency over the tenant default — a
  // historical receipt issued in GBP must keep its symbol even if the
  // tenant later switches to USD. Caller (`GroomingAppointmentDetailPage`)
  // already passes `displayCurrency` which honours this rule, but the
  // fallback chain protects any other call site that passes the tenant
  // currency directly.
  const sym = getCurrencySymbol(receipt?.currency || currency || 'AUD');
  const receiptDate = receipt?.created_at
    ? format(parseISO(receipt.created_at), 'dd MMM yyyy, h:mm a')
    : format(new Date(), 'dd MMM yyyy');

  const addressParts = [tenant?.address, tenant?.city, tenant?.state, tenant?.country].filter(Boolean);

  const paymentMethodDisplay = {
    cash: 'Cash', card: 'Credit / Debit Card', upi: 'UPI', bank_transfer: 'Bank Transfer',
    online: 'Online Payment', other: 'Other',
  }[receipt?.payment_method] || receipt?.payment_method || '-';

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* ── HEADER ── */}
        <View style={styles.headerBand}>
          {showLogo && <Image src={tenant.logo_url} style={styles.logo} />}
          <View style={styles.salonInfo}>
            <Text style={styles.salonName}>{tenant?.name || 'Salon'}</Text>
            {tagline ? <Text style={styles.salonTagline}>{tagline}</Text> : null}
            <Text style={styles.salonContact}>
              {[tenant?.phone, tenant?.email].filter(Boolean).join('  ·  ')}
            </Text>
            {addressParts.length > 0 && (
              <Text style={styles.salonAddress}>{addressParts.join(', ')}</Text>
            )}
          </View>
        </View>

        {/* ── RECEIPT META ── */}
        <View style={styles.receiptBar}>
          <View>
            <Text style={styles.receiptLabel}>Receipt #</Text>
            <Text style={styles.receiptValue}>{receipt?.receipt_number || '-'}</Text>
          </View>
          <View>
            <Text style={styles.receiptLabel}>Date</Text>
            <Text style={styles.receiptValue}>{receiptDate}</Text>
          </View>
          <View>
            <Text style={styles.receiptLabel}>Payment Method</Text>
            <Text style={styles.receiptValue}>{paymentMethodDisplay}</Text>
          </View>
          <View>
            <Text style={styles.receiptLabel}>Status</Text>
            <Text style={[styles.receiptValue, { color: receipt?.payment_status === 'paid' ? '#16a34a' : '#d97706' }]}>
              {receipt?.payment_status?.toUpperCase() || 'PENDING'}
            </Text>
          </View>
        </View>

        {/* ── CLIENT & PET ── */}
        <View style={styles.clientPetRow}>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>Client</Text>
            <Text style={styles.infoValue}>{appointment?.client?.full_name || '-'}</Text>
            {appointment?.client?.phone && (
              <Text style={styles.infoSub}>{appointment.client.phone}</Text>
            )}
            {appointment?.client?.email && (
              <Text style={styles.infoSub}>{appointment.client.email}</Text>
            )}
          </View>
          {appointment?.pet && (
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>Pet</Text>
              <Text style={styles.infoValue}>{appointment.pet.name}</Text>
              <Text style={styles.infoSub}>
                {[appointment.pet.species, appointment.pet.breed].filter(Boolean).join(' · ')}
              </Text>
              {appointment.pet.weight && (
                <Text style={styles.infoSub}>Weight: {appointment.pet.weight} kg</Text>
              )}
            </View>
          )}
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>Service Date</Text>
            <Text style={styles.infoValue}>
              {appointment?.start_time
                ? format(parseISO(appointment.start_time), 'dd MMM yyyy')
                : '-'}
            </Text>
            <Text style={styles.infoSub}>
              {appointment?.start_time
                ? format(parseISO(appointment.start_time), 'h:mm a')
                : ''}
              {appointment?.end_time
                ? ` – ${format(parseISO(appointment.end_time), 'h:mm a')}`
                : ''}
            </Text>
          </View>
        </View>

        {/* ── GROOMERS ── */}
        {(() => {
          const staffNames = [...new Set(
            (apptServices || []).map(s => s.staff_name).filter(Boolean)
          )];
          if (staffNames.length === 0 && appointment?.staff?.full_name) {
            staffNames.push(appointment.staff.full_name);
          }
          return staffNames.length > 0 ? (
            <View style={styles.staffBar}>
              <Text style={styles.staffLabel}>{staffNames.length > 1 ? 'Groomers:' : 'Groomer:'}</Text>
              <Text style={styles.staffName}>{staffNames.join(', ')}</Text>
            </View>
          ) : null;
        })()}

        {/* ── SERVICES TABLE ── */}
        <Text style={styles.sectionTitle}>Services Performed</Text>
        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableHeader, styles.col1]}>#</Text>
            <Text style={[styles.tableHeader, styles.col2]}>Service</Text>
            <Text style={[styles.tableHeader, styles.col3]}>Duration</Text>
            <Text style={[styles.tableHeader, styles.col4]}>Unit Price</Text>
            <Text style={[styles.tableHeader, styles.col5]}>Qty</Text>
            <Text style={[styles.tableHeader, styles.col6]}>Total</Text>
          </View>
          {(apptServices || []).map((item, idx) => (
            <View
              key={item.id || idx}
              style={idx === (apptServices.length - 1) ? styles.tableLastRow : styles.tableRow}
            >
              <Text style={[styles.tableCell, styles.col1]}>{idx + 1}</Text>
              <View style={styles.col2}>
                <Text style={styles.tableCell}>{item.name}</Text>
                {item.staff_name && <Text style={{ fontSize: 7, color: '#94a3b8' }}>by {item.staff_name}</Text>}
              </View>
              <Text style={[styles.tableCell, styles.col3]}>
                {item.duration_minutes ? `${item.duration_minutes} min` : '-'}
              </Text>
              <Text style={[styles.tableCell, styles.col4]}>{formatAmt(item.unit_price, sym)}</Text>
              <Text style={[styles.tableCell, styles.col5]}>{item.quantity}</Text>
              <Text style={[styles.tableCell, styles.col6, { fontFamily: 'Helvetica-Bold' }]}>
                {formatAmt(item.total, sym)}
              </Text>
            </View>
          ))}
        </View>

        {/* ── TOTALS ── */}
        <View style={styles.totalsBox}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{formatAmt(receipt?.subtotal, sym)}</Text>
          </View>
          {parseFloat(receipt?.tax_rate) > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax ({receipt?.tax_rate}%)</Text>
              <Text style={styles.totalValue}>{formatAmt(receipt?.tax_amount, sym)}</Text>
            </View>
          )}
          {parseFloat(receipt?.discount_amount) > 0 && (
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: '#16a34a' }]}>Discount</Text>
              <Text style={[styles.totalValue, { color: '#16a34a' }]}>- {formatAmt(receipt?.discount_amount, sym)}</Text>
            </View>
          )}
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>TOTAL</Text>
            <Text style={styles.grandTotalValue}>{formatAmt(receipt?.total, sym)}</Text>
          </View>
        </View>

        {/* ── PAYMENT ── */}
        <View style={styles.paymentBox}>
          <Text style={styles.paymentLabel}>Paid by:</Text>
          <Text style={styles.paymentValue}>{paymentMethodDisplay}</Text>
          {receipt?.notes && (
            <Text style={[styles.paymentLabel, { marginLeft: 12 }]}>Note: {receipt.notes}</Text>
          )}
        </View>

        {/* ── FOOTER ── */}
        <View style={styles.footer}>
          <Text style={styles.footerThank}>{footerText}</Text>
          {nextVisitMsg ? <Text style={styles.footerNextVisit}>{nextVisitMsg}</Text> : null}
          {socialHandles ? <Text style={styles.footerSocial}>{socialHandles}</Text> : null}
          {terms ? <Text style={styles.footerTerms}>{terms}</Text> : null}
          <View style={styles.footerMeta}>
            <Text style={styles.footerMetaText}>Receipt #{receipt?.receipt_number}</Text>
            <Text style={styles.footerMetaText}>
              Generated: {format(new Date(), 'dd MMM yyyy')}
            </Text>
            <Text style={styles.footerMetaText}>{tenant?.name}</Text>
          </View>
        </View>

      </Page>
    </Document>
  );
}
