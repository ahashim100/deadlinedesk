import type { Metadata } from 'next';
import LegalPage, { type LegalSection } from '@/components/marketing/LegalPage';

export const metadata: Metadata = {
  title: 'Privacy Policy — DeadlineDesk',
};

const LAST_UPDATED = 'June 27, 2026';

const sections: LegalSection[] = [
  {
    heading: 'Information we collect',
    paragraphs: [
      'Account information: your email address and, if you enable SMS reminders, your phone number.',
      'Property and lease information you enter: property nicknames and addresses, unit labels, tenant names and emails, lease terms, rent and deposit amounts, and the dates used to compute deadlines.',
      'Billing information: handled by our payment processor (Stripe). We store a customer identifier and subscription status, not your full card details.',
      'Usage and log data: basic technical information needed to operate and secure the Service.',
    ],
  },
  {
    heading: 'How we use your information',
    paragraphs: [
      'To provide the Service: storing your data, computing deadlines, and sending the email and SMS reminders you configure.',
      'To process payments and manage your subscription.',
      'To secure, maintain, and improve the Service, and to communicate with you about your account.',
      'We do not sell your personal information.',
    ],
  },
  {
    heading: 'Service providers we share data with',
    paragraphs: [
      'We use trusted third parties to run the Service, and share only what is necessary: Supabase (database, authentication, and scheduled jobs), Stripe (payments), Resend (email delivery), and Twilio (SMS delivery). Each processes data on our behalf under their own terms and privacy policies.',
      'We may disclose information if required by law or to protect our rights, users, or the public.',
    ],
  },
  {
    heading: 'Tenant information',
    paragraphs: [
      'You may enter information about your tenants (such as name and email) to organize your leases. You are responsible for having a lawful basis to provide that information and for complying with applicable privacy laws regarding it.',
    ],
  },
  {
    heading: 'Data retention',
    paragraphs: [
      'We retain your information for as long as your account is active or as needed to provide the Service. You may delete properties and leases at any time, and you may request deletion of your account, after which we will delete or anonymize your data except where retention is required by law.',
    ],
  },
  {
    heading: 'Security',
    paragraphs: [
      'We use technical safeguards including encrypted connections and row-level access controls that isolate each account’s data. No method of transmission or storage is perfectly secure, and we cannot guarantee absolute security.',
    ],
  },
  {
    heading: 'Your rights',
    paragraphs: [
      'Depending on where you live, you may have rights to access, correct, export, or delete your personal information, and to object to or restrict certain processing. To exercise these rights, contact us at [contact email].',
    ],
  },
  {
    heading: 'Cookies',
    paragraphs: [
      'We use strictly necessary cookies to keep you signed in and operate the Service. We do not use advertising cookies.',
    ],
  },
  {
    heading: 'Children',
    paragraphs: [
      'The Service is not intended for anyone under 18, and we do not knowingly collect information from children.',
    ],
  },
  {
    heading: 'Changes to this policy',
    paragraphs: [
      'We may update this Privacy Policy from time to time. We will post the new version here and update the "Last updated" date, and provide additional notice for material changes.',
    ],
  },
  {
    heading: 'Contact',
    paragraphs: [
      'Questions about your privacy or this policy? Contact us at [contact email].',
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      lastUpdated={LAST_UPDATED}
      intro="This policy explains what information DeadlineDesk collects, how we use it, and the choices you have."
      sections={sections}
    />
  );
}
