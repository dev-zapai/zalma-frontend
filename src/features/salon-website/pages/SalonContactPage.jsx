import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTheme } from '@/shared/lib/ThemeContext';
import { WavyDivider } from '@/shared/lib/themeTemplates';
import { Phone, Mail, MapPin, Clock, Calendar, Heart } from 'lucide-react';

const LeafletMapEmbed = React.lazy(() => import('@/shared/components/maps/LeafletMapEmbed'));

export default function SalonContactPage() {
  const { site, openBooking, slug } = useOutletContext();
  const { themeColor, template, fonts, colors, decorations, isLuxe, isPlayful, isWarm } = useTheme();
  const salonName = site.salon_name || 'Salon';
  const hasLocation = site.latitude && site.longitude;

  const cardClass = isLuxe ? 'luxe-card' : isPlayful ? 'playful-card' : isWarm ? 'warm-card' : 'clean-card';

  // Theme-specific header
  const renderHeader = () => {
    if (isLuxe) {
      return (
        <section className="py-20 text-center" style={{ backgroundColor: colors.surface }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="w-12 h-[2px] mx-auto mb-6" style={{ backgroundColor: colors.secondary }} />
            <span className="text-xs font-bold tracking-[0.2em] uppercase mb-4 block" style={{ color: colors.secondary }}>Get In Touch</span>
            <h1 className="text-4xl sm:text-5xl font-bold mb-4 tracking-tight" style={{ fontFamily: fonts.heading, color: colors.headingText }}>
              Contact Us
            </h1>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: colors.bodyText }}>
              {site.contact_page_subtitle || `We'd love to hear from you.`}
            </p>
          </div>
        </section>
      );
    }
    if (isPlayful) {
      return (
        <section className="py-16 sm:py-20 text-center relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${colors.primary}10, ${colors.secondary}10)` }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <h1 className="text-4xl sm:text-5xl font-black mb-4 tracking-tight" style={{ fontFamily: fonts.heading, color: colors.headingText }}>
              Say Hello! 👋
            </h1>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: colors.bodyText }}>
              {site.contact_page_subtitle || `We'd love to hear from you! Get in touch with ${salonName}.`}
            </p>
          </div>
          <WavyDivider color={colors.background} />
        </section>
      );
    }
    if (isWarm) {
      return (
        <section className="py-16 sm:py-20 text-center relative" style={{ backgroundColor: colors.surface }}>
          <div className="absolute top-0 right-0 w-48 h-48 warm-blob opacity-[0.04]" style={{ background: colors.primary }} />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <span className="inline-flex items-center gap-2 text-xs font-bold tracking-wider uppercase mb-4" style={{ color: colors.secondary }}>
              <Heart className="h-3.5 w-3.5" /> Contact
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 tracking-tight" style={{ fontFamily: fonts.heading, color: colors.headingText }}>
              Visit Our Family
            </h1>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: colors.bodyText }}>
              {site.contact_page_subtitle || `We'd love to meet you and your fur baby!`}
            </p>
          </div>
        </section>
      );
    }
    return (
      <section className="py-16 sm:py-20 text-center" style={{ backgroundColor: colors.background }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 tracking-tight" style={{ fontFamily: fonts.heading, color: colors.headingText }}>
            Contact Us
          </h1>
          <div className="w-12 h-[2px] mx-auto mt-2 mb-4" style={{ backgroundColor: themeColor }} />
          <p className="text-lg max-w-2xl mx-auto" style={{ color: colors.bodyText }}>
            {site.contact_page_subtitle || `We'd love to hear from you! Get in touch with ${salonName}.`}
          </p>
        </div>
      </section>
    );
  };

  const iconBg = decorations.featureIconBg;
  const iconColor = decorations.featureIconColor || themeColor;

  return (
    <div style={{ backgroundColor: colors.background }}>
      {renderHeader()}

      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Info + Hours */}
            <div className="space-y-8">
              {/* Contact Card */}
              <div className={`${cardClass} p-8 border`}
                style={{
                  borderRadius: isPlayful ? '24px' : template.layout.borderRadiusLg,
                  backgroundColor: colors.cardBg,
                  borderColor: colors.cardBorder,
                  ...(isLuxe ? { borderLeftWidth: '3px', borderLeftColor: colors.secondary } : {}),
                  ...(isPlayful ? { border: `3px solid ${colors.primary}20` } : {}),
                }}>
                <h3 className="font-bold text-xl mb-6" style={{ fontFamily: fonts.heading, color: colors.headingText }}>
                  {isPlayful ? 'Reach Out! 📞' : 'Get In Touch'}
                </h3>
                <div className="space-y-6">
                  {site.phone && (
                    <a href={`tel:${site.phone}`} className="flex items-center gap-4 transition-colors hover:opacity-80">
                      <div className={`w-12 h-12 flex items-center justify-center ${isWarm ? 'warm-blob' : ''}`}
                        style={{ backgroundColor: iconBg, borderRadius: isPlayful ? '50%' : isWarm ? undefined : template.layout.borderRadiusLg }}>
                        <Phone className="h-5 w-5" style={{ color: iconColor }} />
                      </div>
                      <div>
                        <p className="font-bold" style={{ color: colors.headingText }}>{site.phone}</p>
                        <p className="text-xs" style={{ color: colors.mutedText }}>Give us a call</p>
                      </div>
                    </a>
                  )}
                  {site.email && (
                    <a href={`mailto:${site.email}`} className="flex items-center gap-4 transition-colors hover:opacity-80">
                      <div className={`w-12 h-12 flex items-center justify-center ${isWarm ? 'warm-blob' : ''}`}
                        style={{ backgroundColor: iconBg, borderRadius: isPlayful ? '50%' : isWarm ? undefined : template.layout.borderRadiusLg }}>
                        <Mail className="h-5 w-5" style={{ color: iconColor }} />
                      </div>
                      <div>
                        <p className="font-bold" style={{ color: colors.headingText }}>{site.email}</p>
                        <p className="text-xs" style={{ color: colors.mutedText }}>Send us an email</p>
                      </div>
                    </a>
                  )}
                  {site.address && (
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 flex items-center justify-center ${isWarm ? 'warm-blob' : ''}`}
                        style={{ backgroundColor: iconBg, borderRadius: isPlayful ? '50%' : isWarm ? undefined : template.layout.borderRadiusLg }}>
                        <MapPin className="h-5 w-5" style={{ color: iconColor }} />
                      </div>
                      <div>
                        <p className="font-bold" style={{ color: colors.headingText }}>
                          {[site.address, site.city].filter(Boolean).join(', ')}
                        </p>
                        <p className="text-xs" style={{ color: colors.mutedText }}>
                          {[site.state, site.postal_code, site.country].filter(Boolean).join(', ')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Business Hours */}
              {site.business_hours && (
                <div className={`${cardClass} p-8 border`}
                  style={{
                    borderRadius: isPlayful ? '24px' : template.layout.borderRadiusLg,
                    backgroundColor: colors.cardBg,
                    borderColor: colors.cardBorder,
                    ...(isPlayful ? { border: `3px solid ${colors.secondary}20` } : {}),
                  }}>
                  <h3 className="font-bold text-xl mb-6 flex items-center gap-2"
                    style={{ fontFamily: fonts.heading, color: colors.headingText }}>
                    <Clock className="h-5 w-5" style={{ color: iconColor }} />
                    {isPlayful ? 'Our Hours 🕐' : 'Business Hours'}
                  </h3>
                  <div className="space-y-2">
                    {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                      const hours = site.business_hours[day];
                      if (!hours) return null;
                      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
                      const isToday = day === today;
                      return (
                        <div key={day}
                          className={`flex justify-between py-3 px-4 transition-colors ${isToday ? 'font-bold' : ''}`}
                          style={{
                            borderRadius: isPlayful ? '12px' : template.layout.borderRadius,
                            ...(isToday ? { backgroundColor: (isLuxe ? colors.secondary : themeColor) + '08', color: isLuxe ? colors.secondary : themeColor } : {}),
                          }}>
                          <span style={{ color: isToday ? (isLuxe ? colors.secondary : themeColor) : colors.bodyText }} className="capitalize">
                            {day} {isToday && '(Today)'}
                          </span>
                          <span style={{ color: isToday ? (isLuxe ? colors.secondary : themeColor) : colors.headingText }}>
                            {hours.closed ? 'Closed' : `${hours.open || '9:00 AM'} - ${hours.close || '6:00 PM'}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Book CTA */}
              {site.online_booking_enabled && (
                <div className="p-8 text-white relative overflow-hidden"
                  style={{
                    background: decorations.ctaBg,
                    borderRadius: isPlayful ? '24px' : template.layout.borderRadiusLg,
                  }}>
                  {isWarm && <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 warm-blob" />}
                  {isPlayful && <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full" />}
                  <h4 className="font-bold text-xl mb-2 relative z-10" style={{ fontFamily: fonts.heading }}>
                    {isPlayful ? 'Book Your Visit! 🎉' : 'Book Your Visit'}
                  </h4>
                  <p className="opacity-90 mb-5 text-sm relative z-10">Appointments fill up fast! Secure your slot today.</p>
                  <button onClick={() => openBooking()}
                    className={`bg-white px-8 py-3 font-bold w-full transition-colors relative z-10 ${cardClass}`}
                    style={{
                      color: isLuxe ? colors.primary : themeColor,
                      borderRadius: isPlayful ? '9999px' : template.layout.borderRadius,
                    }}>
                    <Calendar className="h-4 w-4 inline mr-2" /> Book Online Now
                  </button>
                </div>
              )}
            </div>

            {/* Map */}
            <div>
              {hasLocation ? (
                <React.Suspense fallback={
                  <div className="h-[500px] flex items-center justify-center"
                    style={{ backgroundColor: colors.surface, borderRadius: isPlayful ? '24px' : template.layout.borderRadiusLg }}>
                    <p style={{ color: colors.mutedText }}>Loading map...</p>
                  </div>
                }>
                  <div style={{ borderRadius: isPlayful ? '24px' : template.layout.borderRadiusLg }} className="overflow-hidden h-[500px]">
                    <LeafletMapEmbed
                      lat={site.latitude}
                      lng={site.longitude}
                      salonName={salonName}
                      themeColor={themeColor}
                      slug={slug}
                    />
                  </div>
                </React.Suspense>
              ) : site.address ? (
                <div className="h-[500px] flex flex-col items-center justify-center border"
                  style={{
                    backgroundColor: colors.surface,
                    borderColor: colors.cardBorder,
                    borderRadius: isPlayful ? '24px' : template.layout.borderRadiusLg,
                  }}>
                  <MapPin className="h-12 w-12 mb-4" style={{ color: colors.cardBorder }} />
                  <p className="font-bold text-lg mb-1" style={{ color: colors.headingText }}>{salonName}</p>
                  <p className="text-sm text-center max-w-xs" style={{ color: colors.bodyText }}>
                    {[site.address, site.city, site.state, site.postal_code].filter(Boolean).join(', ')}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
