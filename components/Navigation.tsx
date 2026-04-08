import React from 'react';
import Link from 'next/link';

const Navigation = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-100 px-12 py-5 flex items-center justify-between bg-gradient-to-b from-color-espresso/95 to-transparent">
      <Link href="/" className="nav-logo font-display text-22 font-500 tracking-wider uppercase text-color-cream no-underline">
        Espresso<span className="text-color-amber">.</span>
      </Link>
      
      <ul className="nav-links flex items-center gap-9 list-none">
        <li>
          <Link href="#problem" className="text-color-cream-dim text-14 tracking-wide no-underline transition-colors duration-200 hover:text-color-cream">
            Problem
          </Link>
        </li>
        <li>
          <Link href="#how-it-works" className="text-color-cream-dim text-14 tracking-wide no-underline transition-colors duration-200 hover:text-color-cream">
            How it works
          </Link>
        </li>
        <li>
          <Link href="#features" className="text-color-cream-dim text-14 tracking-wide no-underline transition-colors duration-200 hover:text-color-cream">
            Features
          </Link>
        </li>
        <li>
          <Link href="#pricing" className="text-color-cream-dim text-14 tracking-wide no-underline transition-colors duration-200 hover:text-color-cream">
            Pricing
          </Link>
        </li>
        <li>
          <Link href="#setup" className="text-color-cream-dim text-14 tracking-wide no-underline transition-colors duration-200 hover:text-color-cream">
            Setup
          </Link>
        </li>
        <li>
          <Link href="#faq" className="text-color-cream-dim text-14 tracking-wide no-underline transition-colors duration-200 hover:text-color-cream">
            FAQ
          </Link>
        </li>
      </ul>
      
      <Link 
        href="/dashboard" 
        className="nav-cta bg-color-amber text-color-dark font-500 text-14 px-6 py-2.5 rounded-full no-underline transition-all duration-200 hover:bg-color-amber-light hover:translate-y--1"
      >
        Launch Dashboard
      </Link>
    </nav>
  );
};

export default Navigation;