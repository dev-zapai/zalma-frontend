import React, { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { Button } from '@/shared/components/ui/button';
import { Download, Loader2, Printer } from 'lucide-react';
import ServiceReceiptPDF from './ServiceReceiptPDF';
import { format } from 'date-fns';

export default function DownloadReceipt({
  receipt, appointment, apptServices, tenant, currency,
  size = 'sm', variant = 'outline',
}) {
  const [generating, setGenerating] = useState(false);
  const [printing, setPrinting] = useState(false);

  const buildPdf = () => (
    <ServiceReceiptPDF
      receipt={receipt}
      appointment={appointment}
      apptServices={apptServices}
      tenant={tenant}
      currency={currency}
    />
  );

  const handleDownload = async (e) => {
    e?.stopPropagation?.();
    setGenerating(true);
    try {
      const blob = await pdf(buildPdf()).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const petName = appointment?.pet?.name || 'pet';
      const date = format(new Date(), 'yyyy-MM-dd');
      a.download = `receipt_${receipt?.receipt_number || 'RCP'}_${petName.replace(/\s+/g, '_')}_${date}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF generation failed:', err);
    }
    setGenerating(false);
  };

  const handlePrint = async (e) => {
    e?.stopPropagation?.();
    setPrinting(true);
    try {
      const blob = await pdf(buildPdf()).toBlob();
      const url = URL.createObjectURL(blob);
      const printWin = window.open(url, '_blank');
      if (printWin) {
        printWin.onload = () => {
          printWin.focus();
          printWin.print();
        };
      }
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (err) {
      console.error('Print failed:', err);
    }
    setPrinting(false);
  };

  return (
    <div className="flex gap-2">
      <Button
        size={size}
        variant={variant}
        onClick={handleDownload}
        disabled={generating || printing}
        className="gap-1.5"
      >
        {generating ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</>
        ) : (
          <><Download className="h-4 w-4" /> Download PDF</>
        )}
      </Button>
      <Button
        size={size}
        variant="outline"
        onClick={handlePrint}
        disabled={generating || printing}
        className="gap-1.5"
      >
        {printing ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Preparing...</>
        ) : (
          <><Printer className="h-4 w-4" /> Print Receipt</>
        )}
      </Button>
    </div>
  );
}
