import React from 'react';
import { Link } from 'react-router-dom';
import {
  Accordion, AccordionItem, AccordionTrigger, AccordionContent
} from '@/shared/components/ui/accordion';
import { HelpCircle } from 'lucide-react';
import PublicNavbar from '@/shared/components/PublicNavbar';
import Footer from '@/shared/components/Footer';

const FAQ_CATEGORIES = [
  {
    title: 'Getting started',
    questions: [
      {
        q: 'What is Zalma?',
        a: 'Zalma is a complete software platform for pet grooming salons. It handles online bookings, pet and client records, staff scheduling, AI client communication, invoicing, and analytics, all in one place.',
      },
      {
        q: 'How long does setup take?',
        a: 'Most salons are up and running in under an hour. Sign up, set your services and pricing, add your staff, and you are ready to take bookings. We can also help import your existing client and pet data.',
      },
      {
        q: 'Is there a free trial?',
        a: 'Yes. Every new account starts with a 14-day free trial. Full functionality, no credit card required to begin. You only add a payment method if you decide to continue past the trial.',
      },
      {
        q: 'Can I import my existing clients and pets?',
        a: 'Yes. We support CSV import for clients, pets, and appointment history. If your current system is not on our import list, send us a sample export and we will help you get the data in.',
      },
    ],
  },
  {
    title: 'Bookings and scheduling',
    questions: [
      {
        q: 'Do you provide an online booking page for my salon?',
        a: 'Yes. Every salon gets a public booking website with your branding, services, gallery, and an online booking flow. Share the link or embed it on your existing site.',
      },
      {
        q: 'Can multiple staff have separate calendars?',
        a: 'Yes. Each staff member has their own working hours, leave schedule, and capabilities. Bookings are routed based on the service requested and staff availability.',
      },
      {
        q: 'How are no-shows and cancellations handled?',
        a: 'You can require a deposit at booking, set cancellation windows, and automatically charge no-show fees. Reminders are sent automatically before the appointment to reduce no-shows.',
      },
      {
        q: 'Can I take walk-ins or block off time?',
        a: 'Yes. You can add walk-in appointments directly from the calendar, drag-drop existing bookings, and block off time for breaks, training, or grooming admin.',
      },
    ],
  },
  {
    title: 'Pricing and billing',
    questions: [
      {
        q: 'How is pricing structured?',
        a: 'Zalma uses a monthly subscription with no setup fees and no long contracts. Pricing tiers are based on the size of your team. Specific pricing is shown when you sign up.',
      },
      {
        q: 'What payment methods do you accept?',
        a: 'We accept all major credit and debit cards (Visa, Mastercard, Amex). Billing is processed securely through Stripe. Pricing is in Australian dollars (AUD).',
      },
      {
        q: 'Can I cancel any time?',
        a: 'Yes. There are no lock-in contracts. Cancel any time from your billing settings. You retain access through the end of your current billing period.',
      },
      {
        q: 'Do you offer discounts for multi-location salons?',
        a: 'Yes. Salons running two or more locations qualify for multi-location pricing. Contact us through the demo form and we will put together a quote.',
      },
    ],
  },
  {
    title: 'Features',
    questions: [
      {
        q: 'What does the AI assistant do?',
        a: 'The AI assistant powers your booking chat widget, answers common client questions (services, pricing, hours, location), captures lead details, and helps clients book directly. It also drafts SMS and email reminders that you can review or auto-send.',
      },
      {
        q: 'Can I store grooming notes and photos?',
        a: 'Yes. Each pet record stores grooming history, breed-specific notes, behaviour flags, and unlimited photos from past appointments. Useful for both training new staff and remembering what worked last time.',
      },
      {
        q: 'Do you send SMS or email reminders?',
        a: 'Yes. Automatic email reminders are included on all plans. SMS reminders are available on paid plans. Reminders are scheduled relative to the appointment time and respect client preferences.',
      },
      {
        q: 'Can I track revenue and performance?',
        a: 'Yes. The analytics dashboard shows revenue by service and groomer, no-show rates, repeat client percentage, peak booking times, and trends over weeks and months.',
      },
    ],
  },
  {
    title: 'Data and security',
    questions: [
      {
        q: 'Where is my data stored?',
        a: 'All customer data is stored in Australia. We do not move data offshore. Daily backups are kept in the same region.',
      },
      {
        q: 'How is my data protected?',
        a: 'All data is encrypted at rest and in transit. We enforce strict tenant isolation, role-based access, and audit logging. Production access uses short-lived credentials and is restricted to authorised staff.',
      },
      {
        q: 'Are you compliant with Australian privacy law?',
        a: 'Yes. We operate under the Australian Privacy Act 1988, the Australian Privacy Principles, and the Spam Act 2003. All marketing communications include compliant unsubscribe handling.',
      },
      {
        q: 'What happens to my data if I leave?',
        a: 'You can export all your data (clients, pets, appointments, notes) at any time. After cancellation, your data is retained for 30 days for safety, then permanently deleted from active systems.',
      },
    ],
  },
  {
    title: 'Support',
    questions: [
      {
        q: 'How do I contact support?',
        a: (
          <>
            Paid customers have access to in-app chat support and email at{' '}
            <a href="mailto:info@zapai.com.au" className="text-indigo-500 hover:underline">info@zapai.com.au</a>.
            Trial users can reach us through the same email.
          </>
        ),
      },
      {
        q: 'What are your support hours?',
        a: 'Support is monitored Monday to Friday during Australian business hours (Sydney time). We aim to respond within one business day. Critical issues affecting active salons are escalated outside hours.',
      },
      {
        q: 'Do you help with onboarding?',
        a: 'Yes. We offer a free 30-minute onboarding session for new salons. We help you set up services, staff, and migrate existing data. Book it from your dashboard once you sign up.',
      },
      {
        q: 'I have a question that is not on this page.',
        a: (
          <>
            Send us an email at <a href="mailto:info@zapai.com.au" className="text-indigo-500 hover:underline">info@zapai.com.au</a>{' '}
            or use the <Link to="/contact" className="text-indigo-500 hover:underline">Contact</Link> page. We are happy to help.
          </>
        ),
      },
    ],
  },
];

function FAQHero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/40 via-white to-white" />
      <div className="relative w-full max-w-[1440px] mx-auto px-4 md:px-8 pt-20 pb-12 md:pt-24 md:pb-16">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-8" style={{ background: 'rgba(120,120,255,0.06)', border: '1px solid rgba(120,120,255,0.12)' }}>
            <HelpCircle className="h-3.5 w-3.5 text-indigo-400" />
            <span className="text-[11px] font-bold tracking-[0.15em] uppercase text-indigo-400">Help Center</span>
          </div>
          <h1 className="text-[3rem] md:text-[4rem] lg:text-[4.75rem] font-black tracking-[-0.03em] leading-[0.95] mb-6 text-gray-900" style={{ fontFamily: 'Manrope, system-ui, sans-serif' }}>
            Frequently Asked<br />
            <span className="text-indigo-400">Questions.</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-500 leading-relaxed max-w-2xl">
            Everything you need to know about Zalma. If your question is not here, drop us an email and we will get back to you.
          </p>
        </div>
      </div>
    </section>
  );
}

function FAQContent() {
  return (
    <section className="py-16 bg-white">
      <div className="w-full max-w-[900px] mx-auto px-4 md:px-8 space-y-14">
        {FAQ_CATEGORIES.map((cat, i) => (
          <div key={i}>
            <h2 className="text-2xl font-bold text-gray-900 mb-6" style={{ fontFamily: 'Manrope' }}>
              {cat.title}
            </h2>
            <Accordion type="single" collapsible className="w-full space-y-2">
              {cat.questions.map((item, j) => (
                <AccordionItem
                  key={j}
                  value={`${i}-${j}`}
                  className="border border-gray-100 rounded-2xl px-5 bg-gray-50/40"
                >
                  <AccordionTrigger className="text-base font-medium text-gray-900 hover:no-underline text-left py-5">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-gray-500 leading-relaxed pb-5">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />
      <FAQHero />
      <FAQContent />
      <Footer />
    </div>
  );
}
