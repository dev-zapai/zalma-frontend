import React from 'react';
import { Link } from 'react-router-dom';
import LegalPageLayout from '@/components/LegalPageLayout';

const SECTIONS = [
  {
    id: 'acceptance',
    title: 'Acceptance of terms',
    content: (
      <>
        <p>
          These Terms of Service (the <strong>"Terms"</strong>) govern your access to and use of Zalma, the pet grooming salon management platform, and related websites and services (collectively, the <strong>"Services"</strong>) provided by Zap AI (<strong>"Zap AI"</strong>, <strong>"we"</strong>, <strong>"us"</strong>, or <strong>"our"</strong>).
        </p>
        <p>
          By creating an account, accessing the Services, or otherwise using Zalma, you agree to be bound by these Terms. If you do not agree, do not use the Services.
        </p>
        <p>
          If you accept these Terms on behalf of a business, you represent that you have authority to bind that business, and "you" refers both to you individually and to that business.
        </p>
      </>
    ),
  },
  {
    id: 'the-service',
    title: 'The service',
    content: (
      <>
        <p>
          Zalma is a software-as-a-service platform that helps pet grooming salons manage bookings, client and pet records, staff schedules, communications, and analytics. We may add, modify, or remove features over time as the Services evolve.
        </p>
        <p>
          We provide the Services on a commercially reasonable best-efforts basis. We do not warrant that the Services will be uninterrupted, error-free, or meet every requirement of your business.
        </p>
      </>
    ),
  },
  {
    id: 'eligibility',
    title: 'Eligibility',
    content: (
      <>
        <p>You may use the Services only if you:</p>
        <ul className="list-disc pl-6 space-y-1.5">
          <li>Are at least 18 years old.</li>
          <li>Have the legal capacity to enter into a binding contract.</li>
          <li>Are not prohibited from using the Services under applicable law or by a previous suspension or termination of your account.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'account',
    title: 'Account and registration',
    content: (
      <>
        <p>
          You must create an account to use most of the Services. You agree to provide accurate, current, and complete information during registration and to keep that information up to date.
        </p>
        <p>
          You are responsible for maintaining the confidentiality of your login credentials and for all activity that occurs under your account. Notify us immediately at <a href="mailto:info@zapai.com.au" className="text-indigo-500 hover:underline">info@zapai.com.au</a> if you suspect unauthorised access.
        </p>
        <p>
          The salon owner who creates the account is the primary administrator and is responsible for managing additional users (staff). The salon owner may add or remove staff and assign roles within the platform.
        </p>
      </>
    ),
  },
  {
    id: 'subscription',
    title: 'Subscription and billing',
    content: (
      <>
        <p>
          Access to most features requires a paid subscription. Pricing, billing frequency, and feature tiers are described on the pricing page or in your subscription agreement at the time of sign-up.
        </p>
        <p><strong>Free trial.</strong> New accounts may begin with a free trial. At the end of the trial, you must add a payment method to continue using the Services.</p>
        <p><strong>Renewal.</strong> Subscriptions renew automatically at the end of each billing period until cancelled. You authorise us to charge your payment method for each renewal.</p>
        <p><strong>Taxes.</strong> Prices are exclusive of GST and other applicable taxes. You are responsible for any taxes associated with your subscription.</p>
        <p><strong>Late payments.</strong> If a payment fails, we may suspend the Services until the balance is paid. We will notify you and allow a reasonable period to resolve the issue before suspension.</p>
        <p><strong>Refunds.</strong> Subscription fees are non-refundable except where required by law. If you cancel mid-period, you will retain access until the end of the current billing period.</p>
      </>
    ),
  },
  {
    id: 'cancellation',
    title: 'Cancellation',
    content: (
      <>
        <p>
          You can cancel your subscription at any time from your billing settings. Cancellation takes effect at the end of the current billing period. There are no early-termination fees and we do not lock you into long contracts.
        </p>
        <p>
          After cancellation, your data will be available for export for 30 days. After that period, your data will be deleted from production systems in accordance with our <Link to="/privacy" className="text-indigo-500 hover:underline">Privacy Policy</Link>.
        </p>
      </>
    ),
  },
  {
    id: 'acceptable-use',
    title: 'Acceptable use',
    content: (
      <>
        <p>You agree not to:</p>
        <ul className="list-disc pl-6 space-y-1.5">
          <li>Use the Services for any unlawful purpose or in violation of any applicable law or regulation.</li>
          <li>Send unsolicited marketing communications in violation of the Spam Act 2003.</li>
          <li>Upload, store, or transmit content that is illegal, harmful, defamatory, fraudulent, or infringes the rights of others.</li>
          <li>Attempt to gain unauthorised access to the Services, another customer's data, or any related system.</li>
          <li>Interfere with or disrupt the integrity or performance of the Services, including by introducing viruses or other harmful code.</li>
          <li>Reverse engineer, decompile, or attempt to extract source code from the Services, except as permitted by law.</li>
          <li>Resell, sublicense, or otherwise commercially exploit the Services without our written permission.</li>
          <li>Use the Services to compete with Zap AI or to build a competing product.</li>
        </ul>
        <p>
          We may suspend or terminate your access if we determine, in our reasonable judgment, that you have violated these acceptable use rules.
        </p>
      </>
    ),
  },
  {
    id: 'customer-data',
    title: 'Your data',
    content: (
      <>
        <p>
          You retain all rights to the data you upload to, or process through, the Services (<strong>"Customer Data"</strong>), including client records, pet profiles, photos, and grooming notes.
        </p>
        <p>
          You grant Zap AI a worldwide, non-exclusive, royalty-free licence to host, copy, transmit, display, and process Customer Data solely as needed to provide the Services to you.
        </p>
        <p>
          You are responsible for the accuracy, legality, and appropriateness of Customer Data, including obtaining all necessary consents from the individuals whose data you upload.
        </p>
        <p>
          We do not use Customer Data to train general-purpose AI models. AI features that operate on your data run only at your direction and only on your tenant.
        </p>
      </>
    ),
  },
  {
    id: 'intellectual-property',
    title: 'Intellectual property',
    content: (
      <>
        <p>
          The Services, including the underlying software, design, branding, and documentation, are the property of Zap AI and its licensors. We grant you a limited, non-exclusive, non-transferable, revocable licence to access and use the Services solely as permitted by these Terms.
        </p>
        <p>
          You may not remove proprietary notices, copy substantial portions of the Services, or use our trademarks without our written permission.
        </p>
        <p>
          Feedback you provide about the Services is appreciated and may be used by us without restriction or compensation.
        </p>
      </>
    ),
  },
  {
    id: 'privacy',
    title: 'Privacy',
    content: (
      <>
        <p>
          Our handling of personal information is described in the <Link to="/privacy" className="text-indigo-500 hover:underline">Privacy Policy</Link>, which forms part of these Terms.
        </p>
      </>
    ),
  },
  {
    id: 'third-party',
    title: 'Third-party services',
    content: (
      <>
        <p>
          The Services may integrate with third-party services such as payment processors, SMS gateways, calendar providers, or accounting software. Your use of those third-party services is governed by their own terms and privacy policies. We are not responsible for the availability or performance of third-party services.
        </p>
      </>
    ),
  },
  {
    id: 'suspension',
    title: 'Suspension and termination',
    content: (
      <>
        <p>We may suspend or terminate your access to the Services if:</p>
        <ul className="list-disc pl-6 space-y-1.5">
          <li>You materially breach these Terms.</li>
          <li>Your account is more than 14 days past due.</li>
          <li>We are required to do so by law.</li>
          <li>Your use poses a security or operational risk to Zap AI or other customers.</li>
        </ul>
        <p>
          Where practical, we will notify you and give you a reasonable opportunity to cure the issue before suspension. Upon termination, the licences granted to you cease and you must stop using the Services.
        </p>
      </>
    ),
  },
  {
    id: 'disclaimers',
    title: 'Disclaimers',
    content: (
      <>
        <p>
          To the maximum extent permitted by law, the Services are provided <strong>"as is"</strong> and <strong>"as available"</strong>. We make no warranties, express or implied, about the Services, including warranties of merchantability, fitness for a particular purpose, non-infringement, or uninterrupted operation.
        </p>
        <p>
          Some warranties under Australian Consumer Law cannot be excluded. Nothing in these Terms is intended to exclude, restrict, or modify any consumer guarantees that apply to you.
        </p>
      </>
    ),
  },
  {
    id: 'liability',
    title: 'Limitation of liability',
    content: (
      <>
        <p>
          To the maximum extent permitted by law, Zap AI's total liability arising out of or in connection with the Services or these Terms shall not exceed the fees paid by you to Zap AI in the 12 months preceding the event giving rise to the claim.
        </p>
        <p>
          We are not liable for indirect, incidental, special, consequential, or punitive damages, including lost profits, lost data, or business interruption, even if we have been advised of the possibility.
        </p>
        <p>
          These limitations do not apply to liability that cannot be excluded under Australian Consumer Law, fraud, or wilful misconduct.
        </p>
      </>
    ),
  },
  {
    id: 'indemnity',
    title: 'Indemnity',
    content: (
      <>
        <p>
          You agree to indemnify and hold Zap AI harmless from claims, damages, losses, and reasonable expenses (including reasonable legal fees) arising from:
        </p>
        <ul className="list-disc pl-6 space-y-1.5">
          <li>Your breach of these Terms.</li>
          <li>Your Customer Data, including any claim that it infringes a third party's rights or violates law.</li>
          <li>Your violation of any applicable law in connection with your use of the Services.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'governing-law',
    title: 'Governing law and disputes',
    content: (
      <>
        <p>
          These Terms are governed by the laws of New South Wales, Australia, without regard to conflict of laws rules.
        </p>
        <p>
          The parties submit to the non-exclusive jurisdiction of the courts of New South Wales for any dispute arising out of or in connection with these Terms.
        </p>
        <p>
          Before commencing legal proceedings, the parties agree to attempt to resolve any dispute in good faith through direct discussion.
        </p>
      </>
    ),
  },
  {
    id: 'changes',
    title: 'Changes to these terms',
    content: (
      <>
        <p>
          We may update these Terms from time to time. We will post the updated version on this page and update the "Last updated" date at the top.
        </p>
        <p>
          For material changes, we will give you at least 30 days' notice via the Services or by email to your account email address. Your continued use of the Services after the updated Terms take effect indicates your acceptance.
        </p>
      </>
    ),
  },
  {
    id: 'general',
    title: 'General',
    content: (
      <>
        <p>
          <strong>Entire agreement.</strong> These Terms, together with the Privacy Policy and any subscription agreement, constitute the entire agreement between you and Zap AI relating to the Services.
        </p>
        <p>
          <strong>Severability.</strong> If any provision of these Terms is held unenforceable, the remaining provisions remain in full force and effect.
        </p>
        <p>
          <strong>No waiver.</strong> Our failure to enforce a provision is not a waiver of that provision or any other.
        </p>
        <p>
          <strong>Assignment.</strong> You may not assign these Terms without our written consent. We may assign these Terms in connection with a merger, acquisition, or sale of assets.
        </p>
        <p>
          <strong>Notices.</strong> We may give notices through the Services or by email to your account address. Notices to us should be sent to <a href="mailto:info@zapai.com.au" className="text-indigo-500 hover:underline">info@zapai.com.au</a>.
        </p>
      </>
    ),
  },
  {
    id: 'contact',
    title: 'Contact',
    content: (
      <>
        <p>
          If you have questions about these Terms, contact us at <a href="mailto:info@zapai.com.au" className="text-indigo-500 hover:underline">info@zapai.com.au</a>.
        </p>
      </>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalPageLayout
      title="Terms of Service"
      lastUpdated="May 2, 2026"
      sections={SECTIONS}
    />
  );
}
