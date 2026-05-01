import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTheme } from '@/lib/ThemeContext';
import { WavyDivider } from '@/lib/themeTemplates';
import { PawPrint, Clock, ArrowRight, Heart } from 'lucide-react';

export default function SalonServicesPage() {
  const { site, openBooking } = useOutletContext();
  const { themeColor, template, fonts, colors, decorations, gradient, isLuxe, isPlayful, isWarm } = useTheme();
  const services = site.services || [];
  const salonName = site.salon_name || 'Salon';

  const categories = [...new Set(services.map(s => s.category).filter(Boolean))];
  const [activeCategory, setActiveCategory] = useState(null);

  const filtered = activeCategory
    ? services.filter(s => s.category === activeCategory)
    : services;

  const pastelBgs = decorations.pastelCards || [];
  const cardColors = [colors.primary, colors.secondary, colors.tertiary || colors.primary, colors.primary];
  const warmTints = decorations.warmTints || ['#fef7ed', '#f0fdf4', '#fef2f2', '#fdf4e8'];

  // Theme-specific page header
  const renderHeader = () => {
    if (isLuxe) {
      return (
        <section className="py-20 text-center" style={{ backgroundColor: colors.surface }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="w-12 h-[2px] mx-auto mb-6" style={{ backgroundColor: colors.secondary }} />
            <span className="text-xs font-bold tracking-[0.2em] uppercase mb-4 block" style={{ color: colors.secondary }}>Our Services</span>
            <h1 className="text-4xl sm:text-5xl font-bold mb-4 tracking-tight" style={{ fontFamily: fonts.heading, color: colors.headingText }}>
              Premium Grooming
            </h1>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: colors.bodyText }}>
              {site.services_page_subtitle || `Experience the finest pet grooming at ${salonName}.`}
            </p>
          </div>
        </section>
      );
    }
    if (isPlayful) {
      return (
        <section className="py-16 sm:py-20 text-center relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${colors.primary}10, ${colors.secondary}10, ${colors.tertiary}08)` }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <h1 className="text-4xl sm:text-5xl font-black mb-4 tracking-tight" style={{ fontFamily: fonts.heading, color: colors.headingText }}>
              Our Pawsome Services 🐾
            </h1>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: colors.bodyText }}>
              {site.services_page_subtitle || `Tail-wagging treatments your pet will absolutely love!`}
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
              <Heart className="h-3.5 w-3.5" /> What We Offer
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 tracking-tight" style={{ fontFamily: fonts.heading, color: colors.headingText }}>
              Services Our Community Loves
            </h1>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: colors.bodyText }}>
              {site.services_page_subtitle || `Professional grooming with a warm, personal touch.`}
            </p>
          </div>
        </section>
      );
    }
    // Clean
    return (
      <section className="py-16 sm:py-20 text-center" style={{ backgroundColor: colors.background }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 tracking-tight" style={{ fontFamily: fonts.heading, color: colors.headingText }}>
            Our Services
          </h1>
          <div className="w-12 h-[2px] mx-auto mt-2 mb-4" style={{ backgroundColor: themeColor }} />
          <p className="text-lg max-w-2xl mx-auto" style={{ color: colors.bodyText }}>
            {site.services_page_subtitle || `Professional grooming tailored for your pet.`}
          </p>
        </div>
      </section>
    );
  };

  // Card CSS class per theme
  const cardClass = isLuxe ? 'luxe-card' : isPlayful ? 'playful-card' : isWarm ? 'warm-card' : 'clean-card';

  return (
    <div style={{ backgroundColor: colors.background }}>
      {renderHeader()}

      {/* Category Tabs */}
      {categories.length > 1 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <div className="flex flex-wrap gap-2 justify-center">
            <button onClick={() => setActiveCategory(null)}
              className={`px-5 py-2 text-sm font-bold transition-all ${cardClass}`}
              style={{
                borderRadius: isPlayful ? '9999px' : isWarm ? '12px' : isLuxe ? '4px' : template.layout.borderRadiusFull,
                ...(activeCategory === null
                  ? { background: isLuxe ? colors.secondary : gradient, color: isLuxe ? colors.background : '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }
                  : { backgroundColor: colors.surface, color: colors.bodyText }),
              }}>
              All
            </button>
            {categories.map((cat) => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2 text-sm font-bold transition-all ${cardClass}`}
                style={{
                  borderRadius: isPlayful ? '9999px' : isWarm ? '12px' : isLuxe ? '4px' : template.layout.borderRadiusFull,
                  ...(activeCategory === cat
                    ? { background: isLuxe ? colors.secondary : gradient, color: isLuxe ? colors.background : '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }
                    : { backgroundColor: colors.surface, color: colors.bodyText }),
                }}>
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Services Grid */}
      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* LUXE: List layout */}
          {isLuxe ? (
            <div className="space-y-4 max-w-4xl mx-auto">
              {filtered.map((svc) => (
                <div key={svc.id}
                  className="luxe-card group flex items-center gap-8 p-8 border cursor-pointer"
                  style={{ borderRadius: template.layout.borderRadiusLg, backgroundColor: colors.cardBg, borderColor: colors.cardBorder, borderLeftWidth: '3px', borderLeftColor: colors.secondary }}
                  onClick={() => site.online_booking_enabled && openBooking(svc.id)}>
                  <div className="w-14 h-14 flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: colors.secondary + '12', borderRadius: template.layout.borderRadius }}>
                    <PawPrint className="h-6 w-6" style={{ color: colors.secondary }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-xl mb-1" style={{ color: colors.headingText, fontFamily: fonts.heading }}>{svc.name}</h3>
                    {svc.description && <p className="text-sm line-clamp-1" style={{ color: colors.bodyText }}>{svc.description}</p>}
                    {svc.category && <span className="text-xs font-semibold" style={{ color: colors.secondary }}>{svc.category}</span>}
                  </div>
                  <div className="flex items-center gap-6 flex-shrink-0">
                    <span className="text-xs" style={{ color: colors.mutedText }}><Clock className="h-3.5 w-3.5 inline mr-1" />{svc.duration_minutes} min</span>
                    {site.show_prices && svc.price > 0 && (
                      <span className="text-2xl font-bold" style={{ color: colors.secondary, fontFamily: fonts.heading }}>${svc.price}</span>
                    )}
                    {site.online_booking_enabled && (
                      <span className="px-5 py-2 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ backgroundColor: colors.secondary, color: colors.background, borderRadius: template.layout.borderRadius }}>
                        Book
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Grid layout for Playful, Warm, Clean */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((svc, idx) => (
                <div key={svc.id}
                  className={`${cardClass} group relative p-7 cursor-pointer`}
                  style={{
                    borderRadius: isPlayful ? '24px' : template.layout.borderRadiusLg,
                    backgroundColor: isPlayful ? (pastelBgs[idx % pastelBgs.length] || '#fff') : isWarm ? colors.cardBg : colors.cardBg,
                    border: isPlayful ? `3px solid ${cardColors[idx % 4]}25` : `1px solid ${colors.cardBorder}`,
                    ...(isWarm && idx === 0 ? {} : {}),
                  }}
                  onClick={() => site.online_booking_enabled && openBooking(svc.id)}>
                  {/* Playful: colored top strip */}
                  {isPlayful && <div className="absolute top-0 left-6 right-6 h-1.5 rounded-b-full" style={{ backgroundColor: cardColors[idx % 4] }} />}
                  {/* Warm: "Most Popular" on first */}
                  {isWarm && idx === 0 && (
                    <div className="absolute -top-3 left-6 px-4 py-1 text-xs font-bold text-white shadow-md"
                      style={{ backgroundColor: colors.secondary, borderRadius: '9999px' }}>Most Popular</div>
                  )}
                  <div className={`w-14 h-14 flex items-center justify-center mb-6 ${isWarm ? 'warm-blob' : ''}`}
                    style={{ backgroundColor: decorations.featureIconBg, borderRadius: isPlayful ? '50%' : isWarm ? undefined : template.layout.borderRadiusLg }}>
                    <PawPrint className="h-6 w-6" style={{ color: isPlayful ? cardColors[idx % 4] : (decorations.featureIconColor || themeColor) }} />
                  </div>
                  <h3 className="font-bold text-xl mb-2" style={{ color: colors.headingText }}>{svc.name}</h3>
                  {svc.description && <p className="text-sm mb-5 leading-relaxed" style={{ color: colors.bodyText }}>{svc.description}</p>}
                  {svc.category && (
                    <span className="inline-block px-3 py-1 text-xs font-semibold mb-4"
                      style={{ backgroundColor: themeColor + '10', color: themeColor, borderRadius: isPlayful ? '9999px' : template.layout.borderRadius }}>
                      {svc.category}
                    </span>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 text-xs font-semibold"
                      style={{ backgroundColor: colors.surface, color: colors.mutedText, borderRadius: isPlayful ? '9999px' : template.layout.borderRadius }}>
                      <Clock className="h-3 w-3 inline mr-1" />{svc.duration_minutes} min
                    </span>
                    {site.show_prices && svc.price > 0 && (
                      <span className="text-2xl font-extrabold"
                        style={{ color: isPlayful ? cardColors[idx % 4] : isWarm ? colors.primary : themeColor }}>${svc.price}</span>
                    )}
                  </div>
                  {site.online_booking_enabled && (
                    <button className="w-full mt-5 py-3 font-bold text-sm opacity-0 group-hover:opacity-100 transition-all"
                      style={{
                        ...(isPlayful
                          ? { background: `linear-gradient(135deg, ${cardColors[idx % 4]}, ${colors.secondary})`, color: '#fff', borderRadius: '9999px' }
                          : { border: `2px solid ${isWarm ? colors.primary : themeColor}`, color: isWarm ? colors.primary : themeColor, borderRadius: template.layout.borderRadius }),
                      }}>
                      Book This {isPlayful ? '🎉' : ''} <ArrowRight className="h-4 w-4 inline ml-1" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
          {filtered.length === 0 && (
            <div className="text-center py-16">
              <PawPrint className="h-12 w-12 mx-auto mb-4" style={{ color: colors.cardBorder }} />
              <p style={{ color: colors.bodyText }}>No services found in this category.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
