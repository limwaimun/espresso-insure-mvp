#!/usr/bin/env python3
import re

with open('app/dashboard/clients/page.tsx', 'r') as f:
    content = f.read()

print("Original file loaded")

# 1. Add colgroup
table_start = '<table style={{\n              width: \'100%\',\n              tableLayout: \'fixed\',\n              borderCollapse: \'collapse\',\n            }}>'
colgroup_content = '''<colgroup>
 <col style={{ width: '180px' }} />
 <col style={{ width: '80px' }} />
 <col style={{ width: '70px' }} />
 <col style={{ width: '90px' }} />
 <col style={{ width: '100px' }} />
 <col style={{ width: '130px' }} />
 <col style={{ width: '50px' }} />
</colgroup>'''

if table_start in content:
    new_table_start = table_start + '\n              ' + colgroup_content
    content = content.replace(table_start, new_table_start)
    print("✓ Added colgroup")

# 2. Fix th elements - handle multiline th tags
# The th tags in the original look like:
# <th
#   className={`${dmSans.className} text-xs font-medium uppercase text-amber px-6 py-4`}
#   style={{ textAlign: 'left', minWidth: '200px' }}
# >
th_pattern = r'<th\s+[^>]*>'
th_replacement = '''<th style={{ fontFamily: "DM Sans, sans-serif", fontSize: "11px", fontWeight: 500, color: "#C8813A", textTransform: "uppercase", letterSpacing: "0.06em", padding: "10px 12px", textAlign: "left", borderBottom: "1px solid #2E1A0E", whiteSpace: "nowrap" }}>'''

# Use a more careful approach - find all th tags and replace them
lines = content.split('\n')
new_lines = []
i = 0
while i < len(lines):
    line = lines[i]
    if '<th' in line and '>' not in line:
        # Multiline th tag - collect until we find the closing >
        th_lines = [line]
        i += 1
        while i < len(lines) and '>' not in lines[i]:
            th_lines.append(lines[i])
            i += 1
        if i < len(lines):
            th_lines.append(lines[i])
        # Replace the entire multiline th tag
        new_lines.append(th_replacement)
        i += 1
    elif re.search(th_pattern, line):
        # Single line th tag
        new_lines.append(re.sub(th_pattern, th_replacement, line))
        i += 1
    else:
        new_lines.append(line)
        i += 1

content = '\n'.join(new_lines)
print("✓ Processed th elements")

# 3. Fix td elements - they have className attributes
td_pattern = r'<td\s+className="[^"]*"\s*>'
td_replacement = '<td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>'

# Count before
td_before = len(re.findall(td_pattern, content))
print(f"Found {td_before} td tags with className")

# Replace
content = re.sub(td_pattern, td_replacement, content)

# Count after
td_after = content.count('td style')
print(f"After: {td_after} td style elements")

# Write back
with open('app/dashboard/clients/page.tsx', 'w') as f:
    f.write(content)

print("✓ File written successfully")

# Verify
with open('app/dashboard/clients/page.tsx', 'r') as f:
    final = f.read()
    
print(f"\nVerification:")
print(f"  th style count: {final.count('th style')}")
print(f"  td style count: {final.count('td style')}")
print(f"  </thead> present: {'</thead>' in final}")
print(f"  <colgroup> present: {'<colgroup>' in final}")