import type { Metadata } from 'next';
import { Cormorant_Garamond, DM_Sans, DM_Mono } from 'next/font/google';
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
        <main>{children}</main>
      </body>
    </html>
  );
}