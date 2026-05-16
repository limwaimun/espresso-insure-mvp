import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign in — Espresso',
  description: 'Sign in to your Espresso account and manage your back-office — client renewals, claims, and briefs, all in one place.',
  alternates: {
    canonical: '/login',
  },
  openGraph: {
    title: 'Sign in — Espresso',
    description: 'Sign in to your Espresso account. Maya handles client intake, renewals, and claims — 24/7, inside WhatsApp.',
    url: 'https://espresso.insure/login',
    siteName: 'Espresso',
    locale: 'en_SG',
    type: 'website',
    images: [
      {
        url: 'https://espresso.insure/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Espresso — AI Back-Office for Singapore Financial Advisers',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sign in — Espresso',
    description: 'Sign in to your Espresso account. Maya handles client intake, renewals, and claims — 24/7, inside WhatsApp.',
    images: ['https://espresso.insure/og-image.png'],
  },
};
