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
  // Warm craft panels. Beliefs, not steps — no numbering, no implied order.
  // Each belief is a calm white panel with the icon inline in the headline
  // row (indigo, no ring/square). Signature is restraint: a hairline top-edge
  // stays transparent at rest and warms to indigo on hover while the panel
  // lifts a few pixels. Rounded, softly shadowed, 2x2 rhythm — deliberately
  // not the bordered hover-lattice used on the home page.
  return (
    <section className="py-28 bg-[#fafafa]">
      <div className="w-full max-w-[1440px] mx-auto px-4 md:px-8">
        <div className="max-w-2xl mb-14 md:mb-16">
          <h2 className="text-3xl md:text-[2.8rem] font-bold tracking-tight text-gray-900 leading-[1.1]" style={{ fontFamily: 'Manrope, system-ui, sans-serif' }}>
            How we build
          </h2>
          <p className="mt-4 text-base md:text-lg text-gray-500 leading-relaxed font-light">
            Four beliefs that shape every product decision we make.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 lg:gap-7">
          {principles.map((p, i) => {
            const Icon = p.icon;
            return (
              <div
                key={i}
                className="group relative rounded-3xl bg-white p-8 md:p-10 shadow-[0_1px_3px_rgba(17,24,39,0.04),0_12px_28px_-16px_rgba(17,24,39,0.10)] transition-[transform,box-shadow] duration-300 ease-out motion-reduce:transition-none hover:-translate-y-1 hover:shadow-[0_2px_6px_rgba(17,24,39,0.05),0_24px_44px_-20px_rgba(79,70,229,0.22)] motion-reduce:hover:translate-y-0"
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-8 md:inset-x-10 top-0 h-px rounded-full bg-indigo-400/0 transition-colors duration-300 group-hover:bg-indigo-400/70 motion-reduce:transition-none"
                />
                <div className="flex items-center gap-3.5 mb-4">
                  <Icon className="h-6 w-6 shrink-0 text-indigo-400" strokeWidth={1.75} aria-hidden="true" />
                  <h3 className="text-xl md:text-[1.6rem] font-bold text-gray-900 tracking-tight leading-tight" style={{ fontFamily: 'Manrope, system-ui, sans-serif' }}>
                    {p.title}
                  </h3>
                </div>
                <p className="text-[15px] md:text-base leading-relaxed text-gray-500 font-light">
                  {p.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Provenance as a quote — sits inside this section (not its own box),
            oversized indigo opening mark + border rail, running edge-to-edge. */}
        <blockquote className="mt-16 md:mt-20 relative pl-8 md:pl-12 border-l-2 border-indigo-200">
          <span
            aria-hidden="true"
            className="block mb-2 text-indigo-400 leading-[0.5] select-none text-[5rem] md:text-[7rem]"
            style={{ fontFamily: 'Manrope, system-ui, sans-serif' }}
          >
            &ldquo;
          </span>
          <div className="space-y-5 text-lg md:text-[1.3rem] leading-[1.5] tracking-[-0.01em] text-gray-500 font-light">
            <p>
              Zalma is built and operated by{' '}
              <span className="text-gray-900 font-semibold" style={{ fontFamily: 'Manrope, system-ui, sans-serif' }}>Zap AI</span>, an Australian software company specialising in AI-powered automation for service businesses.
            </p>
            <p>
              Your data stays{' '}
              <span className="text-indigo-500 font-medium">onshore in Australia</span>, complying with the{' '}
              <span className="text-indigo-500 font-medium">Australian Privacy Act</span> and the{' '}
              <span className="text-indigo-500 font-medium">Spam Act 2003</span>. Pricing is in{' '}
              <span className="text-indigo-500 font-medium">Australian dollars</span>.
            </p>
          </div>
        </blockquote>

        <div className="mt-10">
          <a
            href={`${MARKETING_URL}/about`}
            className="group inline-flex items-center gap-1.5 text-[15px] font-medium text-gray-900 underline underline-offset-4 decoration-gray-300 hover:decoration-gray-900 transition-colors"
          >
            About Zap AI
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
          </a>
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
      <CTASection />
      <Footer />
    </div>
  );
}
