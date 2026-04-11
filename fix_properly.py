#!/usr/bin/env python3
import re

with open('app/dashboard/clients/page.tsx', 'r') as f:
    content = f.read()

print("=== Fixing table styles ===")

# 1. Add colgroup after table opening
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

# 2. Fix th elements - ONLY replace opening th tags, not thead
# We need to be careful not to match </th> or <thead>
# Pattern: <th followed by space, then any characters that are not >, then >
th_pattern = r'<th\s[^>]*>'

# But we need to avoid matching multiline th tags incorrectly
# Let's read line by line
lines = content.split('\n')
output_lines = []
i = 0
th_count = 0

while i < len(lines):
    line = lines[i]
    
    # Check if this line contains an opening th tag
    if '<th' in line and '>' in line and not line.strip().startswith('</'):
        # This is a single-line th opening tag
        # Replace it with our standardized style
        new_th = '''<th style={{ fontFamily: "DM Sans, sans-serif", fontSize: "11px", fontWeight: 500, color: "#C8813A", textTransform: "uppercase", letterSpacing: "0.06em", padding: "10px 12px", textAlign: "left", borderBottom: "1px solid #2E1A0E", whiteSpace: "nowrap" }}>'''
        # Replace the entire th tag
        line = re.sub(r'<th\s[^>]*>', new_th, line)
        th_count += 1
        output_lines.append(line)
        i += 1
    elif '<th' in line and '>' not in line:
        # Multiline th tag - collect all lines until we find >
        th_lines = [line]
        i += 1
        while i < len(lines) and '>' not in lines[i]:
            th_lines.append(lines[i])
            i += 1
        if i < len(lines):
            th_lines.append(lines[i])
        # Join and replace
        th_block = '\n'.join(th_lines)
        new_th = '''<th style={{ fontFamily: "DM Sans, sans-serif", fontSize: "11px", fontWeight: 500, color: "#C8813A", textTransform: "uppercase", letterSpacing: "0.06em", padding: "10px 12px", textAlign: "left", borderBottom: "1px solid #2E1A0E", whiteSpace: "nowrap" }}>'''
        th_block = re.sub(r'<th\s[^>]*>', new_th, th_block, flags=re.DOTALL)
        output_lines.append(th_block)
        th_count += 1
        i += 1
    else:
        output_lines.append(line)
        i += 1

content = '\n'.join(output_lines)
print(f"✓ Processed {th_count} th elements")

# 3. Fix td elements - they have className="px-6 py-4"
td_pattern = r'<td\s+className="px-6 py-4"\s*>'
td_replacement = '<td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>'

td_before = len(re.findall(td_pattern, content))
print(f"Found {td_before} td tags with className='px-6 py-4'")

if td_before > 0:
    content = re.sub(td_pattern, td_replacement, content)
    print(f"✓ Replaced {td_before} td elements")
else:
    print("⚠️ No td tags with className='px-6 py-4' found")

# Write back
with open('app/dashboard/clients/page.tsx', 'w') as f:
    f.write(content)

print("\n=== Verification ===")
with open('app/dashboard/clients/page.tsx', 'r') as f:
    final = f.read()

# Check counts
th_style_count = final.count('th style')
td_style_count = final.count('td style')
thead_count = final.count('<thead')
colgroup_count = final.count('<colgroup>')

print(f"th style elements: {th_style_count}")
print(f"td style elements: {td_style_count}")
print(f"thead elements: {thead_count}")
print(f"colgroup elements: {colgroup_count}")

# Check for common errors
if '</th>' in final and '<tr>' in final and final.find('</th>') < final.find('<tr>'):
    print("⚠️ WARNING: Found </th> before <tr> - possible malformed structure")
if 'th style' in final and 'thead' not in final:
    print("⚠️ WARNING: th style found but no thead - possible missing thead")

print("\n=== Build test ===")
import subprocess
result = subprocess.run(['npm', 'run', 'build'], capture_output=True, text=True, cwd='.')
if result.returncode == 0:
    print("✅ Build successful!")
else:
    print("❌ Build failed")
    print(result.stderr[:500])  # First 500 chars of error