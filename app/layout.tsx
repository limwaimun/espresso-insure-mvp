import type { Metadata } from 'next';
import { Cormorant_Garamond, DM_Sans, DM_Mono } from 'next/font/google';
import './globals.css';
import Navigation from '@/components/Navigation';

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
  title: 'Espresso — Your AI Back-Office. Inside WhatsApp.',
  description: 'Give every solo agent the back-office of a top-tier brokerage. AI-powered insurance platform for IFAs across Southeast Asia.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${cormorant.variable} ${dmSans.variable} ${dmMono.variable}`}>
      <body className="min-h-screen bg-color-dark text-color-cream font-body font-weight-300">
        <Navigation />
        <main>{children}</main>
      </body>
    </html>
  );
}