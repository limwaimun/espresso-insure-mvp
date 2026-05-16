import type { Metadata } from 'next';
import TrialForm from './TrialForm';

export const metadata: Metadata = {
  title: 'Start your free 14-day trial — Espresso',
  description: 'Join Singapore FAs already using Espresso. Maya handles intake, renewals, and claims inside WhatsApp — 24/7. No credit card required.',
  openGraph: {
    title: 'Start your free 14-day trial — Espresso',
    description: 'Join Singapore FAs already using Espresso. Maya handles intake, renewals, and claims inside WhatsApp — 24/7. No credit card required.',
    url: 'https://espresso.insure/trial',
    siteName: 'Espresso',
    locale: 'en_SG',
    type: 'website',
    images: [
      {
        url: 'https://espresso.insure/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Espresso — AI Back-Office for Singapore FAs',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Start your free 14-day trial — Espresso',
    description: 'Join Singapore FAs already using Espresso. Maya handles intake, renewals, and claims inside WhatsApp — 24/7.',
    images: ['https://espresso.insure/og-image.png'],
  },
  alternates: {
    canonical: '/trial',
  },
};

export default function TrialPage() {
  return <TrialForm />;
}
