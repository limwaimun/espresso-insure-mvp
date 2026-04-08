import React from 'react';
import Link from 'next/link';

const CTASection = () => {
  const plans = [
    {
      name: 'Starter',
      price: '$49',
      period: '/month',
      description: 'Perfect for solo agents starting out',
      features: [
        '1 AI Agent (choose one)',
        'Up to 50 clients',
        'Basic WhatsApp integration',
        'Email support',
        'Standard reporting',
      ],
      cta: 'Start Free Trial',
      popular: false,
    },
    {
      name: 'Professional',
      price: '$99',
      period: '/month',
      description: 'For growing practices',
      features: [
        '3 AI Agents',
        'Up to 200 clients',
        'Full WhatsApp integration',
        'Priority support',
        'Advanced analytics',
        'Compliance monitoring',
      ],
      cta: 'Most Popular',
      popular: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      description: 'For large agencies and teams',
      features: [
        'All 6 AI Agents',
        'Unlimited clients',
        'Custom integrations',
        'Dedicated support',
        'White-label options',
        'API access',
        'Custom development',
      ],
      cta: 'Contact Sales',
      popular: false,
    },
  ];

  return (
    <section className="bg-gradient-to-b from-dark to-warm-mid py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl font-bold text-cream sm:text-5xl">
            Ready to Transform Your Practice?
          </h2>
          <p className="mt-4 text-xl text-cream-dim max-w-3xl mx-auto">
            Choose the plan that fits your needs. All plans include a 14-day free trial with full access.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`card relative ${plan.popular ? 'border-2 border-amber scale-105' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <div className="bg-amber text-dark font-semibold px-4 py-1 rounded-full text-sm">
                    Most Popular
                  </div>
                </div>
              )}
              
              <div className="text-center">
                <h3 className="text-2xl font-display font-semibold text-cream mb-2">
                  {plan.name}
                </h3>
                <div className="flex items-baseline justify-center mb-4">
                  <span className="text-5xl font-bold text-cream">{plan.price}</span>
                  <span className="text-cream-dim ml-2">{plan.period}</span>
                </div>
                <p className="text-cream-dim mb-8">{plan.description}</p>
                
                <ul className="space-y-4 mb-8 text-left">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <svg className="h-5 w-5 text-amber mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-cream">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Link
                  href={plan.name === 'Enterprise' ? '/contact' : '/signup'}
                  className={`w-full inline-flex items-center justify-center px-6 py-3 text-lg font-semibold rounded-lg transition-all duration-200 ${
                    plan.popular
                      ? 'btn-primary'
                      : 'btn-secondary'
                  }`}
                >
                  {plan.cta}
                  {plan.name !== 'Enterprise' && (
                    <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  )}
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-24">
          <h3 className="font-display text-3xl font-bold text-cream text-center mb-12">
            Frequently Asked Questions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                question: 'How does the 14-day free trial work?',
                answer: 'You get full access to all features of your chosen plan for 14 days. No credit card required to start. If you love it, choose a plan to continue.',
              },
              {
                question: 'Can I switch between AI agents?',
                answer: 'Yes! You can activate and deactivate AI agents based on your needs. The Professional and Enterprise plans allow multiple agents to work simultaneously.',
              },
              {
                question: 'Is there a contract or long-term commitment?',
                answer: 'No. All plans are month-to-month. You can cancel anytime with no penalties.',
              },
              {
                question: 'How secure is my client data?',
                answer: 'We use bank-level encryption and comply with all regional data protection regulations. Your data is never shared or sold.',
              },
              {
                question: 'Do you offer training and onboarding?',
                answer: 'Yes! We provide comprehensive onboarding and ongoing support to ensure you get the most out of Espresso.',
              },
              {
                question: 'Can I integrate with my existing tools?',
                answer: 'Our Enterprise plan includes API access and custom integrations. Contact our sales team to discuss your specific needs.',
              },
            ].map((faq, index) => (
              <div key={index} className="card">
                <h4 className="text-lg font-semibold text-cream mb-3">
                  {faq.question}
                </h4>
                <p className="text-cream-dim">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <div className="mt-24 text-center">
          <div className="bg-gradient-to-r from-amber/10 to-teal/10 rounded-2xl p-8 border border-warm-border">
            <h3 className="font-display text-3xl font-bold text-cream mb-4">
              Still have questions?
            </h3>
            <p className="text-xl text-cream-dim mb-8 max-w-2xl mx-auto">
              Our team is here to help you understand how Espresso can transform your insurance practice.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="btn-primary inline-flex items-center justify-center px-8 py-4 text-lg font-semibold"
              >
                <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Contact Our Team
              </Link>
              <Link
                href="/demo"
                className="btn-secondary inline-flex items-center justify-center px-8 py-4 text-lg font-semibold"
              >
                <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Schedule a Demo
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;