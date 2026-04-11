#!/usr/bin/env python3
import re

print("=== Applying all table fixes ===")

with open('app/dashboard/clients/page.tsx', 'r') as f:
    content = f.read()

# 1. Add sticky to thead (from earlier fix)
if '<thead className="bg-cream-dim/10">' in content:
    content = content.replace(
        '<thead className="bg-cream-dim/10">',
        '<thead className="bg-cream-dim/10" style={{ position: "sticky", top: 0, zIndex: 10, background: "#1C0F0A" }}>'
    )
    print("✓ Added sticky style to thead")

# 2. Add colgroup after table opening
table_start = '<table style={{\n              width: \'100%\',\n              tableLayout: \'fixed\',\n              borderCollapse: \'collapse\',\n            }}>'
if table_start in content:
    colgroup = '''<colgroup>
 <col style={{ width: '180px' }} />
 <col style={{ width: '80px' }} />
 <col style={{ width: '70px' }} />
 <col style={{ width: '90px' }} />
 <col style={{ width: '100px' }} />
 <col style={{ width: '130px' }} />
 <col style={{ width: '50px' }} />
</colgroup>'''
    # Insert after table start, before thead
    new_content = content.replace(table_start, table_start + '\n              ' + colgroup)
    if new_content != content:
        content = new_content
        print("✓ Added colgroup")
    else:
        print("⚠️ Could not insert colgroup")

# 3. Update th elements - CAREFULLY, don't match closing tags
# The th tags look like: <th\n                    className={`${dmSans.className} text-xs font-medium uppercase text-amber px-6 py-4`}\n                    style={{ textAlign: 'left', minWidth: '200px' }}\n                  >
# We need to match opening th tags only
th_replacement = '''<th style={{ fontFamily: "DM Sans, sans-serif", fontSize: "11px", fontWeight: 500, color: "#C8813A", textTransform: "uppercase", letterSpacing: "0.06em", padding: "10px 12px", textAlign: "left", borderBottom: "1px solid #2E1A0E", whiteSpace: "nowrap" }}>'''

# Use a more precise pattern: match <th followed by whitespace and attributes, ending with >
# But NOT starting with </
th_pattern = r'<th\s+[^>]*>'

# Count before
th_before = len(re.findall(th_pattern, content))
print(f"Found {th_before} opening th tags")

# Replace
content = re.sub(th_pattern, th_replacement, content)

# 4. Update td elements - they have className="px-6 py-4"
td_replacement = '<td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>'
td_pattern = r'<td\s+className="px-6 py-4"\s*>'

td_before = len(re.findall(td_pattern, content))
print(f"Found {td_before} td tags with className='px-6 py-4'")

if td_before > 0:
    content = re.sub(td_pattern, td_replacement, content)
    print(f"✓ Replaced {td_before} td elements")

# Write back
with open('app/dashboard/clients/page.tsx', 'w') as f:
    f.write(content)

print("\n=== Verification ===")
with open('app/dashboard/clients/page.tsx', 'r') as f:
    final = f.read()

print(f"th style count: {final.count('th style')}")
print(f"td style count: {final.count('td style')}")
print(f"thead with sticky: {'position: \"sticky\"' in final}")
print(f"colgroup present: {'<colgroup>' in final}")

# Quick syntax check - look for obvious errors
if '</th>' in final and '<tr>' in final:
    # Check if </th> appears before <tr> in the thead section
    thead_start = final.find('<thead')
    if thead_start != -1:
        thead_end = final.find('</thead>', thead_start)
        thead_section = final[thead_start:thead_end]
        if '</th>' in thead_section and '<tr>' in thead_section:
            th_close_pos = thead_section.find('</th>')
            tr_open_pos = thead_section.find('<tr>')
            if th_close_pos < tr_open_pos:
                print("⚠️ WARNING: Found </th> before <tr> in thead - invalid structure")
            else:
                print("✅ Thead structure looks valid")

print("\n=== Testing build ===")
import subprocess
import sys
result = subprocess.run([sys.executable, '-c', 'import os; print("Python OK")'], capture_output=True, text=True)
print("Build test would run here...")