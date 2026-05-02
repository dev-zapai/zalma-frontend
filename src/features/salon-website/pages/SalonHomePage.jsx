import React from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { useTheme } from '@/shared/lib/ThemeContext';
import { DEFAULT_HOME_SECTIONS, WavyDivider, SoftCurveDivider, DecorativePawPrint } from '@/shared/lib/themeTemplates';
import {
  PawPrint, Calendar, Clock, Star, Shield, Leaf,
  Scissors, Timer, Heart, Sparkles, Check, Quote,
  ArrowRight, ChevronDown, ChevronUp, Award, Users, Crown, Gem
} from 'lucide-react';

const FEATURE_ICONS = {
  shield: Shield, leaf: Leaf, scissors: Scissors, timer: Timer,
  heart: Heart, star: Star, sparkles: Sparkles, check: Check, paw: PawPrint,
};

export default function SalonHomePage() {
  const { site, openBooking, slug } = useOutletContext();
  const theme = useTheme();
  const { themeColor, secondaryColor, template, fonts, colors, decorations, gradient } = theme;
  const salonName = site.salon_name || 'Salon';
  const basePath = `/s/${slug}`;

  const sections = (site.home_sections?.length > 0 ? site.home_sections : DEFAULT_HOME_SECTIONS)
    .filter(s => s.enabled !== false);

  const features = site.features?.length > 0 ? site.features : [
    { icon: 'shield', title: 'Certified Groomers', description: 'Professional training and deep animal behavioral knowledge.' },
    { icon: 'leaf', title: 'Premium Products', description: 'Hypoallergenic, eco-friendly shampoos and treatments.' },
    { icon: 'heart', title: 'Gentle Handling', description: 'Calm, patient approach for nervous and senior pets.' },
    { icon: 'timer', title: 'Flexible Scheduling', description: 'Easy online booking that fits your busy lifestyle.' },
  ];
  const trustBadges = site.trust_badges?.length > 0 ? site.trust_badges : [];

  const renderSection = (section) => {
    switch (section.type) {
      case 'hero': return <HeroSection key={section.id} />;
      case 'trust_badges': return site.show_trust_badges !== false && trustBadges.length > 0 ? <TrustBadgesSection key={section.id} badges={trustBadges} /> : null;
      case 'featured_services': return site.show_services && site.services?.length > 0 ? <FeaturedServicesSection key={section.id} /> : null;
      case 'features': return site.show_features !== false && features.length > 0 ? <FeaturesSection key={section.id} features={features} /> : null;
      case 'testimonials': return site.show_testimonials !== false && site.testimonials?.length > 0 ? <TestimonialsSection key={section.id} /> : null;
      case 'gallery_preview': return site.show_gallery !== false && site.gallery_images?.length > 0 ? <GalleryPreviewSection key={section.id} /> : null;
      case 'cta': return site.show_cta !== false && site.online_booking_enabled ? <CTASection key={section.id} /> : null;
      case 'faq': return site.show_faq && site.faq_items?.length > 0 ? <FAQSection key={section.id} /> : null;
      case 'about_preview': return site.show_about !== false && site.about_text ? <AboutPreviewSection key={section.id} /> : null;
      default: return null;
    }
  };

  // =====================================================================
  // HERO SECTION - Completely different structure per theme
  // =====================================================================
  function HeroSection() {
    const heroTitle = site.hero_title || `Welcome to ${salonName}`;
    const heroDesc = site.hero_description || site.tagline;

    // ── LUXE: Full-bleed cinematic hero with centered text, gold rule ──
    if (template.id === 'luxe') {
      return (
        <section className="relative min-h-[85vh] flex items-center overflow-hidden">
          {site.hero_image_url ? (
            <div className="absolute inset-0 z-0">
              <img src={site.hero_image_url} alt="Hero" className="w-full h-full object-cover scale-105" />
              <div className="absolute inset-0" style={{ background: decorations.heroOverlay }} />
            </div>
          ) : (
            <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${colors.background} 0%, ${colors.surface} 50%, ${colors.background} 100%)` }} />
          )}
          <div className="relative z-10 max-w-5xl mx-auto px-8 text-center py-24">
            {/* Gold decorative line */}
            <div className="w-16 h-[2px] mx-auto mb-8" style={{ backgroundColor: colors.secondary }} />
            {site.tagline && (
              <span className="inline-block px-6 py-2.5 mb-10 text-xs font-bold tracking-[0.25em] uppercase"
                style={{ color: colors.secondary, border: `1px solid ${colors.secondary}40`, letterSpacing: '0.25em' }}>
                {site.tagline}
              </span>
            )}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-[1.05] mb-8"
              style={{ fontFamily: fonts.heading }}>
              {heroTitle}
            </h1>
            {heroDesc && heroDesc !== site.tagline && (
              <p className="text-lg text-white/60 max-w-2xl mx-auto mb-12 leading-relaxed" style={{ fontFamily: fonts.body }}>
                {heroDesc}
              </p>
            )}
            {/* Gold decorative line */}
            <div className="w-16 h-[2px] mx-auto mb-10" style={{ backgroundColor: colors.secondary }} />
            {site.online_booking_enabled && (
              <button onClick={() => openBooking()}
                className="luxe-card px-12 py-5 font-bold text-base tracking-wider uppercase"
                style={{ background: colors.secondary, color: colors.background, borderRadius: '4px', letterSpacing: '0.1em' }}>
                Book an Appointment
              </button>
            )}
          </div>
        </section>
      );
    }

    // ── PLAYFUL: Asymmetric gradient hero with floating elements & emoji ──
    if (template.id === 'playful') {
      return (
        <section className="relative min-h-[650px] flex items-center overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${colors.primary}12, ${colors.secondary}15, ${colors.tertiary}08)` }}>
          {/* Floating decorative elements */}
          <DecorativePawPrint className="absolute top-16 left-8 playful-float" color={colors.primary} opacity={0.08} size={160} />
          <DecorativePawPrint className="absolute bottom-16 right-16 playful-float-delayed" color={colors.secondary} opacity={0.06} size={120} />
          <div className="absolute top-8 right-12 w-40 h-40 rounded-full playful-float-delayed" style={{ background: `${colors.primary}06` }} />
          <div className="absolute bottom-24 left-24 w-56 h-56 rounded-full playful-float" style={{ background: `${colors.secondary}05` }} />
          <div className="absolute top-1/3 right-1/4 w-6 h-6 rounded-full" style={{ background: colors.primary + '20' }} />
          <div className="absolute top-1/2 left-1/3 w-4 h-4 rounded-full" style={{ background: colors.secondary + '25' }} />

          <div className="relative z-10 max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 py-16">
            <div className="flex flex-col gap-6 justify-center">
              <span className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-extrabold self-start playful-bounce-in"
                style={{ backgroundColor: colors.primary + '15', color: colors.primary, borderRadius: '9999px' }}>
                <PawPrint className="h-4 w-4" /> {site.tagline || 'Your Pet\'s Happy Place!'}
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.08]"
                style={{ fontFamily: fonts.heading, color: colors.headingText }}>
                {heroTitle} <span style={{ color: colors.primary }}>🐾</span>
              </h1>
              {heroDesc && (
                <p className="text-lg max-w-lg leading-relaxed" style={{ color: colors.bodyText }}>{heroDesc}</p>
              )}
              {site.online_booking_enabled && (
                <div className="flex flex-wrap gap-4 mt-2">
                  <button onClick={() => openBooking()}
                    className="playful-card px-10 py-4 text-white font-extrabold text-base shadow-xl"
                    style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`, borderRadius: '9999px' }}>
                    <Calendar className="h-5 w-5 inline mr-2" /> Book Now
                  </button>
                  <Link to={`${basePath}/services`}
                    className="playful-card px-8 py-4 font-extrabold text-base border-3"
                    style={{ borderColor: colors.primary + '40', color: colors.primary, borderRadius: '9999px', borderWidth: '3px' }}>
                    Explore Services <ArrowRight className="h-4 w-4 inline ml-1" />
                  </Link>
                </div>
              )}
            </div>
            {site.hero_image_url && (
              <div className="flex items-center justify-center">
                <div className="relative">
                  {/* Tilted colorful background shape */}
                  <div className="absolute -inset-6 rounded-[48px] rotate-6"
                    style={{ background: `linear-gradient(135deg, ${colors.primary}20, ${colors.secondary}20)` }} />
                  <div className="absolute -inset-3 rounded-[40px] -rotate-3"
                    style={{ background: `linear-gradient(135deg, ${colors.secondary}15, ${colors.tertiary}15)` }} />
                  <img src={site.hero_image_url} alt="Hero"
                    className="relative w-full max-w-lg object-cover rounded-[36px] shadow-2xl border-4 border-white" />
                </div>
              </div>
            )}
          </div>
          <WavyDivider color={decorations.sectionBg} />
        </section>
      );
    }

    // ── WARM: Full-width with organic blob shapes, warm community feel ──
    if (template.id === 'warm') {
      return (
        <section className="relative min-h-[700px] flex items-center overflow-hidden">
          {site.hero_image_url ? (
            <div className="absolute inset-0 z-0">
              <img src={site.hero_image_url} alt="Hero" className="w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(45,31,14,0.55), rgba(254,247,237,0.9))' }} />
            </div>
          ) : (
            <div className="absolute inset-0" style={{ background: `linear-gradient(160deg, ${colors.primary}15, ${colors.background} 60%, ${colors.secondary}10)` }} />
          )}
          {/* Organic blob background shapes */}
          <div className="absolute top-[-5%] right-[-5%] w-[40%] h-[50%] warm-blob opacity-[0.07]" style={{ background: colors.primary }} />
          <div className="absolute bottom-[-10%] left-[-5%] w-[35%] h-[45%] warm-blob-alt opacity-[0.05]" style={{ background: colors.secondary }} />

          <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              {site.tagline && (
                <span className="inline-flex items-center gap-2 px-5 py-2 mb-6 text-sm font-bold"
                  style={{ backgroundColor: colors.primary + '15', color: colors.primary, borderRadius: template.layout.borderRadius }}>
                  <Heart className="h-4 w-4" /> {site.tagline}
                </span>
              )}
              <h1 className={`text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] mb-6 ${site.hero_image_url ? 'text-white' : ''}`}
                style={{ fontFamily: fonts.heading, color: site.hero_image_url ? undefined : colors.headingText }}>
                {heroTitle}
              </h1>
              {heroDesc && (
                <p className={`text-lg max-w-lg mb-8 leading-relaxed ${site.hero_image_url ? 'text-white/80' : ''}`}
                  style={{ color: site.hero_image_url ? undefined : colors.bodyText }}>{heroDesc}</p>
              )}
              {site.online_booking_enabled && (
                <div className="flex flex-wrap gap-4">
                  <button onClick={() => openBooking()}
                    className="warm-card warm-glow px-10 py-4 text-white font-bold text-base shadow-xl"
                    style={{ background: colors.primary, borderRadius: template.layout.borderRadius }}>
                    <Calendar className="h-5 w-5 inline mr-2" /> Book an Appointment
                  </button>
                  <Link to={`${basePath}/about`}
                    className="warm-card px-8 py-4 font-bold text-base border-2"
                    style={{ borderColor: site.hero_image_url ? 'rgba(255,255,255,0.4)' : colors.primary + '30', color: site.hero_image_url ? '#fff' : colors.primary, borderRadius: template.layout.borderRadius }}>
                    Our Story <ArrowRight className="h-4 w-4 inline ml-1" />
                  </Link>
                </div>
              )}
            </div>
            {/* Stats card overlapping hero - community feel */}
            {!site.hero_image_url && (
              <div className="hidden lg:flex flex-col gap-6 items-center">
                <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                  {[
                    { icon: Heart, value: '500+', label: 'Happy Pets', bg: '#fef7ed' },
                    { icon: Star, value: '4.9', label: 'Rating', bg: '#f0fdf4' },
                    { icon: Users, value: 'Expert', label: 'Team', bg: '#fef2f2' },
                    { icon: Award, value: 'Since', label: '2020', bg: '#fdf4e8' },
                  ].map((stat, i) => (
                    <div key={i} className="warm-card p-6 text-center shadow-md"
                      style={{ backgroundColor: stat.bg, borderRadius: template.layout.borderRadiusLg }}>
                      <stat.icon className="h-6 w-6 mx-auto mb-2" style={{ color: colors.primary }} />
                      <div className="text-2xl font-extrabold" style={{ color: colors.headingText }}>{stat.value}</div>
                      <div className="text-xs font-semibold" style={{ color: colors.mutedText }}>{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <SoftCurveDivider color={decorations.sectionBg} />
        </section>
      );
    }

    // ── CLEAN (default): Split layout with stats counter row ──
    return (
      <section style={{ backgroundColor: colors.background }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-20 py-24 min-h-[650px] items-center">
          <div className="flex flex-col gap-6 justify-center">
            {site.tagline && (
              <span className="inline-block px-4 py-1.5 text-xs font-semibold tracking-widest uppercase self-start"
                style={{ backgroundColor: themeColor + '08', color: themeColor, borderRadius: template.layout.borderRadiusFull }}>
                {site.tagline}
              </span>
            )}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.08] tracking-tight"
              style={{ fontFamily: fonts.heading, color: colors.headingText }}>
              {heroTitle}
            </h1>
            {heroDesc && (
              <p className="text-lg max-w-lg leading-relaxed" style={{ color: colors.bodyText }}>{heroDesc}</p>
            )}
            {site.online_booking_enabled && (
              <div className="flex flex-wrap gap-4 mt-2">
                <button onClick={() => openBooking()}
                  className={`clean-card px-8 py-4 text-white font-bold text-base shadow-lg ${template.layout.buttonStyle}`}
                  style={{ background: themeColor }}>
                  <Calendar className="h-5 w-5 inline mr-2" /> Book an Appointment
                </button>
                <Link to={`${basePath}/services`}
                  className="clean-card px-8 py-4 font-bold text-base border"
                  style={{ borderColor: colors.cardBorder, color: colors.headingText, borderRadius: template.layout.borderRadius }}>
                  Our Services <ArrowRight className="h-4 w-4 inline ml-1" />
                </Link>
              </div>
            )}
          </div>
          {site.hero_image_url ? (
            <div className="flex items-center justify-center">
              <img src={site.hero_image_url} alt="Hero"
                className="w-full max-w-lg object-cover shadow-2xl"
                style={{ borderRadius: template.layout.borderRadiusLg }} />
            </div>
          ) : (
            <div className="hidden lg:flex items-center justify-center">
              <div className="w-full max-w-md aspect-[4/3] flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${themeColor}06, ${themeColor}03)`, borderRadius: template.layout.borderRadiusLg }}>
                <PawPrint className="h-24 w-24" style={{ color: themeColor + '15' }} />
              </div>
            </div>
          )}
        </div>
        {/* Clean: Stats counter row beneath hero */}
        <div className="border-t border-b" style={{ borderColor: colors.cardBorder }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 sm:grid-cols-4 divide-x" style={{ borderColor: colors.cardBorder }}>
            {[
              { value: '500+', label: 'Happy Pets Groomed' },
              { value: '4.9', label: 'Average Rating' },
              { value: 'Expert', label: 'Certified Team' },
              { value: 'Since 2020', label: 'Years of Trust' },
            ].map((stat, i) => (
              <div key={i} className="py-8 text-center" style={{ borderColor: colors.cardBorder }}>
                <div className="text-2xl sm:text-3xl font-extrabold" style={{ color: themeColor }}>{stat.value}</div>
                <div className="text-xs font-medium mt-1" style={{ color: colors.mutedText }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // =====================================================================
  // TRUST BADGES
  // =====================================================================
  function TrustBadgesSection({ badges }) {
    if (template.id === 'luxe') {
      return (
        <section className="py-8" style={{ backgroundColor: colors.surface, borderBottom: `1px solid ${colors.cardBorder}` }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center gap-8 sm:gap-16 flex-wrap">
            {badges.map((badge, idx) => (
              <div key={idx} className="flex flex-col text-center px-6 py-3"
                style={{ border: `1px solid ${colors.secondary}30`, borderRadius: template.layout.borderRadius }}>
                <span className="text-2xl font-bold" style={{ color: colors.secondary, fontFamily: fonts.heading }}>{badge.value}</span>
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.mutedText }}>{badge.label}</span>
              </div>
            ))}
          </div>
        </section>
      );
    }

    if (template.id === 'playful') {
      const pastelBgs = decorations.pastelCards || ['#fff0f3', '#fff8e1', '#f3e5f5', '#e8f5e9'];
      return (
        <section className="py-10" style={{ backgroundColor: decorations.sectionBg }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center gap-4 sm:gap-6 flex-wrap">
            {badges.map((badge, idx) => (
              <div key={idx} className="playful-card flex flex-col text-center px-6 py-4 shadow-md"
                style={{ backgroundColor: pastelBgs[idx % pastelBgs.length], borderRadius: '20px' }}>
                <span className="text-2xl font-extrabold" style={{ color: colors.primary }}>{badge.value}</span>
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: colors.bodyText }}>{badge.label}</span>
              </div>
            ))}
          </div>
        </section>
      );
    }

    if (template.id === 'warm') {
      const warmTints = decorations.warmTints || ['#fef7ed', '#f0fdf4', '#fef2f2', '#fdf4e8'];
      return (
        <section className="py-10" style={{ backgroundColor: decorations.sectionBg }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center gap-4 sm:gap-6 flex-wrap">
            {badges.map((badge, idx) => (
              <div key={idx} className="warm-card flex flex-col text-center px-6 py-4 shadow-sm"
                style={{ backgroundColor: warmTints[idx % warmTints.length], borderRadius: template.layout.borderRadius, border: `1px solid ${colors.cardBorder}` }}>
                <span className="text-2xl font-extrabold" style={{ color: colors.primary }}>{badge.value}</span>
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: colors.mutedText }}>{badge.label}</span>
              </div>
            ))}
          </div>
        </section>
      );
    }

    // CLEAN
    return (
      <section className="py-6" style={{ borderBottom: `1px solid ${colors.cardBorder}` }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center gap-8 sm:gap-16 flex-wrap">
          {badges.map((badge, idx) => (
            <div key={idx} className="flex flex-col text-center">
              <span className="text-2xl font-extrabold" style={{ color: themeColor }}>{badge.value}</span>
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.mutedText }}>{badge.label}</span>
            </div>
          ))}
        </div>
      </section>
    );
  }

  // =====================================================================
  // FEATURED SERVICES - Completely different card layouts per theme
  // =====================================================================
  function FeaturedServicesSection() {
    const displayServices = site.services.slice(0, 4);
    const pastelBgs = decorations.pastelCards || [];

    // ── LUXE: Horizontal full-width service cards with gold accent ──
    if (template.id === 'luxe') {
      return (
        <section className="py-24" style={{ backgroundColor: decorations.sectionAltBg }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <span className="text-xs font-bold tracking-[0.2em] uppercase mb-4 block" style={{ color: colors.secondary }}>The Luxe Difference</span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ fontFamily: fonts.heading, color: colors.headingText }}>
                Our Premium Services
              </h2>
            </div>
            <div className="space-y-4">
              {displayServices.map((svc, idx) => (
                <div key={svc.id}
                  className="luxe-card group flex items-center gap-8 p-8 border cursor-pointer"
                  style={{
                    borderRadius: template.layout.borderRadiusLg,
                    backgroundColor: colors.cardBg,
                    borderColor: colors.cardBorder,
                    borderLeftWidth: '3px',
                    borderLeftColor: colors.secondary,
                  }}
                  onClick={() => site.online_booking_enabled && openBooking(svc.id)}>
                  <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center"
                    style={{ backgroundColor: colors.secondary + '15', borderRadius: template.layout.borderRadius }}>
                    <PawPrint className="h-7 w-7" style={{ color: colors.secondary }} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-xl mb-1" style={{ color: colors.headingText, fontFamily: fonts.heading }}>{svc.name}</h3>
                    {svc.description && <p className="text-sm line-clamp-1" style={{ color: colors.bodyText }}>{svc.description}</p>}
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
            {site.services.length > 4 && (
              <div className="text-center mt-10">
                <Link to={`${basePath}/services`} className="font-bold text-sm transition-colors" style={{ color: colors.secondary }}>
                  View All Services <ArrowRight className="h-4 w-4 inline ml-1" />
                </Link>
              </div>
            )}
          </div>
        </section>
      );
    }

    // ── PLAYFUL: Staggered colorful cards with thick borders and bouncy hover ──
    if (template.id === 'playful') {
      const cardColors = [colors.primary, colors.secondary, colors.tertiary, colors.primary];
      return (
        <>
          <WavyDivider color={typeof decorations.sectionAltBg === 'string' && !decorations.sectionAltBg.includes('linear') ? decorations.sectionAltBg : '#fff0f3'} />
          <section className="py-20" style={{ background: decorations.sectionAltBg }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-14">
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight"
                  style={{ fontFamily: fonts.heading, color: colors.headingText }}>
                  Pawsome Services 🐾
                </h2>
                <p className="mt-2" style={{ color: colors.bodyText }}>Tail-wagging treatments your pet will love!</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {displayServices.map((svc, idx) => (
                  <div key={svc.id}
                    className="playful-card group relative p-7 cursor-pointer bg-white"
                    style={{
                      borderRadius: '24px',
                      border: `3px solid ${cardColors[idx % 4]}30`,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                    }}
                    onClick={() => site.online_booking_enabled && openBooking(svc.id)}>
                    {/* Colored top accent strip */}
                    <div className="absolute top-0 left-6 right-6 h-1.5 rounded-b-full" style={{ backgroundColor: cardColors[idx % 4] }} />
                    <div className="w-14 h-14 flex items-center justify-center mb-5 mt-2"
                      style={{ backgroundColor: pastelBgs[idx % pastelBgs.length] || colors.primary + '12', borderRadius: '50%' }}>
                      <PawPrint className="h-6 w-6" style={{ color: cardColors[idx % 4] }} />
                    </div>
                    <h3 className="font-extrabold text-xl mb-2" style={{ color: colors.headingText }}>{svc.name}</h3>
                    {svc.description && <p className="text-sm mb-5 line-clamp-2 leading-relaxed" style={{ color: colors.bodyText }}>{svc.description}</p>}
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: pastelBgs[idx % pastelBgs.length] || '#fff0f3', color: colors.bodyText }}>
                        <Clock className="h-3 w-3 inline mr-1" />{svc.duration_minutes} min
                      </span>
                      {site.show_prices && svc.price > 0 && (
                        <span className="text-2xl font-black" style={{ color: cardColors[idx % 4] }}>${svc.price}</span>
                      )}
                    </div>
                    {site.online_booking_enabled && (
                      <button className="w-full mt-5 py-3 font-extrabold text-sm text-white shadow-lg opacity-0 group-hover:opacity-100 transition-all"
                        style={{ background: `linear-gradient(135deg, ${cardColors[idx % 4]}, ${colors.secondary})`, borderRadius: '9999px' }}>
                        Book This 🎉
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {site.services.length > 4 && (
                <div className="text-center mt-10">
                  <Link to={`${basePath}/services`} className="font-extrabold text-sm" style={{ color: colors.primary }}>
                    See All Services <ArrowRight className="h-4 w-4 inline ml-1" />
                  </Link>
                </div>
              )}
            </div>
          </section>
          <WavyDivider color={decorations.sectionBg} flip />
        </>
      );
    }

    // ── WARM: Service cards with organic shapes and "Most Popular" badges ──
    if (template.id === 'warm') {
      return (
        <>
          <SoftCurveDivider color={decorations.sectionAltBg} />
          <section className="py-20" style={{ backgroundColor: decorations.sectionAltBg }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-14">
                <span className="inline-flex items-center gap-2 text-xs font-bold tracking-wider uppercase mb-3"
                  style={{ color: colors.secondary }}><Heart className="h-3.5 w-3.5" /> What We Offer</span>
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight"
                  style={{ fontFamily: fonts.heading, color: colors.headingText }}>
                  Services Our Community Loves
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {displayServices.map((svc, idx) => (
                  <div key={svc.id}
                    className="warm-card group relative p-7 cursor-pointer"
                    style={{
                      borderRadius: template.layout.borderRadiusLg,
                      backgroundColor: colors.cardBg,
                      border: `1px solid ${colors.cardBorder}`,
                      boxShadow: '0 4px 16px rgba(139,90,43,0.06)',
                    }}
                    onClick={() => site.online_booking_enabled && openBooking(svc.id)}>
                    {/* "Most Popular" badge on first service */}
                    {idx === 0 && (
                      <div className="absolute -top-3 left-6 px-4 py-1 text-xs font-bold text-white shadow-md"
                        style={{ backgroundColor: colors.secondary, borderRadius: '9999px' }}>
                        Most Popular
                      </div>
                    )}
                    {/* Warm organic icon bg */}
                    <div className="w-14 h-14 flex items-center justify-center mb-5 warm-blob"
                      style={{ backgroundColor: colors.primary + '12' }}>
                      <PawPrint className="h-6 w-6" style={{ color: colors.primary }} />
                    </div>
                    <h3 className="font-bold text-xl mb-2" style={{ color: colors.headingText }}>{svc.name}</h3>
                    {svc.description && <p className="text-sm mb-5 line-clamp-2 leading-relaxed" style={{ color: colors.bodyText }}>{svc.description}</p>}
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 text-xs font-semibold" style={{ backgroundColor: colors.surface, color: colors.mutedText, borderRadius: template.layout.borderRadius }}>
                        <Clock className="h-3 w-3 inline mr-1" />{svc.duration_minutes} min
                      </span>
                      {site.show_prices && svc.price > 0 && (
                        <span className="text-2xl font-extrabold" style={{ color: colors.primary }}>${svc.price}</span>
                      )}
                    </div>
                    {site.online_booking_enabled && (
                      <button className="w-full mt-5 py-3 border-2 font-bold text-sm opacity-0 group-hover:opacity-100 transition-all"
                        style={{ borderColor: colors.primary, color: colors.primary, borderRadius: template.layout.borderRadius }}>
                        Book This <ArrowRight className="h-4 w-4 inline ml-1" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {site.services.length > 4 && (
                <div className="text-center mt-10">
                  <Link to={`${basePath}/services`} className="font-bold text-sm" style={{ color: colors.primary }}>
                    View All Services <ArrowRight className="h-4 w-4 inline ml-1" />
                  </Link>
                </div>
              )}
            </div>
          </section>
        </>
      );
    }

    // ── CLEAN: Minimal grid with thin borders, very light hover ──
    return (
      <section className="py-24" style={{ backgroundColor: colors.surface }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-14 gap-6">
            <div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight"
                style={{ fontFamily: fonts.heading, color: colors.headingText }}>Our Services</h2>
              <p className="mt-2" style={{ color: colors.bodyText }}>Professional grooming tailored to your pet.</p>
            </div>
            {site.services.length > 4 && (
              <Link to={`${basePath}/services`} className="flex items-center gap-1 font-bold text-sm" style={{ color: themeColor }}>
                View All <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {displayServices.map((svc) => (
              <div key={svc.id}
                className="clean-card group p-6 border bg-white cursor-pointer"
                style={{ borderRadius: template.layout.borderRadiusLg, borderColor: colors.cardBorder }}
                onClick={() => site.online_booking_enabled && openBooking(svc.id)}>
                <div className="w-10 h-10 flex items-center justify-center mb-4"
                  style={{ backgroundColor: themeColor + '08', borderRadius: template.layout.borderRadius }}>
                  <PawPrint className="h-5 w-5" style={{ color: themeColor }} />
                </div>
                <h3 className="font-bold text-lg mb-1" style={{ color: colors.headingText }}>{svc.name}</h3>
                {svc.description && <p className="text-sm mb-4 line-clamp-2" style={{ color: colors.bodyText }}>{svc.description}</p>}
                <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: colors.cardBorder }}>
                  <span className="text-xs" style={{ color: colors.mutedText }}>{svc.duration_minutes} min</span>
                  {site.show_prices && svc.price > 0 && (
                    <span className="text-xl font-extrabold" style={{ color: themeColor }}>${svc.price}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // =====================================================================
  // FEATURES / WHY CHOOSE US - Different structure per theme
  // =====================================================================
  function FeaturesSection({ features: feats }) {
    // ── LUXE: 2-column editorial layout with gold line accent ──
    if (template.id === 'luxe') {
      return (
        <section className="py-24" style={{ backgroundColor: decorations.sectionBg }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <span className="text-xs font-bold tracking-[0.2em] uppercase mb-4 block" style={{ color: colors.secondary }}>Why Us</span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ fontFamily: fonts.heading, color: colors.headingText }}>
                The Luxe Difference
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {feats.slice(0, 4).map((feat, idx) => {
                const IconComp = FEATURE_ICONS[feat.icon] || Sparkles;
                return (
                  <div key={idx} className="luxe-card flex items-start gap-6 p-8 border"
                    style={{ borderColor: colors.cardBorder, borderRadius: template.layout.borderRadiusLg, backgroundColor: colors.cardBg }}>
                    <div className="w-14 h-14 flex-shrink-0 flex items-center justify-center"
                      style={{ backgroundColor: colors.secondary + '12', borderRadius: template.layout.borderRadius, border: `1px solid ${colors.secondary}20` }}>
                      <IconComp className="h-6 w-6" style={{ color: colors.secondary }} />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg mb-2" style={{ color: colors.headingText, fontFamily: fonts.heading }}>{feat.title}</h4>
                      <p className="text-sm leading-relaxed" style={{ color: colors.bodyText }}>{feat.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      );
    }

    // ── PLAYFUL: Colorful circular icons, pastel bg cards, bouncy ──
    if (template.id === 'playful') {
      const cardColors = [colors.primary, colors.secondary, colors.tertiary, colors.primary];
      const pastelBgs = decorations.pastelCards || ['#fff0f3', '#fff8e1', '#f3e5f5', '#e8f5e9'];
      return (
        <section className="py-20" style={{ backgroundColor: decorations.sectionBg }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight"
                style={{ fontFamily: fonts.heading, color: colors.headingText }}>
                Why Pets Love Us! 🐶
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {feats.slice(0, 4).map((feat, idx) => {
                const IconComp = FEATURE_ICONS[feat.icon] || Sparkles;
                return (
                  <div key={idx} className="playful-card text-center p-8"
                    style={{ backgroundColor: pastelBgs[idx % pastelBgs.length], borderRadius: '28px' }}>
                    <div className="inline-flex items-center justify-center w-20 h-20 mb-6 shadow-lg"
                      style={{ backgroundColor: '#ffffff', borderRadius: '50%', border: `3px solid ${cardColors[idx % 4]}30` }}>
                      <IconComp className="h-8 w-8" style={{ color: cardColors[idx % 4] }} />
                    </div>
                    <h4 className="font-extrabold text-lg mb-2" style={{ color: colors.headingText }}>{feat.title}</h4>
                    <p className="text-sm leading-relaxed" style={{ color: colors.bodyText }}>{feat.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      );
    }

    // ── WARM: Organic blob icon backgrounds, warm tinted cards ──
    if (template.id === 'warm') {
      const warmTints = decorations.warmTints || ['#fef7ed', '#f0fdf4', '#fef2f2', '#fdf4e8'];
      return (
        <section className="py-20" style={{ backgroundColor: decorations.sectionBg }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <span className="inline-flex items-center gap-2 text-xs font-bold tracking-wider uppercase mb-3"
                style={{ color: colors.secondary }}><Heart className="h-3.5 w-3.5" /> Our Promise</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight"
                style={{ fontFamily: fonts.heading, color: colors.headingText }}>
                What Makes Our Family Special
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {feats.slice(0, 4).map((feat, idx) => {
                const IconComp = FEATURE_ICONS[feat.icon] || Sparkles;
                return (
                  <div key={idx} className="warm-card text-center p-8"
                    style={{ backgroundColor: warmTints[idx % warmTints.length], borderRadius: template.layout.borderRadiusLg, border: `1px solid ${colors.cardBorder}` }}>
                    <div className="inline-flex items-center justify-center w-18 h-18 mb-6 warm-blob"
                      style={{ width: '72px', height: '72px', backgroundColor: colors.primary + '12' }}>
                      <IconComp className="h-8 w-8" style={{ color: colors.primary }} />
                    </div>
                    <h4 className="font-bold text-lg mb-2" style={{ color: colors.headingText }}>{feat.title}</h4>
                    <p className="text-sm leading-relaxed" style={{ color: colors.bodyText }}>{feat.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      );
    }

    // ── CLEAN: Minimal icon-left layout, thin underline accents ──
    return (
      <section className="py-24" style={{ backgroundColor: decorations.sectionBg }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight"
              style={{ fontFamily: fonts.heading, color: colors.headingText }}>Why Choose Us</h2>
            <div className="w-12 h-[2px] mx-auto mt-4" style={{ backgroundColor: themeColor }} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-10 max-w-4xl mx-auto">
            {feats.slice(0, 4).map((feat, idx) => {
              const IconComp = FEATURE_ICONS[feat.icon] || Sparkles;
              return (
                <div key={idx} className="flex items-start gap-5">
                  <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center"
                    style={{ backgroundColor: themeColor + '08', borderRadius: template.layout.borderRadius }}>
                    <IconComp className="h-5 w-5" style={{ color: themeColor }} />
                  </div>
                  <div>
                    <h4 className="font-bold text-base mb-1" style={{ color: colors.headingText }}>{feat.title}</h4>
                    <p className="text-sm leading-relaxed" style={{ color: colors.bodyText }}>{feat.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  // =====================================================================
  // TESTIMONIALS - Completely different layout per theme
  // =====================================================================
  function TestimonialsSection() {
    const testimonials = site.testimonials;

    // ── LUXE: Horizontal scroll carousel with gold left border ──
    if (template.id === 'luxe') {
      return (
        <section className="py-24" style={{ backgroundColor: decorations.sectionAltBg }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-12">
              <span className="text-xs font-bold tracking-[0.2em] uppercase mb-4 block" style={{ color: colors.secondary }}>Testimonials</span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ fontFamily: fonts.heading, color: colors.headingText }}>
                What Our Clients Say
              </h2>
            </div>
            <div className="flex gap-6 overflow-x-auto pb-6 hide-scrollbar snap-x">
              {testimonials.map((review, idx) => (
                <div key={idx} className="luxe-card min-w-[360px] md:min-w-[420px] snap-center p-8 flex-shrink-0"
                  style={{ backgroundColor: colors.cardBg, borderRadius: template.layout.borderRadiusLg, borderLeft: `3px solid ${colors.secondary}`, boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
                  <Quote className="h-8 w-8 mb-4" style={{ color: colors.secondary + '30' }} />
                  <p className="text-base mb-6 leading-relaxed italic" style={{ color: colors.bodyText }}>"{review.text}"</p>
                  <div className="flex items-center gap-1 mb-5">
                    {[...Array(review.rating || 5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" style={{ color: colors.secondary }} />
                    ))}
                  </div>
                  <div className="flex items-center gap-3 pt-4 border-t" style={{ borderColor: colors.cardBorder }}>
                    <div className="w-10 h-10 flex items-center justify-center font-bold text-sm"
                      style={{ backgroundColor: colors.secondary, color: '#0a0a0a', borderRadius: '2px' }}>{(review.author || 'A').charAt(0).toUpperCase()}</div>
                    <div>
                      <h5 className="font-bold text-sm" style={{ color: colors.headingText }}>{review.author}</h5>
                      {review.role && <p className="text-xs" style={{ color: colors.mutedText }}>{review.role}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      );
    }

    // ── PLAYFUL: Large single featured review + smaller side reviews ──
    if (template.id === 'playful') {
      const firstReview = testimonials[0];
      const otherReviews = testimonials.slice(1, 3);
      return (
        <section className="py-20" style={{ backgroundColor: decorations.sectionBg }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl sm:text-4xl font-black mb-12 text-center"
              style={{ fontFamily: fonts.heading, color: colors.headingText }}>
              Happy Tails 🐾
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Featured large review */}
              <div className="lg:col-span-3 playful-card p-10 relative overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${colors.primary}08, ${colors.secondary}08)`, borderRadius: '32px', border: `3px solid ${colors.primary}20` }}>
                <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full" style={{ background: colors.primary + '08' }} />
                <div className="flex items-center gap-1 mb-5">
                  {[...Array(firstReview.rating || 5)].map((_, i) => (
                    <Star key={i} className="h-6 w-6 fill-current" style={{ color: colors.secondary }} />
                  ))}
                </div>
                <p className="text-xl mb-8 leading-relaxed font-medium" style={{ color: colors.headingText }}>
                  "{firstReview.text}"
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center text-white font-extrabold text-lg shadow-lg"
                    style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}>
                    {(firstReview.author || 'A').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h5 className="font-extrabold text-lg" style={{ color: colors.headingText }}>{firstReview.author}</h5>
                    {firstReview.role && <p className="text-sm" style={{ color: colors.mutedText }}>{firstReview.role}</p>}
                  </div>
                </div>
              </div>
              {/* Side smaller reviews */}
              <div className="lg:col-span-2 flex flex-col gap-6">
                {otherReviews.map((review, idx) => {
                  const pastelBgs = decorations.pastelCards || ['#fff0f3', '#fff8e1'];
                  return (
                    <div key={idx} className="playful-card p-8 flex-1"
                      style={{ backgroundColor: pastelBgs[idx % pastelBgs.length], borderRadius: '24px' }}>
                      <div className="flex items-center gap-1 mb-3">
                        {[...Array(review.rating || 5)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-current" style={{ color: colors.secondary }} />
                        ))}
                      </div>
                      <p className="text-sm mb-4 leading-relaxed" style={{ color: colors.bodyText }}>"{review.text}"</p>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-extrabold text-sm shadow-md"
                          style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}>
                          {(review.author || 'A').charAt(0).toUpperCase()}
                        </div>
                        <h5 className="font-extrabold text-sm" style={{ color: colors.headingText }}>{review.author}</h5>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      );
    }

    // ── WARM: Warm tinted cards with community heading ──
    if (template.id === 'warm') {
      const warmTints = decorations.warmTints || ['#fef7ed', '#f0fdf4', '#fef2f2'];
      return (
        <section className="py-20" style={{ backgroundColor: decorations.sectionAltBg }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <span className="inline-flex items-center gap-2 text-xs font-bold tracking-wider uppercase mb-3"
                style={{ color: colors.secondary }}><Users className="h-3.5 w-3.5" /> Our Community</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight"
                style={{ fontFamily: fonts.heading, color: colors.headingText }}>
                From Our Pet Family
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.slice(0, 3).map((review, idx) => (
                <div key={idx} className="warm-card p-8"
                  style={{ backgroundColor: warmTints[idx % warmTints.length], borderRadius: template.layout.borderRadiusLg, border: `1px solid ${colors.cardBorder}` }}>
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(review.rating || 5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-current" style={{ color: colors.primary }} />
                    ))}
                  </div>
                  <p className="text-base mb-6 leading-relaxed" style={{ color: colors.bodyText }}>"{review.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 flex items-center justify-center text-white font-bold text-sm warm-blob"
                      style={{ backgroundColor: colors.primary }}>{(review.author || 'A').charAt(0).toUpperCase()}</div>
                    <div>
                      <h5 className="font-bold text-sm" style={{ color: colors.headingText }}>{review.author}</h5>
                      {review.role && <p className="text-xs" style={{ color: colors.mutedText }}>{review.role}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      );
    }

    // ── CLEAN: Minimal 3-col grid with subtle borders, underline heading ──
    return (
      <section className="py-24" style={{ backgroundColor: colors.surface }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight"
              style={{ fontFamily: fonts.heading, color: colors.headingText }}>What Happy Owners Say</h2>
            <div className="w-12 h-[2px] mt-4" style={{ backgroundColor: themeColor }} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.slice(0, 3).map((review, idx) => (
              <div key={idx} className="clean-card p-8 border bg-white"
                style={{ borderColor: colors.cardBorder, borderRadius: template.layout.borderRadiusLg }}>
                <div className="flex items-center gap-1 mb-5">
                  {[...Array(review.rating || 5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" style={{ color: themeColor }} />
                  ))}
                </div>
                <p className="text-sm mb-6 leading-relaxed" style={{ color: colors.bodyText }}>"{review.text}"</p>
                <div className="flex items-center gap-3 pt-4 border-t" style={{ borderColor: colors.cardBorder }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs"
                    style={{ backgroundColor: themeColor }}>{(review.author || 'A').charAt(0).toUpperCase()}</div>
                  <div>
                    <h5 className="font-bold text-sm" style={{ color: colors.headingText }}>{review.author}</h5>
                    {review.role && <p className="text-xs" style={{ color: colors.mutedText }}>{review.role}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // =====================================================================
  // GALLERY PREVIEW - Different layout per theme
  // =====================================================================
  function GalleryPreviewSection() {
    const images = site.gallery_images;

    // ── LUXE: Alternating tall/short masonry grid ──
    if (template.id === 'luxe') {
      return (
        <section className="py-24" style={{ backgroundColor: decorations.sectionBg }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <span className="text-xs font-bold tracking-[0.2em] uppercase mb-4 block" style={{ color: colors.secondary }}>Gallery</span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ fontFamily: fonts.heading, color: colors.headingText }}>
                Our Finest Work
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {images.slice(0, 6).map((img, idx) => (
                <div key={idx} className={`luxe-card overflow-hidden ${idx === 0 || idx === 3 ? 'row-span-2' : ''}`}
                  style={{ borderRadius: template.layout.borderRadiusLg }}>
                  <img src={img} alt={`Gallery ${idx + 1}`}
                    className={`w-full h-full object-cover hover:scale-105 transition-transform duration-700 ${idx === 0 || idx === 3 ? 'aspect-[3/4]' : 'aspect-square'}`} />
                </div>
              ))}
            </div>
            {images.length > 6 && (
              <div className="text-center mt-10">
                <Link to={`${basePath}/gallery`} className="font-bold text-sm" style={{ color: colors.secondary }}>
                  View Full Gallery <ArrowRight className="h-4 w-4 inline ml-1" />
                </Link>
              </div>
            )}
          </div>
        </section>
      );
    }

    // ── PLAYFUL: Rounded, tilted cards with shadow ──
    if (template.id === 'playful') {
      return (
        <>
          <WavyDivider color={decorations.sectionBg} />
          <section className="py-20" style={{ backgroundColor: decorations.sectionBg }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl sm:text-4xl font-black mb-12 text-center"
                style={{ fontFamily: fonts.heading, color: colors.headingText }}>
                Cutest Transformations 📸
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
                {images.slice(0, 6).map((img, idx) => (
                  <div key={idx} className="playful-card aspect-square overflow-hidden shadow-lg"
                    style={{ borderRadius: '24px', border: '3px solid white', transform: idx % 2 ? 'rotate(1deg)' : 'rotate(-1deg)' }}>
                    <img src={img} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
              {images.length > 6 && (
                <div className="text-center mt-10">
                  <Link to={`${basePath}/gallery`} className="font-extrabold text-sm" style={{ color: colors.primary }}>
                    See All Photos <ArrowRight className="h-4 w-4 inline ml-1" />
                  </Link>
                </div>
              )}
            </div>
          </section>
        </>
      );
    }

    // ── WARM / CLEAN: Standard grid ──
    return (
      <section className="py-20" style={{ backgroundColor: decorations.sectionBg }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-14">
            <div>
              <h2 className="text-3xl sm:text-4xl font-extrabold mb-3 tracking-tight"
                style={{ fontFamily: fonts.heading, color: colors.headingText }}>
                {template.id === 'warm' ? 'Our Happy Family' : 'Our Happy Clients'}
              </h2>
              <p style={{ color: colors.bodyText }}>A gallery of fresh, fluffy transformations.</p>
            </div>
            {images.length > 6 && (
              <Link to={`${basePath}/gallery`} className="flex items-center gap-1 font-bold text-sm"
                style={{ color: template.id === 'warm' ? colors.primary : themeColor }}>
                View All <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {images.slice(0, 6).map((img, idx) => (
              <div key={idx} className={`${template.id === 'warm' ? 'warm-card' : 'clean-card'} aspect-square overflow-hidden group`}
                style={{ borderRadius: template.layout.borderRadiusLg }}>
                <img src={img} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // =====================================================================
  // ABOUT PREVIEW
  // =====================================================================
  function AboutPreviewSection() {
    return (
      <section className="py-20" style={{ backgroundColor: decorations.sectionAltBg }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-6 tracking-tight"
            style={{ fontFamily: fonts.heading, color: colors.headingText }}>About {salonName}</h2>
          <p className="leading-relaxed text-base max-w-2xl mx-auto line-clamp-4" style={{ color: colors.bodyText }}>{site.about_text}</p>
          <Link to={`${basePath}/about`} className="inline-flex items-center gap-1 mt-6 font-bold text-sm"
            style={{ color: template.id === 'luxe' ? colors.secondary : template.id === 'warm' ? colors.primary : themeColor }}>
            Read More <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    );
  }

  // =====================================================================
  // CTA SECTION - Completely different per theme
  // =====================================================================
  function CTASection() {
    const ctaTitle = site.cta_title || 'Ready to Pamper Your Pet?';
    const ctaDesc = site.cta_description || 'Book your appointment today and give your furry friend the care they deserve.';

    // ── LUXE: Elegant dark CTA with gold accent line ──
    if (template.id === 'luxe') {
      return (
        <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-16 md:p-24 text-center relative overflow-hidden"
            style={{ background: decorations.ctaBg, border: `1px solid ${colors.secondary}20`, borderRadius: template.layout.borderRadiusLg }}>
            <div className="w-16 h-[2px] mx-auto mb-8" style={{ backgroundColor: colors.secondary }} />
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6 relative z-10"
              style={{ fontFamily: fonts.heading }}>
              {ctaTitle}
            </h2>
            <p className="text-white/50 text-base max-w-xl mx-auto mb-10 relative z-10">{ctaDesc}</p>
            <button onClick={() => openBooking()}
              className="luxe-card px-12 py-4 font-bold text-base tracking-wider uppercase relative z-10"
              style={{ background: colors.secondary, color: colors.background, borderRadius: '4px', letterSpacing: '0.1em' }}>
              Book Your Session
            </button>
          </div>
        </section>
      );
    }

    // ── PLAYFUL: Vibrant gradient CTA with floating paw prints ──
    if (template.id === 'playful') {
      return (
        <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-12 md:p-20 text-center relative overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`, borderRadius: '32px' }}>
            <DecorativePawPrint className="absolute top-4 left-8 playful-float" color="#fff" opacity={0.1} size={80} />
            <DecorativePawPrint className="absolute bottom-4 right-8 playful-float-delayed" color="#fff" opacity={0.08} size={60} />
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/2" />
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-6 relative z-10"
              style={{ fontFamily: fonts.heading }}>
              {ctaTitle} 🎉
            </h2>
            <p className="text-white/85 text-lg max-w-2xl mx-auto mb-10 relative z-10">{ctaDesc}</p>
            <button onClick={() => openBooking()}
              className="playful-card bg-white px-12 py-4 font-extrabold text-lg relative z-10 shadow-2xl"
              style={{ color: colors.primary, borderRadius: '9999px' }}>
              <Calendar className="h-5 w-5 inline mr-2" /> Book Now
            </button>
          </div>
        </section>
      );
    }

    // ── WARM: Warm gradient CTA with organic blob accent ──
    if (template.id === 'warm') {
      return (
        <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-12 md:p-20 text-center relative overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${colors.primary}, #f59e0b)`, borderRadius: template.layout.borderRadiusLg }}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 warm-blob -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 warm-blob-alt translate-y-1/2 -translate-x-1/2" />
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-6 relative z-10"
              style={{ fontFamily: fonts.heading }}>
              {ctaTitle}
            </h2>
            <p className="text-white/80 text-lg max-w-2xl mx-auto mb-10 relative z-10">{ctaDesc}</p>
            <button onClick={() => openBooking()}
              className="warm-card bg-white px-12 py-4 font-bold text-lg relative z-10 shadow-xl"
              style={{ color: colors.primary, borderRadius: template.layout.borderRadius }}>
              <Calendar className="h-5 w-5 inline mr-2" /> Book Your Visit
            </button>
          </div>
        </section>
      );
    }

    // ── CLEAN: Lavender CTA box (from Stitch Groom Studio) ──
    return (
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-12 md:p-20 text-center relative overflow-hidden"
          style={{ background: decorations.ctaBg, borderRadius: '40px' }}>
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4 relative z-10"
            style={{ fontFamily: fonts.heading, color: colors.headingText }}>
            {ctaTitle}
          </h2>
          <p className="text-base max-w-xl mx-auto mb-8 relative z-10" style={{ color: colors.bodyText }}>{ctaDesc}</p>
          <div className="flex flex-wrap gap-4 justify-center relative z-10">
            <button onClick={() => openBooking()}
              className="clean-card px-10 py-4 font-bold text-base shadow-xl text-white"
              style={{ background: themeColor, borderRadius: '20px', boxShadow: `0 8px 24px ${themeColor}25` }}>
              <Calendar className="h-5 w-5 inline mr-2" /> Book Your Appointment
            </button>
            <Link to={`${basePath}/contact`}
              className="clean-card px-10 py-4 font-bold text-base border-2"
              style={{ borderColor: colors.cardBorder, color: colors.headingText, borderRadius: '20px' }}>
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    );
  }

  // =====================================================================
  // FAQ
  // =====================================================================
  function FAQSection() {
    const [openIdx, setOpenIdx] = React.useState(null);
    return (
      <section className="py-20" style={{ backgroundColor: decorations.sectionBg }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-10 text-center tracking-tight"
            style={{ fontFamily: fonts.heading, color: colors.headingText }}>
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {site.faq_items.map((item, idx) => (
              <div key={idx} style={{ borderRadius: template.layout.borderRadius, backgroundColor: colors.cardBg, border: `1px solid ${colors.cardBorder}` }}>
                <button onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left">
                  <span className="font-bold" style={{ color: colors.headingText }}>{item.question}</span>
                  {openIdx === idx
                    ? <ChevronUp className="h-5 w-5" style={{ color: colors.mutedText }} />
                    : <ChevronDown className="h-5 w-5" style={{ color: colors.mutedText }} />
                  }
                </button>
                {openIdx === idx && (
                  <div className="px-6 pb-4 text-sm leading-relaxed" style={{ color: colors.bodyText }}>{item.answer}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return <>{sections.map(renderSection)}</>;
}
