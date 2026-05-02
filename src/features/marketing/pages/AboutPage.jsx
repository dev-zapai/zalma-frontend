import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/shared/components/ui/button';
import { ArrowRight, Sparkles, MessageCircle, Zap, Shield } from 'lucide-react';
import PublicNavbar from '@/shared/components/PublicNavbar';
import Footer from '@/shared/components/Footer';

const MARKETING_URL = process.env.REACT_APP_MARKETING_URL || 'https://www.zapai.com.au';

function AboutHero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/40 via-white to-white" />
      <div className="relative w-full max-w-[1440px] mx-auto px-4 md:px-8 pt-20 pb-16 md:pt-28 md:pb-20">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-8" style={{ background: 'rgba(120,120,255,0.06)', border: '1px solid rgba(120,120,255,0.12)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            <span className="text-[11px] font-bold tracking-[0.15em] uppercase text-indigo-400">About Zalma</span>
          </div>
          <h1 className="text-[3rem] md:text-[4rem] lg:text-[5rem] font-black tracking-[-0.03em] leading-[0.92] text-gray-900" style={{ fontFamily: 'Manrope, system-ui, sans-serif' }}>
            Software shaped<br />
            around the way<br />
            <span className="text-indigo-400">groomers actually work.</span>
          </h1>
        </div>
      </div>
    </section>
  );
}

function MissionSection() {
  return (
    <section className="relative min-h-[50vh] flex items-center overflow-hidden">
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=1800&q=90"
          alt="Happy dog outdoors"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(110deg, rgba(255,255,255,0.97) 0%, rgba(255,255,255,0.92) 40%, rgba(255,255,255,0.4) 65%, rgba(255,255,255,0.1) 100%)' }} />
      </div>
      <div className="w-full max-w-[1440px] mx-auto px-4 md:px-8 py-20 relative z-10">
        <div className="max-w-lg">
          <span className="inline-block text-[11px] font-bold tracking-[0.15em] uppercase text-indigo-400 mb-3">Our Mission</span>
          <h2 className="text-3xl md:text-[2.8rem] font-bold text-gray-900 mb-5 tracking-tight leading-[1.1]" style={{ fontFamily: 'Manrope, system-ui, sans-serif' }}>
            Software that disappears into the background.
          </h2>
          <div className="space-y-4 text-base md:text-lg leading-relaxed text-gray-500 font-light">
            <p>
              We believe great service businesses deserve great software. Pet grooming is a craft that depends on relationships, judgment, and care. The tools that support it should not feel like generic CRM software bolted onto a calendar.
            </p>
            <p>
              Our mission is to give every grooming salon, from a solo operator to a multi-location chain, software that quietly does its job. Bookings flow in. Reminders go out. Records stay clean.
            </p>
            <p>
              We use AI where it earns its place. We avoid it where deterministic software is faster, cheaper, and more reliable.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function StorySection() {
  return (
    <section className="relative min-h-[50vh] flex items-center overflow-hidden">
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=1800&q=90"
          alt="Happy dog at salon"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(250deg, rgba(255,255,255,0.97) 0%, rgba(255,255,255,0.92) 40%, rgba(255,255,255,0.4) 65%, rgba(255,255,255,0.1) 100%)' }} />
      </div>
      <div className="w-full max-w-[1440px] mx-auto px-4 md:px-8 py-20 relative z-10">
        <div className="max-w-lg ml-auto">
          <span className="inline-block text-[11px] font-bold tracking-[0.15em] uppercase text-indigo-400 mb-3">The Zalma Story</span>
          <h2 className="text-3xl md:text-[2.8rem] font-bold text-gray-900 mb-5 tracking-tight leading-[1.1]" style={{ fontFamily: 'Manrope, system-ui, sans-serif' }}>
            Built from a familiar conversation.
          </h2>
          <div className="space-y-4 text-base md:text-lg leading-relaxed text-gray-500 font-light">
            <p>
              A salon owner showing us their setup: a calendar app for bookings, a separate spreadsheet for clients, sticky notes for grooming preferences, and SMS reminders sent by hand at the end of each day. Hours of admin every week, and at least one no-show because a reminder was missed.
            </p>
            <p>
              We looked at what was on the market. The big "all-in-one" tools were built for hairdressers. Pet records were missing. Grooming notes were a free-text field, if they existed at all.
            </p>
            <p>
              We started Zalma because the gap was obvious. A salon-management platform that understands how grooming actually works, with thoughtful AI quietly removing the busy work.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function PrinciplesSection() {
  const principles = [
    {
      icon: Sparkles,
      title: 'Build something great',
      desc: 'We aim high. We don\'t settle for okay. Seeing something done poorly drives us to roll up our sleeves and raise the bar. We ship early because greatness is paved with rapid iteration and real-world feedback from real salons.',
    },
    {
      icon: MessageCircle,
      title: 'Listen first, build second',
      desc: 'The best ideas come from the people doing the work. We talk to groomers, owners, and front-desk staff before we open an editor. Every feature should answer a question someone actually asked.',
    },
    {
      icon: Zap,
      title: 'Quiet automation',
      desc: 'The best software does its job and gets out of the way. We use AI and automation to remove busy work, not to add buzzwords. If a feature does not save real time, it does not ship.',
    },
    {
      icon: Shield,
      title: 'Customer ownership of data',
      desc: 'Your data is yours. Always exportable, never locked in, never used to train general-purpose AI models. Tenant isolation is not a marketing line; it is enforced at every layer of the stack.',
    },
  ];
  return (
    <section className="py-28 bg-white">
      <div className="w-full max-w-[1100px] mx-auto px-4 md:px-8">
        <div className="grid md:grid-cols-12 gap-10 mb-16">
          <div className="md:col-span-5">
            <span className="inline-block text-[11px] font-bold tracking-[0.15em] uppercase text-indigo-400 mb-3">Operating Principles</span>
            <h2 className="text-3xl md:text-[2.8rem] font-bold tracking-tight text-gray-900 leading-[1.1]" style={{ fontFamily: 'Manrope, system-ui, sans-serif' }}>
              How we build.
            </h2>
          </div>
          <div className="md:col-span-7 flex md:items-end">
            <p className="text-base md:text-lg text-gray-500 leading-relaxed font-light">
              Four ideas that shape every product decision we make. We hold ourselves to them, and our customers hold us to them.
            </p>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-x-12 gap-y-14">
          {principles.map((p, i) => (
            <div key={i} className="group relative">
              <div className="flex items-center gap-4 mb-5">
                <span className="text-[13px] font-black tracking-[0.2em] text-indigo-400" style={{ fontFamily: 'Manrope, system-ui, sans-serif' }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="h-px flex-1 bg-gray-200" />
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                  <p.icon className="h-5 w-5 text-indigo-400" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3" style={{ fontFamily: 'Manrope, system-ui, sans-serif' }}>
                {p.title}
              </h3>
              <p className="text-base text-gray-500 leading-relaxed font-light">
                {p.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function BuiltByZapAISection() {
  return (
    <section className="py-24 bg-white">
      <div className="w-full max-w-[900px] mx-auto px-4 md:px-8">
        <div className="grid md:grid-cols-12 gap-10 items-start">
          <div className="md:col-span-4">
            <span className="text-[11px] font-bold tracking-[0.15em] uppercase text-indigo-400">Built by Zap AI</span>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 mt-3" style={{ fontFamily: 'Manrope' }}>
              A product of an Australian software studio.
            </h2>
          </div>
          <div className="md:col-span-8 space-y-5 text-base md:text-lg text-gray-500 leading-relaxed">
            <p>
              Zalma is built and operated by Zap AI, an Australian software company specialising in AI-powered automation for service businesses.
            </p>
            <p>
              Customer data stays onshore in Australia. We comply with the Australian Privacy Act and the Spam Act 2003. Pricing is in Australian dollars.
            </p>
            <div className="pt-2">
              <a href={`${MARKETING_URL}/about`}>
                <Button className="rounded-full px-6 h-11 text-[13px] font-medium bg-gray-900 text-white hover:bg-gray-800">
                  About Zap AI <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="relative min-h-[50vh] flex items-center overflow-hidden">
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=1800&q=90"
          alt="Happy dog"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(110deg, rgba(255,255,255,0.97) 0%, rgba(255,255,255,0.92) 40%, rgba(255,255,255,0.4) 65%, rgba(255,255,255,0.1) 100%)' }} />
      </div>
      <div className="w-full max-w-[1440px] mx-auto px-4 md:px-8 py-20 relative z-10">
        <div className="max-w-2xl">
          <span className="inline-block text-[11px] font-bold tracking-[0.15em] uppercase text-indigo-400 mb-4">Get Started Today</span>
          <h2 className="text-3xl md:text-[3.2rem] font-bold text-gray-900 mb-5 tracking-tight leading-[1.1]" style={{ fontFamily: 'Manrope, system-ui, sans-serif' }}>
            Ready to try Zalma?
          </h2>
          <p className="text-base md:text-lg mb-8 max-w-md leading-relaxed text-gray-400 font-light">
            Start your free trial. No credit card required. Be running in minutes, not weeks.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button asChild size="lg" className="rounded-full px-8 h-12 text-base font-semibold bg-gray-900 text-white hover:bg-gray-800 shadow-lg">
              <Link to="/register">Start Free Trial <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full px-8 h-12 text-base font-semibold border-gray-200 text-gray-600 hover:bg-gray-50">
              <Link to="/contact">Talk to us</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />
      <AboutHero />
      <MissionSection />
      <StorySection />
      <PrinciplesSection />
      <BuiltByZapAISection />
      <CTASection />
      <Footer />
    </div>
  );
}
