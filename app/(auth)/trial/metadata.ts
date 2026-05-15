import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Start Your Free Trial — Espresso',
  description: 'Set up your AI back-office in under 30 minutes. Maya handles client intake, renewals, and claims inside WhatsApp — 14 days free, no credit card required.',
  openGraph: {
    type: 'website',
    url: 'https://espresso.insure/trial',
    siteName: 'Espresso',
    title: 'Start Your Free Trial — Espresso',
    description: 'Set up your AI back-office in under 30 minutes. Maya handles client intake, renewals, and claims inside WhatsApp — 14 days free, no credit card required.',
    locale: 'en_SG',
    images: [
      {
        url: 'https://espresso.insure/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Espresso — Start Your Free Trial',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Start Your Free Trial — Espresso',
    description: 'Set up your AI back-office in under 30 minutes. Maya handles client intake, renewals, and claims inside WhatsApp — 14 days free, no credit card required.',
    images: ['https://espresso.insure/og-image.png'],
  },
  alternates: {
    canonical: '/trial',
  },
};
