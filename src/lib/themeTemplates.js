/**
 * 4 theme templates designed with Stitch for pet salon websites.
 * Each theme has truly different visual identity: colors, layout variants,
 * hero styles, card designs, section dividers, and decorative elements.
 *
 * Theme inspirations from Stitch-generated designs:
 *  - luxe    → Noir Luxe Spa: full-dark #0a0a0a bg, gold #c9a96e, Playfair Display, 0px radius
 *  - playful → Happy Paws Playground: hot pink #ff006e, Nunito, 32-48px radius, neon glows
 *  - clean   → Groom Studio: purple #742fe5, white bg, Inter, glass navbar, SaaS aesthetic
 *  - warm    → Cozy Paws Corner: amber #8d4b00 + forest green #006c4a, cream bg, Public Sans
 */

export const THEME_TEMPLATES = {
  luxe: {
    id: 'luxe',
    name: 'Luxe',
    description: 'Noir Magazine — Dark & Dramatic',
    preview: 'Full-black background, gold hairline accents, Playfair Display, zero border radius',
    fonts: {
      heading: "'Playfair Display', 'Georgia', serif",
      body: "'Inter', 'Helvetica Neue', sans-serif",
      googleImport: 'Playfair+Display:wght@400;600;700;800&family=Inter:wght@300;400;500;600;700',
    },
    colors: {
      primary: '#0a0a0a',
      secondary: '#c9a96e',       // gold accent
      tertiary: '#a0845e',
      accent: '#c9a96e',
      background: '#0a0a0a',      // full dark — entire page
      surface: '#111111',
      surfaceAlt: '#0d0d0d',
      navBg: '#000000',
      navText: '#ffffff',
      footerBg: '#000000',
      footerText: '#ffffff',
      cardBg: '#111111',
      cardBorder: '#c9a96e20',
      headingText: '#ffffff',
      bodyText: 'rgba(255,255,255,0.6)',
      mutedText: 'rgba(255,255,255,0.32)',
    },
    layout: {
      borderRadius: '0px',
      borderRadiusLg: '2px',
      borderRadiusFull: '9999px',
      heroVariant: 'centered-overlay',
      cardStyle: 'shadow-none',
      cardHover: 'hover:-translate-y-0.5',
      cardAccent: 'border-l-2',
      sectionDivider: 'none',
      buttonStyle: '',
      trustBadgeStyle: 'bordered',
      testimonialStyle: 'left-border',
      navStyle: 'solid-dark',
      footerStyle: 'solid-dark',
    },
    decorations: {
      heroOverlay: 'linear-gradient(to right, rgba(0,0,0,0.92), rgba(0,0,0,0.6), rgba(0,0,0,0.3))',
      sectionBg: '#111111',
      sectionAltBg: '#0d0d0d',
      ctaBg: 'linear-gradient(135deg, #0d0d0d 0%, #1a1a1a 100%)',
      ctaAccent: '#c9a96e',
      badgeStyle: 'bg-transparent border border-[#c9a96e30]',
      featureIconBg: 'rgba(201,169,110,0.08)',
      featureIconColor: '#c9a96e',
      pastelCards: ['#1a1208', '#0d1a0d', '#1a0d0d', '#111118'],
      warmTints: ['#111111', '#0d0d0d', '#111111', '#0d0d0d'],
    },
  },

  playful: {
    id: 'playful',
    name: 'Playful',
    description: 'Gen Z Neon — Bold & Electric',
    preview: 'Hot pink #ff006e + purple neon, Nunito font, 40px rounded cards, neon glow shadows',
    fonts: {
      heading: "'Nunito', 'Nunito Sans', sans-serif",
      body: "'Nunito', sans-serif",
      googleImport: 'Nunito:wght@400;600;700;800;900',
    },
    colors: {
      primary: '#ff006e',          // electric hot pink
      secondary: '#8338ec',        // neon purple
      tertiary: '#3a86ff',         // electric blue
      accent: '#06d6a0',           // mint
      background: '#ffffff',
      surface: '#fff0f6',
      surfaceAlt: '#f5f0ff',
      navBg: '#ffffff',
      navText: '#1a1a2e',
      footerBg: '#fff0f6',
      footerText: '#1a1a2e',
      cardBg: '#ffffff',
      cardBorder: '#ff006e18',
      headingText: '#1a0a2e',
      bodyText: '#4a3a5a',
      mutedText: '#8a7a9a',
    },
    layout: {
      borderRadius: '24px',
      borderRadiusLg: '32px',
      borderRadiusFull: '9999px',
      heroVariant: 'gradient-fun',
      cardStyle: 'shadow-lg',
      cardHover: 'hover:shadow-2xl hover:-translate-y-3 hover:scale-[1.02]',
      cardAccent: 'border-t-4',
      sectionDivider: 'wavy',
      buttonStyle: 'rounded-full shadow-xl',
      trustBadgeStyle: 'pastel',
      testimonialStyle: 'colorful-card',
      navStyle: 'transparent-light',
      footerStyle: 'pastel-light',
    },
    decorations: {
      heroOverlay: 'linear-gradient(135deg, #ff006e15, #8338ec10, #3a86ff08)',
      sectionBg: '#ffffff',
      sectionAltBg: '#fff0f6',
      ctaBg: 'linear-gradient(135deg, #ff006e, #8338ec)',
      ctaAccent: '#ffffff',
      badgeStyle: 'bg-pink-50 border-0',
      featureIconBg: '#ff006e12',
      featureIconColor: '#ff006e',
      pawPrints: true,
      wavyDividers: true,
      pastelCards: ['#fff0f6', '#f5f0ff', '#f0f6ff', '#f0fff9'],
      warmTints: ['#fff0f6', '#f5f0ff', '#f0f6ff', '#f0fff9'],
      neonShadows: {
        pink: '0 0 20px rgba(255,0,110,0.3), 0 4px 16px rgba(255,0,110,0.15)',
        purple: '0 0 20px rgba(131,56,236,0.3), 0 4px 16px rgba(131,56,236,0.15)',
        blue: '0 0 20px rgba(58,134,255,0.25)',
      },
    },
  },

  clean: {
    id: 'clean',
    name: 'Clean',
    description: 'SaaS Minimal — Modern & Precise',
    preview: 'Purple #742fe5, frosted glass navbar, stat strip hero, Inter font, 16px radius cards',
    fonts: {
      heading: "'Inter', 'Helvetica Neue', sans-serif",
      body: "'Inter', sans-serif",
      googleImport: 'Inter:wght@300;400;500;600;700;800',
    },
    colors: {
      primary: '#742fe5',
      secondary: '#00687b',        // teal from Stitch Groom Studio
      tertiary: '#a476ff',
      accent: '#742fe5',
      background: '#f7f9fb',
      surface: '#f0f4f7',
      surfaceAlt: '#eaeff2',
      navBg: 'rgba(255,255,255,0.92)',
      navText: '#2c3437',
      footerBg: '#f7f9fb',
      footerText: '#2c3437',
      cardBg: '#ffffff',
      cardBorder: '#dce4e8',
      headingText: '#2c3437',
      bodyText: '#596064',
      mutedText: '#747c80',
    },
    layout: {
      borderRadius: '12px',
      borderRadiusLg: '20px',
      borderRadiusFull: '9999px',
      heroVariant: 'split',
      cardStyle: 'shadow-sm border',
      cardHover: 'hover:shadow-lg hover:scale-[1.01]',
      cardAccent: 'border-t-0',
      sectionDivider: 'none',
      buttonStyle: 'rounded-xl',
      trustBadgeStyle: 'minimal',
      testimonialStyle: 'clean-grid',
      navStyle: 'glass-light',
      footerStyle: 'minimal-light',
    },
    decorations: {
      heroOverlay: 'linear-gradient(to right, rgba(247,249,251,1), rgba(247,249,251,0.8), transparent)',
      sectionBg: '#ffffff',
      sectionAltBg: '#f7f9fb',
      ctaBg: '#f5f3ff',            // lavender from Stitch Groom Studio CTA
      ctaAccent: '#742fe5',
      badgeStyle: 'bg-transparent border border-slate-200',
      featureIconBg: 'rgba(116,47,229,0.06)',
      featureIconColor: '#742fe5',
      pastelCards: ['#ffffff', '#fdf8ff', '#f0fff8', '#fff8f0'],
      warmTints: ['#f5f3ff', '#f0fdf4', '#fef3c7', '#fce7f3'],
    },
  },

  warm: {
    id: 'warm',
    name: 'Warm',
    description: 'Botanical Cottagecore — Artisan & Cozy',
    preview: 'Amber #8d4b00 + forest green, cream #fff8f0 bg, Public Sans, organic blob shapes',
    fonts: {
      heading: "'Public Sans', 'DM Sans', sans-serif",
      body: "'Public Sans', sans-serif",
      googleImport: 'Public+Sans:wght@300;400;500;600;700;800',
    },
    colors: {
      primary: '#8d4b00',          // rich amber/brown from Stitch Cozy Paws
      secondary: '#006c4a',        // forest green from Stitch Cozy Paws
      tertiary: '#bb0112',         // accent red
      accent: '#8d4b00',
      background: '#fff8f0',
      surface: '#faf3e9',
      surfaceAlt: '#f4ede3',
      navBg: '#fef7ed',
      navText: '#1e1b16',
      footerBg: '#2d1f0e',         // dark brown from Stitch Cozy Paws footer
      footerText: '#fef7ed',
      cardBg: '#fef7ed',
      cardBorder: '#dbc2b0',
      headingText: '#1e1b16',
      bodyText: '#554336',
      mutedText: '#887364',
    },
    layout: {
      borderRadius: '12px',
      borderRadiusLg: '20px',
      borderRadiusFull: '9999px',
      heroVariant: 'warm-overlay',
      cardStyle: 'shadow-md',
      cardHover: 'hover:shadow-xl hover:-translate-y-1.5',
      cardAccent: 'border-b-2',
      sectionDivider: 'soft-curve',
      buttonStyle: 'rounded-xl shadow-lg',
      trustBadgeStyle: 'warm-cards',
      testimonialStyle: 'warm-tint',
      navStyle: 'warm-cream',
      footerStyle: 'dark-warm',
    },
    decorations: {
      heroOverlay: 'linear-gradient(to bottom, rgba(141,75,0,0.4), rgba(254,247,237,0.9))',
      sectionBg: '#fef7ed',
      sectionAltBg: '#f4ede3',
      ctaBg: 'linear-gradient(135deg, #8d4b00, #b15f00)',
      ctaAccent: '#ffffff',
      badgeStyle: 'bg-amber-50 border border-amber-200/60',
      featureIconBg: 'rgba(141,75,0,0.08)',
      featureIconColor: '#8d4b00',
      // Colored testimonial cards from Stitch Cozy Paws design
      pastelCards: ['#ffdcc3', '#82f5c1', '#ffdad6', '#fef7ed'],
      warmTints: ['#fef7ed', '#f0fdf4', '#fef2f2', '#fdf4e8'],
    },
  },
};

export function getThemeTemplate(templateId) {
  return THEME_TEMPLATES[templateId] || THEME_TEMPLATES.clean;
}

/** Default home sections ordering */
export const DEFAULT_HOME_SECTIONS = [
  { id: 'hero', type: 'hero', label: 'Hero Banner', enabled: true, removable: false },
  { id: 'trust_badges', type: 'trust_badges', label: 'Trust Badges', enabled: true, removable: false },
  { id: 'services', type: 'featured_services', label: 'Featured Services', enabled: true, removable: false },
  { id: 'features', type: 'features', label: 'Why Choose Us', enabled: true, removable: false },
  { id: 'testimonials', type: 'testimonials', label: 'Testimonials', enabled: true, removable: false },
  { id: 'gallery', type: 'gallery_preview', label: 'Gallery Preview', enabled: true, removable: false },
  { id: 'cta', type: 'cta', label: 'Call to Action', enabled: true, removable: false },
];

/** Additional sections that can be added */
export const EXTRA_SECTIONS = [
  { id: 'faq', type: 'faq', label: 'FAQ', enabled: true, removable: true },
  { id: 'pricing', type: 'pricing_table', label: 'Pricing Table', enabled: true, removable: true },
  { id: 'about_preview', type: 'about_preview', label: 'About Preview', enabled: true, removable: true },
];

/** SVG wavy divider for Playful theme */
export const WavyDivider = ({ color = '#ffffff', flip = false }) => (
  <div className={`w-full overflow-hidden leading-[0] ${flip ? 'rotate-180' : ''}`} style={{ marginTop: '-1px', marginBottom: '-1px' }}>
    <svg viewBox="0 0 1440 80" preserveAspectRatio="none" className="w-full h-12 sm:h-16 md:h-20">
      <path
        d="M0,40 C240,80 480,0 720,40 C960,80 1200,0 1440,40 L1440,80 L0,80 Z"
        fill={color}
      />
    </svg>
  </div>
);

/** Soft curve divider for Warm theme */
export const SoftCurveDivider = ({ color = '#fef7ed' }) => (
  <div className="w-full overflow-hidden leading-[0]" style={{ marginTop: '-1px', marginBottom: '-1px' }}>
    <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="w-full h-10 sm:h-14">
      <path
        d="M0,60 C360,0 1080,0 1440,60 L1440,60 L0,60 Z"
        fill={color}
      />
    </svg>
  </div>
);

/** Decorative paw print SVG for Playful theme */
export const DecorativePawPrint = ({ className = '', color = '#ff006e', opacity = 0.08, size = 120 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" className={className} style={{ opacity, color }}>
    <ellipse cx="50" cy="65" rx="22" ry="18" fill={color} />
    <ellipse cx="30" cy="38" rx="10" ry="12" fill={color} transform="rotate(-15 30 38)" />
    <ellipse cx="70" cy="38" rx="10" ry="12" fill={color} transform="rotate(15 70 38)" />
    <ellipse cx="18" cy="52" rx="8" ry="10" fill={color} transform="rotate(-25 18 52)" />
    <ellipse cx="82" cy="52" rx="8" ry="10" fill={color} transform="rotate(25 82 52)" />
  </svg>
);
