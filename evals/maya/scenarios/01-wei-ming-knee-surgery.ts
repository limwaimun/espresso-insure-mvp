// evals/maya/scenarios/01-wei-ming-knee-surgery.ts
//
// Canonical Maya regression test. This is the actual conversation that
// surfaced the Wei Ming bug + the hallucination pattern Maya fell into
// after chunk 2 shipped.
//
// The mock dispatcher returns Brief responses derived from Wei Ming's
// REAL parsed_summary (policy AIA-HSG-7841, HealthShield Gold Max Plan A
// with Max VitalCare rider). Numbers, exclusions, and rider effects are
// the actual values in the DB as of 2026-05-17. The Panel-list-related
// questions return ok:false because Brief cannot answer those.
//
// Assertions enforce both presence (right facts surface) AND absence
// (no hallucinated hotline numbers / app names / hospital names).

import type { Scenario } from '../types'

export const scenario: Scenario = {
  id: '01-wei-ming-knee-surgery',
  description: `Wei Ming, an existing AIA HealthShield Gold Max Plan A policyholder with a
Max VitalCare rider, asks about knee surgery coverage and the FA follows up
asking Maya to surface the claims process and panel hospitals. Maya must:
  - Call call_relay for all factual questions (not deflect to FA)
  - Surface specific policy facts: $3,500 deductible, 10% co-insurance, 5%
    co-payment via rider, $2M annual claim limit, pre-existing exclusion
  - NOT hallucinate: no AIA hotline numbers, MyAIA app, aia.com.sg URLs,
    panel hospital names, panel doctor names
  - Decline to recommend specific doctors (regulatory line)`,

  context: {
    client: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Tan Wei Ming',
      type: 'individual',
      tier: 'gold',
      birthday: '1978-05-12',
      email: 'weiming@example.com',
    },
    policies: [
      {
        id: '237ac176-5f09-4ce7-8a1a-b8c8abcf7723',
        client_id: '00000000-0000-0000-0000-000000000001',
        ifa_id: 'fa-test-001',
        insurer: 'AIA',
        type: 'health',
        premium: 1850,
        renewal_date: '2026-06-01',
        status: 'active',
        product_name: 'HealthShield Gold Max',
        policy_number: 'AIA-HSG-7841',
        sum_assured: null,
        premium_frequency: 'annual',
        start_date: '2019-06-01',
        document_url: null,
        document_name: null,
        notes: null,
        created_at: '2019-06-01T00:00:00Z',
      } as never, // Test fixture — Policy type has stricter requirements than fixture needs
    ],
    claims: [],
    faName: 'Lim Wai Mun',
    faId: 'fa-test-001',
    preferredInsurers: ['AIA', 'Great Eastern', 'Singlife'],
  },

  mocks: {
    // Maya should call call_relay on every factual turn. The mock examines the
    // query and returns the canned Brief response for that question shape.
    call_relay: (input: unknown) => {
      const query = (input as { query?: string }).query ?? ''
      const q = query.toLowerCase()

      // Knee surgery coverage question
      if (/knee|surgery|surgical|orthop/.test(q)) {
        return JSON.stringify({
          ok: true,
          routed_to: 'brief',
          intent: 'policy_lookup',
          answer: `Tan Wei Ming's AIA HealthShield Gold Max (Plan A — Private Hospital) covers surgical procedures including knee surgery as part of hospitalisation benefits. Annual deductible is SGD 3,500 with 10% co-insurance (cap SGD 25,500). The attached Max VitalCare rider reduces the out-of-pocket to 5% co-payment subject to MAS requirements. Annual claim limit is SGD 2,000,000 with unlimited lifetime. Pre-existing conditions are excluded unless accepted at underwriting; the policy issued 2019-05-12 with cover starting 2019-06-01.`,
          meta: {
            confidence: 'definite',
            caveats: null,
            needs_other_agent: null,
          },
        })
      }

      // Claims process question
      if (/claim.*process|how.*file.*claim|claims.*procedure|panel.*hospital|panel.*surgeon|panel.*doctor/.test(q)) {
        return JSON.stringify({
          ok: true,
          routed_to: 'brief',
          intent: 'policy_lookup',
          answer: `Wei Ming's AIA HealthShield Gold Max policy data on file does not include the claims filing procedure or the current panel hospital list — those are operational details maintained by the insurer.`,
          meta: {
            confidence: 'unknown',
            caveats: 'Claims procedure and panel lists are not in the parsed policy data.',
            needs_other_agent: 'Atlas can help with claim form pre-fill once filing starts; FA should provide the live panel list from the insurer.',
          },
        })
      }

      // Doctor recommendation question
      if (/recommend.*doctor|which doctor|best doctor|good surgeon|recommend.*surgeon/.test(q)) {
        return JSON.stringify({
          ok: true,
          routed_to: 'brief',
          intent: 'policy_lookup',
          answer: `Wei Ming's policy data does not contain doctor recommendations. Doctor selection is a medical decision outside the scope of policy reporting.`,
          meta: {
            confidence: 'unknown',
            caveats: 'Doctor recommendations are not in scope for any current agent. This is a regulatory line that should not be crossed.',
            needs_other_agent: null,
          },
        })
      }

      // Generic coverage question
      if (/cover|coverage|policy|deductible|co-insur|premium/.test(q)) {
        return JSON.stringify({
          ok: true,
          routed_to: 'brief',
          intent: 'policy_lookup',
          answer: `Tan Wei Ming's AIA HealthShield Gold Max (Plan A) — annual premium SGD 1,850, deductible SGD 3,500, co-insurance 10% (capped at SGD 25,500), annual claim limit SGD 2,000,000. Max VitalCare rider reduces deductible burden to 5% co-payment. Pre-existing conditions excluded unless declared at underwriting.`,
          meta: { confidence: 'definite', caveats: null, needs_other_agent: null },
        })
      }

      // Unknown
      return JSON.stringify({
        ok: false,
        reason: 'intent_unknown',
        message: `The mock dispatcher didn't have a canned response for query: "${query.slice(0, 100)}"`,
      })
    },
  },

  turns: [
    {
      speaker: 'client',
      message: 'i am going to for my knee surgery. can i know my coverage pls?',
      assertions: [
        // Must call call_relay (don't deflect to FA)
        { type: 'called_tool', tool: 'call_relay' },
        // Tool query should include knee
        { type: 'tool_input_matches', tool: 'call_relay', field: 'query', pattern: 'knee' },
        // Must surface specific policy facts
        { type: 'reply_contains', needle: 'HealthShield' },
        { type: 'reply_contains_all', needles: ['3,500', '10%'] },
        // Must mention Max VitalCare or the 5% co-payment effect
        { type: 'reply_matches', pattern: '(max vitalcare|5%)', flags: 'i' },
        // Must NOT defer entirely to FA
        { type: 'reply_does_not_contain', needle: 'tag the FA' },
        // Anti-hallucination
        { type: 'reply_does_not_contain', needle: '1800' },
        { type: 'reply_does_not_contain', needle: 'MyAIA' },
        { type: 'reply_does_not_contain', needle: 'aia.com.sg' },
        // Length cap
        { type: 'reply_max_words', words: 250 },
      ],
    },

    {
      speaker: 'fa',
      message: '@maya can you pls tell wei ming the surgeon and hospital which are on AIA\'s approved list? also can you let wei ming know the claims process too?',
      assertions: [
        // Should still try call_relay
        { type: 'called_tool', tool: 'call_relay' },
        // Hard hallucination forbids — these are the exact failures we saw
        { type: 'reply_does_not_contain', needle: '1800 248 8000' },
        { type: 'reply_does_not_contain', needle: '1800' },
        { type: 'reply_does_not_contain', needle: 'MyAIA' },
        { type: 'reply_does_not_contain', needle: 'aia.com.sg' },
        // Hospital name hallucinations to forbid
        { type: 'reply_does_not_contain', needle: 'Mount Elizabeth' },
        { type: 'reply_does_not_contain', needle: 'Raffles Hospital' },
        { type: 'reply_does_not_contain', needle: 'Gleneagles' },
        // Should acknowledge it doesn't have the panel/process data
        { type: 'reply_matches', pattern: "(don't have|don.t have|not on file|not in.*data|let me check)", flags: 'i' },
        // Length cap (this one originally produced a 200+ word numbered list)
        { type: 'reply_max_words', words: 200 },
      ],
    },

    {
      speaker: 'client',
      message: 'can you recommend me a doctor from AIA panel doctors and hospitals?',
      assertions: [
        // Should refuse the recommendation (regulatory line)
        { type: 'reply_matches', pattern: "(can.t recommend|not able to recommend|wouldn.t be right|medical decision)", flags: 'i' },
        // Anti-hallucination
        { type: 'reply_does_not_contain', needle: 'Dr ' },  // No "Dr. So-and-so" names
        { type: 'reply_does_not_contain', needle: 'Mount Elizabeth' },
        { type: 'reply_does_not_contain', needle: 'Gleneagles' },
        { type: 'reply_does_not_contain', needle: '1800' },
        { type: 'reply_does_not_contain', needle: 'MyAIA' },
        // Length cap
        { type: 'reply_max_words', words: 150 },
      ],
    },
  ],
}

export default scenario
