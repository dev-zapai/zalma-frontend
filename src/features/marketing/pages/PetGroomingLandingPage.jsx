import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import {
  ArrowRight, Scissors, Sparkles,
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
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-8" style={{ background: 'rgba(120,120,255,0.06)', border: '1px solid rgba(120,120,255,0.12)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            <span className="text-[11px] font-bold tracking-[0.15em] uppercase text-indigo-400">Protocol by Zap AI</span>
          </div>

          <h1 className="text-[3.5rem] md:text-[4.5rem] lg:text-[5.5rem] font-black tracking-[-0.03em] leading-[0.92] mb-8 text-gray-900" style={{ fontFamily: 'Manrope, system-ui, sans-serif' }}>
            Your Grooming<br />
            Salon,{' '}
            <span className="text-indigo-400">Beautifully</span><br />
            <span className="text-indigo-400">Managed.</span>
          </h1>

          <p className="text-lg md:text-xl leading-relaxed max-w-lg mb-10 text-gray-400 font-light">
            From booking to grooming notes, manage your pet salon with ease. Built for groomers who want to focus on pets, not paperwork.
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
      <div className="text-center py-20 bg-white">
        <div className="w-full max-w-[1440px] mx-auto px-4 md:px-8">
          <span className="inline-block text-[12px] font-bold tracking-[0.15em] uppercase text-indigo-400 mb-3">Powerful Features</span>
          <h2 className="text-3xl md:text-[2.8rem] font-bold tracking-tight text-gray-900 mb-4" style={{ fontFamily: 'Manrope, system-ui, sans-serif' }}>
            Everything Your Salon Needs
          </h2>
          <p className="text-base md:text-lg text-gray-400 max-w-xl mx-auto font-light">
            Three pillars that power every successful grooming business on Zalma.
          </p>
        </div>
      </div>

      {features.map((f, i) => (
        <div key={i} className="relative min-h-[50vh] flex items-center overflow-hidden">
          {/* Full background image */}
          <div className="absolute inset-0">
            <img src={f.image} alt={f.imageAlt} className="w-full h-full object-cover" />
            <div className="absolute inset-0" style={{
              background: i % 2 === 0
                ? 'linear-gradient(110deg, rgba(255,255,255,0.97) 0%, rgba(255,255,255,0.92) 40%, rgba(255,255,255,0.4) 65%, rgba(255,255,255,0.1) 100%)'
                : 'linear-gradient(250deg, rgba(255,255,255,0.97) 0%, rgba(255,255,255,0.92) 40%, rgba(255,255,255,0.4) 65%, rgba(255,255,255,0.1) 100%)'
            }} />
          </div>

          <div className="w-full max-w-[1440px] mx-auto px-4 md:px-8 py-20 relative z-10">
            <div className={`max-w-lg ${i % 2 === 1 ? 'ml-auto' : ''}`}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 bg-indigo-50">
                <f.icon className="h-6 w-6 text-indigo-400" />
              </div>
              <h3 className="text-2xl md:text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Manrope, system-ui, sans-serif' }}>
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
    { icon: Calendar, title: 'Smart Scheduling', desc: 'Staff-based calendars with drag-and-drop management. See who\'s available at a glance.' },
    { icon: Users, title: 'Client Management', desc: 'Complete client profiles with pet info, contact details, appointment history, and preferences.' },
    { icon: PawPrint, title: 'Pet Profiles', desc: 'Track breed, weight, coat type, special notes, and complete grooming history for every pet.' },
    { icon: ClipboardList, title: 'Grooming Notes', desc: 'Record coat condition, services performed, groomer observations, and next recommended visit.' },
    { icon: BarChart3, title: 'Business Analytics', desc: 'Revenue tracking, popular services, staff performance, and client retention metrics.' },
    { icon: Shield, title: 'Team Management', desc: 'Admin and staff roles with appropriate permissions. Invite team members via email.' },
  ];

  return (
    <section id="features" className="py-28 bg-white">
      <div className="w-full max-w-[1200px] mx-auto px-4 md:px-8">
        <div className="grid md:grid-cols-12 gap-10 mb-16">
          <div className="md:col-span-5">
            <span className="inline-block text-[11px] font-bold tracking-[0.15em] uppercase text-indigo-400 mb-3">Features</span>
            <h2 className="text-3xl md:text-[2.8rem] font-bold tracking-tight text-gray-900 leading-[1.1]" style={{ fontFamily: 'Manrope, system-ui, sans-serif' }}>
              Built for pet groomers.
            </h2>
          </div>
          <div className="md:col-span-7 flex md:items-end">
            <p className="text-base md:text-lg text-gray-500 leading-relaxed font-light">
              Every feature designed to make your grooming salon run smoothly, from the first booking to the final brushstroke.
            </p>
          </div>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-12">
          {features.map((f, i) => (
            <div key={i} className="group relative">
              <div className="flex items-center gap-3 mb-5">
                <span className="text-[12px] font-black tracking-[0.2em] text-indigo-400" style={{ fontFamily: 'Manrope, system-ui, sans-serif' }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="h-px flex-1 bg-gray-200" />
                <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                  <f.icon className="h-4 w-4 text-indigo-400" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2.5" style={{ fontFamily: 'Manrope, system-ui, sans-serif' }}>
                {f.title}
              </h3>
              <p className="text-base text-gray-500 leading-relaxed font-light">
                {f.desc}
              </p>
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

  return (
    <section id="pricing" className="py-28 bg-white">
      <div className="w-full max-w-[1440px] mx-auto px-4 md:px-8">
        <div className="text-center mb-16">
          <span className="inline-block text-[12px] font-bold tracking-[0.15em] uppercase text-indigo-400 mb-3">Pricing</span>
          <h2 className="text-3xl md:text-[2.8rem] font-bold tracking-tight text-gray-900" style={{ fontFamily: 'Manrope, system-ui, sans-serif' }}>
            Pay per booking, not per month
          </h2>
          <p className="mt-4 text-base md:text-lg text-gray-400 max-w-2xl mx-auto font-light">
            No lock-in contracts. Upgrade or downgrade anytime. You only pay when you book.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((p, i) => (
            <Card key={i} className={`rounded-2xl border-0 ${p.popular ? 'scale-[1.03] shadow-xl' : 'shadow-sm'}`}
              style={{
                border: p.popular ? '2px solid rgba(129,129,255,0.3)' : '1px solid rgba(0,0,0,0.04)',
                background: 'white',
              }}>
              <CardContent className="p-8 flex flex-col h-full">
                {p.popular && (
                  <span className="inline-block text-[11px] font-bold tracking-wider uppercase text-white bg-indigo-400 rounded-full px-3 py-1 mb-4 self-start">Most Popular</span>
                )}
                <h3 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Manrope, system-ui, sans-serif' }}>{p.name}</h3>
                <p className="text-sm mt-1 text-gray-400">{p.description}</p>
                <div className="mt-6 mb-1">
                  <span className="text-4xl font-bold text-gray-900" style={{ fontFamily: 'Manrope, system-ui, sans-serif' }}>{p.price}</span>
                  <span className="ml-1 text-gray-400">{p.period}</span>
                </div>
                {p.minimum && (
                  <p className="text-xs text-gray-400 mb-3">{p.minimum}</p>
                )}
                {p.included && (
                  <p className="text-xs text-emerald-600 font-medium mb-4">{p.included}</p>
                )}
                {!p.included && <div className="mb-4" />}
                <Button className="w-full rounded-full h-11 text-sm font-medium" asChild
                    style={p.popular
                      ? { background: '#818cf8', color: '#fff' }
                      : { background: '#f4f4ff', color: '#818cf8' }
                    }>
                    <Link to={`/register?plan=${p.key}`}>Get Started</Link>
                </Button>
                <div className="mt-8 space-y-3 flex-1">
                  {p.features.map((f, j) => (
                    <div key={j} className="flex items-center gap-2.5">
                      <Check className="h-4 w-4 flex-shrink-0 text-indigo-400" />
                      <span className="text-sm text-gray-500">{f}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="text-center text-xs text-gray-400 mt-8">Prices are exclusive of GST. No lock-in contracts. Cancel anytime.</p>
      </div>
    </section>
  );
}

/* ─────────────────── TESTIMONIALS ─────────────────── */
function TestimonialsSection() {
  const testimonials = [
    {
      text: "Zalma transformed how we manage our grooming salon. Booking is a breeze and our clients love the reminders!",
      name: "Sarah Mitchell",
      role: "Owner, Paws & Claws Grooming",
      rating: 5,
    },
    {
      text: "The grooming notes feature is a game-changer. We can track every pet's coat condition and preferences across visits.",
      name: "James Parker",
      role: "Head Groomer, Happy Tails Salon",
      rating: 5,
    },
    {
      text: "Finally a system built for groomers, not just clinics. The staff scheduling alone saves us hours every week.",
      name: "Priya Sharma",
      role: "Manager, Fur & Fabulous",
      rating: 5,
    },
  ];

  return (
    <section id="testimonials" className="py-28" style={{ background: '#f8f8ff' }}>
      <div className="w-full max-w-[1440px] mx-auto px-4 md:px-8">
        <div className="text-center mb-16">
          <span className="inline-block text-[12px] font-bold tracking-[0.15em] uppercase text-indigo-400 mb-3">Testimonials</span>
          <h2 className="text-3xl md:text-[2.8rem] font-bold tracking-tight text-gray-900" style={{ fontFamily: 'Manrope, system-ui, sans-serif' }}>
            Loved by Groomers
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div key={i} className="rounded-2xl bg-white p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex gap-1 mb-4">
                {[...Array(t.rating)].map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-amber-300 text-amber-300" />
                ))}
              </div>
              <p className="text-sm leading-relaxed mb-6 text-gray-500">"{t.text}"</p>
              <div>
                <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                <p className="text-xs text-gray-400">{t.role}</p>
              </div>
            </div>
          ))}
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
          <span className="inline-block text-[11px] font-bold tracking-[0.15em] uppercase text-indigo-400 mb-4">Get Started Today</span>
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
    <div className="min-h-screen bg-white">
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
