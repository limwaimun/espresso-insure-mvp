import React from 'react';

const FeaturesSection = () => {
  const features = [
    {
      id: 1,
      name: 'AI-Powered Client Advisory',
      description: 'Jordan, our AI advisor, provides real-time recommendations and answers client questions 24/7.',
      icon: '🤖',
      color: 'amber',
      capabilities: ['Risk Assessment', 'Policy Recommendations', 'Market Analysis', 'Client Q&A'],
    },
    {
      id: 2,
      name: 'Automated Policy Management',
      description: 'Sam handles quotes, renewals, and claims processing with AI precision and speed.',
      icon: '📄',
      color: 'teal',
      capabilities: ['Instant Quotes', 'Renewal Tracking', 'Claims Processing', 'Document Management'],
    },
    {
      id: 3,
      name: 'Intelligent Client Intake',
      description: 'Maya qualifies leads, schedules meetings, and collects client information automatically.',
      icon: '🎯',
      color: 'info',
      capabilities: ['Lead Qualification', 'Appointment Scheduling', 'Data Collection', 'Follow-up Automation'],
    },
    {
      id: 4,
      name: 'Compliance & Reporting',
      description: 'Morgan ensures regulatory compliance and generates detailed performance reports.',
      icon: '📊',
      color: 'ok',
      capabilities: ['Regulatory Compliance', 'Audit Trails', 'Performance Reports', 'Risk Monitoring'],
    },
    {
      id: 5,
      name: 'WhatsApp Integration',
      description: 'Full-stack WhatsApp platform for seamless client communication and engagement.',
      icon: '💬',
      color: 'warning',
      capabilities: ['Chat Automation', 'Broadcast Messaging', 'File Sharing', 'Payment Links'],
    },
    {
      id: 6,
      name: 'Business Intelligence',
      description: 'Advanced analytics and insights to optimize your practice and identify opportunities.',
      icon: '🔍',
      color: 'danger',
      capabilities: ['Revenue Analytics', 'Client Insights', 'Market Trends', 'Performance Benchmarks'],
    },
  ];

  return (
    <section className="bg-warm-mid py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl font-bold text-cream sm:text-5xl">
            Your Complete AI Back-Office
          </h2>
          <p className="mt-4 text-xl text-cream-dim max-w-3xl mx-auto">
            Six specialized AI agents work together to handle every aspect of your insurance practice, 
            giving you the capabilities of a large brokerage.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.id}
              className="card group hover:scale-[1.02] transition-all duration-300"
            >
              <div className="flex items-start space-x-4">
                <div className={`flex-shrink-0 h-14 w-14 rounded-xl bg-${feature.color}/10 text-${feature.color} text-2xl flex items-center justify-center`}>
                  {feature.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-display font-semibold text-cream mb-3">
                    {feature.name}
                  </h3>
                  <p className="text-cream-dim mb-4">
                    {feature.description}
                  </p>
                  <div className="space-y-2">
                    {feature.capabilities.map((capability, index) => (
                      <div key={index} className="flex items-center text-sm">
                        <div className={`h-1.5 w-1.5 rounded-full bg-${feature.color} mr-2`} />
                        <span className="text-cream-dim">{capability}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Integration Note */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center rounded-lg bg-dark border border-warm-border px-6 py-4">
            <div className="text-left">
              <div className="flex items-center text-cream font-semibold mb-1">
                <svg className="mr-2 h-5 w-5 text-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Seamless Integration
              </div>
              <p className="text-sm text-cream-dim">
                All AI agents work together seamlessly through our unified platform. 
                No need to switch between different tools or systems.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;