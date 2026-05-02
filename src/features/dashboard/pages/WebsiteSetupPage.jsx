import React, { useState, useEffect } from 'react';
import api from '@/shared/lib/api';
import { useAuth } from '@/features/auth/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Switch } from '@/shared/components/ui/switch';
import {
  Globe, Save, Eye, ExternalLink, Copy, Check, Loader2,
  Palette, Image, Type, Info, Settings2, ShoppingBag, Pencil,
  Star, Shield, Leaf, Heart, Timer, Sparkles, Scissors, PawPrint,
  MessageSquareQuote, Users, Share2, Megaphone, LayoutGrid, MapPin,
  Plus, Trash2, GripVertical, Instagram, Facebook, ChevronDown, ChevronUp
} from 'lucide-react';
import { toast } from 'sonner';
import { THEME_PRESETS } from '@/shared/lib/theme';
import ImageUploader from '@/features/salon-website/components/ImageUploader';
import GalleryManager from '@/features/salon-website/components/GalleryManager';
import WebsitePreview from '@/features/salon-website/components/WebsitePreview';
import SectionBuilder from '@/features/salon-website/components/SectionBuilder';
import { getSiteBaseUrl, getTenantSiteUrl } from '@/shared/lib/utils';
import { THEME_TEMPLATES, DEFAULT_HOME_SECTIONS } from '@/shared/lib/themeTemplates';

const FEATURE_ICON_OPTIONS = [
  { value: 'shield', label: 'Shield', icon: Shield },
  { value: 'leaf', label: 'Leaf', icon: Leaf },
  { value: 'heart', label: 'Heart', icon: Heart },
  { value: 'timer', label: 'Timer', icon: Timer },
  { value: 'sparkles', label: 'Sparkles', icon: Sparkles },
  { value: 'scissors', label: 'Scissors', icon: Scissors },
  { value: 'star', label: 'Star', icon: Star },
  { value: 'check', label: 'Check', icon: Check },
  { value: 'paw', label: 'Paw', icon: PawPrint },
];

const FONT_OPTIONS = [
  { value: 'modern', label: 'Modern (Jakarta Sans)' },
  { value: 'classic', label: 'Classic (Georgia)' },
  { value: 'playful', label: 'Playful (Nunito)' },
  { value: 'minimal', label: 'Minimal (Inter)' },
  { value: 'elegant', label: 'Elegant (Playfair)' },
];

function CollapsibleCard({ title, icon: Icon, description, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className="rounded-xl border-slate-200/60">
      <CardHeader className="pb-2 cursor-pointer select-none" onClick={() => setOpen(!open)}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Icon className="h-4 w-4 text-primary" /> {title}
          </CardTitle>
          {open ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </div>
        {description && <CardDescription className="text-xs">{description}</CardDescription>}
      </CardHeader>
      {open && <CardContent className="space-y-4">{children}</CardContent>}
    </Card>
  );
}

export default function WebsiteSetupPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [slug, setSlug] = useState('');
  const [editingSlug, setEditingSlug] = useState(false);
  const [slugInput, setSlugInput] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [fullPreviewOpen, setFullPreviewOpen] = useState(false);
  const [tenant, setTenant] = useState(null);

  const [config, setConfig] = useState({
    logo_url: null,
    salon_name: '',
    tagline: '',
    hero_image_url: null,
    hero_title: '',
    hero_description: '',
    hero_style: 'image',
    website_theme_color: '#7C3AED',
    website_secondary_color: '',
    font_style: 'modern',
    about_text: '',
    about_image_url: null,
    gallery_images: [],
    features: [],
    show_features: true,
    testimonials: [],
    show_testimonials: true,
    show_team: true,
    trust_badges: [],
    show_trust_badges: true,
    cta_title: '',
    cta_description: '',
    social_instagram: '',
    social_facebook: '',
    social_tiktok: '',
    online_booking_enabled: true,
    require_phone: true,
    allow_new_client_registration: true,
    show_services: true,
    show_prices: true,
    service_card_style: 'card',
    show_gallery: true,
    show_about: true,
    show_contact: true,
    show_socials: true,
    show_cta: true,
    theme_template: 'clean',
    home_sections: [],
    faq_items: [],
    show_faq: false,
    show_pricing_table: false,
    services_page_subtitle: '',
    gallery_page_subtitle: '',
    about_story: '',
    contact_page_subtitle: '',
    is_published: false,
    published_at: null,
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const [cfgRes, tenantRes] = await Promise.all([
        api.get('/website/config'),
        api.get('/tenant/me'),
      ]);
      setTenant(tenantRes.data);
      setSlug(cfgRes.data.slug || '');
      setTenantName(cfgRes.data.tenant_name || '');
      if (cfgRes.data.config) {
        setConfig(c => ({
          ...c,
          ...cfgRes.data.config,
          salon_name: cfgRes.data.config.salon_name || cfgRes.data.tenant_name || '',
          website_theme_color: cfgRes.data.config.website_theme_color || cfgRes.data.theme_color || '#7C3AED',
        }));
      } else {
        setConfig(c => ({
          ...c,
          salon_name: cfgRes.data.tenant_name || '',
          website_theme_color: cfgRes.data.theme_color || '#7C3AED',
        }));
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to load website config');
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { is_published, published_at, ...saveData } = config;
      const res = await api.put('/website/config', saveData);
      if (res.data.slug) setSlug(res.data.slug);
      if (res.data.config) {
        setConfig(c => ({ ...c, ...res.data.config }));
      }
      toast.success('Website settings saved');
    } catch (e) {
      toast.error('Failed to save');
    }
    setSaving(false);
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      if (config.is_published) {
        const res = await api.post('/website/config/unpublish');
        setConfig(c => ({ ...c, ...res.data.config }));
        toast.success('Website unpublished');
      } else {
        const { is_published, published_at, ...saveData } = config;
        await api.put('/website/config', saveData);
        const res = await api.post('/website/config/publish');
        setConfig(c => ({ ...c, ...res.data.config }));
        if (res.data.slug) setSlug(res.data.slug);
        toast.success('Website published!');
      }
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to update publish status');
    }
    setPublishing(false);
  };

  const handleSlugSave = async () => {
    try {
      const res = await api.put('/website/slug', { slug: slugInput });
      setSlug(res.data.slug);
      setEditingSlug(false);
      toast.success('URL updated');
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to update URL');
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(getTenantSiteUrl(slug));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const updateConfig = (key, value) => {
    setConfig(c => ({ ...c, [key]: value }));
  };

  // Feature helpers
  const addFeature = () => {
    updateConfig('features', [...(config.features || []), { icon: 'sparkles', title: '', description: '' }]);
  };
  const updateFeature = (idx, field, value) => {
    const updated = [...(config.features || [])];
    updated[idx] = { ...updated[idx], [field]: value };
    updateConfig('features', updated);
  };
  const removeFeature = (idx) => {
    updateConfig('features', (config.features || []).filter((_, i) => i !== idx));
  };

  // Testimonial helpers
  const addTestimonial = () => {
    updateConfig('testimonials', [...(config.testimonials || []), { author: '', role: '', text: '', rating: 5, photo_url: '' }]);
  };
  const updateTestimonial = (idx, field, value) => {
    const updated = [...(config.testimonials || [])];
    updated[idx] = { ...updated[idx], [field]: value };
    updateConfig('testimonials', updated);
  };
  const removeTestimonial = (idx) => {
    updateConfig('testimonials', (config.testimonials || []).filter((_, i) => i !== idx));
  };

  // Trust badge helpers
  const addTrustBadge = () => {
    updateConfig('trust_badges', [...(config.trust_badges || []), { value: '', label: '' }]);
  };
  const updateTrustBadge = (idx, field, value) => {
    const updated = [...(config.trust_badges || [])];
    updated[idx] = { ...updated[idx], [field]: value };
    updateConfig('trust_badges', updated);
  };
  const removeTrustBadge = (idx) => {
    updateConfig('trust_badges', (config.trust_badges || []).filter((_, i) => i !== idx));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Globe className="h-6 w-6 text-primary" />
            Website Setup
          </h1>
          <p className="text-sm text-slate-500 mt-1">Customize your public booking website</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setFullPreviewOpen(true)}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button variant="outline" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save Draft
          </Button>
          <Button onClick={handlePublish} disabled={publishing}
            variant={config.is_published ? 'outline' : 'default'}
          >
            {publishing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {config.is_published ? 'Unpublish' : 'Publish Website'}
          </Button>
        </div>
      </div>

      {/* URL Bar */}
      {slug && (
        <div className="mb-6 flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3 border border-slate-200/60">
          <Globe className="h-4 w-4 text-slate-400" />
          {editingSlug ? (
            <div className="flex items-center gap-2 flex-1">
              <span className="text-sm text-slate-500">{getSiteBaseUrl()}/s/</span>
              <Input
                value={slugInput}
                onChange={(e) => setSlugInput(e.target.value)}
                className="h-8 w-48 text-sm"
              />
              <Button size="sm" variant="outline" onClick={handleSlugSave}>Save</Button>
              <Button size="sm" variant="ghost" onClick={() => setEditingSlug(false)}>Cancel</Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-1">
              <span className="text-sm text-slate-700 font-medium">{getSiteBaseUrl()}/s/{slug}</span>
              <button onClick={() => { setSlugInput(slug); setEditingSlug(true); }} className="text-slate-400 hover:text-slate-600">
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button onClick={handleCopyUrl} className="text-slate-400 hover:text-slate-600">
                {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
              {config.is_published && slug && (
                <a href={getTenantSiteUrl(slug)} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 ml-1">
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          )}
          {config.is_published ? (
            <span className="text-xs font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Live</span>
          ) : (
            <span className="text-xs font-medium bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Draft</span>
          )}
        </div>
      )}

      {/* Main Layout: Preview + Form */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Live Preview */}
        <div className="lg:col-span-3 order-2 lg:order-1">
          <Card className="rounded-xl border-slate-200/60 overflow-hidden">
            <div className="bg-slate-100 px-4 py-2 flex items-center gap-2 border-b border-slate-200">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 bg-white rounded-md px-3 py-1 text-xs text-slate-400 ml-2">
                {getSiteBaseUrl()}/s/{slug || 'your-salon'}
              </div>
              <Eye className="h-4 w-4 text-slate-400" />
            </div>
            <div className="h-[600px] overflow-y-auto">
              <WebsitePreview config={config} tenant={tenant} />
            </div>
          </Card>
        </div>

        {/* Right: Customization Form */}
        <div className="lg:col-span-2 order-1 lg:order-2 space-y-4">

          {/* Brand Settings */}
          <CollapsibleCard title="Brand Settings" icon={Type}>
            <div>
              <Label className="text-xs text-slate-500 mb-1.5 block">Logo</Label>
              <ImageUploader
                value={config.logo_url}
                onChange={(url) => updateConfig('logo_url', url)}
                imageType="logo"
                className="h-24 w-24"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-500 mb-1.5 block">Salon Name</Label>
              <Input
                value={config.salon_name}
                onChange={(e) => updateConfig('salon_name', e.target.value)}
                placeholder="Your Salon Name"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-500 mb-1.5 block">Tagline</Label>
              <Input
                value={config.tagline || ''}
                onChange={(e) => updateConfig('tagline', e.target.value)}
                placeholder="Premium pet grooming services"
              />
            </div>
          </CollapsibleCard>

          {/* Hero Section */}
          <CollapsibleCard title="Hero Section" icon={Image}>
            <div>
              <Label className="text-xs text-slate-500 mb-1.5 block">Hero Image</Label>
              <ImageUploader
                value={config.hero_image_url}
                onChange={(url) => updateConfig('hero_image_url', url)}
                imageType="hero"
                className="h-36"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-500 mb-1.5 block">Hero Title</Label>
              <Input
                value={config.hero_title || ''}
                onChange={(e) => updateConfig('hero_title', e.target.value)}
                placeholder="Your Pet Deserves the Best Care"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-500 mb-1.5 block">Hero Description</Label>
              <Textarea
                value={config.hero_description || ''}
                onChange={(e) => updateConfig('hero_description', e.target.value)}
                placeholder="Experience the gold standard in pet grooming..."
                rows={3}
              />
            </div>
          </CollapsibleCard>

          {/* Trust Badges */}
          <CollapsibleCard title="Trust Badges" icon={Shield} description="Show stats in the hero section" defaultOpen={false}>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm">Show trust badges</Label>
              <Switch
                checked={config.show_trust_badges}
                onCheckedChange={(v) => updateConfig('show_trust_badges', v)}
              />
            </div>
            {config.show_trust_badges && (
              <>
                {(config.trust_badges || []).map((badge, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-slate-50 rounded-lg p-2">
                    <Input
                      value={badge.value}
                      onChange={(e) => updateTrustBadge(idx, 'value', e.target.value)}
                      placeholder="500+"
                      className="h-8 w-24 text-xs"
                    />
                    <Input
                      value={badge.label}
                      onChange={(e) => updateTrustBadge(idx, 'label', e.target.value)}
                      placeholder="Happy Pets"
                      className="h-8 flex-1 text-xs"
                    />
                    <button onClick={() => removeTrustBadge(idx)} className="text-slate-400 hover:text-red-500">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addTrustBadge} className="w-full">
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Badge
                </Button>
              </>
            )}
          </CollapsibleCard>

          {/* Theme Template Picker */}
          <CollapsibleCard title="Theme Template" icon={LayoutGrid} description="Choose a visual style for your website. Each theme has unique layout, colors and decorations">
            <div className="grid grid-cols-2 gap-3">
              {Object.values(THEME_TEMPLATES).map((tmpl) => {
                const isSelected = (config.theme_template || 'clean') === tmpl.id;
                const c = tmpl.colors;
                return (
                  <button
                    key={tmpl.id}
                    onClick={() => updateConfig('theme_template', tmpl.id)}
                    className={`relative rounded-xl border-2 text-left transition-all overflow-hidden ${
                      isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {/* Mini visual preview */}
                    <div className="h-20 relative" style={{ backgroundColor: c.background }}>
                      {/* Mini navbar */}
                      <div className="h-5 flex items-center px-2 gap-1" style={{ backgroundColor: c.navBg === 'rgba(255,255,255,0.92)' ? '#fff' : c.navBg }}>
                        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: c.accent }} />
                        <div className="w-8 h-1.5 rounded" style={{ backgroundColor: c.navText === '#ffffff' ? 'rgba(255,255,255,0.6)' : '#94a3b8' }} />
                        <div className="flex-1" />
                        <div className="w-10 h-2.5 rounded-full" style={{ backgroundColor: c.accent }} />
                      </div>
                      {/* Mini hero */}
                      <div className="px-2 pt-1.5">
                        <div className="w-16 h-1.5 rounded mb-1" style={{ backgroundColor: c.headingText }} />
                        <div className="w-12 h-1 rounded mb-1.5" style={{ backgroundColor: c.bodyText + '60' }} />
                        <div className="w-10 h-2.5 rounded" style={{ backgroundColor: c.accent, borderRadius: tmpl.layout.borderRadius }} />
                      </div>
                      {/* Color dots */}
                      <div className="absolute bottom-1.5 right-2 flex gap-1">
                        <div className="w-3 h-3 rounded-full border border-white shadow-sm" style={{ backgroundColor: c.primary }} />
                        <div className="w-3 h-3 rounded-full border border-white shadow-sm" style={{ backgroundColor: c.secondary }} />
                        <div className="w-3 h-3 rounded-full border border-white shadow-sm" style={{ backgroundColor: c.accent }} />
                      </div>
                    </div>
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-md z-10">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                    <div className="p-3 bg-white">
                      <div className="font-bold text-sm text-slate-900 mb-0.5">{tmpl.name}</div>
                      <div className="text-[10px] text-slate-500 leading-tight">{tmpl.preview || tmpl.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </CollapsibleCard>

          {/* Home Page Section Builder */}
          <CollapsibleCard title="Home Page Sections" icon={GripVertical} description="Drag to reorder, toggle to show/hide sections">
            <SectionBuilder
              sections={config.home_sections?.length > 0 ? config.home_sections : DEFAULT_HOME_SECTIONS}
              onChange={(sections) => updateConfig('home_sections', sections)}
              themeColor={config.website_theme_color}
            />
          </CollapsibleCard>

          {/* FAQ Items */}
          <CollapsibleCard title="FAQ Section" icon={MessageSquareQuote} description="Add frequently asked questions" defaultOpen={false}>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm">Show FAQ section</Label>
              <Switch
                checked={config.show_faq}
                onCheckedChange={(v) => updateConfig('show_faq', v)}
              />
            </div>
            {config.show_faq && (
              <>
                {(config.faq_items || []).map((item, idx) => (
                  <div key={idx} className="bg-slate-50 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-slate-500">Question {idx + 1}</Label>
                      <button onClick={() => updateConfig('faq_items', (config.faq_items || []).filter((_, i) => i !== idx))} className="text-slate-400 hover:text-red-500">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <Input
                      value={item.question || ''}
                      onChange={(e) => {
                        const updated = [...(config.faq_items || [])];
                        updated[idx] = { ...updated[idx], question: e.target.value };
                        updateConfig('faq_items', updated);
                      }}
                      placeholder="e.g. How long does grooming take?"
                    />
                    <Textarea
                      value={item.answer || ''}
                      onChange={(e) => {
                        const updated = [...(config.faq_items || [])];
                        updated[idx] = { ...updated[idx], answer: e.target.value };
                        updateConfig('faq_items', updated);
                      }}
                      placeholder="Answer..."
                      rows={2}
                    />
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => updateConfig('faq_items', [...(config.faq_items || []), { question: '', answer: '' }])}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Question
                </Button>
              </>
            )}
          </CollapsibleCard>

          {/* Theme & Design */}
          <CollapsibleCard title="Theme & Design" icon={Palette}>
            <div>
              <Label className="text-xs text-slate-500 mb-2 block">Primary Color</Label>
              <div className="flex flex-wrap gap-2">
                {THEME_PRESETS.map((preset) => (
                  <button
                    key={preset.hex}
                    onClick={() => updateConfig('website_theme_color', preset.hex)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      config.website_theme_color === preset.hex
                        ? 'border-slate-900 scale-110 ring-2 ring-offset-2 ring-slate-300'
                        : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: preset.hex }}
                    title={preset.name}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 mt-3">
                <Label className="text-xs text-slate-500">Custom:</Label>
                <input
                  type="color"
                  value={config.website_theme_color || '#7C3AED'}
                  onChange={(e) => updateConfig('website_theme_color', e.target.value)}
                  className="w-8 h-8 rounded border cursor-pointer"
                />
                <Input
                  value={config.website_theme_color || ''}
                  onChange={(e) => updateConfig('website_theme_color', e.target.value)}
                  className="w-28 h-8 text-xs font-mono"
                  placeholder="#7C3AED"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs text-slate-500 mb-2 block">Secondary / Gradient Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={config.website_secondary_color || config.website_theme_color || '#7C3AED'}
                  onChange={(e) => updateConfig('website_secondary_color', e.target.value)}
                  className="w-8 h-8 rounded border cursor-pointer"
                />
                <Input
                  value={config.website_secondary_color || ''}
                  onChange={(e) => updateConfig('website_secondary_color', e.target.value)}
                  className="w-28 h-8 text-xs font-mono"
                  placeholder="Same as primary"
                />
                {config.website_secondary_color && (
                  <button onClick={() => updateConfig('website_secondary_color', '')} className="text-xs text-slate-400 hover:text-slate-600">
                    Reset
                  </button>
                )}
              </div>
              {config.website_secondary_color && (
                <div className="mt-2 h-6 rounded-lg" style={{ background: `linear-gradient(135deg, ${config.website_theme_color}, ${config.website_secondary_color})` }} />
              )}
            </div>
            <div>
              <Label className="text-xs text-slate-500 mb-1.5 block">Font Style</Label>
              <select
                value={config.font_style || 'modern'}
                onChange={(e) => updateConfig('font_style', e.target.value)}
                className="w-full h-9 rounded-md border border-slate-200 px-3 text-sm bg-white"
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>
          </CollapsibleCard>

          {/* Features / Why Choose Us */}
          <CollapsibleCard title="Why Choose Us" icon={Sparkles} description="Highlight your key selling points" defaultOpen={false}>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm">Show features section</Label>
              <Switch
                checked={config.show_features}
                onCheckedChange={(v) => updateConfig('show_features', v)}
              />
            </div>
            {config.show_features && (
              <>
                {(config.features || []).map((feat, idx) => (
                  <div key={idx} className="bg-slate-50 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-slate-400">Feature {idx + 1}</Label>
                      <button onClick={() => removeFeature(idx)} className="text-slate-400 hover:text-red-500">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={feat.icon || 'sparkles'}
                        onChange={(e) => updateFeature(idx, 'icon', e.target.value)}
                        className="h-8 w-28 rounded-md border border-slate-200 px-2 text-xs bg-white"
                      >
                        {FEATURE_ICON_OPTIONS.map((ico) => (
                          <option key={ico.value} value={ico.value}>{ico.label}</option>
                        ))}
                      </select>
                      <Input
                        value={feat.title}
                        onChange={(e) => updateFeature(idx, 'title', e.target.value)}
                        placeholder="Feature title"
                        className="h-8 text-xs flex-1"
                      />
                    </div>
                    <Input
                      value={feat.description}
                      onChange={(e) => updateFeature(idx, 'description', e.target.value)}
                      placeholder="Brief description..."
                      className="h-8 text-xs"
                    />
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addFeature} className="w-full">
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Feature
                </Button>
                <div className="text-xs text-slate-400 flex items-center gap-1.5 bg-slate-50 rounded-lg p-2.5">
                  <Info className="h-3.5 w-3.5" />
                  If no features are added, default ones will be shown.
                </div>
              </>
            )}
          </CollapsibleCard>

          {/* About & Contact */}
          <CollapsibleCard title="About Section" icon={Info}>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm">Show about section</Label>
              <Switch
                checked={config.show_about}
                onCheckedChange={(v) => updateConfig('show_about', v)}
              />
            </div>
            {config.show_about && (
              <>
                <div>
                  <Label className="text-xs text-slate-500 mb-1.5 block">About Image</Label>
                  <ImageUploader
                    value={config.about_image_url}
                    onChange={(url) => updateConfig('about_image_url', url)}
                    imageType="about"
                    className="h-32"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Optional. Creates a side-by-side layout with text.</p>
                </div>
                <div>
                  <Label className="text-xs text-slate-500 mb-1.5 block">About Your Salon</Label>
                  <Textarea
                    value={config.about_text || ''}
                    onChange={(e) => updateConfig('about_text', e.target.value)}
                    placeholder="Tell your customers about your salon, your team, and what makes you special..."
                    rows={4}
                  />
                </div>
              </>
            )}
          </CollapsibleCard>

          {/* Testimonials */}
          <CollapsibleCard title="Testimonials" icon={MessageSquareQuote} description="Customer reviews & ratings" defaultOpen={false}>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm">Show testimonials</Label>
              <Switch
                checked={config.show_testimonials}
                onCheckedChange={(v) => updateConfig('show_testimonials', v)}
              />
            </div>
            {config.show_testimonials && (
              <>
                {(config.testimonials || []).map((review, idx) => (
                  <div key={idx} className="bg-slate-50 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-slate-400">Review {idx + 1}</Label>
                      <button onClick={() => removeTestimonial(idx)} className="text-slate-400 hover:text-red-500">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <Textarea
                      value={review.text}
                      onChange={(e) => updateTestimonial(idx, 'text', e.target.value)}
                      placeholder="What did the customer say?"
                      rows={2}
                      className="text-xs"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        value={review.author}
                        onChange={(e) => updateTestimonial(idx, 'author', e.target.value)}
                        placeholder="Customer name"
                        className="h-8 text-xs"
                      />
                      <Input
                        value={review.role || ''}
                        onChange={(e) => updateTestimonial(idx, 'role', e.target.value)}
                        placeholder="e.g. Mom of Cooper"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-slate-400">Rating:</Label>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            onClick={() => updateTestimonial(idx, 'rating', n)}
                            className="transition-colors"
                          >
                            <Star className={`h-4 w-4 ${n <= (review.rating || 5) ? 'fill-current text-amber-400' : 'text-slate-200'}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addTestimonial} className="w-full">
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Testimonial
                </Button>
              </>
            )}
          </CollapsibleCard>

          {/* Gallery */}
          <CollapsibleCard title="Gallery" icon={Image} description="Showcase your work with photos" defaultOpen={false}>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm">Show gallery</Label>
              <Switch
                checked={config.show_gallery}
                onCheckedChange={(v) => updateConfig('show_gallery', v)}
              />
            </div>
            {config.show_gallery && (
              <GalleryManager
                images={config.gallery_images || []}
                onChange={(images) => updateConfig('gallery_images', images)}
              />
            )}
          </CollapsibleCard>

          {/* Team */}
          <CollapsibleCard title="Team / Staff" icon={Users} defaultOpen={false}>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Show team members on website</Label>
              <Switch
                checked={config.show_team}
                onCheckedChange={(v) => updateConfig('show_team', v)}
              />
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-1.5 bg-slate-50 rounded-lg p-2.5">
              <Info className="h-3.5 w-3.5" />
              Staff members are pulled from your Staff settings. Add photos and roles there.
            </div>
          </CollapsibleCard>

          {/* Services Display */}
          <CollapsibleCard title="Services Display" icon={ShoppingBag} defaultOpen={false}>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Show services on website</Label>
              <Switch
                checked={config.show_services}
                onCheckedChange={(v) => updateConfig('show_services', v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Show prices</Label>
              <Switch
                checked={config.show_prices}
                onCheckedChange={(v) => updateConfig('show_prices', v)}
              />
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-1.5 bg-slate-50 rounded-lg p-2.5">
              <Info className="h-3.5 w-3.5" />
              Services are pulled from your Services settings.
            </div>
          </CollapsibleCard>

          {/* CTA Section */}
          <CollapsibleCard title="Call to Action" icon={Megaphone} description="The big booking banner" defaultOpen={false}>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm">Show CTA section</Label>
              <Switch
                checked={config.show_cta}
                onCheckedChange={(v) => updateConfig('show_cta', v)}
              />
            </div>
            {config.show_cta && (
              <>
                <div>
                  <Label className="text-xs text-slate-500 mb-1.5 block">CTA Title</Label>
                  <Input
                    value={config.cta_title || ''}
                    onChange={(e) => updateConfig('cta_title', e.target.value)}
                    placeholder="Ready to Pamper Your Pet?"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-500 mb-1.5 block">CTA Description</Label>
                  <Textarea
                    value={config.cta_description || ''}
                    onChange={(e) => updateConfig('cta_description', e.target.value)}
                    placeholder="Book your appointment today..."
                    rows={2}
                  />
                </div>
              </>
            )}
          </CollapsibleCard>

          {/* Social Media */}
          <CollapsibleCard title="Social Media" icon={Share2} defaultOpen={false}>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm">Show social links</Label>
              <Switch
                checked={config.show_socials}
                onCheckedChange={(v) => updateConfig('show_socials', v)}
              />
            </div>
            {config.show_socials && (
              <>
                <div>
                  <Label className="text-xs text-slate-500 mb-1.5 block flex items-center gap-1.5">
                    <Instagram className="h-3.5 w-3.5" /> Instagram URL
                  </Label>
                  <Input
                    value={config.social_instagram || ''}
                    onChange={(e) => updateConfig('social_instagram', e.target.value)}
                    placeholder="https://instagram.com/yoursalon"
                    className="text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-500 mb-1.5 block flex items-center gap-1.5">
                    <Facebook className="h-3.5 w-3.5" /> Facebook URL
                  </Label>
                  <Input
                    value={config.social_facebook || ''}
                    onChange={(e) => updateConfig('social_facebook', e.target.value)}
                    placeholder="https://facebook.com/yoursalon"
                    className="text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-500 mb-1.5 block">TikTok URL</Label>
                  <Input
                    value={config.social_tiktok || ''}
                    onChange={(e) => updateConfig('social_tiktok', e.target.value)}
                    placeholder="https://tiktok.com/@yoursalon"
                    className="text-xs"
                  />
                </div>
              </>
            )}
          </CollapsibleCard>

          {/* Contact Section */}
          <CollapsibleCard title="Contact Section" icon={MapPin} defaultOpen={false}>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Show contact & hours</Label>
              <Switch
                checked={config.show_contact}
                onCheckedChange={(v) => updateConfig('show_contact', v)}
              />
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-1.5 bg-slate-50 rounded-lg p-2.5">
              <Info className="h-3.5 w-3.5" />
              Business hours and contact info are pulled from your Business Details settings.
            </div>
          </CollapsibleCard>

          {/* Booking Settings */}
          <CollapsibleCard title="Booking Settings" icon={Settings2} defaultOpen={false}>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Allow online booking</Label>
              <Switch
                checked={config.online_booking_enabled}
                onCheckedChange={(v) => updateConfig('online_booking_enabled', v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Require phone number</Label>
              <Switch
                checked={config.require_phone}
                onCheckedChange={(v) => updateConfig('require_phone', v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Allow new client registration</Label>
              <Switch
                checked={config.allow_new_client_registration}
                onCheckedChange={(v) => updateConfig('allow_new_client_registration', v)}
              />
            </div>
          </CollapsibleCard>

        </div>
      </div>

      {/* Full-Screen Preview Modal */}
      {fullPreviewOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex flex-col" onClick={() => setFullPreviewOpen(false)}>
          <div className="flex items-center justify-between px-6 py-3 bg-slate-900 shrink-0" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400 cursor-pointer" onClick={() => setFullPreviewOpen(false)} />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <span className="text-slate-400 text-sm ml-2">{getSiteBaseUrl()}/s/{slug || 'your-salon'}</span>
            </div>
            <div className="flex items-center gap-3">
              {config.is_published && slug && (
                <a href={getTenantSiteUrl(slug)} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white border border-slate-600 px-3 py-1.5 rounded-lg transition-colors">
                  <ExternalLink className="h-3.5 w-3.5" /> Open Live Site
                </a>
              )}
              <button onClick={() => setFullPreviewOpen(false)}
                className="text-slate-400 hover:text-white text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-slate-700 transition-colors">
                ✕ Close
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto bg-slate-800 flex items-start justify-center p-6" onClick={e => e.stopPropagation()}>
            <div className="w-full max-w-4xl bg-white rounded-xl shadow-2xl overflow-hidden">
              <WebsitePreview config={config} tenant={tenant} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
