#!/bin/bash

# Apply all find-and-replace operations to public/landing.html

# A) Features section headings
sed -i '' 's/Riley — Renewal manager/Renewal management/g' public/landing.html
sed -i '' 's/Jordan — Policy advisory/Policy advisory/g' public/landing.html
sed -i '' 's/Casey — Claims support/Claims support/g' public/landing.html
sed -i '' 's/Morgan — Documents/Document management/g' public/landing.html
sed -i '' 's/Sam — Quote comparison/Quote comparison/g' public/landing.html

# B) Features section descriptions
sed -i '' 's/Riley tracks every policy/Maya tracks every policy/g' public/landing.html
sed -i '' 's/Jordan pulls the answer/Maya pulls the answer/g' public/landing.html
sed -i '' 's/Casey guides them/Maya guides them/g' public/landing.html
sed -i '' 's/Morgan handles all document/Maya handles all document/g' public/landing.html
sed -i '' 's/Sam aggregates market quotes/Maya aggregates market quotes/g' public/landing.html

# C) Features header
sed -i '' 's/One assistant.<br><em>Six specialists<\/em><br>behind her./One assistant.<br><em>Everything<\/em><br>handled./g' public/landing.html
sed -i '' 's/Your clients only ever see Maya — warm, knowledgeable, always available. Behind her, a full team of AI specialists handles every part of the insurance journey invisibly./Your clients see Maya — warm, knowledgeable, always available. She handles every part of the insurance journey seamlessly./g' public/landing.html

# D) Pricing descriptions
sed -i '' 's/Maya and Riley handle your intake and renewals/Maya handles your intake and renewals/g' public/landing.html
sed -i '' 's/Maya — 24\/7 client intake in WhatsApp groups/24\/7 client intake in WhatsApp groups/g' public/landing.html
sed -i '' 's/Riley — full renewal management/Full renewal management/g' public/landing.html
sed -i '' 's/Jordan — policy Q&amp;A and advisory/Policy Q&amp;A and advisory/g' public/landing.html
sed -i '' 's/Casey — 24\/7 claims and FNOL support/24\/7 claims and FNOL support/g' public/landing.html
sed -i '' 's/Morgan — documents and compliance/Documents and compliance/g' public/landing.html
sed -i '' 's/Sam — quote comparison reports/Quote comparison reports/g' public/landing.html
sed -i '' 's/the full Espresso squad across/the full Espresso suite across/g' public/landing.html

# E) Setup guide fixes
sed -i '' 's/Riley immediately begins tracking all renewals/Maya immediately begins tracking all renewals/g' public/landing.html
sed -i '' 's/Every client brief Maya completes, every renewal Riley flags, and every alert from the squad appears/Every client brief, every renewal flag, and every alert appears/g' public/landing.html

# F) FAQ fixes
# The tied agent FAQ - replace entire answer
sed -i '' 's/Absolutely. Even if you can only sell one insurer'"'"'s products, Espresso adds enormous value through client intake, renewal management, claims support, and document handling. The quote comparison feature (Sam) is most powerful for IFAs, but the rest of the squad is fully valuable for tied agents too./Absolutely. Even if you can only sell one insurer'"'"'s products, Maya adds enormous value through client intake, renewal management, claims support, coverage gap detection, and document handling — all features that work regardless of which insurer you represent./g' public/landing.html

# The data safety FAQ - replace entire answer
sed -i '' 's/Yes. All client data is encrypted and stored securely. Each IFA account is completely isolated — no advisor can ever see another advisor'"'"'s client data. We comply with PDPA (Singapore) and equivalent data protection requirements across our operating markets./Espresso never connects to any insurer'"'"'s system. You import your own data — just like using a personal spreadsheet, except smarter. All client data is encrypted, isolated to your account only, and stored in Singapore. No advisor can ever see another advisor'"'"'s data. We comply with PDPA and equivalent data protection requirements across our markets. Your data is yours — we are your personal tool, not a data aggregator./g' public/landing.html

# The markets FAQ
sed -i '' 's/launching in 2025/launching in 2026/g' public/landing.html

# G) Footer
sed -i '' 's/© 2025 Espresso/© 2026 Espresso/g' public/landing.html

# H) Link fixes
sed -i '' 's/href="#" on "Start free trial" buttons/href="\/trial"/g' public/landing.html
sed -i '' 's/href="#pricing" on "Start free trial" buttons/href="\/trial"/g' public/landing.html
sed -i '' 's/"Sign in →" link/"Sign in →"/g' public/landing.html

# I) Remove "Pro plan" tags and other feature tags
sed -i '' '/<div class="feature-tag">Pro plan<\/div>/d' public/landing.html
sed -i '' '/<div class="feature-tag">Always on<\/div>/d' public/landing.html
sed -i '' '/<div class="feature-tag">Never miss a renewal<\/div>/d' public/landing.html

echo "All fixes applied!"
