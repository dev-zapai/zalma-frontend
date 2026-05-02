import React from 'react';
import LegalPageLayout from '@/components/LegalPageLayout';

const SECTIONS = [
  {
    id: 'overview',
    title: 'Overview',
    content: (
      <>
        <p>
          This Privacy Policy explains how Zap AI (<strong>"Zap AI"</strong>, <strong>"we"</strong>, <strong>"us"</strong>, or <strong>"our"</strong>) collects, uses, shares, and protects personal information when you use Zalma, our pet grooming salon management platform, and the related websites and services (collectively, the <strong>"Services"</strong>).
        </p>
        <p>
          Zalma is a multi-tenant business-to-business product. We process information on behalf of grooming salons (our <strong>"Customers"</strong>) and we also process information about the people who use the Services directly, including salon owners, staff, and visitors to public salon booking pages.
        </p>
        <p>
          We are committed to handling your personal information in accordance with the Australian Privacy Principles set out in the <em>Privacy Act 1988</em> (Cth) and applicable data protection laws.
        </p>
      </>
    ),
  },
  {
    id: 'who-this-applies-to',
    title: 'Who this applies to',
    content: (
      <>
        <p>This Privacy Policy applies to:</p>
        <ul className="list-disc pl-6 space-y-1.5">
          <li><strong>Salon owners and staff</strong> who register an account on Zalma and use the dashboard.</li>
          <li><strong>Clients of salons</strong> (pet owners) who book appointments through a salon's Zalma-powered booking page or interact with our AI assistant.</li>
          <li><strong>Visitors</strong> to www.zalma.com.au and salon-specific public websites we host.</li>
          <li><strong>Job applicants</strong> who apply for a role at Zap AI.</li>
        </ul>
        <p>
          When a salon uses Zalma to manage information about its own clients, the salon is the <strong>data controller</strong> of that information and we act as the <strong>data processor</strong>. The salon's own privacy notice governs how it handles client information. This Privacy Policy describes our practices.
        </p>
      </>
    ),
  },
  {
    id: 'information-we-collect',
    title: 'Information we collect',
    content: (
      <>
        <p><strong>Information you provide to us</strong></p>
        <ul className="list-disc pl-6 space-y-1.5">
          <li><strong>Account information</strong>: name, email address, phone number, password, salon business name, business address, and ABN where applicable.</li>
          <li><strong>Staff information</strong>: name, email, role, working hours, and capabilities, added by the salon owner.</li>
          <li><strong>Client and pet information</strong>: when a salon imports or enters records, we may process client name, contact details, pet name, breed, age, photos, grooming notes, and appointment history. This information belongs to the salon.</li>
          <li><strong>Booking information</strong>: services, appointment times, deposits, and notes attached to a booking.</li>
          <li><strong>Payment information</strong>: billing details for your subscription. Card data is handled directly by our payment processor (Stripe) and is never stored on our servers. We retain only metadata such as last four digits, brand, and expiry.</li>
          <li><strong>Support communications</strong>: messages you send us via email, in-app chat, or web forms.</li>
          <li><strong>Job application data</strong>: CV, cover letter, and contact details submitted through our hiring channels.</li>
        </ul>

        <p className="pt-2"><strong>Information we collect automatically</strong></p>
        <ul className="list-disc pl-6 space-y-1.5">
          <li><strong>Usage data</strong>: pages visited, features used, clicks, and session duration.</li>
          <li><strong>Device and log data</strong>: IP address, browser type, operating system, referring URL, timestamps, and crash logs.</li>
          <li><strong>Cookies and similar technologies</strong>: see "Cookies" below.</li>
        </ul>

        <p className="pt-2"><strong>Information from third parties</strong></p>
        <ul className="list-disc pl-6 space-y-1.5">
          <li>If you sign in with a third-party identity provider, we receive basic profile information from that provider.</li>
          <li>Our payment processor returns confirmation and metadata after a transaction.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'how-we-use',
    title: 'How we use information',
    content: (
      <>
        <p>We use personal information to:</p>
        <ul className="list-disc pl-6 space-y-1.5">
          <li>Provide, operate, and maintain the Services and your account.</li>
          <li>Process bookings, send appointment reminders, and deliver the AI assistant features that salons enable.</li>
          <li>Process subscription payments and prevent fraud.</li>
          <li>Provide customer support and respond to enquiries.</li>
          <li>Improve and develop the Services, including measuring feature usage and debugging issues.</li>
          <li>Send you transactional communications (account notifications, security alerts, billing reminders).</li>
          <li>Send marketing communications where you have consented or where we are otherwise permitted under the Spam Act 2003.</li>
          <li>Detect and prevent abuse, security incidents, and violations of our Terms of Service.</li>
          <li>Comply with legal obligations and respond to lawful requests.</li>
        </ul>
        <p className="pt-2">
          We do not sell personal information. We do not use customer-uploaded data (clients, pets, grooming notes, photos) to train general-purpose AI models.
        </p>
      </>
    ),
  },
  {
    id: 'how-we-share',
    title: 'How we share information',
    content: (
      <>
        <p>We share personal information only as described below:</p>
        <ul className="list-disc pl-6 space-y-1.5">
          <li><strong>Within your salon</strong>: information you enter into Zalma is visible to other authorised staff at your salon, scoped to their role and permissions.</li>
          <li><strong>Service providers</strong>: we use trusted third parties to operate the Services. Each provider is bound by confidentiality and data processing terms. Current providers include:
            <ul className="list-disc pl-6 mt-1.5 space-y-1">
              <li>Cloud infrastructure provider (Australian region) for hosting and storage</li>
              <li>Stripe for payment processing</li>
              <li>SendGrid or Amazon SES for transactional email delivery</li>
              <li>Twilio or comparable provider for SMS reminders</li>
              <li>Google Workspace for our internal communication and email</li>
              <li>Posthog or comparable provider for product analytics</li>
            </ul>
          </li>
          <li><strong>Legal and safety</strong>: we may disclose information when required by law, in response to valid legal process, to protect the rights, property, or safety of Zap AI, our customers, or the public.</li>
          <li><strong>Business transfers</strong>: if we are involved in a merger, acquisition, or asset sale, personal information may be transferred subject to standard confidentiality protections.</li>
          <li><strong>With your consent</strong>: in any other case where you have given us specific consent.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'cookies',
    title: 'Cookies and tracking',
    content: (
      <>
        <p>
          We use cookies and similar technologies to operate the Services, remember your preferences, keep you signed in, measure usage, and protect against fraud.
        </p>
        <ul className="list-disc pl-6 space-y-1.5">
          <li><strong>Strictly necessary cookies</strong> are required to log you in and keep your session secure. These cannot be disabled without breaking the Services.</li>
          <li><strong>Analytics cookies</strong> help us understand which features are used and where errors occur. These are anonymised where possible.</li>
          <li><strong>Preference cookies</strong> remember non-essential settings such as your last-used filter or language.</li>
        </ul>
        <p>
          You can manage cookies through your browser settings. Disabling cookies may affect the functionality of the Services.
        </p>
      </>
    ),
  },
  {
    id: 'cross-border',
    title: 'Cross-border processing',
    content: (
      <>
        <p>
          Customer data, including all client and pet records uploaded by salons, is hosted in Australia and stays onshore.
        </p>
        <p>
          A small number of operational tools (for example, support ticketing or product analytics) may be operated by providers headquartered outside Australia. Where this is the case, we ensure those providers offer privacy protections substantially similar to the Australian Privacy Principles, typically through contractual data processing terms and standard contractual clauses.
        </p>
      </>
    ),
  },
  {
    id: 'retention',
    title: 'Data retention',
    content: (
      <>
        <p>
          We retain personal information only as long as necessary to provide the Services, comply with our legal obligations, resolve disputes, and enforce our agreements.
        </p>
        <ul className="list-disc pl-6 space-y-1.5">
          <li><strong>Active customer data</strong> is retained for as long as your account remains active.</li>
          <li><strong>After cancellation</strong>, customer data is retained for 30 days in case you reactivate, then permanently deleted from production systems. Encrypted backups are purged on rolling cycles within 90 days.</li>
          <li><strong>Billing records</strong> are retained for at least 7 years to comply with Australian tax law.</li>
          <li><strong>Audit logs</strong> are retained for 12 months.</li>
          <li><strong>Marketing preferences</strong>, including opt-outs, are retained indefinitely so that we honour your choice.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'security',
    title: 'Security',
    content: (
      <>
        <p>
          We implement appropriate technical and organisational measures to protect personal information, including:
        </p>
        <ul className="list-disc pl-6 space-y-1.5">
          <li>Encryption of data in transit (TLS 1.2 or higher) and at rest.</li>
          <li>Strict tenant isolation so that one salon's data cannot be accessed by another.</li>
          <li>Role-based access controls for both customers and Zap AI staff.</li>
          <li>Audit logging on sensitive actions including authentication, billing, and data exports.</li>
          <li>Short-lived credentials and least-privilege access for production systems.</li>
          <li>Regular vulnerability scanning and dependency monitoring.</li>
        </ul>
        <p>
          No system is completely secure. If we detect a data breach that affects you, we will notify you in accordance with our obligations under the Notifiable Data Breaches scheme.
        </p>
      </>
    ),
  },
  {
    id: 'your-rights',
    title: 'Your rights and choices',
    content: (
      <>
        <p>Subject to applicable law, you have the right to:</p>
        <ul className="list-disc pl-6 space-y-1.5">
          <li><strong>Access</strong> the personal information we hold about you.</li>
          <li><strong>Correct</strong> inaccurate or incomplete information.</li>
          <li><strong>Delete</strong> your personal information, subject to retention obligations described above.</li>
          <li><strong>Export</strong> a copy of your data in a machine-readable format.</li>
          <li><strong>Withdraw consent</strong> for marketing communications at any time using the unsubscribe link in our emails.</li>
          <li><strong>Make a complaint</strong> if you believe we have mishandled your information.</li>
        </ul>
        <p>
          For salons, you can exercise most of these rights directly from your dashboard. For others, contact us using the details below.
        </p>
        <p>
          If you are not satisfied with our response, you can contact the Office of the Australian Information Commissioner (OAIC) at oaic.gov.au.
        </p>
      </>
    ),
  },
  {
    id: 'children',
    title: 'Children',
    content: (
      <>
        <p>
          The Services are not directed to children under 16. We do not knowingly collect personal information from children. If you believe we have inadvertently collected information from a child, contact us and we will delete it.
        </p>
      </>
    ),
  },
  {
    id: 'third-party',
    title: 'Third-party links',
    content: (
      <>
        <p>
          The Services may contain links to third-party websites or integrations. Their privacy practices are governed by their own policies, not this one. We encourage you to review the privacy notice of any third-party service before sharing personal information with it.
        </p>
      </>
    ),
  },
  {
    id: 'changes',
    title: 'Changes to this policy',
    content: (
      <>
        <p>
          We may update this Privacy Policy from time to time to reflect changes in our practices, the Services, or applicable law. We will post the updated version on this page and update the "Last updated" date at the top.
        </p>
        <p>
          For material changes, we will provide additional notice, such as an in-app message or an email to your account email address. Your continued use of the Services after the updated policy takes effect indicates your acceptance of the changes.
        </p>
      </>
    ),
  },
  {
    id: 'contact',
    title: 'Contact us',
    content: (
      <>
        <p>
          If you have any questions about this Privacy Policy, want to exercise any of your rights, or wish to make a complaint, please contact us:
        </p>
        <ul className="list-disc pl-6 space-y-1.5">
          <li>Email: <a href="mailto:info@zapai.com.au" className="text-indigo-500 hover:underline">info@zapai.com.au</a></li>
          <li>Mail: Zap AI, Privacy Team, Australia</li>
        </ul>
        <p>
          We aim to respond to privacy enquiries within 30 days.
        </p>
      </>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      lastUpdated="May 2, 2026"
      sections={SECTIONS}
    />
  );
}
