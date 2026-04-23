#!/usr/bin/env python3
import re
from pathlib import Path

cdp_file = Path("app/dashboard/clients/components/ClientDetailPage.tsx")
types_file = Path("lib/types.ts")

if not cdp_file.exists() or not types_file.exists():
    print("ERROR: Missing files"); exit(1)

cdp = cdp_file.read_text()
types = types_file.read_text()

print("=" * 80)
print("BATCH 32: Extract types from ClientDetailPage → lib/types.ts")
print("=" * 80)
print()

# Extract types block
types_block = re.search(r'// ── Types ──.*?interface Props \{[^}]*\n\}', cdp, re.DOTALL)
if not types_block:
    print("ERROR: types block not found"); exit(1)

block = types_block.group(0)
print("✓ Found types block")

# Extract individual types
msg = re.search(r'interface Message \{[^}]*\}', block).group(0)
conv = re.search(r'interface Conversation \{[^}]*\}', block).group(0)
cov = re.search(r'interface CoverageItem \{[^}]*\}', block).group(0)
tl = re.search(r'interface TimelineItem \{[^}]*\}', block).group(0)
met = re.search(r'interface Metric \{[^}]*\}', block).group(0)
cd = re.search(r'interface ClientData \{[^}]*\}', block, re.DOTALL).group(0)
pr = re.search(r'interface Props \{[^}]*\n\}', block, re.DOTALL).group(0)

# Fix ClientData: remove dob
cd = re.sub(r'\n\s*dob\?: string \| null', '', cd)
print("✓ Fixed ClientData (removed dob)")

# Find insertion point in lib/types.ts
holding_end = re.search(r'export interface Holding \{[^}]*\n\}', types, re.DOTALL)
if not holding_end:
    print("ERROR: could not find Holding"); exit(1)

insert_pos = holding_end.end()

# Build new section
new_section = (
    "\n\n// ── UI types (ClientDetailPage) ─────────────────────────────────────────────\n\n"
    f"export {msg}\n\nexport {conv}\n\nexport {cov}\n\nexport {tl}\n\nexport {met}\n\nexport {cd}\n\nexport {pr}\n"
)

types_new = types[:insert_pos] + new_section + types[insert_pos:]
print("✓ Prepared lib/types.ts")

# Update import
old_imp = "import type { Holding } from '@/lib/types'"
new_imp = "import type { Holding, Message, Conversation, CoverageItem, TimelineItem, Metric, ClientData, Props } from '@/lib/types'"

if old_imp not in cdp:
    print("ERROR: import not found"); exit(1)

cdp_new = cdp.replace(old_imp, new_imp)
print("✓ Updated import")

# Remove types block
cdp_new = cdp_new.replace(block, "// Types imported from @/lib/types (see imports above)")
print("✓ Removed type block")

# Write
types_file.write_text(types_new)
cdp_file.write_text(cdp_new)

print()
print("=" * 80)
print("✓ FILES UPDATED")
print("=" * 80)
print("NEXT: npx tsc --noEmit && npm run build && npm test")
print("=" * 80)
