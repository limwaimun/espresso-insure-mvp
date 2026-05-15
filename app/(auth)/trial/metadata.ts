import type { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://espresso.insure'),
  title: 'Start Your Free Trial — Espresso',
  description: 'Try Espresso free for 14 days. No credit card needed. Maya handles intake, renewals, and claims for Singapore FAs — 24/7 inside WhatsApp.',
  alternates: {
    canonical: '/trial',
  },
  openGraph: {
    type: 'website',
    url: 'https://espresso.insure/trial',
    siteName: 'Espresso',
    title: 'Start Your Free Trial — Espresso',
    description: 'Try Espresso free for 14 days. No credit card needed. Maya handles intake, renewals, and claims for Singapore FAs — 24/7 inside WhatsApp.',
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
    description: 'Try Espresso free for 14 days. No credit card needed. Maya handles intake, renewals, and claims for Singapore FAs — 24/7 inside WhatsApp.',
    images: ['https://espresso.insure/og-image.png'],
  },
};
