'use client';

import { Cormorant_Garamond, DM_Sans } from 'next/font/google';
import { useState } from 'react';

const cormorant = Cormorant_Garamond({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
});

const dmSans = DM_Sans({
  weight: ['400', '500'],
  subsets: ['latin'],
});

export default function ClientsPage() {
  const [activeTab, setActiveTab] = useState('All');

  const tabs = ['All', 'Platinum', 'Gold', 'Silver', 'Bronze', 'At risk'];

  return (
    <div className="min-h-screen bg-cream">
      {/* Top Bar */}
      <div className="border-b border-cream-dim px-8 py-6 flex items-center justify-between">
        <h1 className={`${cormorant.className} text-3xl text-amber`}>All clients</h1>
        <div className="flex items-center gap-4">
          <button className="bg-amber text-cream px-6 py-2.5 rounded-lg font-medium hover:bg-amber/90 transition">
            + Add client
          </button>
          <button className="border border-amber text-amber px-6 py-2.5 rounded-lg font-medium hover:bg-amber/5 transition">
            Import
          </button>
          <button className="border border-amber text-amber px-6 py-2.5 rounded-lg font-medium hover:bg-amber/5 transition">
            Export
          </button>
        </div>
      </div>

      <div className="px-8 py-6">
        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search clients..."
            className="w-full px-4 py-3 bg-cream border border-cream-dim rounded-lg focus:outline-none focus:ring-2 focus:ring-amber/20 focus:border-amber"
          />
        </div>

        {/* Stats Bar */}
        <div className="mb-6 bg-amber/5 rounded-lg px-6 py-4">
          <div className={`${dmSans.className} text-sm text-amber`}>
            <span className="font-medium">247 Total</span> · 
            <span className="font-medium"> 231 Active</span> · 
            <span className="font-medium"> 12 Renewing soon</span> · 
            <span className="font-medium"> 4 Need attention</span>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-8 border-b border-cream-dim">
          <div className="flex gap-8">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-medium transition ${activeTab === tab ? 'text-amber border-b-2 border-amber' : 'text-cream-dim hover:text-amber'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Table - Desktop */}
        <div className="hidden md:block">
          <div className="overflow-x-auto rounded-lg border border-cream-dim">
            <table className="w-full">
              <thead className="bg-cream-dim/10">
                <tr>
                  {['CLIENT', 'TYPE', 'POLICIES', 'NEXT RENEWAL', 'PREMIUM', 'STATUS', 'ACTIONS'].map((header) => (
                    <th
                      key={header}
                      className={`${dmSans.className} text-xs font-medium uppercase text-amber px-6 py-4 text-left`}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-dim/20">
                {/* Row 1 */}
                <tr className="hover:bg-cream-dim/5">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium">Tan Ah Kow</div>
                      <div className="text-sm text-cream-dim">TAK Technologies</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>SME</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>3</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`${dmSans.className} text-sm text-red`}>13 Apr</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>$7,140/yr</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red/10 text-red">
                      Claim open
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-cream-dim hover:text-amber">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                  </td>
                </tr>

                {/* Row 2 */}
                <tr className="hover:bg-cream-dim/5">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium">Sarah Lim</div>
                      <div className="text-sm text-cream-dim">Café Latte</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>SME</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>—</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`${dmSans.className} text-sm text-amber`}>New</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>—</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber/10 text-amber">
                      Intake active
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-cream-dim hover:text-amber">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                  </td>
                </tr>

                {/* Row 3 */}
                <tr className="hover:bg-cream-dim/5">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium">Kwek Industries Pte Ltd</div>
                      <div className="text-sm text-cream-dim">SME</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>SME</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>4</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`${dmSans.className} text-sm text-amber`}>28 Apr</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>$11,340/yr</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber/10 text-amber">
                      Gap detected
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-cream-dim hover:text-amber">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                  </td>
                </tr>

                {/* Row 4 */}
                <tr className="hover:bg-cream-dim/5">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium">Angela Foo</div>
                      <div className="text-sm text-cream-dim">Individual</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>Individual</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>2</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`${dmSans.className} text-sm text-red`}>18 Apr</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>$2,240/yr</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red/10 text-red">
                      Renewal urgent
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-cream-dim hover:text-amber">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                  </td>
                </tr>

                {/* Row 5 */}
                <tr className="hover:bg-cream-dim/5">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium">James Ong</div>
                      <div className="text-sm text-cream-dim">Individual</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>Individual</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>3</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>15 May</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>$6,780/yr</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green/10 text-green">
                      Active
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-cream-dim hover:text-amber">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-8 flex items-center justify-between">
            <div className={`${dmSans.className} text-sm text-cream-dim`}>
              Showing 1-5 of 247
            </div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-2 text-cream-dim hover:text-amber disabled:opacity-50 disabled:cursor-not-allowed">
                ← Previous
              </button>
              {[1, 2, 3].map((num) => (
                <button
                  key={num}
                  className={`w-8 h-8 rounded ${num === 1 ? 'bg-amber text-cream' : 'text-cream-dim hover:text-amber'}`}
                >
                  {num}
                </button>
              ))}
              <span className="text-cream-dim">...</span>
              <button className="w-8 h-8 rounded text-cream-dim hover:text-amber">
                50
              </button>
              <button className="px-3 py-2 text-cream-dim hover:text-amber">
                Next →
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-4">
          {/* Card 1 */}
          <div className="bg-cream border border-cream-dim rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-medium">Tan Ah Kow</div>
                <div className="text-sm text-cream-dim">TAK Technologies · SME</div>
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red/10 text-red">
                Claim open
              </span>
            </div>
            <div className="mt-3 text-sm text-cream-dim">
              <div>3 policies · Next renewal: <span className="text-red">13 Apr</span></div>
              <div>Premium: $7,140/yr</div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-cream border border-cream-dim rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-medium">Sarah Lim</div>
                <div className="text-sm text-cream-dim">Café Latte · SME</div>
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber/10 text-amber">
                Intake active
              </span>
            </div>
            <div className="mt-3 text-sm text-cream-dim">
              <div>New client · No policies yet</div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-cream border border-cream-dim rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-medium">Kwek Industries Pte Ltd</div>
                <div className="text-sm text-cream-dim">SME</div>
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber/10 text-amber">
                Gap detected
              </span>
            </div>
            <div className="mt-3 text-sm text-cream-dim">

              <div>4 policies · Next renewal: <span className="text-amber">28 Apr</span></div>
              <div>Premium: $11,340/yr</div>
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-cream border border-cream-dim rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-medium">Angela Foo</div>
                <div className="text-sm text-cream-dim">Individual</div>
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red/10 text-red">
                Renewal urgent
              </span>
            </div>
            <div className="mt-3 text-sm text-cream-dim">
              <div>2 policies · Next renewal: <span className="text-red">18 Apr</span></div>
              <div>Premium: $2,240/yr</div>
            </div>
          </div>

          {/* Card 5 */}
          <div className="bg-cream border border-cream-dim rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-medium">James Ong</div>
                <div className="text-sm text-cream-dim">Individual</div>
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green/10 text-green">
                Active
              </span>
            </div>
            <div className="mt-3 text-sm text-cream-dim">
              <div>3 policies · Next renewal: 15 May</div>
              <div>Premium: $6,780/yr</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
