import React from 'react';

const StatsSection = () => {
  const stats = [
    {
      id: 1,
      name: 'Time Saved Per Week',
      value: '15+ hours',
      description: 'Automated admin tasks free up your time for client relationships',
      icon: '⏰',
    },
    {
      id: 2,
      name: 'Revenue Increase',
      value: '40% avg.',
      description: 'Agents using Espresso see significant revenue growth',
      icon: '📈',
    },
    {
      id: 3,
      name: 'Client Retention',
      value: '92%',
      description: 'Higher satisfaction leads to better retention rates',
      icon: '🤝',
    },
    {
      id: 4,
      name: 'Policy Processing',
      value: '3x faster',
      description: 'AI-powered processing accelerates policy management',
      icon: '⚡',
    },
  ];

  return (
    <section className="bg-dark py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl font-bold text-cream sm:text-5xl">
            Transform Your Insurance Practice
          </h2>
          <p className="mt-4 text-xl text-cream-dim max-w-3xl mx-auto">
            Espresso doesn't just automate tasks—it transforms how you run your business, 
            giving you the tools of a large brokerage while maintaining your independence.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.id}
              className="card relative overflow-hidden group hover:border-amber/30 transition-all duration-300"
            >
              {/* Hover effect background */}
              <div className="absolute inset-0 bg-gradient-to-br from-amber/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="relative">
                <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-amber/10 text-amber text-2xl mb-6">
                  {stat.icon}
                </div>
                <div className="text-3xl font-display font-bold text-cream mb-2">
                  {stat.value}
                </div>
                <h3 className="text-lg font-semibold text-cream mb-3">
                  {stat.name}
                </h3>
                <p className="text-cream-dim">
                  {stat.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Additional context */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center rounded-full bg-warm-mid px-6 py-3 text-sm font-medium text-cream-dim ring-1 ring-inset ring-warm-border">
            <svg className="mr-2 h-4 w-4 text-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Based on data from 500+ agents across Southeast Asia
          </div>
        </div>
      </div>
    </section>
  );
};

export default StatsSection;