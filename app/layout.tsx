import type { Metadata, Viewport } from 'next';
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
  description: 'Maya handles intake, renewals, and claims for Singapore FAs — 24/7, inside the WhatsApp groups you already use with clients.',
  applicationName: 'Espresso',
  keywords: ['FA', 'financial adviser', 'insurance', 'Singapore', 'WhatsApp', 'AI assistant', 'back-office', 'renewals', 'claims'],
  alternates: {
    canonical: '/',
    languages: {
      'en-SG': '/',
    },
  },
  openGraph: {
    type: 'website',
    url: 'https://espresso.insure',
    siteName: 'Espresso',
    title: 'Espresso — Your AI Back-Office. Inside WhatsApp.',
    description: 'Maya handles intake, renewals, and claims for Singapore FAs — 24/7, inside the WhatsApp groups you already use with clients.',
    locale: 'en_SG',
    images: [
      {
        url: 'https://espresso.insure/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Espresso — Your AI Back-Office for Singapore FAs',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Espresso — Your AI Back-Office. Inside WhatsApp.',
    description: 'Maya handles intake, renewals, and claims for Singapore FAs — 24/7, inside the WhatsApp groups you already use with clients.',
    images: ['https://espresso.insure/og-image.png'],
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

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Espresso',
  url: 'https://espresso.insure',
  logo: 'https://espresso.insure/favicon.ico',
  description: 'AI back-office platform for Financial Advisers in Singapore.',
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
  description: 'AI assistant Maya handles intake, renewals, and claims for Singapore FAs — 24/7 inside WhatsApp.',
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

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Espresso',
  alternateName: 'Espresso Insure',
  url: 'https://espresso.insure',
  inLanguage: 'en-SG',
  publisher: {
    '@type': 'Organization',
    name: 'Espresso',
    url: 'https://espresso.insure',
  },
};

const webPageJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  '@id': 'https://espresso.insure/#webpage',
  url: 'https://espresso.insure/',
  name: 'Espresso — Your AI Back-Office. Inside WhatsApp.',
  description: 'Maya handles intake, renewals, and claims for Singapore FAs — 24/7, inside the WhatsApp groups you already use with clients.',
  inLanguage: 'en-SG',
  isPartOf: {
    '@type': 'WebSite',
    '@id': 'https://espresso.insure/#website',
    url: 'https://espresso.insure',
    name: 'Espresso',
  },
  speakable: {
    '@type': 'SpeakableSpecification',
    cssSelector: ['h1', 'h2'],
  },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: 'https://espresso.insure/',
    },
  ],
};

const faqPageJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is Espresso?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Espresso is an AI back-office platform for Financial Advisers in Singapore. Our AI assistant Maya handles client intake, policy renewals, and claims support — 24/7, inside the WhatsApp groups FAs already use with their clients.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do I need to download an app?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. Maya works entirely inside WhatsApp. You and your clients use the WhatsApp you already have. The Espresso dashboard is a web app — no installation needed.',
      },
    },
    {
      '@type': 'Question',
      name: 'How long does setup take?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Most FAs are set up in under 30 minutes — sign up, import your client list as a CSV, and create your first WhatsApp client group with Maya.',
      },
    },
    {
      '@type': 'Question',
      name: 'How much does Espresso cost?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Espresso starts at SGD 79 per month for the Solo plan (up to 50 clients). The Pro plan is SGD 149 per month with unlimited clients and full claims support. Every plan starts with a 14-day free trial — no credit card required.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is Espresso available outside Singapore?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Espresso is currently focused on Singapore-licensed Financial Advisers. Other Asian markets are on the roadmap.',
      },
    },
    {
      '@type': 'Question',
      name: 'How is my client data protected?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Client data is stored in Singapore-region infrastructure with row-level access controls so each adviser only sees their own clients. Every action is audit-logged. Espresso is built to be ready for MAS compliance review.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I pause or stop Maya at any time?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Type "Maya pause" in any client WhatsApp group to stop her replying, or "Maya take over" to hand back. You stay in control of every client conversation.',
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPageJsonLd) }}
        />
        <main>{children}</main>
        <VersionBadge />
      </body>
    </html>
  );
}
