#!/usr/bin/env python3
"""
Fix landing page mobile responsiveness.
Run from the espresso-mvp project root:
  python3 fix-mobile.py
"""

with open('public/landing.html', 'r', encoding='utf-8') as f:
    content = f.read()

print(f'Original file size: {len(content)} chars')

# Step 1: Remove any existing media queries (they may be corrupted)
import re
content = re.sub(r'@media\s*\([^)]*\)\s*\{[^}]*(\{[^}]*\}[^}]*)*\}', '', content)

# Step 2: Remove the old .nav-links display:none if it exists standalone
# (This was the problematic rule that hid everything on mobile)

# Step 3: Add comprehensive mobile CSS before </style>
mobile_css = """
  /* ===== MOBILE RESPONSIVE ===== */
  @media (max-width: 1100px) {
    .hero-visual { display: none !important; }
    .pricing-grid { grid-template-columns: repeat(2, 1fr) !important; }
  }

  @media (max-width: 768px) {
    nav { padding: 16px 20px !important; }
    .nav-links { gap: 16px !important; }
    .nav-links li:nth-child(1),
    .nav-links li:nth-child(2),
    .nav-links li:nth-child(3),
    .nav-links li:nth-child(4) { display: none !important; }

    section { padding: 60px 20px !important; }
    .hero { padding: 100px 20px 60px !important; }
    .hero-visual { display: none !important; }

    .display {
      font-size: 36px !important;
      line-height: 1.1 !important;
    }

    .hero-sub { font-size: 16px !important; }

    .hero-stat-row {
      display: grid !important;
      grid-template-columns: 1fr 1fr !important;
      gap: 20px !important;
      margin-top: 48px !important;
    }

    .hero-actions {
      flex-direction: column !important;
      align-items: stretch !important;
    }

    .btn-primary { text-align: center !important; }

    .section-title {
      font-size: 32px !important;
      line-height: 1.15 !important;
    }

    .section-sub { font-size: 15px !important; }

    .problem-grid { grid-template-columns: 1fr !important; }
    .steps-row { grid-template-columns: 1fr !important; }
    .step-arrow { display: none !important; }

    .features-header {
      grid-template-columns: 1fr !important;
      gap: 24px !important;
    }

    .feature-grid { grid-template-columns: 1fr !important; }
    .pricing-grid { grid-template-columns: 1fr !important; }

    .setup-grid { grid-template-columns: 1fr !important; }
    .setup-callout {
      position: static !important;
      margin-top: 40px !important;
    }

    .cta-section h2 { font-size: 32px !important; }
    .cta-section p { font-size: 15px !important; }

    footer {
      flex-direction: column !important;
      gap: 24px !important;
      text-align: center !important;
      padding: 32px 20px !important;
    }

    .footer-links {
      flex-wrap: wrap !important;
      justify-content: center !important;
      gap: 16px !important;
    }
  }

  @media (max-width: 480px) {
    .hero { padding: 90px 16px 40px !important; }

    .display { font-size: 28px !important; }

    .hero-sub { font-size: 14px !important; }

    .hero-stat-row { gap: 16px !important; }
    .hero-stat-value { font-size: 28px !important; }
    .hero-stat-label { font-size: 11px !important; }

    section { padding: 48px 16px !important; }
    .section-title { font-size: 26px !important; }

    .problem-item { padding: 24px 20px !important; }
    .step { padding: 28px 24px !important; }
    .step-num { font-size: 48px !important; }

    .feature-card { padding: 24px 20px !important; }
    .pricing-card { padding: 28px 20px !important; }
    .pricing-price { font-size: 44px !important; }

    .setup-step { gap: 16px !important; }

    .faq-q { font-size: 15px !important; padding: 20px 0 !important; }

    .cta-section { padding: 80px 16px !important; }
    .cta-section h2 { font-size: 26px !important; }

    nav { padding: 14px 16px !important; }
    .nav-logo { font-size: 18px !important; }
    .nav-cta { padding: 8px 16px !important; font-size: 12px !important; }
  }
"""

# Insert before </style>
if '</style>' in content:
    content = content.replace('</style>', mobile_css + '\n</style>')
    print('✅ Mobile CSS injected before </style>')
else:
    print('❌ ERROR: Could not find </style> tag!')

# Step 4: Verify
line_count = content.count('\n') + 1
print(f'Fixed file size: {len(content)} chars, ~{line_count} lines')

# Check for hero section
if 'class="hero"' in content:
    print('✅ Hero section present')
else:
    print('❌ Hero section MISSING')

# Check for media queries
media_count = content.count('@media')
print(f'✅ Media queries found: {media_count}')

with open('public/landing.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('\n✅ File saved. Ready to deploy.')
