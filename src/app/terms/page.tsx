import type { Metadata } from 'next';
import LegalPage, { type LegalSection } from '@/components/marketing/LegalPage';

export const metadata: Metadata = {
  title: 'Terms of Service — DeadlineDesk',
};

const LAST_UPDATED = 'June 27, 2026';

const sections: LegalSection[] = [
  {
    heading: 'Acceptance of these terms',
    paragraphs: [
      'These Terms of Service ("Terms") govern your access to and use of DeadlineDesk (the "Service"), operated by [Company Name] ("we", "us", "our"). By creating an account or using the Service, you agree to these Terms. If you do not agree, do not use the Service.',
    ],
  },
  {
    heading: 'What the Service does',
    paragraphs: [
      'DeadlineDesk helps small landlords track and receive reminders about property-related deadlines such as lease renewals, security-deposit returns, rent-increase notices, inspections, and insurance or license renewals.',
      'DeadlineDesk is a reminder and organization tool only. It is not property-management, accounting, or rent-collection software, and it is not a substitute for professional advice.',
    ],
  },
  {
    heading: 'Not legal advice',
    paragraphs: [
      'The Service may calculate or display dates and timeframes based on rules we encode (for example, statutory notice periods). These are provided for convenience only and may be incomplete, outdated, or inapplicable to your situation. They do not constitute legal advice and create no attorney-client relationship.',
      'You are solely responsible for verifying every deadline and legal requirement that applies to you, including local ordinances, with a qualified attorney or other professional. We are not liable for any missed deadline, penalty, loss, or damage arising from reliance on the Service.',
    ],
  },
  {
    heading: 'Accounts',
    paragraphs: [
      'You must provide accurate information and keep your login credentials secure. You are responsible for all activity under your account. Notify us promptly of any unauthorized use.',
      'You must be at least 18 years old and able to form a binding contract to use the Service.',
    ],
  },
  {
    heading: 'Subscriptions, billing, and cancellation',
    paragraphs: [
      'Adding properties and viewing your dashboard is free. Sending email and SMS reminders requires a paid subscription, billed monthly through our payment processor (Stripe). Prices are shown at checkout and may change with notice.',
      'Subscriptions renew automatically until cancelled. You may cancel at any time from your account settings; access continues through the end of the current billing period. Except where required by law, payments are non-refundable.',
      'SMS reminders may be subject to message-and-data rates charged by your carrier. You are responsible for keeping your contact details accurate.',
    ],
  },
  {
    heading: 'Acceptable use',
    paragraphs: [
      'You agree not to misuse the Service, including by attempting to access other users’ data, disrupting the Service, reverse-engineering it, or using it for unlawful purposes. You retain ownership of the content you enter; you grant us the limited rights needed to operate the Service for you.',
    ],
  },
  {
    heading: 'Disclaimer of warranties',
    paragraphs: [
      'The Service is provided "as is" and "as available" without warranties of any kind, express or implied, including merchantability, fitness for a particular purpose, and non-infringement. We do not warrant that reminders will always be delivered, timely, or error-free, or that the Service will be uninterrupted.',
    ],
  },
  {
    heading: 'Limitation of liability',
    paragraphs: [
      'To the maximum extent permitted by law, we will not be liable for any indirect, incidental, special, consequential, or punitive damages, or for lost profits, lost data, or missed deadlines. Our total liability for any claim relating to the Service will not exceed the amount you paid us in the twelve months before the claim.',
    ],
  },
  {
    heading: 'Indemnification',
    paragraphs: [
      'You agree to indemnify and hold us harmless from claims, losses, and expenses arising out of your use of the Service or your violation of these Terms.',
    ],
  },
  {
    heading: 'Changes to the Service or Terms',
    paragraphs: [
      'We may modify the Service or these Terms. If we make material changes, we will provide notice (for example, by email or in-app). Your continued use after changes take effect constitutes acceptance.',
    ],
  },
  {
    heading: 'Governing law',
    paragraphs: [
      'These Terms are governed by the laws of [State/Country], without regard to conflict-of-laws rules. Disputes will be resolved in the courts located in [Jurisdiction], unless otherwise required by law.',
    ],
  },
  {
    heading: 'Contact',
    paragraphs: ['Questions about these Terms? Contact us at [contact email].'],
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      lastUpdated={LAST_UPDATED}
      intro="Please read these Terms carefully. They explain the rules for using DeadlineDesk and limit our liability."
      sections={sections}
    />
  );
}
