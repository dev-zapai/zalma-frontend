import React, { useState, useEffect } from 'react';
import { useParams, Outlet, NavLink, useNavigate } from 'react-router-dom';
import publicApi from '@/lib/publicApi';
import { applyThemeColor } from '@/lib/theme';
import { SalonThemeProvider, useTheme } from '@/lib/ThemeContext';
import BookingModal from '../BookingModal';
import {
  PawPrint, Loader2, AlertCircle, Menu, X,
  Calendar, Instagram, Facebook, Heart, Phone, Mail, MapPin
} from 'lucide-react';

export default function SalonWebsiteLayout() {
  const { slug } = useParams();
  const [site, setSite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [preselectedService, setPreselectedService] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchSite = async () => {
      try {
        const res = await publicApi.get(`/site/${slug}`);
        setSite(res.data);
        if (res.data.website_theme_color) {
          applyThemeColor(res.data.website_theme_color);
        }
      } catch (e) {
        setError(e.response?.status === 404 ? 'not_found' : 'error');
      }
      setLoading(false);
    };
    fetchSite();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto" />
          <p className="text-sm text-slate-400 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (error === 'not_found') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center max-w-md px-6">
          <PawPrint className="h-16 w-16 text-slate-200 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Page Not Found</h1>
          <p className="text-slate-500">This salon website doesn't exist or hasn't been published yet.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center max-w-md px-6">
          <AlertCircle className="h-16 w-16 text-slate-200 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Something went wrong</h1>
          <p className="text-slate-500">Please try again later.</p>
        </div>
      </div>
    );
  }

  const openBooking = (serviceId = null) => {
    setPreselectedService(serviceId);
    setBookingOpen(true);
  };

  return (
    <SalonThemeProvider siteData={site}>
      <LayoutShell
        slug={slug}
        site={site}
        openBooking={openBooking}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />
      {bookingOpen && (
        <BookingModal
          slug={slug}
          site={site}
          preselectedServiceId={preselectedService}
          onClose={() => { setBookingOpen(false); setPreselectedService(null); }}
        />
      )}
    </SalonThemeProvider>
  );
}

function LayoutShell({ slug, site, openBooking, mobileMenuOpen, setMobileMenuOpen }) {
  const { themeColor, secondaryColor, template, fonts, colors, isLuxe, isPlayful, isWarm, isClean } = useTheme();
  const salonName = site.salon_name || 'Salon';
  const basePath = `/s/${slug}`;

  const navLinks = [
    { to: basePath, label: 'Home', end: true },
    site.show_services && { to: `${basePath}/services`, label: 'Services' },
    site.show_gallery && site.gallery_images?.length > 0 && { to: `${basePath}/gallery`, label: 'Gallery' },
    site.show_about && { to: `${basePath}/about`, label: 'About' },
    site.show_contact && { to: `${basePath}/contact`, label: 'Contact' },
  ].filter(Boolean);

  return (
    <div className="min-h-screen" style={{ fontFamily: fonts.body, backgroundColor: colors.background }}>
      <link rel="stylesheet" href={`https://fonts.googleapis.com/css2?family=${fonts.googleImport}&display=swap`} />

      {/* ══════════════════════════════════════════════════ */}
      {/* NAVBAR - Completely different per theme */}
      {/* ══════════════════════════════════════════════════ */}

      {isLuxe ? (
        // ── LUXE: Dark solid navbar, gold accents, serif logo, gold outline CTA ──
        <nav className="fixed top-0 w-full z-50" style={{ backgroundColor: colors.navBg, borderBottom: `1px solid ${colors.secondary}15` }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
            <NavLink to={basePath} className="flex items-center gap-3">
              {site.logo_url ? (
                <img src={site.logo_url} alt={salonName} className="h-11 w-11 object-cover" style={{ borderRadius: '4px' }} />
              ) : (
                <div className="h-11 w-11 flex items-center justify-center" style={{ backgroundColor: colors.secondary + '15', borderRadius: '4px' }}>
                  <PawPrint className="h-5 w-5" style={{ color: colors.secondary }} />
                </div>
              )}
              <span className="font-bold text-xl tracking-tight text-white" style={{ fontFamily: fonts.heading }}>
                {salonName}
              </span>
            </NavLink>
            <div className="hidden md:flex items-center gap-10">
              {navLinks.map((link) => (
                <NavLink key={link.to} to={link.to} end={link.end}
                  className={({ isActive }) => `text-sm font-medium tracking-wide transition-colors ${isActive ? 'text-white' : 'text-white/50 hover:text-white'}`}
                  style={({ isActive }) => isActive ? { borderBottom: `2px solid ${colors.secondary}`, paddingBottom: '2px' } : {}}>
                  {link.label}
                </NavLink>
              ))}
            </div>
            <div className="flex items-center gap-3">
              {site.online_booking_enabled && (
                <NavLink to={`${basePath}/book`}
                  className="px-6 py-2.5 font-bold text-sm tracking-wider uppercase transition-all hover:scale-105"
                  style={{ border: `1px solid ${colors.secondary}`, color: colors.secondary, borderRadius: '4px', letterSpacing: '0.08em' }}>
                  Reserve
                </NavLink>
              )}
              <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X className="h-6 w-6 text-white" /> : <Menu className="h-6 w-6 text-white" />}
              </button>
            </div>
          </div>
          {mobileMenuOpen && (
            <div className="md:hidden" style={{ backgroundColor: colors.navBg, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="px-4 py-4 flex flex-col gap-1">
                {navLinks.map((link) => (
                  <NavLink key={link.to} to={link.to} end={link.end} onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) => `px-4 py-3 text-sm font-medium ${isActive ? 'text-white' : 'text-white/50'}`}
                    style={({ isActive }) => isActive ? { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px' } : {}}>
                    {link.label}
                  </NavLink>
                ))}
              </div>
            </div>
          )}
        </nav>

      ) : isPlayful ? (
        // ── PLAYFUL: White navbar with pink dashed border, rounded pill CTA, gradient ──
        <nav className="fixed top-0 w-full z-50" style={{ backgroundColor: 'rgba(255,255,255,0.97)', borderBottom: '3px dashed #ffe0e8', backdropFilter: 'blur(16px)' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
            <NavLink to={basePath} className="flex items-center gap-3">
              {site.logo_url ? (
                <img src={site.logo_url} alt={salonName} className="h-11 w-11 object-cover rounded-2xl shadow-md" />
              ) : (
                <div className="h-12 w-12 flex items-center justify-center shadow-md"
                  style={{ background: `linear-gradient(135deg, ${colors.primary}20, ${colors.secondary}20)`, borderRadius: '16px' }}>
                  <PawPrint className="h-5 w-5" style={{ color: colors.primary }} />
                </div>
              )}
              <span className="font-black text-xl" style={{ fontFamily: fonts.heading, color: colors.headingText }}>
                {salonName} <span style={{ color: colors.primary }}>🐾</span>
              </span>
            </NavLink>
            <div className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <NavLink key={link.to} to={link.to} end={link.end}
                  className={({ isActive }) => `text-sm font-bold transition-colors px-3 py-1.5 ${isActive ? '' : 'text-slate-500 hover:text-pink-500'}`}
                  style={({ isActive }) => isActive ? { color: colors.primary, backgroundColor: colors.primary + '10', borderRadius: '9999px' } : {}}>
                  {link.label}
                </NavLink>
              ))}
            </div>
            <div className="flex items-center gap-3">
              {site.online_booking_enabled && (
                <NavLink to={`${basePath}/book`}
                  className="px-6 py-2.5 font-extrabold text-sm text-white shadow-lg hover:shadow-xl transition-all hover:scale-105"
                  style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`, borderRadius: '9999px', boxShadow: `0 4px 14px ${colors.primary}30` }}>
                  Book Now ✨
                </NavLink>
              )}
              <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
          {mobileMenuOpen && (
            <div className="md:hidden bg-white" style={{ borderTop: '2px dashed #ffe0e8' }}>
              <div className="px-4 py-4 flex flex-col gap-1">
                {navLinks.map((link) => (
                  <NavLink key={link.to} to={link.to} end={link.end} onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) => `px-4 py-3 text-sm font-bold ${isActive ? '' : 'text-slate-500'}`}
                    style={({ isActive }) => isActive ? { color: colors.primary, backgroundColor: colors.primary + '08', borderRadius: '16px' } : {}}>
                    {link.label}
                  </NavLink>
                ))}
              </div>
            </div>
          )}
        </nav>

      ) : isWarm ? (
        // ── WARM: Cream navbar with warm border, organic feel, heart icon ──
        <nav className="fixed top-0 w-full z-50" style={{ backgroundColor: colors.navBg, borderBottom: `2px solid ${colors.cardBorder}`, backdropFilter: 'blur(12px)' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
            <NavLink to={basePath} className="flex items-center gap-3">
              {site.logo_url ? (
                <img src={site.logo_url} alt={salonName} className="h-11 w-11 object-cover shadow-sm" style={{ borderRadius: '12px' }} />
              ) : (
                <div className="h-11 w-11 flex items-center justify-center shadow-sm warm-blob"
                  style={{ backgroundColor: colors.primary + '12' }}>
                  <Heart className="h-5 w-5" style={{ color: colors.primary }} />
                </div>
              )}
              <span className="font-extrabold text-xl tracking-tight" style={{ fontFamily: fonts.heading, color: colors.headingText }}>
                {salonName}
              </span>
            </NavLink>
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <NavLink key={link.to} to={link.to} end={link.end}
                  className={({ isActive }) => `text-sm font-semibold transition-colors ${isActive ? 'font-bold' : 'hover:text-amber-700'}`}
                  style={({ isActive }) => ({ color: isActive ? colors.primary : colors.bodyText })}>
                  {link.label}
                </NavLink>
              ))}
            </div>
            <div className="flex items-center gap-3">
              {site.online_booking_enabled && (
                <NavLink to={`${basePath}/book`}
                  className="px-6 py-2.5 font-bold text-sm text-white shadow-lg hover:shadow-xl transition-all hover:scale-105"
                  style={{ background: colors.primary, borderRadius: '12px' }}>
                  Book Now
                </NavLink>
              )}
              <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
          {mobileMenuOpen && (
            <div className="md:hidden" style={{ backgroundColor: colors.navBg, borderTop: `1px solid ${colors.cardBorder}` }}>
              <div className="px-4 py-4 flex flex-col gap-1">
                {navLinks.map((link) => (
                  <NavLink key={link.to} to={link.to} end={link.end} onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) => `px-4 py-3 text-sm font-medium ${isActive ? 'font-bold' : ''}`}
                    style={({ isActive }) => ({
                      borderRadius: '12px',
                      color: isActive ? colors.primary : colors.bodyText,
                      backgroundColor: isActive ? colors.primary + '08' : 'transparent',
                    })}>
                    {link.label}
                  </NavLink>
                ))}
              </div>
            </div>
          )}
        </nav>

      ) : (
        // ── CLEAN: Frosted glass navbar, minimal, thin border ──
        <nav className="fixed top-0 w-full z-50" style={{ backgroundColor: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid #e2e8f0' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
            <NavLink to={basePath} className="flex items-center gap-3">
              {site.logo_url ? (
                <img src={site.logo_url} alt={salonName} className="h-10 w-10 object-cover" style={{ borderRadius: '8px' }} />
              ) : (
                <div className="h-10 w-10 flex items-center justify-center" style={{ backgroundColor: themeColor + '08', borderRadius: '8px' }}>
                  <PawPrint className="h-5 w-5" style={{ color: themeColor }} />
                </div>
              )}
              <span className="font-extrabold text-xl tracking-tight" style={{ fontFamily: fonts.heading, color: colors.headingText }}>
                {salonName}
              </span>
            </NavLink>
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <NavLink key={link.to} to={link.to} end={link.end}
                  className={({ isActive }) => `text-sm font-medium transition-colors ${isActive ? 'font-semibold' : 'text-slate-500 hover:text-slate-900'}`}
                  style={({ isActive }) => isActive ? { color: themeColor } : {}}>
                  {link.label}
                </NavLink>
              ))}
            </div>
            <div className="flex items-center gap-3">
              {site.online_booking_enabled && (
                <NavLink to={`${basePath}/book`}
                  className="px-6 py-2.5 font-bold text-sm text-white shadow-md hover:shadow-lg transition-all hover:scale-105"
                  style={{ background: themeColor, borderRadius: '12px' }}>
                  Book Now
                </NavLink>
              )}
              <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
          {mobileMenuOpen && (
            <div className="md:hidden bg-white shadow-lg" style={{ borderTop: '1px solid #e2e8f0' }}>
              <div className="px-4 py-4 flex flex-col gap-1">
                {navLinks.map((link) => (
                  <NavLink key={link.to} to={link.to} end={link.end} onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) => `px-4 py-3 text-sm font-medium ${isActive ? 'font-semibold' : 'text-slate-500'}`}
                    style={({ isActive }) => ({
                      borderRadius: '8px',
                      color: isActive ? themeColor : undefined,
                      backgroundColor: isActive ? themeColor + '06' : undefined,
                    })}>
                    {link.label}
                  </NavLink>
                ))}
              </div>
            </div>
          )}
        </nav>
      )}

      {/* Page Content */}
      <main className="pt-20">
        <Outlet context={{ site, openBooking, slug }} />
      </main>

      {/* ══════════════════════════════════════════════════ */}
      {/* FOOTER - Completely different structure per theme */}
      {/* ══════════════════════════════════════════════════ */}

      {isLuxe ? (
        // ── LUXE: Dark editorial footer with gold accents ──
        <footer className="pt-16 pb-8" style={{ backgroundColor: colors.footerBg }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Gold line */}
            <div className="w-full h-[1px] mb-12" style={{ backgroundColor: colors.secondary + '20' }} />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-14">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  {site.logo_url ? (
                    <img src={site.logo_url} alt={salonName} className="h-9 w-9 object-cover" style={{ borderRadius: '4px' }} />
                  ) : (
                    <PawPrint className="h-5 w-5" style={{ color: colors.secondary }} />
                  )}
                  <span className="font-bold text-lg text-white" style={{ fontFamily: fonts.heading }}>{salonName}</span>
                </div>
                {site.tagline && <p className="text-sm text-white/40">{site.tagline}</p>}
              </div>
              <div>
                <h6 className="font-bold mb-4 text-xs tracking-[0.15em] uppercase" style={{ color: colors.secondary }}>Navigate</h6>
                <ul className="flex flex-col gap-2.5">
                  {navLinks.map((link) => (
                    <li key={link.to}><NavLink to={link.to} end={link.end} className="text-sm text-white/50 hover:text-white transition-colors">{link.label}</NavLink></li>
                  ))}
                </ul>
              </div>
              <div>
                <h6 className="font-bold mb-4 text-xs tracking-[0.15em] uppercase" style={{ color: colors.secondary }}>Contact</h6>
                <ul className="flex flex-col gap-2.5 text-sm text-white/50">
                  {site.phone && <li>{site.phone}</li>}
                  {site.email && <li>{site.email}</li>}
                  {site.address && <li>{[site.address, site.city].filter(Boolean).join(', ')}</li>}
                </ul>
              </div>
              <div>
                <h6 className="font-bold mb-4 text-xs tracking-[0.15em] uppercase" style={{ color: colors.secondary }}>Follow Us</h6>
                <div className="flex gap-3">
                  {site.social_instagram && (
                    <a href={site.social_instagram} target="_blank" rel="noopener noreferrer"
                      className="w-10 h-10 flex items-center justify-center rounded transition-colors"
                      style={{ border: `1px solid ${colors.secondary}30` }}>
                      <Instagram className="h-4 w-4 text-white/50" />
                    </a>
                  )}
                  {site.social_facebook && (
                    <a href={site.social_facebook} target="_blank" rel="noopener noreferrer"
                      className="w-10 h-10 flex items-center justify-center rounded transition-colors"
                      style={{ border: `1px solid ${colors.secondary}30` }}>
                      <Facebook className="h-4 w-4 text-white/50" />
                    </a>
                  )}
                </div>
              </div>
            </div>
            <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
              <span className="text-sm text-white/30">&copy; {new Date().getFullYear()} {salonName}</span>
              <span className="text-xs text-white/30">Powered by <span className="font-semibold" style={{ color: colors.secondary }}>Zap AI</span></span>
            </div>
          </div>
        </footer>

      ) : isPlayful ? (
        // ── PLAYFUL: Light pastel footer with fun copy, dashed border, emoji ──
        <footer className="pt-14 pb-8" style={{ backgroundColor: colors.footerBg, borderTop: `3px dashed ${colors.primary}25` }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  {site.logo_url ? (
                    <img src={site.logo_url} alt={salonName} className="h-10 w-10 object-cover rounded-xl shadow-md" />
                  ) : (
                    <PawPrint className="h-5 w-5" style={{ color: colors.primary }} />
                  )}
                  <span className="font-black text-lg" style={{ fontFamily: fonts.heading, color: colors.headingText }}>
                    {salonName} 🐾
                  </span>
                </div>
                {site.tagline && <p className="text-sm" style={{ color: colors.bodyText }}>{site.tagline}</p>}
                <p className="text-xs font-bold" style={{ color: colors.primary }}>Tail-wagging service guaranteed! 🐾</p>
              </div>
              <div>
                <h6 className="font-extrabold mb-4 text-sm" style={{ color: colors.headingText }}>Quick Links</h6>
                <ul className="flex flex-col gap-2">
                  {navLinks.map((link) => (
                    <li key={link.to}><NavLink to={link.to} end={link.end} className="text-sm hover:text-pink-500 transition-colors" style={{ color: colors.bodyText }}>{link.label}</NavLink></li>
                  ))}
                </ul>
              </div>
              <div>
                <h6 className="font-extrabold mb-4 text-sm" style={{ color: colors.headingText }}>Get In Touch</h6>
                <ul className="flex flex-col gap-2 text-sm" style={{ color: colors.bodyText }}>
                  {site.phone && <li className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" style={{ color: colors.primary }} /> {site.phone}</li>}
                  {site.email && <li className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" style={{ color: colors.primary }} /> {site.email}</li>}
                  {site.address && <li className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" style={{ color: colors.primary }} /> {[site.address, site.city].filter(Boolean).join(', ')}</li>}
                </ul>
                <div className="flex gap-3 mt-4">
                  {site.social_instagram && (
                    <a href={site.social_instagram} target="_blank" rel="noopener noreferrer"
                      className="w-9 h-9 flex items-center justify-center rounded-full shadow-md"
                      style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}>
                      <Instagram className="h-4 w-4 text-white" />
                    </a>
                  )}
                  {site.social_facebook && (
                    <a href={site.social_facebook} target="_blank" rel="noopener noreferrer"
                      className="w-9 h-9 flex items-center justify-center rounded-full shadow-md"
                      style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}>
                      <Facebook className="h-4 w-4 text-white" />
                    </a>
                  )}
                </div>
              </div>
            </div>
            <div className="pt-6 border-t text-center" style={{ borderColor: `${colors.primary}25` }}>
              <span className="text-xs" style={{ color: colors.mutedText }}>
                &copy; {new Date().getFullYear()} {salonName} &middot; Powered by <span className="font-bold" style={{ color: colors.primary }}>Zap AI</span> ✨
              </span>
            </div>
          </div>
        </footer>

      ) : isWarm ? (
        // ── WARM: Dark brown footer with organic shapes, community feel, 3-col ──
        <footer className="pt-16 pb-8 relative overflow-hidden" style={{ backgroundColor: colors.footerBg }}>
          {/* Organic blob decorations */}
          <div className="absolute top-0 right-0 w-64 h-64 warm-blob opacity-[0.04]" style={{ background: '#ffb77d' }} />
          <div className="absolute bottom-0 left-0 w-48 h-48 warm-blob-alt opacity-[0.03]" style={{ background: '#82f5c1' }} />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-14">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  {site.logo_url ? (
                    <img src={site.logo_url} alt={salonName} className="h-10 w-10 object-cover" style={{ borderRadius: '12px' }} />
                  ) : (
                    <Heart className="h-5 w-5" style={{ color: '#f59e0b' }} />
                  )}
                  <span className="font-extrabold text-lg text-white" style={{ fontFamily: fonts.heading }}>{salonName}</span>
                </div>
                {site.tagline && <p className="text-sm text-white/40">{site.tagline}</p>}
                <p className="text-xs text-white/30">Part of your pet's family since day one.</p>
              </div>
              <div>
                <h6 className="font-bold mb-4 text-sm text-white">Quick Links</h6>
                <ul className="flex flex-col gap-2.5">
                  {navLinks.map((link) => (
                    <li key={link.to}><NavLink to={link.to} end={link.end} className="text-sm text-white/50 hover:text-white transition-colors">{link.label}</NavLink></li>
                  ))}
                </ul>
              </div>
              <div>
                <h6 className="font-bold mb-4 text-sm text-white">Contact</h6>
                <ul className="flex flex-col gap-2.5 text-sm text-white/50">
                  {site.phone && <li className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" style={{ color: '#f59e0b' }} /> {site.phone}</li>}
                  {site.email && <li className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" style={{ color: '#f59e0b' }} /> {site.email}</li>}
                  {site.address && <li className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" style={{ color: '#f59e0b' }} /> {[site.address, site.city].filter(Boolean).join(', ')}</li>}
                </ul>
                <div className="flex gap-3 mt-4">
                  {site.social_instagram && (
                    <a href={site.social_instagram} target="_blank" rel="noopener noreferrer"
                      className="w-10 h-10 flex items-center justify-center rounded-full"
                      style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
                      <Instagram className="h-4 w-4 text-white/50" />
                    </a>
                  )}
                  {site.social_facebook && (
                    <a href={site.social_facebook} target="_blank" rel="noopener noreferrer"
                      className="w-10 h-10 flex items-center justify-center rounded-full"
                      style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
                      <Facebook className="h-4 w-4 text-white/50" />
                    </a>
                  )}
                </div>
              </div>
            </div>
            <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
              <span className="text-sm text-white/30">&copy; {new Date().getFullYear()} {salonName}. All rights reserved.</span>
              <span className="text-xs text-white/30">Powered by <span className="font-semibold" style={{ color: '#f59e0b' }}>Zap AI</span></span>
            </div>
          </div>
        </footer>

      ) : (
        // ── CLEAN: Light minimal footer, thin border, lots of whitespace ──
        <footer className="pt-14 pb-8" style={{ backgroundColor: colors.surface, borderTop: `1px solid ${colors.cardBorder}` }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  {site.logo_url ? (
                    <img src={site.logo_url} alt={salonName} className="h-9 w-9 object-cover" style={{ borderRadius: '8px' }} />
                  ) : (
                    <PawPrint className="h-5 w-5" style={{ color: themeColor }} />
                  )}
                  <span className="font-bold text-lg" style={{ fontFamily: fonts.heading, color: colors.headingText }}>{salonName}</span>
                </div>
                {site.tagline && <p className="text-sm" style={{ color: colors.mutedText }}>{site.tagline}</p>}
              </div>
              <div>
                <h6 className="font-bold mb-4 text-sm" style={{ color: colors.headingText }}>Quick Links</h6>
                <ul className="flex flex-col gap-2.5">
                  {navLinks.map((link) => (
                    <li key={link.to}><NavLink to={link.to} end={link.end} className="text-sm transition-colors hover:text-slate-900" style={{ color: colors.mutedText }}>{link.label}</NavLink></li>
                  ))}
                </ul>
              </div>
              <div>
                <h6 className="font-bold mb-4 text-sm" style={{ color: colors.headingText }}>Contact</h6>
                <ul className="flex flex-col gap-2.5 text-sm" style={{ color: colors.mutedText }}>
                  {site.phone && <li>{site.phone}</li>}
                  {site.email && <li>{site.email}</li>}
                  {site.address && <li>{[site.address, site.city].filter(Boolean).join(', ')}</li>}
                </ul>
              </div>
              <div>
                <h6 className="font-bold mb-4 text-sm" style={{ color: colors.headingText }}>Follow Us</h6>
                <div className="flex gap-3">
                  {site.social_instagram && (
                    <a href={site.social_instagram} target="_blank" rel="noopener noreferrer"
                      className="w-10 h-10 flex items-center justify-center rounded-full transition-colors" style={{ backgroundColor: colors.surfaceAlt || colors.surface }}>
                      <Instagram className="h-4 w-4" style={{ color: colors.bodyText }} />
                    </a>
                  )}
                  {site.social_facebook && (
                    <a href={site.social_facebook} target="_blank" rel="noopener noreferrer"
                      className="w-10 h-10 flex items-center justify-center rounded-full transition-colors" style={{ backgroundColor: colors.surfaceAlt || colors.surface }}>
                      <Facebook className="h-4 w-4" style={{ color: colors.bodyText }} />
                    </a>
                  )}
                </div>
              </div>
            </div>
            <div className="pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4" style={{ borderColor: colors.cardBorder }}>
              <span className="text-sm" style={{ color: colors.mutedText }}>&copy; {new Date().getFullYear()} {salonName}</span>
              <span className="text-xs" style={{ color: colors.mutedText }}>Powered by <span className="font-semibold" style={{ color: themeColor }}>Zap AI</span></span>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
