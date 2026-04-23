import re
import sys
from pathlib import Path

# Paths
client_detail = Path("app/dashboard/clients/components/ClientDetailPage.tsx")
lib_types = Path("lib/types.ts")

if not client_detail.exists():
    print(f"ERROR: {client_detail} not found")
    sys.exit(1)

if not lib_types.exists():
    print(f"ERROR: {lib_types} not found")
    sys.exit(1)

# Read files
cdp_content = client_detail.read_text()
lib_content = lib_types.read_text()

# Extract type defs from ClientDetailPage.tsx
type_pattern = r'(?:^|\n)((?:type|interface)\s+(\w+)\s*(?:=\s*)?(?:\{[^}]*\}|[^;]+);?)'
types_in_cdp = {}

for match in re.finditer(type_pattern, cdp_content):
    full_def = match.group(1).strip()
    type_name = match.group(2)
    types_in_cdp[type_name] = full_def

# Extract existing types from lib/types.ts
existing_types = set(re.findall(r'(?:^|\n)(?:type|interface)\s+(\w+)', lib_content))

print("=" * 70)
print("TYPE EXTRACTION REPORT: ClientDetailPage.tsx → lib/types.ts")
print("=" * 70)
print()

print(f"Found {len(types_in_cdp)} local type(s) in ClientDetailPage.tsx:")
print()

conflicts = []
new_types = []

for name in sorted(types_in_cdp.keys()):
    if name in existing_types:
        conflicts.append(name)
        print(f"  ⚠️  {name:25} — CONFLICT: already exists in lib/types.ts")
    else:
        new_types.append(name)
        print(f"  ✓ {name:25} — NEW, safe to move")

print()
print(f"Summary: {len(new_types)} new types, {len(conflicts)} conflicts")
print()

if new_types:
    print("NEW TYPES TO EXTRACT:")
    print("-" * 70)
    for name in new_types:
        defn = types_in_cdp[name]
        lines = defn.split('\n')
        if len(lines) > 8:
            print(f"\n{name} ({len(lines)} lines):")
            for line in lines[:8]:
                print(f"  {line}")
            print("  ...")
        else:
            print(f"\n{name}:")
            for line in lines:
                print(f"  {line}")

if conflicts:
    print()
    print("⚠️  CONFLICTS (need investigation):")
    print("-" * 70)
    for name in conflicts:
        print(f"  {name}")

print()
print("=" * 70)
