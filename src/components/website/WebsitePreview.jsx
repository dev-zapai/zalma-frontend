import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { getThemeTemplate } from '@/lib/themeTemplates';
import {
  MapPin, Phone, Mail, Clock, PawPrint, Calendar,
  Star, Shield, Leaf, Heart, Timer, Sparkles, Scissors,
  Check, Quote, Instagram, Facebook, ArrowRight, Users
} from 'lucide-react';

const FEATURE_ICONS = {
  shield: Shield, leaf: Leaf, scissors: Scissors, timer: Timer,
  heart: Heart, star: Star, sparkles: Sparkles, check: Check, paw: PawPrint,
};

export default function WebsitePreview({ config, tenant }) {
  const [services, setServices] = useState([]);

  const theme = getThemeTemplate(config.theme_template);
  const t = theme.colors;
  const lay = theme.layout;
  const dec = theme.decorations;
  const fonts = theme.fonts;

  const accentColor = config.website_theme_color || t.accent;
  const secondaryColor = config.website_secondary_color || t.secondary;

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await api.get('/services');
        setServices((res.data?.items || res.data || []).filter(s => s.is_active));
      } catch (e) { /* ignore */ }
    };
    fetchServices();
  }, []);

  const salonName = config.salon_name || tenant?.name || 'Your Salon';
  const businessHours = tenant?.business_hours;
  const features = config.features?.length > 0 ? config.features : [
    { icon: 'shield', title: 'Certified Groomers', description: 'Professional training.' },
    { icon: 'leaf', title: 'Premium Products', description: 'Eco-friendly products.' },
    { icon: 'heart', title: 'Gentle Handling', description: 'Calm, patient approach.' },
    { icon: 'timer', title: 'Flexible Scheduling', description: 'Easy online booking.' },
  ];
  const trustBadges = config.trust_badges?.length > 0 ? config.trust_badges : [];
  const themeId = theme.id;
  const isLuxe = themeId === 'luxe';
  const isPlayful = themeId === 'playful';
  const isClean = themeId === 'clean';
  const isWarm = themeId === 'warm';

  const headingFont = fonts.heading;
  const bodyFont = fonts.body;

  // Wavy SVG for playful
  const WavyDividerSmall = ({ color, flip }) => (
    <div style={{ width: '100%', overflow: 'hidden', lineHeight: 0, transform: flip ? 'rotate(180deg)' : 'none', marginTop: '-1px', marginBottom: '-1px' }}>
      <svg viewBox="0 0 1440 60" preserveAspectRatio="none" style={{ width: '100%', height: '16px', display: 'block' }}>
        <path d="M0,30 C240,60 480,0 720,30 C960,60 1200,0 1440,30 L1440,60 L0,60 Z" fill={color} />
      </svg>
    </div>
  );

  // ══════════════════════════════════════════════════
  // NAVBAR - Different per theme
  // ══════════════════════════════════════════════════
  const renderNavbar = () => {
    const navBase = { position: 'sticky', top: 0, zIndex: 10, padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: bodyFont };

    if (isLuxe) {
      return (
        <div style={{ ...navBase, backgroundColor: t.navBg, borderBottom: `1px solid ${t.accent}15` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {config.logo_url ? (
              <img src={config.logo_url} alt="Logo" style={{ height: '24px', width: '24px', borderRadius: '4px', objectFit: 'cover' }} />
            ) : (
              <div style={{ height: '24px', width: '24px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: `${t.accent}20` }}>
                <PawPrint style={{ height: '12px', width: '12px', color: t.accent }} />
              </div>
            )}
            <span style={{ fontWeight: 700, color: '#ffffff', fontSize: '11px', fontFamily: headingFont }}>{salonName}</span>
          </div>
          <button style={{ fontSize: '8px', padding: '4px 10px', border: `1px solid ${t.accent}`, color: t.accent, background: 'transparent', borderRadius: '4px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            Reserve
          </button>
        </div>
      );
    }

    if (isPlayful) {
      return (
        <div style={{ ...navBase, backgroundColor: '#ffffff', borderBottom: '3px dashed #ffe0e8' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {config.logo_url ? (
              <img src={config.logo_url} alt="Logo" style={{ height: '24px', width: '24px', borderRadius: '12px', objectFit: 'cover' }} />
            ) : (
              <div style={{ height: '26px', width: '26px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${t.primary}20, ${t.secondary}20)` }}>
                <PawPrint style={{ height: '12px', width: '12px', color: t.primary }} />
              </div>
            )}
            <span style={{ fontWeight: 900, color: t.headingText, fontSize: '11px', fontFamily: headingFont }}>{salonName} 🐾</span>
          </div>
          <button style={{ fontSize: '8px', padding: '4px 12px', background: `linear-gradient(135deg, ${t.primary}, ${t.secondary})`, color: '#fff', borderRadius: '9999px', fontWeight: 800, border: 'none', boxShadow: `0 2px 8px ${t.primary}30` }}>
            Book Now ✨
          </button>
        </div>
      );
    }

    if (isWarm) {
      return (
        <div style={{ ...navBase, backgroundColor: t.navBg, borderBottom: `2px solid ${t.cardBorder}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {config.logo_url ? (
              <img src={config.logo_url} alt="Logo" style={{ height: '24px', width: '24px', borderRadius: '8px', objectFit: 'cover' }} />
            ) : (
              <div style={{ height: '24px', width: '24px', borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: `${t.primary}12` }}>
                <Heart style={{ height: '11px', width: '11px', color: t.primary }} />
              </div>
            )}
            <span style={{ fontWeight: 800, color: t.headingText, fontSize: '11px', fontFamily: headingFont }}>{salonName}</span>
          </div>
          <button style={{ fontSize: '8px', padding: '4px 12px', background: t.primary, color: '#fff', borderRadius: '8px', fontWeight: 700, border: 'none' }}>
            Book Now
          </button>
        </div>
      );
    }

    // Clean
    return (
      <div style={{ ...navBase, backgroundColor: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {config.logo_url ? (
            <img src={config.logo_url} alt="Logo" style={{ height: '22px', width: '22px', borderRadius: '6px', objectFit: 'cover' }} />
          ) : (
            <div style={{ height: '22px', width: '22px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: `${accentColor}08` }}>
              <PawPrint style={{ height: '11px', width: '11px', color: accentColor }} />
            </div>
          )}
          <span style={{ fontWeight: 800, color: t.headingText, fontSize: '11px', fontFamily: headingFont }}>{salonName}</span>
        </div>
        <button style={{ fontSize: '8px', padding: '4px 12px', background: accentColor, color: '#fff', borderRadius: '8px', fontWeight: 700, border: 'none' }}>
          Book Now
        </button>
      </div>
    );
  };

  // ══════════════════════════════════════════════════
  // HERO - Different structure per theme
  // ══════════════════════════════════════════════════
  const renderHero = () => {
    const heroTitle = config.hero_title || `Welcome to ${salonName}`;

    // LUXE: Dark cinematic, gold rule, centered
    if (isLuxe) {
      return (
        <div style={{ position: 'relative', minHeight: '190px', overflow: 'hidden' }}>
          {config.hero_image_url ? (
            <img src={config.hero_image_url} alt="Hero" style={{ width: '100%', height: '190px', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '190px', background: 'linear-gradient(135deg, #000000 0%, #111111 50%, #000000 100%)' }} />
          )}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.85), rgba(0,0,0,0.6))', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '16px' }}>
            <div style={{ width: '24px', height: '2px', backgroundColor: t.accent, marginBottom: '10px' }} />
            {config.tagline && (
              <span style={{ fontSize: '7px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: t.accent, marginBottom: '6px' }}>{config.tagline}</span>
            )}
            <h1 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', lineHeight: 1.15, marginBottom: '8px', fontFamily: headingFont }}>{heroTitle}</h1>
            <div style={{ width: '24px', height: '2px', backgroundColor: t.accent, marginBottom: '10px' }} />
            <button style={{ fontSize: '8px', padding: '5px 14px', background: t.accent, color: t.background, borderRadius: '4px', fontWeight: 700, border: 'none', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              Book an Appointment
            </button>
          </div>
        </div>
      );
    }

    // PLAYFUL: Gradient bg with floating circles, emoji
    if (isPlayful) {
      return (
        <div style={{ position: 'relative', minHeight: '180px', overflow: 'hidden', background: `linear-gradient(135deg, ${t.primary}12, ${t.secondary}15, ${t.tertiary}08)`, display: 'flex', alignItems: 'center', padding: '20px 16px' }}>
          {/* Floating circles */}
          <div style={{ position: 'absolute', top: '-8px', right: '-8px', width: '50px', height: '50px', borderRadius: '50%', background: `${t.primary}08` }} />
          <div style={{ position: 'absolute', bottom: '10px', left: '10px', width: '30px', height: '30px', borderRadius: '50%', background: `${t.secondary}06` }} />
          <div style={{ position: 'relative', zIndex: 1, flex: 1 }}>
            {config.tagline && (
              <span style={{ fontSize: '7px', fontWeight: 800, color: t.primary, backgroundColor: `${t.primary}15`, padding: '2px 8px', borderRadius: '9999px', display: 'inline-block', marginBottom: '6px' }}>
                🐾 {config.tagline}
              </span>
            )}
            <h1 style={{ fontSize: '14px', fontWeight: 900, color: t.headingText, lineHeight: 1.15, marginBottom: '6px', fontFamily: headingFont }}>{heroTitle} 🐾</h1>
            {config.hero_description && (
              <p style={{ fontSize: '8px', color: t.bodyText, marginBottom: '8px' }}>{config.hero_description}</p>
            )}
            <div style={{ display: 'flex', gap: '6px' }}>
              <button style={{ fontSize: '8px', padding: '5px 12px', background: `linear-gradient(135deg, ${t.primary}, ${t.secondary})`, color: '#fff', borderRadius: '9999px', fontWeight: 800, border: 'none', boxShadow: `0 2px 8px ${t.primary}30` }}>
                Book Now ✨
              </button>
              <button style={{ fontSize: '8px', padding: '5px 10px', border: `2px solid ${t.primary}30`, color: t.primary, borderRadius: '9999px', fontWeight: 800, background: 'transparent' }}>
                Explore →
              </button>
            </div>
          </div>
          {config.hero_image_url && (
            <div style={{ width: '35%', position: 'relative', marginLeft: '12px' }}>
              <div style={{ position: 'absolute', inset: '-4px', borderRadius: '20px', transform: 'rotate(4deg)', background: `${t.primary}10` }} />
              <img src={config.hero_image_url} alt="Hero" style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: '16px', position: 'relative', border: '2px solid white' }} />
            </div>
          )}
        </div>
      );
    }

    // WARM: Warm overlay with organic blob shapes
    if (isWarm) {
      return (
        <div style={{ position: 'relative', minHeight: '180px', overflow: 'hidden' }}>
          {config.hero_image_url ? (
            <img src={config.hero_image_url} alt="Hero" style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '180px', background: `linear-gradient(160deg, ${t.primary}15, ${t.background} 60%, ${t.secondary}10)` }} />
          )}
          {/* Organic blob shape */}
          <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: '40%', height: '60%', borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%', opacity: 0.06, background: t.primary }} />
          <div style={{ position: 'absolute', inset: 0, background: config.hero_image_url ? 'linear-gradient(to bottom, rgba(45,31,14,0.45), rgba(254,247,237,0.9))' : 'transparent', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '16px' }}>
            {config.tagline && (
              <span style={{ fontSize: '7px', fontWeight: 700, color: t.primary, backgroundColor: `${t.primary}15`, padding: '2px 8px', borderRadius: '8px', display: 'inline-block', marginBottom: '6px', alignSelf: 'flex-start' }}>
                ❤️ {config.tagline}
              </span>
            )}
            <h1 style={{ fontSize: '15px', fontWeight: 800, color: config.hero_image_url ? '#ffffff' : t.headingText, lineHeight: 1.15, marginBottom: '6px', fontFamily: headingFont }}>{heroTitle}</h1>
            <button style={{ fontSize: '8px', padding: '5px 14px', background: t.primary, color: '#fff', borderRadius: '10px', fontWeight: 700, border: 'none', alignSelf: 'flex-start', boxShadow: '0 2px 10px rgba(217,119,6,0.3)' }}>
              Book an Appointment
            </button>
          </div>
        </div>
      );
    }

    // CLEAN: Split hero with stats counter row
    return (
      <div>
        <div style={{ display: 'flex', minHeight: '150px', overflow: 'hidden', background: t.background }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '16px' }}>
            {config.tagline && (
              <span style={{ fontSize: '7px', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: accentColor, marginBottom: '6px' }}>{config.tagline}</span>
            )}
            <h1 style={{ fontSize: '14px', fontWeight: 800, color: t.headingText, lineHeight: 1.15, marginBottom: '6px', fontFamily: headingFont }}>{heroTitle}</h1>
            {config.hero_description && (
              <p style={{ fontSize: '8px', color: t.bodyText, marginBottom: '8px' }}>{config.hero_description}</p>
            )}
            <div style={{ display: 'flex', gap: '6px' }}>
              <button style={{ fontSize: '8px', padding: '5px 12px', background: accentColor, color: '#fff', borderRadius: '8px', fontWeight: 700, border: 'none' }}>
                Book Now
              </button>
              <button style={{ fontSize: '8px', padding: '5px 10px', border: `1px solid ${t.cardBorder}`, color: t.headingText, borderRadius: '8px', fontWeight: 600, background: 'transparent' }}>
                Services →
              </button>
            </div>
          </div>
          <div style={{ width: '42%', position: 'relative' }}>
            {config.hero_image_url ? (
              <img src={config.hero_image_url} alt="Hero" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '0 0 0 16px' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', background: `${accentColor}06`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PawPrint style={{ height: '28px', width: '28px', color: `${accentColor}18` }} />
              </div>
            )}
          </div>
        </div>
        {/* Stats counter row - unique to Clean */}
        <div style={{ display: 'flex', borderTop: `1px solid ${t.cardBorder}`, borderBottom: `1px solid ${t.cardBorder}` }}>
          {['500+', '4.9', 'Expert', 'Since 2020'].map((val, i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center', padding: '6px 4px', borderRight: i < 3 ? `1px solid ${t.cardBorder}` : 'none' }}>
              <div style={{ fontSize: '10px', fontWeight: 800, color: accentColor }}>{val}</div>
              <div style={{ fontSize: '6px', color: t.mutedText }}>{['Happy Pets', 'Rating', 'Team', 'Years'][i]}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ══════════════════════════════════════════════════
  // SERVICES
  // ══════════════════════════════════════════════════
  const renderServices = () => {
    if (!config.show_services || services.length === 0) return null;

    const cardColors = [t.primary, t.secondary, t.tertiary || t.primary, t.primary];

    // LUXE: Horizontal list items
    if (isLuxe) {
      return (
        <div style={{ padding: '16px 12px', background: t.background, fontFamily: bodyFont }}>
          <div style={{ textAlign: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '7px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: t.accent }}>THE LUXE DIFFERENCE</span>
            <div style={{ fontFamily: headingFont, color: t.headingText, fontWeight: 700, fontSize: '12px', marginTop: '4px' }}>Our Services</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {services.slice(0, 4).map((svc) => (
              <div key={svc.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', backgroundColor: t.cardBg, border: `1px solid ${t.cardBorder}`, borderLeft: `3px solid ${t.accent}`, borderRadius: '4px' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: `${t.accent}12`, flexShrink: 0 }}>
                  <PawPrint style={{ height: '11px', width: '11px', color: t.accent }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, color: t.headingText, fontSize: '9px', fontFamily: headingFont }}>{svc.name}</div>
                </div>
                {config.show_prices && svc.price > 0 && (
                  <span style={{ fontWeight: 700, fontSize: '10px', color: t.accent, fontFamily: headingFont, flexShrink: 0 }}>${svc.price}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    // PLAYFUL: Colorful cards with top strips
    if (isPlayful) {
      return (
        <>
          <WavyDividerSmall color={dec.sectionAltBg} />
          <div style={{ padding: '16px 12px', background: `linear-gradient(135deg, ${t.primary}06, ${t.secondary}06, ${t.tertiary}04)`, fontFamily: bodyFont }}>
            <div style={{ fontFamily: headingFont, color: t.headingText, fontWeight: 900, fontSize: '12px', textAlign: 'center', marginBottom: '10px' }}>
              Pawsome Services 🐾
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {services.slice(0, 4).map((svc, idx) => (
                <div key={svc.id} style={{ position: 'relative', backgroundColor: t.cardBg, border: `2px solid ${cardColors[idx % 4]}20`, borderRadius: '16px', padding: '10px', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: '8px', right: '8px', height: '3px', borderRadius: '0 0 4px 4px', backgroundColor: cardColors[idx % 4] }} />
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: `${cardColors[idx % 4]}12`, marginBottom: '5px', marginTop: '4px' }}>
                    <PawPrint style={{ height: '10px', width: '10px', color: cardColors[idx % 4] }} />
                  </div>
                  <div style={{ fontWeight: 800, color: t.headingText, fontSize: '9px', fontFamily: headingFont, marginBottom: '2px' }}>{svc.name}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: t.mutedText, fontSize: '7px' }}>{svc.duration_minutes}min</span>
                    {config.show_prices && svc.price > 0 && (
                      <span style={{ fontWeight: 900, fontSize: '10px', color: cardColors[idx % 4] }}>${svc.price}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <WavyDividerSmall color={dec.sectionBg} flip />
        </>
      );
    }

    // WARM: Cards with organic icon bg and "Most Popular" badge
    if (isWarm) {
      return (
        <div style={{ padding: '16px 12px', background: t.background, fontFamily: bodyFont }}>
          <div style={{ textAlign: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '7px', fontWeight: 700, color: t.secondary, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
              <Heart style={{ height: '7px', width: '7px' }} /> WHAT WE OFFER
            </span>
            <div style={{ fontFamily: headingFont, color: t.headingText, fontWeight: 800, fontSize: '12px', marginTop: '3px' }}>Services Our Community Loves</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {services.slice(0, 4).map((svc, idx) => (
              <div key={svc.id} style={{ position: 'relative', backgroundColor: t.cardBg, border: `1px solid ${t.cardBorder}`, borderRadius: '12px', padding: '10px' }}>
                {idx === 0 && (
                  <div style={{ position: 'absolute', top: '-6px', left: '8px', fontSize: '6px', fontWeight: 700, color: '#fff', backgroundColor: t.secondary, padding: '1px 6px', borderRadius: '9999px' }}>Most Popular</div>
                )}
                <div style={{ width: '22px', height: '22px', borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: `${t.primary}12`, marginBottom: '5px' }}>
                  <PawPrint style={{ height: '10px', width: '10px', color: t.primary }} />
                </div>
                <div style={{ fontWeight: 700, color: t.headingText, fontSize: '9px', fontFamily: headingFont, marginBottom: '2px' }}>{svc.name}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: t.mutedText, fontSize: '7px' }}>{svc.duration_minutes}min</span>
                  {config.show_prices && svc.price > 0 && (
                    <span style={{ fontWeight: 800, fontSize: '10px', color: t.primary }}>${svc.price}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // CLEAN: Minimal cards with thin border
    return (
      <div style={{ padding: '16px 12px', background: t.surface, fontFamily: bodyFont }}>
        <div style={{ fontFamily: headingFont, color: t.headingText, fontWeight: 800, fontSize: '12px', marginBottom: '10px' }}>Our Services</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
          {services.slice(0, 4).map((svc) => (
            <div key={svc.id} style={{ backgroundColor: t.cardBg, border: `1px solid ${t.cardBorder}`, borderRadius: '8px', padding: '10px' }}>
              <div style={{ width: '20px', height: '20px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: `${accentColor}08`, marginBottom: '5px' }}>
                <PawPrint style={{ height: '10px', width: '10px', color: accentColor }} />
              </div>
              <div style={{ fontWeight: 700, color: t.headingText, fontSize: '9px', fontFamily: headingFont, marginBottom: '2px' }}>{svc.name}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px', borderTop: `1px solid ${t.cardBorder}` }}>
                <span style={{ color: t.mutedText, fontSize: '7px' }}>{svc.duration_minutes}min</span>
                {config.show_prices && svc.price > 0 && (
                  <span style={{ fontWeight: 800, fontSize: '10px', color: accentColor }}>${svc.price}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ══════════════════════════════════════════════════
  // FEATURES
  // ══════════════════════════════════════════════════
  const renderFeatures = () => {
    if (config.show_features === false) return null;

    const cardColors = [t.primary, t.secondary, t.tertiary || t.primary, t.primary];
    const pastelBgs = dec.pastelCards || ['#fff0f3', '#fff8e1', '#f3e5f5', '#e8f5e9'];

    if (isLuxe) {
      return (
        <div style={{ padding: '16px 12px', background: dec.sectionBg, fontFamily: bodyFont }}>
          <div style={{ textAlign: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '7px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: t.accent }}>WHY US</span>
            <div style={{ fontFamily: headingFont, color: t.headingText, fontWeight: 700, fontSize: '12px', marginTop: '3px' }}>The Luxe Difference</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            {features.slice(0, 4).map((feat, idx) => {
              const Icon = FEATURE_ICONS[feat.icon] || Sparkles;
              return (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', padding: '8px', border: `1px solid ${t.cardBorder}`, borderRadius: '6px' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: `${t.accent}12`, border: `1px solid ${t.accent}20`, flexShrink: 0 }}>
                    <Icon style={{ height: '10px', width: '10px', color: t.accent }} />
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '8px', color: t.headingText, fontFamily: headingFont }}>{feat.title}</div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    if (isPlayful) {
      return (
        <div style={{ padding: '14px 12px', background: dec.sectionBg, fontFamily: bodyFont }}>
          <div style={{ fontFamily: headingFont, color: t.headingText, fontWeight: 900, fontSize: '12px', textAlign: 'center', marginBottom: '10px' }}>Why Pets Love Us! 🐶</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            {features.slice(0, 4).map((feat, idx) => {
              const Icon = FEATURE_ICONS[feat.icon] || Sparkles;
              return (
                <div key={idx} style={{ textAlign: 'center', padding: '8px', backgroundColor: pastelBgs[idx % pastelBgs.length], borderRadius: '16px' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#ffffff', border: `2px solid ${cardColors[idx % 4]}20`, marginBottom: '4px' }}>
                    <Icon style={{ height: '10px', width: '10px', color: cardColors[idx % 4] }} />
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '8px', color: t.headingText, fontFamily: headingFont }}>{feat.title}</div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    if (isWarm) {
      const warmTints = dec.warmTints || ['#fef7ed', '#f0fdf4', '#fef2f2', '#fdf4e8'];
      return (
        <div style={{ padding: '14px 12px', background: dec.sectionBg, fontFamily: bodyFont }}>
          <div style={{ textAlign: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '7px', fontWeight: 700, color: t.secondary }}>❤️ OUR PROMISE</span>
            <div style={{ fontFamily: headingFont, color: t.headingText, fontWeight: 800, fontSize: '12px', marginTop: '3px' }}>What Makes Us Special</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            {features.slice(0, 4).map((feat, idx) => {
              const Icon = FEATURE_ICONS[feat.icon] || Sparkles;
              return (
                <div key={idx} style={{ textAlign: 'center', padding: '8px', backgroundColor: warmTints[idx % warmTints.length], borderRadius: '10px', border: `1px solid ${t.cardBorder}` }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%', backgroundColor: `${t.primary}12`, marginBottom: '4px' }}>
                    <Icon style={{ height: '10px', width: '10px', color: t.primary }} />
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '8px', color: t.headingText, fontFamily: headingFont }}>{feat.title}</div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // Clean: icon-left layout
    return (
      <div style={{ padding: '16px 12px', background: dec.sectionBg, fontFamily: bodyFont }}>
        <div style={{ fontFamily: headingFont, color: t.headingText, fontWeight: 800, fontSize: '12px', textAlign: 'center', marginBottom: '4px' }}>Why Choose Us</div>
        <div style={{ width: '16px', height: '2px', backgroundColor: accentColor, margin: '0 auto 10px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {features.slice(0, 4).map((feat, idx) => {
            const Icon = FEATURE_ICONS[feat.icon] || Sparkles;
            return (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: `${accentColor}08`, flexShrink: 0 }}>
                  <Icon style={{ height: '9px', width: '9px', color: accentColor }} />
                </div>
                <div style={{ fontWeight: 700, fontSize: '8px', color: t.headingText, fontFamily: headingFont }}>{feat.title}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ══════════════════════════════════════════════════
  // TESTIMONIALS
  // ══════════════════════════════════════════════════
  const renderTestimonials = () => {
    if (config.show_testimonials === false || !config.testimonials?.length) return null;
    const testimonial = config.testimonials[0];
    const starColor = isLuxe ? t.accent : isPlayful ? t.secondary : isWarm ? t.primary : accentColor;

    if (isLuxe) {
      return (
        <div style={{ padding: '14px 12px', background: t.background, fontFamily: bodyFont }}>
          <div style={{ textAlign: 'left', marginBottom: '6px' }}>
            <span style={{ fontSize: '7px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: t.accent }}>TESTIMONIALS</span>
          </div>
          <div style={{ padding: '10px', backgroundColor: t.cardBg, borderLeft: `3px solid ${t.accent}`, borderRadius: '4px' }}>
            <Quote style={{ height: '10px', width: '10px', color: `${t.accent}30`, marginBottom: '4px' }} />
            <p style={{ fontSize: '8px', color: t.bodyText, fontStyle: 'italic', marginBottom: '6px', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>"{testimonial.text}"</p>
            <div style={{ display: 'flex', gap: '2px', marginBottom: '4px' }}>
              {[...Array(testimonial.rating || 5)].map((_, i) => (<Star key={i} style={{ height: '8px', width: '8px', fill: starColor, color: starColor }} />))}
            </div>
            <p style={{ fontSize: '7px', fontWeight: 700, color: t.headingText, fontFamily: headingFont }}>- {testimonial.author}</p>
          </div>
        </div>
      );
    }

    if (isPlayful) {
      return (
        <div style={{ padding: '14px 12px', background: dec.sectionBg, fontFamily: bodyFont }}>
          <div style={{ fontFamily: headingFont, color: t.headingText, fontWeight: 900, fontSize: '12px', textAlign: 'center', marginBottom: '8px' }}>Happy Tails 🐾</div>
          <div style={{ padding: '12px', background: `linear-gradient(135deg, ${t.primary}06, ${t.secondary}06)`, borderRadius: '18px', border: `2px solid ${t.primary}15` }}>
            <div style={{ display: 'flex', gap: '2px', marginBottom: '6px' }}>
              {[...Array(testimonial.rating || 5)].map((_, i) => (<Star key={i} style={{ height: '10px', width: '10px', fill: starColor, color: starColor }} />))}
            </div>
            <p style={{ fontSize: '9px', color: t.headingText, fontWeight: 500, marginBottom: '8px', lineHeight: 1.5 }}>"{testimonial.text}"</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: `linear-gradient(135deg, ${t.primary}, ${t.secondary})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '8px', fontWeight: 800 }}>
                {(testimonial.author || 'A').charAt(0)}
              </div>
              <span style={{ fontWeight: 800, fontSize: '8px', color: t.headingText }}>{testimonial.author}</span>
            </div>
          </div>
        </div>
      );
    }

    if (isWarm) {
      return (
        <div style={{ padding: '14px 12px', background: t.surface, fontFamily: bodyFont }}>
          <div style={{ textAlign: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '7px', fontWeight: 700, color: t.secondary }}>👨‍👩‍👧‍👦 OUR COMMUNITY</span>
            <div style={{ fontFamily: headingFont, color: t.headingText, fontWeight: 800, fontSize: '11px', marginTop: '2px' }}>From Our Pet Family</div>
          </div>
          <div style={{ padding: '10px', backgroundColor: t.cardBg, borderRadius: '12px', border: `1px solid ${t.cardBorder}` }}>
            <div style={{ display: 'flex', gap: '2px', marginBottom: '4px' }}>
              {[...Array(testimonial.rating || 5)].map((_, i) => (<Star key={i} style={{ height: '9px', width: '9px', fill: starColor, color: starColor }} />))}
            </div>
            <p style={{ fontSize: '8px', color: t.bodyText, marginBottom: '6px', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>"{testimonial.text}"</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '16px', height: '16px', borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%', backgroundColor: t.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '7px', fontWeight: 700 }}>
                {(testimonial.author || 'A').charAt(0)}
              </div>
              <span style={{ fontWeight: 700, fontSize: '8px', color: t.headingText }}>{testimonial.author}</span>
            </div>
          </div>
        </div>
      );
    }

    // Clean
    return (
      <div style={{ padding: '14px 12px', background: t.surface, fontFamily: bodyFont }}>
        <div style={{ fontFamily: headingFont, color: t.headingText, fontWeight: 800, fontSize: '11px', marginBottom: '4px' }}>What Owners Say</div>
        <div style={{ width: '16px', height: '2px', backgroundColor: accentColor, marginBottom: '8px' }} />
        <div style={{ padding: '10px', backgroundColor: t.cardBg, border: `1px solid ${t.cardBorder}`, borderRadius: '8px' }}>
          <div style={{ display: 'flex', gap: '2px', marginBottom: '4px' }}>
            {[...Array(testimonial.rating || 5)].map((_, i) => (<Star key={i} style={{ height: '8px', width: '8px', fill: starColor, color: starColor }} />))}
          </div>
          <p style={{ fontSize: '8px', color: t.bodyText, fontStyle: 'italic', marginBottom: '6px', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>"{testimonial.text}"</p>
          <p style={{ fontSize: '7px', fontWeight: 700, color: t.headingText, fontFamily: headingFont }}>- {testimonial.author}</p>
        </div>
      </div>
    );
  };

  // ══════════════════════════════════════════════════
  // GALLERY
  // ══════════════════════════════════════════════════
  const renderGallery = () => {
    if (config.show_gallery === false || !config.gallery_images?.length) return null;
    const imgRadius = isPlayful ? '14px' : isWarm ? '10px' : isLuxe ? '4px' : '8px';
    return (
      <div style={{ padding: '14px 12px', background: dec.sectionBg, fontFamily: bodyFont }}>
        <div style={{ fontFamily: headingFont, color: t.headingText, fontWeight: isPlayful ? 900 : 800, fontSize: '11px', textAlign: 'center', marginBottom: '8px' }}>
          {isPlayful ? 'Cutest Photos 📸' : isWarm ? 'Our Happy Family' : isLuxe ? 'Our Finest Work' : 'Gallery'}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px' }}>
          {config.gallery_images.slice(0, 6).map((img, idx) => (
            <div key={idx} style={{
              aspectRatio: '1', borderRadius: imgRadius, overflow: 'hidden',
              ...(isPlayful ? { border: '2px solid white', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', transform: idx % 2 ? 'rotate(1deg)' : 'rotate(-1deg)' } : {}),
            }}>
              <img src={img} alt={`Gallery ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ══════════════════════════════════════════════════
  // CTA
  // ══════════════════════════════════════════════════
  const renderCta = () => {
    if (config.show_cta === false) return null;

    if (isLuxe) {
      return (
        <div style={{ margin: '12px', borderRadius: '4px', padding: '16px', textAlign: 'center', background: dec.ctaBg, border: `1px solid ${t.accent}20` }}>
          <div style={{ width: '20px', height: '2px', backgroundColor: t.accent, margin: '0 auto 8px' }} />
          <h3 style={{ fontWeight: 700, fontSize: '11px', color: '#ffffff', fontFamily: headingFont, marginBottom: '8px' }}>
            {config.cta_title || 'Ready to Pamper Your Pet?'}
          </h3>
          <button style={{ background: t.accent, color: '#0a0a0a', padding: '5px 16px', borderRadius: '2px', fontWeight: 700, fontSize: '8px', border: 'none', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            Book Your Session
          </button>
        </div>
      );
    }

    if (isPlayful) {
      return (
        <div style={{ margin: '12px', borderRadius: '24px', padding: '16px', textAlign: 'center', background: `linear-gradient(135deg, ${t.primary}, ${t.secondary})`, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
          <h3 style={{ fontWeight: 900, fontSize: '11px', color: '#ffffff', fontFamily: headingFont, marginBottom: '8px' }}>
            {config.cta_title || 'Ready to Pamper Your Pet?'} 🎉
          </h3>
          <button style={{ background: '#ffffff', color: t.primary, padding: '5px 16px', borderRadius: '9999px', fontWeight: 800, fontSize: '8px', border: 'none', boxShadow: '0 2px 10px rgba(0,0,0,0.15)' }}>
            Book Now ✨
          </button>
        </div>
      );
    }

    if (isWarm) {
      return (
        <div style={{ margin: '12px', borderRadius: '16px', padding: '16px', textAlign: 'center', background: dec.ctaBg, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '40px', height: '40px', borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%', background: 'rgba(255,255,255,0.1)' }} />
          <h3 style={{ fontWeight: 800, fontSize: '11px', color: '#ffffff', fontFamily: headingFont, marginBottom: '8px' }}>
            {config.cta_title || 'Ready to Pamper Your Pet?'}
          </h3>
          <button style={{ background: '#ffffff', color: t.primary, padding: '5px 16px', borderRadius: '10px', fontWeight: 700, fontSize: '8px', border: 'none' }}>
            Book Your Visit
          </button>
        </div>
      );
    }

    // Clean
    return (
      <div style={{ margin: '12px', borderRadius: '10px', padding: '16px', textAlign: 'center', background: `linear-gradient(135deg, ${accentColor}, ${t.tertiary || accentColor})` }}>
        <h3 style={{ fontWeight: 800, fontSize: '11px', color: '#ffffff', fontFamily: headingFont, marginBottom: '6px' }}>
          {config.cta_title || 'Ready to Pamper Your Pet?'}
        </h3>
        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
          <button style={{ background: '#ffffff', color: accentColor, padding: '5px 14px', borderRadius: '8px', fontWeight: 700, fontSize: '8px', border: 'none' }}>
            Book Now
          </button>
          <button style={{ background: 'transparent', color: '#ffffff', padding: '5px 10px', borderRadius: '8px', fontWeight: 600, fontSize: '8px', border: '1px solid rgba(255,255,255,0.3)' }}>
            Contact
          </button>
        </div>
      </div>
    );
  };

  // ══════════════════════════════════════════════════
  // FOOTER
  // ══════════════════════════════════════════════════
  const renderFooter = () => {
    if (isLuxe) {
      return (
        <div style={{ padding: '10px 12px', backgroundColor: t.footerBg, borderTop: `1px solid ${t.accent}15`, textAlign: 'center' }}>
          <p style={{ fontSize: '7px', color: 'rgba(255,255,255,0.3)', margin: 0 }}>
            Powered by <span style={{ fontWeight: 600, color: t.accent }}>Zap AI</span>
          </p>
        </div>
      );
    }
    if (isPlayful) {
      return (
        <div style={{ padding: '10px 12px', backgroundColor: t.footerBg, borderTop: `2px dashed ${t.primary}25`, textAlign: 'center' }}>
          <p style={{ fontSize: '7px', fontWeight: 800, color: t.primary, margin: '0 0 2px 0' }}>Tail-wagging service guaranteed! 🐾</p>
          <p style={{ fontSize: '7px', color: t.mutedText, margin: 0 }}>
            Powered by <span style={{ fontWeight: 700, color: t.primary }}>Zap AI</span> ✨
          </p>
        </div>
      );
    }
    if (isWarm) {
      return (
        <div style={{ padding: '10px 12px', backgroundColor: t.footerBg, textAlign: 'center' }}>
          <p style={{ fontSize: '7px', color: `${t.footerText}60`, margin: 0 }}>
            Powered by <span style={{ fontWeight: 600, color: t.secondary }}>Zap AI</span>
          </p>
        </div>
      );
    }
    return (
      <div style={{ padding: '10px 12px', backgroundColor: t.surface, borderTop: `1px solid ${t.cardBorder}`, textAlign: 'center' }}>
        <p style={{ fontSize: '7px', color: t.mutedText, margin: 0 }}>
          Powered by <span style={{ fontWeight: 600, color: accentColor }}>Zap AI</span>
        </p>
      </div>
    );
  };

  // ══════════════════════════════════════════════════
  // MAIN RENDER
  // ══════════════════════════════════════════════════
  return (
    <div style={{ backgroundColor: t.background, minHeight: '100%', fontFamily: bodyFont, fontSize: '11px', lineHeight: 1.5, color: t.bodyText }}>
      {renderNavbar()}
      {renderHero()}
      {renderServices()}
      {renderFeatures()}
      {renderTestimonials()}
      {renderGallery()}
      {renderCta()}
      {renderFooter()}
    </div>
  );
}
