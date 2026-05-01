import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Footer from '@/components/Footer';

const LOGO_SRC = `${process.env.PUBLIC_URL || ''}/zalma_logo.png`;
const LAST_UPDATED = 'April 2026';

const TOC = [
  { id: 'acceptance',    label: '1.  Acceptance of Terms' },
  { id: 'service',       label: '2.  The Service' },
  { id: 'account',       label: '3.  Your Account' },
  { id: 'plans',         label: '4.  Plans & Pricing' },
  { id: 'billing',       label: '5.  Billing & Payments' },
  { id: 'acceptable',    label: '6.  Acceptable Use' },
  { id: 'client-data',   label: '7.  Your Client Data' },
  { id: 'privacy',       label: '8.  Privacy' },
  { id: 'retention',     label: '9.  Data Retention' },
  { id: 'availability',  label: '10. Service Availability' },
  { id: 'ip',            label: '11. Intellectual Property' },
  { id: 'ai',            label: '12. AI Features' },
  { id: 'disclaimers',   label: '13. Disclaimers' },
  { id: 'liability',     label: '14. Limitation of Liability' },
  { id: 'indemnity',     label: '15. Indemnity' },
  { id: 'termination',   label: '16. Termination' },
  { id: 'changes',       label: '17. Changes to These Terms' },
  { id: 'law',           label: '18. Governing Law' },
  { id: 'contact',       label: '19. Contact' },
];

function Section({ id, title, children }) {
  return (
    <section id={id} className="scroll-mt-24 mb-10">
      <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 tracking-tight">
        {title}
      </h2>
      <div className="text-[15px] leading-relaxed text-gray-600 space-y-4">
        {children}
      </div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>
      {/* Simple nav */}
      <nav className="border-b" style={{ borderColor: 'rgba(0,0,0,0.04)' }}>
        <div className="w-full max-w-[1440px] mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <img src={LOGO_SRC} alt="Zalma" style={{ height: '28px', width: 'auto' }} />
          </Link>
          <Button variant="outline" asChild className="rounded-full px-5 h-9 text-[13px] font-medium border-gray-200 text-gray-600">
            <Link to="/"><ArrowLeft className="mr-2 h-3.5 w-3.5" /> Back to Home</Link>
          </Button>
        </div>
      </nav>

      {/* Header */}
      <header className="w-full max-w-[1100px] mx-auto px-4 md:px-8 pt-16 pb-10">
        <span className="inline-block text-[12px] font-bold tracking-[0.15em] uppercase text-indigo-400 mb-3">Legal</span>
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-gray-900 mb-4 leading-tight" style={{ fontFamily: 'Manrope, system-ui, sans-serif' }}>
          Terms &amp; Conditions
        </h1>
        <p className="text-base md:text-lg text-gray-500 leading-relaxed max-w-2xl">
          These terms cover how you use Zalma, how we bill you, how we handle
          your data, and what we each promise the other. Please read them
          carefully. If anything is unclear, email{' '}
          <a className="text-indigo-500 hover:underline" href="mailto:info@zapai.com.au">info@zapai.com.au</a>.
        </p>
        <p className="text-xs text-gray-400 mt-4">Last updated: {LAST_UPDATED}</p>
      </header>

      {/* Body: TOC + Content */}
      <div className="w-full max-w-[1100px] mx-auto px-4 md:px-8 pb-20 grid lg:grid-cols-[220px_1fr] gap-10">
        {/* Table of contents */}
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <p className="text-[11px] font-bold tracking-[0.15em] uppercase text-gray-400 mb-3">On this page</p>
            <ul className="space-y-2 text-[13px]">
              {TOC.map(item => (
                <li key={item.id}>
                  <a href={`#${item.id}`} className="text-gray-500 hover:text-indigo-500 transition-colors">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Main content */}
        <div>
          <Section id="acceptance" title="1. Acceptance of Terms">
            <p>
              By creating a Zalma account or using the Zalma service (the
              &ldquo;Service&rdquo;), you agree to be bound by these Terms &amp;
              Conditions (the &ldquo;Terms&rdquo;). If you don&rsquo;t agree, you
              must not use the Service. If you&rsquo;re signing up on behalf of
              a business, you confirm that you have authority to bind that
              business to these Terms.
            </p>
          </Section>

          <Section id="service" title="2. The Service">
            <p>
              Zalma is a cloud-based grooming salon management platform. It
              helps salons run their day-to-day operations, including:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Appointment booking and calendar management</li>
              <li>Client and pet records</li>
              <li>Staff scheduling and payroll inputs</li>
              <li>Automated SMS and email reminders, confirmations and follow-ups</li>
              <li>AI-assisted reception (inbound calls, smart replies)</li>
              <li>Marketing campaigns and a public booking website</li>
              <li>Analytics, invoicing and payments</li>
            </ul>
            <p>
              Features may be added, changed or removed over time. We&rsquo;ll
              give reasonable notice before removing a feature you actively use.
            </p>
          </Section>

          <Section id="account" title="3. Your Account">
            <p>
              One Zalma account is intended for one salon (a &ldquo;tenant&rdquo;).
              You&rsquo;re responsible for keeping your login credentials safe
              and for every action taken by staff invited to your tenant, even
              if those actions weren&rsquo;t taken by you personally.
            </p>
            <p>
              Please keep your contact email and phone number up to date &mdash;
              we use them for billing notices, security alerts, and support.
            </p>
          </Section>

          <Section id="plans" title="4. Plans &amp; Pricing">
            <p>
              Zalma is offered on three plan tiers &mdash; Growth, Premium and
              Ultimate. Each plan has a per-booking rate and a monthly minimum
              commitment. Full current pricing is always visible inside your
              dashboard under Billing &rarr; Plan.
            </p>
            <p>
              We may change plan pricing, included allowances, or feature sets
              from time to time. Material changes will be announced at least
              30 days in advance by email and in-app banner, so you have time
              to switch plans or cancel before a change takes effect.
            </p>
          </Section>

          <Section id="billing" title="5. Billing &amp; Payments">
            <p className="font-medium text-gray-800">
              How your monthly bill is calculated
            </p>
            <p>
              Your bill is made up of two parts: a <strong>plan charge</strong>{' '}
              based on bookings, plus <strong>usage charges</strong> for SMS,
              email and AI voice minutes that go over your plan&rsquo;s
              included allowance.
            </p>

            <p className="font-medium text-gray-800 pt-2">Plan charge</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Every completed booking is charged at your plan&rsquo;s
                per-booking rate. Cancellations and no-shows are not charged.
              </li>
              <li>
                Each plan also has a monthly minimum commitment. At the end of
                each month we compare your booking charges against the
                minimum, and bill <em>whichever is higher</em>. If bookings are
                quiet one month and come in below the minimum, you pay the
                minimum. If bookings exceed the minimum, you just pay for the
                bookings you had.
              </li>
            </ul>

            <p className="font-medium text-gray-800 pt-2">Messaging &amp; AI usage</p>
            <p>
              On top of the plan charge, we add metered usage for anything you
              send through Zalma above your plan&rsquo;s included allowance:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>SMS</strong> &mdash; charged per message (inbound and
                outbound), as metered by our telecom provider.
              </li>
              <li>
                <strong>Email</strong> &mdash; charged per send once you
                exceed your plan&rsquo;s monthly included allowance.
              </li>
              <li>
                <strong>AI voice minutes</strong> &mdash; charged per minute
                of AI receptionist call time once you exceed your plan&rsquo;s
                included pool.
              </li>
            </ul>
            <p>
              Per-unit rates for SMS, email and voice minutes are shown inside
              your Billing page. We&rsquo;ll give 30 days&rsquo; notice before
              we change a unit rate.
            </p>

            <p className="font-medium text-gray-800 pt-2">Spending cap (optional)</p>
            <p>
              You can set an optional monthly spending cap in Billing Settings.
              When the cap is hit, Zalma automatically pauses non-essential
              automated sends (such as marketing campaigns) for the rest of
              that month to protect you from an unexpected bill. You can turn
              the cap off or raise it at any time.
            </p>

            <p className="font-medium text-gray-800 pt-2">Payment method &amp; timing</p>
            <p>
              A valid credit or debit card is required to use paid features.
              Payments are processed by Stripe. We charge automatically on the
              1st of each calendar month for the previous month&rsquo;s usage.
              Invoices are available under Billing &rarr; Invoices.
            </p>

            <p className="font-medium text-gray-800 pt-2">Failed payments</p>
            <p>
              If a payment fails, we&rsquo;ll retry on Stripe&rsquo;s standard
              dunning schedule and notify you by email. After repeated
              failures, we may suspend your account. Your data remains
              recoverable during the retention window described in{' '}
              <a href="#retention" className="text-indigo-500 hover:underline">Section 9</a>.
            </p>

            <p className="font-medium text-gray-800 pt-2">Plan changes</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Upgrades</strong> take effect immediately. You&rsquo;ll
                be charged the new plan&rsquo;s rate for bookings from the
                moment you upgrade; previous bookings this month stay on the
                old rate.
              </li>
              <li>
                <strong>Downgrades</strong> take effect on the 1st of the
                following billing cycle. This keeps billing predictable and
                prevents mid-month gaming of the rate structure.
              </li>
            </ul>

            <p className="font-medium text-gray-800 pt-2">Taxes</p>
            <p>
              All listed prices are exclusive of GST where applicable.
              Australian tenants will see GST added to each invoice.
            </p>

            <p className="font-medium text-gray-800 pt-2">Refunds</p>
            <p>
              Subscription fees are non-refundable, except where a refund is
              required by the Australian Consumer Law (ACL) or other
              applicable law.
            </p>
          </Section>

          <Section id="acceptable" title="6. Acceptable Use">
            <p>
              You agree to use Zalma only for lawful purposes and in compliance
              with all applicable laws, including the{' '}
              <em>Spam Act 2003 (Cth)</em> for messages sent to your clients.
              That means, at a minimum:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                You must have consent from each client before sending them
                marketing SMS or email through Zalma.
              </li>
              <li>
                Every marketing message you send must identify your salon and
                include a clear way to unsubscribe.
              </li>
              <li>
                You must not send messages that are misleading, harassing,
                threatening, defamatory, discriminatory, sexually explicit, or
                otherwise unlawful.
              </li>
            </ul>
            <p>
              You&rsquo;re also responsible for the accuracy of any salon
              information you publish through your Zalma-hosted booking website.
              We may suspend or terminate accounts that breach this section.
            </p>
          </Section>

          <Section id="client-data" title="7. Your Client Data">
            <p>
              &ldquo;Your Client Data&rdquo; means the information you put into
              Zalma about your clients, pets, appointments, notes, payments
              and communications. That data belongs to you. We process it on
              your behalf to provide the Service, under the Privacy Act 1988
              (Cth) and the Australian Privacy Principles (APPs).
            </p>
            <p>
              To run the Service we rely on a small number of sub-processors:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Supabase</strong> &mdash; database and authentication hosting</li>
              <li><strong>Stripe</strong> &mdash; card payments</li>
              <li><strong>AWS SES</strong> &mdash; transactional and marketing email</li>
              <li><strong>AWS SNS</strong> &mdash; SMS delivery</li>
            </ul>
            <p>
              Where possible, your operational data is stored in the
              <code className="mx-1 px-1.5 py-0.5 rounded bg-gray-100 text-[13px] text-gray-700">ap-southeast-1</code>
              (Sydney) region. Sub-processors may process some data in other
              regions in line with their own policies and our contracts with
              them.
            </p>
          </Section>

          <Section id="privacy" title="8. Privacy">
            <p>
              This section summarises how we handle personal information. A
              fuller privacy policy will be published separately in the
              future.
            </p>
            <p>
              <strong>What we collect.</strong> Your account details (name,
              email, phone), the client data you enter, billing and payment
              records, and product usage analytics (e.g. which pages you
              visited, feature usage counts, error logs).
            </p>
            <p>
              <strong>Why we collect it.</strong> To provide the Service, to
              bill you, to support you when you contact us, to prevent fraud
              and abuse, and to improve the product.
            </p>
            <p>
              <strong>Who we share it with.</strong> The sub-processors listed
              in <a href="#client-data" className="text-indigo-500 hover:underline">Section 7</a>,
              and any authority we&rsquo;re legally required to share it with.
              We do not sell your data or your clients&rsquo; data.
            </p>
            <p>
              <strong>Your rights.</strong> You can request access to, or
              correction or deletion of, personal information we hold about
              you by emailing{' '}
              <a className="text-indigo-500 hover:underline" href="mailto:info@zapai.com.au">info@zapai.com.au</a>.
              For client-level data, your salon is the data controller and
              should field those requests directly; we&rsquo;ll assist you as
              needed.
            </p>
          </Section>

          <Section id="retention" title="9. Data Retention">
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Active tenants.</strong> We retain your data for as
                long as your account is active.
              </li>
              <li>
                <strong>Cancelled tenants.</strong> After cancellation, your
                data remains available for export for <strong>90 days</strong>.
                After that, operational and personal data is permanently
                deleted from our production systems.
              </li>
              <li>
                <strong>Financial records.</strong> Invoices, payment history
                and related records are retained for <strong>7 years</strong>{' '}
                to meet Australian Taxation Office (ATO) record-keeping
                requirements, even after an account is deleted.
              </li>
              <li>
                <strong>Backups.</strong> We keep rolling encrypted backups for
                up to 35 days. Deletion requests are honoured in production
                immediately, and propagate to backups on the next rotation
                cycle.
              </li>
            </ul>
          </Section>

          <Section id="availability" title="10. Service Availability">
            <p>
              We aim to keep Zalma available on a best-effort basis but do not
              offer a formal uptime SLA during the current beta. Scheduled
              maintenance will be announced in advance where practical.
            </p>
            <p>
              We are not liable for downtime caused by upstream providers
              (e.g. Stripe, AWS, Supabase, telecom carriers) or events
              outside our reasonable control.
            </p>
          </Section>

          <Section id="ip" title="11. Intellectual Property">
            <p>
              The Zalma platform, including its source code, UI, branding and
              documentation, is owned by Zap AI. You get a limited,
              non-exclusive, non-transferable right to use the Service under
              these Terms.
            </p>
            <p>
              You keep all rights to Your Client Data. By using Zalma you
              grant us a limited licence to process Your Client Data only as
              necessary to provide the Service. Anonymised, aggregated usage
              metrics (that can&rsquo;t be traced back to you or your clients)
              may be used to improve the product.
            </p>
          </Section>

          <Section id="ai" title="12. AI Features">
            <p>
              Zalma includes AI-powered features &mdash; voice receptionist,
              suggested message drafts, summarisation of client notes, and
              similar. These features use large language models and can
              produce mistakes, including confidently-stated but incorrect
              information.
            </p>
            <p>
              You should review AI-generated content before acting on it,
              especially anything related to medication, clinical advice, or
              other safety-critical decisions. AI interactions may be logged
              and reviewed for quality, abuse prevention and product
              improvement.
            </p>
          </Section>

          <Section id="disclaimers" title="13. Disclaimers">
            <p>
              Except for guarantees that cannot be excluded under the
              Australian Consumer Law, the Service is provided &ldquo;as is&rdquo;
              and &ldquo;as available&rdquo;, without warranties of any kind,
              whether express or implied. We do not warrant that the Service
              will be uninterrupted, error-free, or fit for any particular
              purpose beyond those baseline ACL guarantees.
            </p>
          </Section>

          <Section id="liability" title="14. Limitation of Liability">
            <p>
              To the fullest extent permitted by law, and subject to the
              non-excludable guarantees under the Australian Consumer Law, our
              total aggregate liability to you arising out of or relating to
              the Service is capped at the total fees you paid us for the
              affected tenant in the 12 months immediately preceding the
              event giving rise to the claim.
            </p>
            <p>
              We are not liable for indirect, incidental, consequential,
              special or exemplary damages, including lost profits, lost
              revenue, lost goodwill, or lost data, even if we&rsquo;ve been
              advised of the possibility of those damages.
            </p>
          </Section>

          <Section id="indemnity" title="15. Indemnity">
            <p>
              You agree to indemnify Zap AI from any claim, loss or expense
              (including reasonable legal fees) arising from content you send
              through the Service &mdash; for example, messages you send to
              your clients, or copy you publish on your Zalma-hosted salon
              website &mdash; to the extent that content breaches the law or
              infringes a third party&rsquo;s rights.
            </p>
          </Section>

          <Section id="termination" title="16. Termination">
            <p>
              You can cancel your Zalma account at any time from the Billing
              page. Cancellation takes effect at the end of the current
              billing month.
            </p>
            <p>
              We may suspend or terminate your account if you materially
              breach these Terms (for example, by breaching Section 6 on
              Acceptable Use, or by failing to pay). Where practical,
              we&rsquo;ll give you notice and a chance to fix the issue before
              terminating. On termination, the data-retention rules in{' '}
              <a href="#retention" className="text-indigo-500 hover:underline">Section 9</a> apply.
            </p>
          </Section>

          <Section id="changes" title="17. Changes to These Terms">
            <p>
              We may update these Terms over time. Material changes will be
              announced at least 30 days in advance by email and through an
              in-app banner. Minor changes (typos, clarifications that
              don&rsquo;t change your rights or obligations) may be made
              without notice.
            </p>
            <p>
              Continued use of the Service after a change takes effect means
              you accept the updated Terms. If you don&rsquo;t accept them,
              you can cancel your account before the effective date.
            </p>
          </Section>

          <Section id="law" title="18. Governing Law">
            <p className="italic text-gray-500">
              [Placeholder &mdash; to be finalised with legal counsel. The
              default intent is: these Terms are governed by the laws of New
              South Wales, Australia. The courts of New South Wales have
              exclusive jurisdiction over any dispute arising out of or
              relating to these Terms or the Service.]
            </p>
          </Section>

          <Section id="contact" title="19. Contact">
            <p>
              If you have any questions about these Terms, billing, privacy,
              or anything else, please contact us:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Email: <a className="text-indigo-500 hover:underline" href="mailto:info@zapai.com.au">info@zapai.com.au</a></li>
              <li>Postal: to be published</li>
            </ul>
            <p className="text-xs text-gray-400 pt-6">
              Last updated: {LAST_UPDATED}
            </p>
          </Section>
        </div>
      </div>

      <Footer />
    </div>
  );
}
