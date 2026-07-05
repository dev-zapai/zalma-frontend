import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import {
  ArrowRight, ArrowUpRight, Scissors, Sparkles,
  Check, Calendar, Users, BarChart3, Shield, Star,
  MessageSquare, ChevronRight, ClipboardList, TrendingUp,
  Phone, PawPrint, Heart, Clock, Play
} from 'lucide-react';

import PublicNavbar from '@/shared/components/PublicNavbar';
import Footer from '@/shared/components/Footer';

/* ─────────────────── HERO ─────────────────── */
function HeroSection() {
  return (
    <section className="relative overflow-hidden min-h-[90vh] flex items-center">
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=1800&q=90"
          alt="Happy golden retriever"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(110deg, rgba(255,255,255,0.97) 0%, rgba(255,255,255,0.92) 40%, rgba(255,255,255,0.4) 65%, rgba(255,255,255,0.1) 100%)' }} />
      </div>

      <div className="w-full max-w-[1440px] mx-auto px-4 md:px-8 py-20 md:py-28 relative z-10">
        <div className="max-w-2xl">
          <h1 className="text-[3.5rem] md:text-[4.5rem] lg:text-[5.5rem] font-black tracking-[-0.03em] leading-[0.92] mt-14 mb-8 text-gray-900" style={{ fontFamily: 'Manrope, system-ui, sans-serif' }}>
            Your Grooming<br />
            Salon,{' '}
            <span className="text-indigo-400">Beautifully</span><br />
            <span className="text-indigo-400">Managed.</span>
          </h1>

          <p className="text-lg md:text-xl leading-relaxed max-w-lg mb-10 text-gray-400 font-light">
            Built for groomers who want to focus on pets, not paperwork.
          </p>

          <div className="flex items-center gap-5 flex-wrap">
            <a href="/contact">
              <Button size="lg" className="rounded-full px-8 h-12 text-base font-semibold shadow-lg bg-gray-900 text-white hover:bg-gray-800">
                Book a Demo
              </Button>
            </a>
            <Button variant="outline" size="lg" asChild className="rounded-full px-8 h-12 text-base font-semibold border-gray-200 text-gray-600 hover:bg-gray-50">
              <Link to="/register">
                Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="flex items-center gap-10 mt-16 pt-8 border-t border-gray-100">
            <div>
              <span className="block text-3xl md:text-4xl font-black tracking-tight text-gray-900">500+</span>
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-300">Salons</span>
            </div>
            <div className="w-px h-10 bg-gray-100" />
            <div>
              <span className="block text-3xl md:text-4xl font-black tracking-tight text-gray-900">50k+</span>
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-300">Pets Groomed</span>
            </div>
            <div className="w-px h-10 bg-gray-100" />
            <div>
              <span className="block text-3xl md:text-4xl font-black tracking-tight text-gray-900">99.4%</span>
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-300">Uptime</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────── AI FEATURES (large showcase) ─────────────────── */
function AIFeaturesSection() {
  const features = [
    {
      title: 'Smart Appointment Booking',
      description: 'Drag-and-drop scheduling with staff availability. Quick-book new clients and pets in seconds.',
      image: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=1600&q=85',
      imageAlt: 'Dog being groomed professionally',
      icon: Calendar,
    },
    {
      title: 'Client & Pet Profiles',
      description: 'Complete profiles for every pet and owner. Track breed, coat type, preferences, and grooming history.',
      image: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=1600&q=85',
      imageAlt: 'Cat looking at camera',
      icon: Heart,
    },
    {
      title: 'Grooming Notes & History',
      description: 'Record coat condition, services performed, and recommended next visit. Build a complete grooming timeline.',
      image: 'https://images.unsplash.com/photo-1596854407944-bf87f6fdd49e?w=1600&q=85',
      imageAlt: 'Pet being pampered',
      icon: ClipboardList,
    },
  ];

  return (
    <section>
      <div className="py-20 bg-white">
        <div className="w-full max-w-[1440px] mx-auto px-4 md:px-8">
          <h2 className="text-3xl md:text-[2.8rem] font-bold tracking-tight text-gray-900 mb-3 whitespace-nowrap">
            Everything Your Salon Needs
          </h2>
          <p className="text-base md:text-lg text-gray-500 font-light whitespace-nowrap">
            Three pillars that power every successful grooming business on Zalma.
          </p>
        </div>
      </div>

      {features.map((f, i) => (
        <div key={i} className="relative h-[440px] md:h-[500px] flex items-center overflow-hidden">
          {/* Full background image */}
          <div className="absolute inset-0">
            <img src={f.image} alt={f.imageAlt} className="w-full h-full object-cover" />
            <div className="absolute inset-0" style={{
              background: i % 2 === 0
                ? 'linear-gradient(110deg, rgba(255,255,255,0.97) 0%, rgba(255,255,255,0.92) 40%, rgba(255,255,255,0.4) 65%, rgba(255,255,255,0.1) 100%)'
                : 'linear-gradient(250deg, rgba(255,255,255,0.97) 0%, rgba(255,255,255,0.92) 40%, rgba(255,255,255,0.4) 65%, rgba(255,255,255,0.1) 100%)'
            }} />
          </div>

          <div className="w-full max-w-[1440px] mx-auto px-4 md:px-8 relative z-10">
            <div className={`max-w-lg ${i % 2 === 1 ? 'ml-auto' : ''}`}>
              <h3 className="text-3xl md:text-5xl font-bold text-gray-900 mb-5 tracking-tight leading-[1.05]">
                {f.title}
              </h3>
              <p className="text-base md:text-lg leading-relaxed text-gray-500 font-light">
                {f.description}
              </p>
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}

/* ─────────────────── FEATURES GRID ─────────────────── */
function FeaturesSection() {
  const features = [
    { title: 'Smart Scheduling',   desc: "Staff-based calendars with drag-and-drop management. See who's available at a glance.", Icon: Calendar },
    { title: 'Client Management',  desc: 'Complete client profiles with pet info, contact details, appointment history, and preferences.', Icon: Users },
    { title: 'Pet Profiles',       desc: 'Track breed, weight, coat type, special notes, and complete grooming history for every pet.', Icon: PawPrint },
    { title: 'Grooming Notes',     desc: 'Record coat condition, services performed, groomer observations, and next recommended visit.', Icon: ClipboardList },
    { title: 'Business Analytics', desc: 'Revenue tracking, popular services, staff performance, and client retention metrics.', Icon: BarChart3 },
    { title: 'Team Management',    desc: 'Admin and staff roles with appropriate permissions. Invite team members via email.', Icon: Shield },
  ];

  return (
    <section id="features" className="py-28 bg-white">
      <div className="w-full max-w-[1440px] mx-auto px-4 md:px-8">
        <h2 className="text-3xl md:text-[2.8rem] font-bold tracking-tight text-gray-900 whitespace-nowrap mb-16">
          Built for pet groomers
        </h2>

        {/* Engineered 3x2 lattice of WHITE tiles with shared hairline borders
            (2 rows on desktop — the requested "2 row" structure). Borrows the
            mono two-digit index + indigo-400 accent from the pricing /
            testimonial sections below for page-family continuity, but stays
            white and airy — NO grey fill, NO clip-path fold, NO photography —
            so it never reads as "same". Descriptions stay visible for touch;
            hover adds an indigo accent rail, an indigo icon-square fill, a
            content indent-slide, and the ArrowUpRight nudge. */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 border-t border-l border-gray-200">
          {features.map((f, i) => (
            <div
              key={i}
              className="group relative overflow-hidden border-b border-r border-gray-200 bg-white transition-colors duration-300 hover:bg-[#faf7f0]"
            >
              {/* Gold accent rail — grows from the top on hover (matches the
                  warm highlight used on the testimonials cards) */}
              <span className="pointer-events-none absolute left-0 top-0 h-full w-[3px] origin-top scale-y-0 bg-[#c9a96e] transition-transform duration-300 ease-out group-hover:scale-y-100" />

              {/* Content indents right as the rail appears */}
              <div className="relative flex min-h-[264px] flex-col p-8 lg:p-10 transition-[padding] duration-300 ease-out group-hover:pl-11 lg:group-hover:pl-[3.25rem]">
                {/* Top row: mono chapter index + gold-fill icon square */}
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[13px] font-bold tracking-[0.08em] text-gray-300 transition-colors duration-300 group-hover:text-[#c9a96e]">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f7f1e6] text-[#c9a96e] transition-colors duration-300 group-hover:bg-[#c9a96e] group-hover:text-white">
                    <f.Icon className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                </div>

                {/* Title — mono uppercase, same typographic voice as the
                    testimonial brand names for page-family consistency */}
                <div className="mt-8">
                  <h3 className="text-[15px] md:text-base font-mono font-bold tracking-[0.06em] uppercase text-gray-800">
                    {f.title}
                  </h3>
                </div>

                {/* Description — always visible (touch-safe) */}
                <p className="mt-3 max-w-sm text-[14px] leading-[1.6] text-gray-500">
                  {f.desc}
                </p>

                {/* Quiet gold baseline that draws in on hover */}
                <span className="pointer-events-none absolute bottom-0 left-0 h-[2px] w-full origin-left scale-x-0 bg-[#c9a96e] transition-transform duration-300 ease-out group-hover:scale-x-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────── PRICING ─────────────────── */
function PricingSection() {
  const plans = [
    {
      key: 'growth',
      name: 'Growth',
      price: 'A$0.39',
      period: '/ booking',
      minimum: 'No monthly minimum',
      description: 'For groomers who want a solid operating system',
      features: [
        'Appointment calendar + KPI cards',
        'Staff availability + employment',
        'Client + pet profiles (compliance-ready)',
        'Pet medical history + before/after photos',
        'Automated tax invoices',
        'Google Maps booking link + free website',
        'Waitlist',
        'Unlimited users & appointments',
      ],
      popular: false,
      included: null,
    },
    {
      key: 'premium',
      name: 'Premium',
      price: 'A$0.74',
      period: '/ booking',
      minimum: 'A$49/mo minimum',
      description: 'Automate enquiries, rebookings, reminders, reviews',
      features: [
        'Everything in Growth',
        'Leave / Absence management',
        'Advanced analytics',
        'Partnerships + Transfer bookings + Partner chat',
        'Appointment reminders (SMS + Email)',
        'Review-request automation',
        'Rebooking reminders',
        'Marketing campaigns (bulk SMS + Email)',
        'Membership plans',
        'Automated tax invoice email',
      ],
      popular: true,
      included: '400 SMS + 500 emails + 100 AI mins/month',
    },
    {
      key: 'ultimate',
      name: 'Ultimate',
      price: 'A$0.99',
      period: '/ booking',
      minimum: 'A$99/mo minimum',
      description: 'Turn the salon into a Revenue Engine',
      features: [
        'Everything in Premium',
        'Explore map (salon discovery)',
        'Custom salon website builder',
        'Birthday greetings + We-miss-you reminders',
        'Client-specific discounts',
      ],
      popular: false,
      included: '600 SMS + 2,000 emails + 150 AI mins/month',
    },
  ];

  // Same clip-path fold as testimonials — visual family across the page.
  const clipCorner = "polygon(0 0, calc(100% - 24px) 0, 100% 24px, 100% 100%, 0 100%)";

  return (
    <section id="pricing" className="py-28 bg-white">
      <div className="w-full max-w-[1440px] mx-auto px-4 md:px-8">
        <h2 className="text-3xl md:text-[2.8rem] font-bold tracking-tight text-gray-900 mb-3 whitespace-nowrap">
          Pay per booking, not per month
        </h2>
        <p className="text-base md:text-lg text-gray-500 font-light mb-16 whitespace-nowrap">
          No lock-in contracts. Upgrade or downgrade anytime. You only pay when you book.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
          {plans.map((p, i) => {
            // "Recommended" plan gets a subtle darker grey — same shape as
            // the other cards, no scale/shadow gimmicks. Lets the price and
            // feature list speak for themselves. Same trick Stripe uses.
            const bg = p.popular ? '#e8e8ec' : '#f2f2f2';

            return (
              <div
                key={i}
                className="group relative p-7 md:p-8 min-h-[620px] flex flex-col transition-all duration-300 hover:-translate-y-1"
                style={{ background: bg, clipPath: clipCorner }}
              >
                {/* Indigo accent rail — grows from the top on hover (same
                    motion as the features lattice, ties the page together) */}
                <span className="pointer-events-none absolute left-0 top-0 h-full w-[3px] origin-top scale-y-0 bg-indigo-400 transition-transform duration-300 ease-out group-hover:scale-y-100" />

                {/* Header row — plan name in mono uppercase (matches
                    testimonial brand-name typography) */}
                <div className="flex items-center justify-between mb-6">
                  <span className="text-[13px] font-mono font-bold tracking-[0.08em] text-gray-800">
                    {p.name.toUpperCase()}
                  </span>
                  {p.popular && (
                    <span className="text-[10px] font-mono font-bold tracking-[0.15em] text-indigo-500 uppercase">
                      Recommended
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-[13px] leading-relaxed text-gray-500 mb-8 min-h-[40px]">
                  {p.description}
                </p>

                {/* Price */}
                <div className="mb-1 flex items-baseline gap-1">
                  <span className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">
                    {p.price}
                  </span>
                  <span className="text-sm text-gray-500">{p.period}</span>
                </div>
                <p className="text-[11px] text-gray-400 mb-2">{p.minimum || ' '}</p>

                {/* Included allowances (SMS/emails/AI mins) */}
                <p className="text-[11px] font-medium text-emerald-600 mb-6 min-h-[16px]">
                  {p.included || ' '}
                </p>

                {/* CTA — minimal, matches Palantir aesthetic (rectangular,
                    subtle, no gradient). On card hover it fills indigo to
                    echo the accent rail. */}
                <Button
                  asChild
                  className={`w-full rounded-none h-11 text-sm font-medium mb-8 shadow-none transition-colors duration-300 ${
                    p.popular
                      ? 'bg-gray-900 text-white group-hover:bg-indigo-500'
                      : 'bg-white text-gray-900 border border-gray-300 group-hover:bg-indigo-500 group-hover:text-white group-hover:border-indigo-500'
                  }`}
                >
                  <Link to={`/register?plan=${p.key}`}>Get Started</Link>
                </Button>

                {/* Feature list — small dot bullets, engineered feel */}
                <div className="space-y-2.5 flex-1">
                  {p.features.map((f, j) => (
                    <div key={j} className="flex items-start gap-3">
                      <span className="w-1 h-1 rounded-full bg-gray-500 mt-2 flex-shrink-0" />
                      <span className="text-[13px] leading-relaxed text-gray-600">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-[11px] font-mono uppercase tracking-[0.1em] text-gray-400 mt-10">
          Prices exclusive of GST · No lock-in · Cancel anytime
        </p>
      </div>
    </section>
  );
}

/* ─────────────────── TESTIMONIALS ─────────────────── */
function TestimonialsSection() {
  const testimonials = [
    {
      brand: "PAWS & CLAWS",
      text: "Zalma transformed how we manage our grooming salon. Booking is a breeze and our clients love the reminders!",
    },
    {
      brand: "HAPPY TAILS",
      text: "The grooming notes feature is a game-changer. We can track every pet's coat condition and preferences across visits.",
    },
    {
      brand: "FUR & FABULOUS",
      text: "Finally a system built for groomers, not just clinics. The staff scheduling alone saves us hours every week.",
    },
    {
      brand: "BARK AVENUE",
      text: "We deployed Zalma at 3 locations in a week. Revenue tracking finally makes sense across the whole salon group.",
    },
    {
      brand: "WAG HAUS",
      text: "Our no-show rate dropped 40% after switching to Zalma's automated reminders. Best decision we made this year.",
    },
  ];

  // Palantir-style card: light grey background with a folded top-right
  // corner (clip-path diagonal cut) that gives the cards a distinct,
  // engineered feel.
  const clipCorner = "polygon(0 0, calc(100% - 24px) 0, 100% 24px, 100% 100%, 0 100%)";

  // Duplicate the list so the marquee track can loop seamlessly (-50%).
  const loop = [...testimonials, ...testimonials];

  return (
    <section id="testimonials" className="py-28 bg-white">
      {/* Everything stays inside the aligned container — the marquee starts
          at the logo's left edge and scrolls horizontally within it, clipping
          on the right. Not full-bleed. */}
      <div className="w-full max-w-[1440px] mx-auto px-4 md:px-8">
        <h2 className="text-3xl md:text-[2.8rem] font-bold tracking-tight text-gray-900 whitespace-nowrap mb-16">
          Loved by Groomers
        </h2>

        <div className="relative overflow-hidden">
          <div className="marquee-track gap-4 md:gap-5">
            {loop.map((t, i) => (
              <div
                key={i}
                className="group relative bg-[#f2f2f2] hover:bg-[#f7f1e6] transition-colors duration-300 p-6 md:p-7 w-[280px] md:w-[320px] shrink-0 min-h-[220px] flex flex-col"
                style={{ clipPath: clipCorner }}
              >
                {/* Accent rail — warm gold highlight (distinct from the indigo
                    used elsewhere), grows from the top on hover */}
                <span className="pointer-events-none absolute left-0 top-0 h-full w-[3px] origin-top scale-y-0 bg-[#c9a96e] transition-transform duration-300 ease-out group-hover:scale-y-100" />
                <span className="text-[13px] font-mono font-bold tracking-[0.08em] text-gray-800">
                  {t.brand}
                </span>
                <p className="text-[13px] leading-[1.55] text-gray-500 mt-auto pt-8">
                  "{t.text}"
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────── CTA ─────────────────── */
function CTASection() {
  return (
    <section className="relative min-h-[50vh] flex items-center overflow-hidden">
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=1600&q=85"
          alt="Two dogs walking together"
          className="w-full h-full object-cover"
          style={{ objectPosition: 'center 25%' }}
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(110deg, rgba(255,255,255,0.97) 0%, rgba(255,255,255,0.92) 40%, rgba(255,255,255,0.4) 65%, rgba(255,255,255,0.1) 100%)' }} />
      </div>

      <div className="w-full max-w-[1440px] mx-auto px-4 md:px-8 py-20 relative z-10">
        <div className="max-w-2xl">
          <h2 className="text-3xl md:text-[3.2rem] font-bold text-gray-900 mb-5 tracking-tight leading-[1.1]" style={{ fontFamily: 'Manrope, system-ui, sans-serif' }}>
            Ready to streamline your grooming salon?
          </h2>
          <p className="text-base md:text-lg mb-8 max-w-md leading-relaxed text-gray-400 font-light">
            Join hundreds of grooming salons already using Zalma to manage bookings, clients, and grow their business.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button size="lg" asChild className="rounded-full px-8 h-12 text-base font-semibold bg-gray-900 text-white hover:bg-gray-800 shadow-lg">
              <Link to="/register">
                Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <a href="/contact">
              <Button variant="outline" size="lg" className="rounded-full px-8 h-12 text-base font-semibold border-gray-200 text-gray-600 hover:bg-gray-50">
                Book a Demo
              </Button>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────── PAGE ─────────────────── */
export default function PetGroomingLandingPage() {
  return (
    // Home page uses Manrope throughout; the rest of the site keeps its
    // original Plus Jakarta Sans body font (set globally in index.css).
    <div className="min-h-screen bg-white" style={{ fontFamily: 'Manrope, system-ui, sans-serif' }}>
      <PublicNavbar />
      <HeroSection />
      <AIFeaturesSection />
      <FeaturesSection />
      <PricingSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </div>
  );
}
