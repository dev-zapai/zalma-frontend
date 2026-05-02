import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTheme } from '@/shared/lib/ThemeContext';
import BookingModal from '@/features/salon-website/components/BookingModal';

export default function SalonBookPage() {
  const { site, slug } = useOutletContext();
  const { themeColor, fonts } = useTheme();

  if (!site.online_booking_enabled) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-2" style={{ fontFamily: fonts.heading }}>Online Booking Unavailable</h1>
          <p className="text-slate-500">Please contact the salon directly to make an appointment.</p>
          {site.phone && (
            <a href={`tel:${site.phone}`} className="mt-4 inline-block px-6 py-3 rounded-full text-white font-bold" style={{ backgroundColor: themeColor }}>
              Call {site.phone}
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-8">
      <div className="w-full max-w-xl mx-auto px-4">
        <BookingModal
          slug={slug}
          site={site}
          preselectedServiceId={null}
          onClose={null}
          embedded
        />
      </div>
    </div>
  );
}
