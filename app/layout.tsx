import type { Metadata } from 'next';
import { Cormorant_Garamond, DM_Sans, DM_Mono } from 'next/font/google';
import VersionBadge from '@/components/VersionBadge';
import './globals.css';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-display',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-body',
});

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://espresso.insure'),
  title: 'Espresso — Your AI Back-Office. Inside WhatsApp.',
  description: 'Maya handles intake, renewals, and claims for Singapore IFAs — 24/7, inside the WhatsApp groups you already use with clients.',
  applicationName: 'Espresso',
  keywords: ['IFA', 'financial adviser', 'insurance', 'Singapore', 'WhatsApp', 'AI assistant', 'back-office', 'renewals', 'claims'],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    url: 'https://espresso.insure',
    siteName: 'Espresso',
    title: 'Espresso — Your AI Back-Office. Inside WhatsApp.',
    description: 'Maya handles intake, renewals, and claims for Singapore IFAs — 24/7, inside the WhatsApp groups you already use with clients.',
    locale: 'en_SG',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Espresso — Your AI Back-Office. Inside WhatsApp.',
    description: 'Maya handles intake, renewals, and claims for Singapore IFAs — 24/7, inside the WhatsApp groups you already use with clients.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Espresso',
  url: 'https://espresso.insure',
  logo: 'https://espresso.insure/favicon.ico',
  description: 'AI back-office platform for Independent Financial Advisers in Singapore.',
  email: 'hello@espresso.insure',
  areaServed: {
    '@type': 'Country',
    name: 'Singapore',
  },
};

const softwareApplicationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Espresso',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web, WhatsApp',
  description: 'AI assistant Maya handles intake, renewals, and claims for Singapore IFAs — 24/7 inside WhatsApp.',
  url: 'https://espresso.insure',
  offers: [
    {
      '@type': 'Offer',
      name: 'Solo',
      price: '79',
      priceCurrency: 'SGD',
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: '79',
        priceCurrency: 'SGD',
        unitText: 'MONTH',
      },
    },
    {
      '@type': 'Offer',
      name: 'Pro',
      price: '149',
      priceCurrency: 'SGD',
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: '149',
        priceCurrency: 'SGD',
        unitText: 'MONTH',
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${cormorant.variable} ${dmSans.variable} ${dmMono.variable}`}>
      <body style={{
        minHeight: '100vh',
        background: '#1C0F0A',
        color: '#F5ECD7',
        fontFamily: 'DM Sans, sans-serif',
        fontWeight: 300,
        overflowX: 'hidden',
        margin: 0,
        padding: 0,
      }}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationJsonLd) }}
        />
        <main>{children}</main>
        <VersionBadge />
      </body>
    </html>
  );
}
