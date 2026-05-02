import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTheme } from '@/shared/lib/ThemeContext';
import { WavyDivider } from '@/shared/lib/themeTemplates';
import { Star, Quote, Heart, Users } from 'lucide-react';

export default function SalonAboutPage() {
  const { site, openBooking } = useOutletContext();
  const { themeColor, template, fonts, colors, decorations, gradient, isLuxe, isPlayful, isWarm } = useTheme();
  const salonName = site.salon_name || 'Salon';

  const cardClass = isLuxe ? 'luxe-card' : isPlayful ? 'playful-card' : isWarm ? 'warm-card' : 'clean-card';

  // Theme-specific header
  const renderHeader = () => {
    if (isLuxe) {
      return (
        <section className="py-20 text-center" style={{ backgroundColor: colors.surface }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="w-12 h-[2px] mx-auto mb-6" style={{ backgroundColor: colors.secondary }} />
            <span className="text-xs font-bold tracking-[0.2em] uppercase mb-4 block" style={{ color: colors.secondary }}>Our Story</span>
            <h1 className="text-4xl sm:text-5xl font-bold mb-4 tracking-tight" style={{ fontFamily: fonts.heading, color: colors.headingText }}>
              About {salonName}
            </h1>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: colors.bodyText }}>
              {site.tagline || 'Where every pet receives the finest care.'}
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
              About Us 🐾
            </h1>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: colors.bodyText }}>
              {site.tagline || 'Your pet\'s happy place!'}
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
              <Heart className="h-3.5 w-3.5" /> Our Story
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 tracking-tight" style={{ fontFamily: fonts.heading, color: colors.headingText }}>
              About {salonName}
            </h1>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: colors.bodyText }}>
              {site.tagline || 'Where every pet is treated like family.'}
            </p>
          </div>
        </section>
      );
    }
    return (
      <section className="py-16 sm:py-20 text-center" style={{ backgroundColor: colors.background }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 tracking-tight" style={{ fontFamily: fonts.heading, color: colors.headingText }}>
            About {salonName}
          </h1>
          <div className="w-12 h-[2px] mx-auto mt-2 mb-4" style={{ backgroundColor: themeColor }} />
          <p className="text-lg max-w-2xl mx-auto" style={{ color: colors.bodyText }}>
            {site.tagline || 'Where every pet is treated like family.'}
          </p>
        </div>
      </section>
    );
  };

  return (
    <div style={{ backgroundColor: colors.background }}>
      {renderHeader()}

      {/* About Story */}
      {(site.about_text || site.about_story) && (
        <section className="py-16 sm:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className={`grid grid-cols-1 ${site.about_image_url ? 'lg:grid-cols-2 gap-16' : ''} items-center`}>
              {site.about_image_url && (
                <div className="relative">
                  {isWarm && <div className="absolute -top-6 -left-6 w-32 h-32 warm-blob opacity-[0.08]" style={{ backgroundColor: colors.primary }} />}
                  {isPlayful && <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full" style={{ background: `${colors.primary}08` }} />}
                  <img src={site.about_image_url} alt="About us"
                    className={`relative z-10 shadow-xl w-full object-cover max-h-[500px] ${isPlayful ? 'border-4 border-white' : ''}`}
                    style={{ borderRadius: isPlayful ? '32px' : template.layout.borderRadiusLg }} />
                </div>
              )}
              <div className={!site.about_image_url ? 'text-center max-w-2xl mx-auto' : ''}>
                <span className="text-xs font-bold tracking-[0.2em] uppercase mb-4 block"
                  style={{ color: isLuxe ? colors.secondary : isWarm ? colors.secondary : isPlayful ? colors.primary : themeColor }}>
                  Our Story
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold mb-6 tracking-tight"
                  style={{ fontFamily: fonts.heading, color: colors.headingText }}>
                  About {salonName}
                </h2>
                <p className="leading-relaxed whitespace-pre-line text-base" style={{ color: colors.bodyText }}>
                  {site.about_story || site.about_text}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Team Section */}
      {site.show_team && site.staff?.length > 0 && (
        <section className="py-16 sm:py-20" style={{ backgroundColor: decorations.sectionAltBg }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              {isLuxe && <div className="w-12 h-[2px] mx-auto mb-4" style={{ backgroundColor: colors.secondary }} />}
              {isWarm && <span className="inline-flex items-center gap-2 text-xs font-bold tracking-wider uppercase mb-3" style={{ color: colors.secondary }}><Users className="h-3.5 w-3.5" /> Our Team</span>}
              <h2 className="text-3xl sm:text-4xl font-extrabold mb-3 tracking-tight"
                style={{ fontFamily: fonts.heading, color: colors.headingText }}>
                {isPlayful ? 'Meet Our Amazing Team! 🌟' : isWarm ? 'Our Family of Experts' : 'Meet Our Experts'}
              </h2>
              <p style={{ color: colors.bodyText }}>
                {isPlayful ? 'The lovely humans behind the magic!' : 'The caring hands behind the fluffy coats.'}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
              {site.staff.map((member) => (
                <div key={member.id} className={`text-center group ${cardClass}`}>
                  <div className="mb-5 overflow-hidden relative mx-auto w-full max-w-[280px]"
                    style={{ borderRadius: isPlayful ? '28px' : template.layout.borderRadiusLg }}>
                    {member.photo_url ? (
                      <img src={member.photo_url} alt={member.name}
                        className="w-full aspect-square object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="w-full aspect-square flex items-center justify-center text-white text-5xl font-extrabold"
                        style={{ background: isPlayful ? `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` : gradient }}>
                        {(member.name || 'S').charAt(0).toUpperCase()}
                      </div>
                    )}
                    {site.online_booking_enabled && (
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button onClick={() => openBooking()}
                          className="bg-white px-5 py-2 font-bold text-sm"
                          style={{ color: isLuxe ? colors.secondary : themeColor, borderRadius: isPlayful ? '9999px' : template.layout.borderRadius }}>
                          Book with {member.name?.split(' ')[0]}
                        </button>
                      </div>
                    )}
                  </div>
                  <h4 className="font-bold text-lg" style={{ color: colors.headingText }}>{member.name}</h4>
                  <p className="text-sm font-semibold mb-1" style={{ color: isLuxe ? colors.secondary : isWarm ? colors.secondary : isPlayful ? colors.primary : themeColor }}>
                    {member.role}
                  </p>
                  {member.specialties && <p className="text-xs" style={{ color: colors.mutedText }}>{member.specialties}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      {site.show_testimonials !== false && site.testimonials?.length > 0 && (
        <section className="py-16 sm:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              {isLuxe && <div className="w-12 h-[2px] mx-auto mb-4" style={{ backgroundColor: colors.secondary }} />}
              <h2 className="text-3xl sm:text-4xl font-extrabold mb-3 tracking-tight"
                style={{ fontFamily: fonts.heading, color: colors.headingText }}>
                {isPlayful ? 'Happy Tails 🐾' : isWarm ? 'From Our Community' : 'What Our Clients Say'}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {site.testimonials.map((review, idx) => {
                const pastelBgs = decorations.pastelCards || ['#fff0f3', '#fff8e1', '#f3e5f5'];
                const warmTints = decorations.warmTints || ['#fef7ed', '#f0fdf4', '#fef2f2'];
                return (
                  <div key={idx} className={`${cardClass} p-8 border`}
                    style={{
                      borderRadius: isPlayful ? '24px' : template.layout.borderRadiusLg,
                      backgroundColor: isPlayful ? pastelBgs[idx % pastelBgs.length] : isWarm ? warmTints[idx % warmTints.length] : colors.cardBg,
                      borderColor: isPlayful ? 'transparent' : colors.cardBorder,
                      ...(isLuxe ? { borderLeftColor: colors.secondary, borderLeftWidth: '3px' } : {}),
                    }}>
                    <div className="flex items-center gap-1 mb-4">
                      {[...Array(review.rating || 5)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 fill-current"
                          style={{ color: isLuxe ? colors.secondary : isWarm ? colors.primary : isPlayful ? colors.secondary : themeColor }} />
                      ))}
                    </div>
                    <Quote className="h-6 w-6 mb-3" style={{ color: (isLuxe ? colors.secondary : themeColor) + '30' }} />
                    <p className="text-base mb-6 leading-relaxed italic" style={{ color: colors.bodyText }}>"{review.text}"</p>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 flex items-center justify-center text-white font-bold text-sm ${isWarm ? 'warm-blob' : 'rounded-full'}`}
                        style={{ backgroundColor: isPlayful ? undefined : isLuxe ? colors.primary : themeColor,
                          background: isPlayful ? `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` : undefined }}>
                        {(review.author || 'A').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h5 className="font-bold text-sm" style={{ color: colors.headingText }}>{review.author}</h5>
                        {review.role && <p className="text-xs" style={{ color: colors.mutedText }}>{review.role}</p>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
