import React from 'react';
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { getCurrencySymbol } from '@/lib/currency';

/**
 * ATO-compliant payslip PDF.
 *
 * Mandatory fields per Fair Work Act 2009 s536:
 *   - Employer name + ABN
 *   - Employee name
 *   - Pay period + payment date
 *   - Gross pay (itemised: base, overtime, allowances)
 *   - Deductions (itemised: PAYG, other)
 *   - Net pay
 *   - Super contribution
 *   - Leave balances (if applicable)
 */

const s = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica', color: '#1e293b' },
  header: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 2, borderBottomColor: '#2563EB', paddingBottom: 12, marginBottom: 16 },
  title: { fontSize: 18, fontFamily: 'Helvetica-Bold' },
  subtitle: { fontSize: 8, color: '#64748b', marginTop: 2 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#f8fafc', borderRadius: 4, padding: 8, marginBottom: 12 },
  metaLabel: { fontSize: 7, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 },
  metaValue: { fontSize: 9, fontFamily: 'Helvetica-Bold', marginTop: 1 },
  section: { marginBottom: 12 },
  sectionTitle: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3, borderBottomWidth: 0.5, borderBottomColor: '#f1f5f9' },
  label: { fontSize: 9, color: '#334155' },
  value: { fontSize: 9, color: '#334155' },
  boldValue: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#1e293b' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderTopWidth: 1, borderTopColor: '#1e293b', marginTop: 4 },
  totalLabel: { fontSize: 11, fontFamily: 'Helvetica-Bold' },
  totalValue: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#2563EB' },
  ytdBox: { backgroundColor: '#f0f9ff', borderRadius: 4, padding: 8, marginTop: 12 },
  ytdTitle: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#0369a1', marginBottom: 4 },
  ytdRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  ytdLabel: { fontSize: 8, color: '#0369a1' },
  ytdValue: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#0369a1' },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, borderTopWidth: 0.5, borderTopColor: '#e2e8f0', paddingTop: 8 },
  footerText: { fontSize: 7, color: '#94a3b8', textAlign: 'center' },
});

function fmt(amount, sym) {
  return `${sym}${(parseFloat(amount) || 0).toFixed(2)}`;
}

export default function PayslipPDF({ payslip, tenant, currency }) {
  const sym = getCurrencySymbol(currency || 'AUD');
  const config = tenant?.settings?.receipt_config || {};

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.title}>{tenant?.name || 'Employer'}</Text>
            {config.abn && <Text style={s.subtitle}>ABN: {config.abn}</Text>}
            {tenant?.address && <Text style={s.subtitle}>{tenant.address}</Text>}
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#2563EB' }}>PAYSLIP</Text>
            <Text style={s.subtitle}>Confidential</Text>
          </View>
        </View>

        {/* Employee + Period meta */}
        <View style={s.metaRow}>
          <View>
            <Text style={s.metaLabel}>Employee</Text>
            <Text style={s.metaValue}>{payslip.staff_name}</Text>
            {payslip.staff_role && <Text style={s.subtitle}>{payslip.staff_role}</Text>}
          </View>
          <View>
            <Text style={s.metaLabel}>Employment Type</Text>
            <Text style={s.metaValue}>{payslip.employment_type?.replace('_', ' ') || '-'}</Text>
          </View>
          <View>
            <Text style={s.metaLabel}>Pay Period</Text>
            <Text style={s.metaValue}>{payslip.period_start} → {payslip.period_end}</Text>
          </View>
          <View>
            <Text style={s.metaLabel}>Payment Method</Text>
            <Text style={s.metaValue}>{payslip.payment_method || 'Bank Transfer'}</Text>
          </View>
        </View>

        {/* Earnings */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Earnings</Text>
          <View style={s.row}>
            <Text style={s.label}>Base Pay ({payslip.hours_worked}h × {fmt(payslip.hourly_rate, sym)}/hr)</Text>
            <Text style={s.boldValue}>{fmt(payslip.base_pay, sym)}</Text>
          </View>
          {parseFloat(payslip.overtime_hours) > 0 && (
            <View style={s.row}>
              <Text style={s.label}>Overtime ({payslip.overtime_hours}h × {fmt(payslip.overtime_rate || payslip.hourly_rate * 1.5, sym)}/hr)</Text>
              <Text style={s.boldValue}>{fmt(payslip.overtime_pay, sym)}</Text>
            </View>
          )}
          {parseFloat(payslip.commission_amount) > 0 && (
            <View style={s.row}>
              <Text style={s.label}>Commission ({payslip.commission_rate}% of {fmt(payslip.commission_revenue, sym)})</Text>
              <Text style={s.boldValue}>{fmt(payslip.commission_amount, sym)}</Text>
            </View>
          )}
          {(payslip.allowances || []).map((a, i) => (
            <View key={i} style={s.row}>
              <Text style={s.label}>Allowance: {a.name}</Text>
              <Text style={s.value}>{fmt(a.amount, sym)}</Text>
            </View>
          ))}
          <View style={s.row}>
            <Text style={[s.label, { fontFamily: 'Helvetica-Bold' }]}>Gross Pay</Text>
            <Text style={s.boldValue}>{fmt(parseFloat(payslip.gross_pay) + parseFloat(payslip.commission_amount || 0), sym)}</Text>
          </View>
        </View>

        {/* Deductions */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Deductions</Text>
          <View style={s.row}>
            <Text style={s.label}>PAYG Withholding (Income Tax)</Text>
            <Text style={[s.value, { color: '#dc2626' }]}>-{fmt(payslip.payg_withholding, sym)}</Text>
          </View>
          {(payslip.deductions || []).map((d, i) => (
            <View key={i} style={s.row}>
              <Text style={s.label}>{d.name}</Text>
              <Text style={[s.value, { color: '#dc2626' }]}>-{fmt(d.amount, sym)}</Text>
            </View>
          ))}
        </View>

        {/* Net Pay */}
        <View style={s.totalRow}>
          <Text style={s.totalLabel}>NET PAY</Text>
          <Text style={s.totalValue}>{fmt(payslip.net_pay, sym)}</Text>
        </View>

        {/* Employer Contributions (not deducted from employee) */}
        <View style={[s.section, { marginTop: 12 }]}>
          <Text style={s.sectionTitle}>Employer Contributions (not deducted from pay)</Text>
          <View style={s.row}>
            <Text style={s.label}>Superannuation Guarantee ({payslip.super_rate}%)</Text>
            <Text style={s.value}>{fmt(payslip.super_amount, sym)}</Text>
          </View>
        </View>

        {/* YTD */}
        {(payslip.ytd_gross > 0 || payslip.ytd_tax > 0) && (
          <View style={s.ytdBox}>
            <Text style={s.ytdTitle}>Year-to-Date (Australian FY Jul–Jun)</Text>
            <View style={s.ytdRow}><Text style={s.ytdLabel}>YTD Gross</Text><Text style={s.ytdValue}>{fmt(payslip.ytd_gross, sym)}</Text></View>
            <View style={s.ytdRow}><Text style={s.ytdLabel}>YTD Tax Withheld</Text><Text style={s.ytdValue}>{fmt(payslip.ytd_tax, sym)}</Text></View>
            <View style={s.ytdRow}><Text style={s.ytdLabel}>YTD Super</Text><Text style={s.ytdValue}>{fmt(payslip.ytd_super, sym)}</Text></View>
          </View>
        )}

        {/* Bank Details */}
        {payslip.bank_bsb && (
          <View style={[s.section, { marginTop: 12 }]}>
            <Text style={s.sectionTitle}>Payment Details</Text>
            <View style={s.row}><Text style={s.label}>BSB</Text><Text style={s.value}>{payslip.bank_bsb}</Text></View>
            <View style={s.row}><Text style={s.label}>Account Name</Text><Text style={s.value}>{payslip.bank_account_name}</Text></View>
          </View>
        )}

        {/* Footer */}
        <View style={s.footer}>
          <Text style={s.footerText}>
            This is a computer-generated payslip. Issued by {tenant?.name || 'Employer'}{config.abn ? ` (ABN: ${config.abn})` : ''}.
          </Text>
          <Text style={[s.footerText, { marginTop: 2 }]}>
            Payslip generated in compliance with Fair Work Act 2009 s536. Retain for your records (7 years).
          </Text>
        </View>

      </Page>
    </Document>
  );
}
