import React from 'react';

const TestimonialsSection = () => {
  const testimonials = [
    {
      id: 1,
      name: 'Sarah Chen',
      role: 'Independent Financial Advisor',
      location: 'Singapore',
      content: 'Espresso transformed my practice. I went from spending 20 hours a week on admin to focusing entirely on client relationships. My revenue increased by 45% in the first quarter.',
      avatar: 'SC',
      rating: 5,
    },
    {
      id: 2,
      name: 'Raj Patel',
      role: 'Insurance Agent',
      location: 'Malaysia',
      content: 'The WhatsApp integration is a game-changer. My clients love the convenience, and I can handle 3x more conversations without feeling overwhelmed.',
      avatar: 'RP',
      rating: 5,
    },
    {
      id: 3,
      name: 'Maria Santos',
      role: 'Financial Planner',
      location: 'Philippines',
      content: 'As a solo practitioner, I could never afford a full back-office team. Espresso gives me that capability at a fraction of the cost. The AI advisors are incredibly helpful.',
      avatar: 'MS',
      rating: 5,
    },
    {
      id: 4,
      name: 'David Wong',
      role: 'Wealth Manager',
      location: 'Hong Kong',
      content: 'The compliance features alone are worth the subscription. Morgan keeps me updated on regulatory changes and ensures I never miss a filing deadline.',
      avatar: 'DW',
      rating: 4,
    },
    {
      id: 5,
      name: 'Aisha Hassan',
      role: 'Insurance Broker',
      location: 'Indonesia',
      content: 'Client retention has never been higher. The automated follow-ups and personalized recommendations make my clients feel truly cared for.',
      avatar: 'AH',
      rating: 5,
    },
    {
      id: 6,
      name: 'Kenji Tanaka',
      role: 'Financial Advisor',
      location: 'Japan',
      content: 'The business intelligence tools helped me identify untapped markets. I expanded my practice into new areas I would have never considered before.',
      avatar: 'KT',
      rating: 5,
    },
  ];

  return (
    <section className="bg-dark py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl font-bold text-cream sm:text-5xl">
            Trusted by Insurance Professionals
          </h2>
          <p className="mt-4 text-xl text-cream-dim max-w-3xl mx-auto">
            Join hundreds of agents and IFAs who have transformed their practices with Espresso.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="card group hover:border-amber/30 transition-all duration-300"
            >
              {/* Rating */}
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`h-5 w-5 ${i < testimonial.rating ? 'text-amber' : 'text-cream-dim/30'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              {/* Content */}
              <p className="text-cream italic mb-6">
                "{testimonial.content}"
              </p>

              {/* Author */}
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber to-amber-light flex items-center justify-center text-dark font-semibold">
                  {testimonial.avatar}
                </div>
                <div className="ml-4">
                  <div className="font-semibold text-cream">{testimonial.name}</div>
                  <div className="text-sm text-cream-dim">
                    {testimonial.role} • {testimonial.location}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Overall Rating */}
        <div className="mt-16 text-center">
          <div className="inline-flex flex-col items-center bg-warm-mid rounded-2xl px-8 py-6 border border-warm-border">
            <div className="flex items-center mb-2">
              <div className="text-4xl font-display font-bold text-cream mr-3">4.9</div>
              <div className="text-left">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className="h-5 w-5 text-amber"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <div className="text-sm text-cream-dim mt-1">Based on 247 reviews</div>
              </div>
            </div>
            <div className="text-cream-dim text-sm">
              Trustpilot • Google Reviews • App Store
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;