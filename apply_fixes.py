#!/usr/bin/env python3
import re

with open('public/landing.html', 'r') as f:
    content = f.read()

# A) Features section headings
content = content.replace('Riley — Renewal manager', 'Renewal management')
content = content.replace('Jordan — Policy advisory', 'Policy advisory')
content = content.replace('Casey — Claims support', 'Claims support')
content = content.replace('Morgan — Documents', 'Document management')
content = content.replace('Sam — Quote comparison', 'Quote comparison')

# B) Features section descriptions
content = content.replace('Riley tracks every policy', 'Maya tracks every policy')
content = content.replace('Jordan pulls the answer', 'Maya pulls the answer')
content = content.replace('Casey guides them', 'Maya guides them')
content = content.replace('Morgan handles all document', 'Maya handles all document')
content = content.replace('Sam aggregates market quotes', 'Maya aggregates market quotes')

# C) Features header
content = content.replace('One assistant.<br><em>Six specialists</em><br>behind her.', 'One assistant.<br><em>Everything</em><br>handled.')
content = content.replace('Your clients only ever see Maya — warm, knowledgeable, always available. Behind her, a full team of AI specialists handles every part of the insurance journey invisibly.', 'Your clients see Maya — warm, knowledgeable, always available. She handles every part of the insurance journey seamlessly.')

# D) Pricing descriptions
content = content.replace('Maya and Riley handle your intake and renewals', 'Maya handles your intake and renewals')
content = content.replace('Maya — 24/7 client intake in WhatsApp groups', '24/7 client intake in WhatsApp groups')
content = content.replace('Riley — full renewal management', 'Full renewal management')
content = content.replace('Jordan — policy Q&amp;A and advisory', 'Policy Q&amp;A and advisory')
content = content.replace('Casey — 24/7 claims and FNOL support', '24/7 claims and FNOL support')
content = content.replace('Morgan — documents and compliance', 'Documents and compliance')
content = content.replace('Sam — quote comparison reports', 'Quote comparison reports')
content = content.replace('the full Espresso squad across', 'the full Espresso suite across')

# E) Setup guide fixes
content = content.replace('Riley immediately begins tracking all renewals', 'Maya immediately begins tracking all renewals')
content = content.replace('Every client brief Maya completes, every renewal Riley flags, and every alert from the squad appears', 'Every client brief, every renewal flag, and every alert appears')

# F) FAQ fixes
# The tied agent FAQ
tied_agent_old = 'Absolutely. Even if you can only sell one insurer\'s products, Espresso adds enormous value through client intake, renewal management, claims support, and document handling. The quote comparison feature (Sam) is most powerful for IFAs, but the rest of the squad is fully valuable for tied agents too.'
tied_agent_new = 'Absolutely. Even if you can only sell one insurer\'s products, Maya adds enormous value through client intake, renewal management, claims support, coverage gap detection, and document handling — all features that work regardless of which insurer you represent.'
content = content.replace(tied_agent_old, tied_agent_new)

# The data safety FAQ
data_safety_old = 'Yes. All client data is encrypted and stored securely. Each IFA account is completely isolated — no advisor can ever see another advisor\'s client data. We comply with PDPA (Singapore) and equivalent data protection requirements across our operating markets.'
data_safety_new = 'Espresso never connects to any insurer\'s system. You import your own data — just like using a personal spreadsheet, except smarter. All client data is encrypted, isolated to your account only, and stored in Singapore. No advisor can ever see another advisor\'s data. We comply with PDPA and equivalent data protection requirements across our markets. Your data is yours — we are your personal tool, not a data aggregator.'
content = content.replace(data_safety_old, data_safety_new)

# The markets FAQ
content = content.replace('launching in 2025', 'launching in 2026')

# G) Footer
content = content.replace('© 2025 Espresso', '© 2026 Espresso')

# H) Link fixes - CTA buttons
content = re.sub(r'href="#pricing" class="nav-cta">Start free trial</a>', 'href="/trial" class="nav-cta">Start free trial</a>', content)
content = re.sub(r'href="#pricing" class="btn-primary">Start 14-day free trial</a>', 'href="/trial" class="btn-primary">Start 14-day free trial</a>', content)
content = re.sub(r'href="#pricing" class="btn-pricing btn-pricing-outline">Start free trial</a>', 'href="/trial" class="btn-pricing btn-pricing-outline">Start free trial</a>', content)
content = re.sub(r'href="#pricing" class="btn-pricing btn-pricing-filled">Start free trial</a>', 'href="/trial" class="btn-pricing btn-pricing-filled">Start free trial</a>', content)
content = re.sub(r'href="#pricing" class="btn-primary" style="display:block; text-align:center; text-decoration:none;">Start your free trial →</a>', 'href="/trial" class="btn-primary" style="display:block; text-align:center; text-decoration:none;">Start your free trial →</a>', content)
content = re.sub(r'href="#pricing" class="btn-primary" style="font-size: 16px; padding: 18px 44px;">Start your free trial</a>', 'href="/trial" class="btn-primary" style="font-size: 16px; padding: 18px 44px;">Start your free trial</a>', content)

# Sign in link
content = re.sub(r'Already on a plan\? <a href="#" style="color: var\(--amber-light\); text-decoration:none;">Sign in →</a>', 'Already on a plan? <a href="/login" style="color: var(--amber-light); text-decoration:none;">Sign in →</a>', content)

# Add Login to nav links
nav_links_old = ''' <ul class="nav-links">
 <li><a href="#how-it-works">How it works</a></li>
 <li><a href="#features">Features</a></li>
 <li><a href="#pricing">Pricing</a></li>
 <li><a href="#setup">Setup</a></li>
 <li><a href="#pricing" class="nav-cta">Start free trial</a></li>
 </ul>'''
nav_links_new = ''' <ul class="nav-links">
 <li><a href="#how-it-works">How it works</a></li>
 <li><a href="#features">Features</a></li>
 <li><a href="#pricing">Pricing</a></li>
 <li><a href="#setup">Setup</a></li>
 <li><a href="/login">Login</a></li>
 <li><a href="/trial" class="nav-cta">Start free trial</a></li>
 </ul>'''
content = content.replace(nav_links_old, nav_links_new)

# I) Remove "Pro plan" tags and other feature tags
content = re.sub(r'<div class="feature-tag">Pro plan</div>\s*', '', content)
content = re.sub(r'<div class="feature-tag">Always on</div>\s*', '', content)
content = re.sub(r'<div class="feature-tag">Never miss a renewal</div>\s*', '', content)

with open('public/landing.html', 'w') as f:
    f.write(content)

print("All fixes applied successfully!")