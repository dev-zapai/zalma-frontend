import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTheme } from '@/lib/ThemeContext';
import { WavyDivider } from '@/lib/themeTemplates';
import { X, PawPrint, Heart } from 'lucide-react';

export default function SalonGalleryPage() {
  const { site } = useOutletContext();
  const { themeColor, template, fonts, colors, isLuxe, isPlayful, isWarm } = useTheme();
  const images = site.gallery_images || [];
  const [lightboxIdx, setLightboxIdx] = useState(null);
  const salonName = site.salon_name || 'Salon';

  // Theme-specific header
  const renderHeader = () => {
    if (isLuxe) {
      return (
        <section className="py-20 text-center" style={{ backgroundColor: colors.surface }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="w-12 h-[2px] mx-auto mb-6" style={{ backgroundColor: colors.secondary }} />
            <span className="text-xs font-bold tracking-[0.2em] uppercase mb-4 block" style={{ color: colors.secondary }}>Portfolio</span>
            <h1 className="text-4xl sm:text-5xl font-bold mb-4 tracking-tight" style={{ fontFamily: fonts.heading, color: colors.headingText }}>
              Our Gallery
            </h1>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: colors.bodyText }}>
              {site.gallery_page_subtitle || `Showcasing our finest grooming work.`}
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
              Cutest Transformations 📸
            </h1>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: colors.bodyText }}>
              {site.gallery_page_subtitle || `Check out these adorable before & afters!`}
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
              <Heart className="h-3.5 w-3.5" /> Gallery
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 tracking-tight" style={{ fontFamily: fonts.heading, color: colors.headingText }}>
              Our Happy Family
            </h1>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: colors.bodyText }}>
              {site.gallery_page_subtitle || `Fresh cuts, fluffy coats, and happy tails.`}
            </p>
          </div>
        </section>
      );
    }
    return (
      <section className="py-16 sm:py-20 text-center" style={{ backgroundColor: colors.background }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 tracking-tight" style={{ fontFamily: fonts.heading, color: colors.headingText }}>
            Gallery
          </h1>
          <div className="w-12 h-[2px] mx-auto mt-2 mb-4" style={{ backgroundColor: themeColor }} />
          <p className="text-lg max-w-2xl mx-auto" style={{ color: colors.bodyText }}>
            {site.gallery_page_subtitle || `Fresh cuts, fluffy coats, and happy tails at ${salonName}.`}
          </p>
        </div>
      </section>
    );
  };

  const cardClass = isLuxe ? 'luxe-card' : isPlayful ? 'playful-card' : isWarm ? 'warm-card' : 'clean-card';
  const imgRadius = isPlayful ? '24px' : isWarm ? '20px' : isLuxe ? '8px' : '12px';

  return (
    <div style={{ backgroundColor: colors.background }}>
      {renderHeader()}

      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {images.length > 0 ? (
            <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-${isPlayful ? '5' : '3'}`}>
              {images.map((img, idx) => (
                <div key={idx}
                  className={`${cardClass} aspect-square overflow-hidden cursor-pointer group`}
                  style={{
                    borderRadius: imgRadius,
                    ...(isPlayful ? { border: '3px solid white', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', transform: idx % 2 ? 'rotate(1deg)' : 'rotate(-1deg)' } : {}),
                  }}
                  onClick={() => setLightboxIdx(idx)}>
                  <img src={img} alt={`Gallery ${idx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <PawPrint className="h-12 w-12 mx-auto mb-4" style={{ color: colors.cardBorder }} />
              <p style={{ color: colors.bodyText }}>No gallery images yet. Check back soon!</p>
            </div>
          )}
        </div>
      </section>

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setLightboxIdx(null)}>
          <button className="absolute top-4 right-4 text-white" onClick={() => setLightboxIdx(null)}>
            <X className="h-8 w-8" />
          </button>
          <img src={images[lightboxIdx]} alt={`Gallery ${lightboxIdx + 1}`}
            className="max-w-full max-h-[90vh] object-contain rounded-lg" onClick={(e) => e.stopPropagation()} />
          {lightboxIdx > 0 && (
            <button className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 rounded-full p-3 text-white transition-colors"
              onClick={(e) => { e.stopPropagation(); setLightboxIdx(lightboxIdx - 1); }}>&#8592;</button>
          )}
          {lightboxIdx < images.length - 1 && (
            <button className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 rounded-full p-3 text-white transition-colors"
              onClick={(e) => { e.stopPropagation(); setLightboxIdx(lightboxIdx + 1); }}>&#8594;</button>
          )}
        </div>
      )}
    </div>
  );
}
